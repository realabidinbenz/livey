import { supabaseAdmin } from '../config/supabase.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import {
  getAuthUrl,
  validateState,
  exchangeCodeForTokens,
  refreshAccessToken as refreshToken,
  revokeToken
} from '../services/google.auth.service.js';
import {
  createSpreadsheet,
  testConnection as testSheetConnection
} from '../services/google.sheets.service.js';
import logger from '../utils/logger.js';

/**
 * Sheets Controller
 * Handles Google Sheets OAuth flow and connection management
 */

/**
 * POST /api/sheets/connect
 * Initiate OAuth flow - returns Google consent URL
 */
export const connect = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Generate OAuth URL with state (CSRF protection)
    const authUrl = getAuthUrl(sellerId);

    logger.info('Sheets OAuth initiated', { sellerId });

    res.json({ authUrl });
  } catch (error) {
    logger.error('Sheets connect failed', {
      sellerId: req.user.id,
      error: error.message
    });
    next(error);
  }
};

/**
 * GET /api/sheets/callback
 * OAuth callback - Google redirects here with authorization code
 */
export const callback = async (req, res, next) => {
  try {
    const { code, state, error: oauthError } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Handle OAuth error from Google
    if (oauthError) {
      logger.warn('OAuth callback error from Google', { error: oauthError });
      return res.redirect(`${frontendUrl}/dashboard/settings?sheets_error=access_denied`);
    }

    if (!code || !state) {
      logger.warn('OAuth callback missing code or state');
      return res.redirect(`${frontendUrl}/dashboard/settings?sheets_error=invalid_callback`);
    }

    // Validate state (CSRF protection)
    const stateData = validateState(state);
    if (!stateData) {
      logger.warn('Invalid OAuth state', { state });
      return res.redirect(`${frontendUrl}/dashboard/settings?sheets_error=invalid_state`);
    }

    const { sellerId } = stateData;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      logger.error('No refresh token received', { sellerId });
      return res.redirect(`${frontendUrl}/dashboard/settings?sheets_error=no_refresh_token`);
    }

    // Create a new spreadsheet
    const { spreadsheetId, spreadsheetUrl } = await createSpreadsheet(
      tokens.access_token,
      'Livey Orders'
    );

    // Encrypt refresh token before storing
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // Calculate token expiry
    const tokenExpiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(); // Default 1 hour

    // Save connection to database (upsert - seller_id is UNIQUE)
    const { error: dbError } = await supabaseAdmin
      .from('google_sheets_connections')
      .upsert({
        seller_id: sellerId,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: spreadsheetUrl,
        refresh_token: encryptedRefreshToken,
        access_token: tokens.access_token,
        token_expires_at: tokenExpiresAt,
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'seller_id'
      });

    if (dbError) {
      logger.error('Failed to save Sheets connection', {
        sellerId,
        error: dbError.message
      });
      return res.redirect(`${frontendUrl}/dashboard/settings?sheets_error=save_failed`);
    }

    logger.info('Sheets OAuth completed', {
      sellerId,
      spreadsheetId
    });

    // Redirect to success page
    res.redirect(`${frontendUrl}/dashboard/settings?sheets=connected`);
  } catch (error) {
    logger.error('Sheets callback failed', { error: error.message });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard/settings?sheets_error=connection_failed`);
  }
};

/**
 * GET /api/sheets/status
 * Check connection status and pending syncs
 */
export const status = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Query connection
    const { data: connection } = await supabaseAdmin
      .from('google_sheets_connections')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (!connection) {
      return res.json({
        connected: false,
        message: 'No Google Sheets connection found'
      });
    }

    // Count pending syncs
    const { count: pendingSyncCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('google_sheets_synced', false);

    res.json({
      connected: true,
      spreadsheetId: connection.spreadsheet_id,
      spreadsheetUrl: connection.spreadsheet_url,
      connectedAt: connection.connected_at,
      lastSyncAt: connection.last_sync_at,
      pendingSyncCount: pendingSyncCount || 0
    });
  } catch (error) {
    logger.error('Sheets status check failed', {
      sellerId: req.user.id,
      error: error.message
    });
    next(error);
  }
};

/**
 * POST /api/sheets/test
 * Test connection - verify spreadsheet still accessible
 */
export const test = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Get connection
    const { data: connection } = await supabaseAdmin
      .from('google_sheets_connections')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (!connection) {
      return res.status(404).json({
        error: { message: 'No Sheets connection found', status: 404 }
      });
    }

    // Get valid access token (refresh if expired)
    let accessToken = connection.access_token;
    const tokenExpiresAt = new Date(connection.token_expires_at);
    const now = new Date();

    if (now >= tokenExpiresAt) {
      // Token expired - refresh it
      const refreshTokenDecrypted = decrypt(connection.refresh_token);

      try {
        const newCredentials = await refreshToken(refreshTokenDecrypted);
        accessToken = newCredentials.access_token;

        // Update stored token
        await supabaseAdmin
          .from('google_sheets_connections')
          .update({
            access_token: newCredentials.access_token,
            token_expires_at: new Date(newCredentials.expiry_date).toISOString()
          })
          .eq('id', connection.id);
      } catch (refreshError) {
        if (refreshError.message === 'REFRESH_TOKEN_REVOKED') {
          // Token revoked - delete connection
          await supabaseAdmin
            .from('google_sheets_connections')
            .delete()
            .eq('seller_id', sellerId);

          logger.warn('Sheets token revoked during test', { sellerId });

          return res.status(401).json({
            error: {
              message: 'Your Google Sheets access has expired. Please reconnect.',
              code: 'token_revoked',
              status: 401
            }
          });
        }
        throw refreshError;
      }
    }

    // Test connection
    try {
      const result = await testSheetConnection(accessToken, connection.spreadsheet_id);

      res.json({
        success: true,
        message: 'Connection is valid',
        spreadsheetId: connection.spreadsheet_id,
        spreadsheetTitle: result.spreadsheetTitle
      });
    } catch (testError) {
      if (testError.message === 'SPREADSHEET_NOT_FOUND') {
        // Sheet was deleted - remove connection
        await supabaseAdmin
          .from('google_sheets_connections')
          .delete()
          .eq('seller_id', sellerId);

        logger.warn('Spreadsheet deleted', { sellerId, spreadsheetId: connection.spreadsheet_id });

        return res.status(404).json({
          error: {
            message: 'The connected Google Sheet was deleted or you lost access. Please reconnect.',
            code: 'sheet_deleted',
            status: 404
          }
        });
      }
      throw testError;
    }
  } catch (error) {
    logger.error('Sheets test failed', {
      sellerId: req.user.id,
      error: error.message
    });
    next(error);
  }
};

/**
 * DELETE /api/sheets/disconnect
 * Remove Google Sheets connection
 */
export const disconnect = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Get connection to revoke token
    const { data: connection } = await supabaseAdmin
      .from('google_sheets_connections')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (!connection) {
      return res.status(404).json({
        error: { message: 'No Sheets connection found', status: 404 }
      });
    }

    // Best effort: try to revoke token with Google
    try {
      const refreshTokenDecrypted = decrypt(connection.refresh_token);
      await revokeToken(refreshTokenDecrypted);
    } catch (revokeError) {
      // Non-critical - continue with disconnect even if revocation fails
      logger.warn('Token revocation failed (non-critical)', {
        sellerId,
        error: revokeError.message
      });
    }

    // Delete connection from database
    const { error: deleteError } = await supabaseAdmin
      .from('google_sheets_connections')
      .delete()
      .eq('seller_id', sellerId);

    if (deleteError) {
      logger.error('Failed to delete Sheets connection', {
        sellerId,
        error: deleteError.message
      });
      return res.status(500).json({
        error: { message: 'Failed to disconnect', status: 500 }
      });
    }

    logger.info('Sheets disconnected', { sellerId });

    res.json({
      success: true,
      message: 'Google Sheets disconnected successfully'
    });
  } catch (error) {
    logger.error('Sheets disconnect failed', {
      sellerId: req.user.id,
      error: error.message
    });
    next(error);
  }
};
