import { supabaseAdmin } from '../config/supabase.js';
import { decrypt } from '../utils/encryption.js';
import { refreshAccessToken } from './google.auth.service.js';
import { appendOrderRow } from './google.sheets.service.js';
import logger from '../utils/logger.js';

/**
 * Sheets Sync Service
 * Orchestrates order syncing to Google Sheets
 * Handles token refresh, error handling, connection cleanup
 */

/**
 * Sync a single order to seller's Google Sheet
 * @param {Object} order - Order object from database
 * @returns {Promise<void>}
 */
export const syncOrderToSheets = async (order) => {
  try {
    // 1. Get seller's Sheets connection
    const { data: connection } = await supabaseAdmin
      .from('google_sheets_connections')
      .select('*')
      .eq('seller_id', order.seller_id)
      .single();

    if (!connection) {
      // Seller hasn't connected Sheets - not an error, just skip
      logger.info('Skipping Sheets sync - no connection', {
        orderId: order.id,
        sellerId: order.seller_id
      });
      return;
    }

    // 2. Get valid access token (refresh if expired)
    let accessToken = connection.access_token;
    const tokenExpiresAt = new Date(connection.token_expires_at);
    const now = new Date();

    if (now >= tokenExpiresAt) {
      // Token expired - refresh it
      logger.info('Refreshing access token', { sellerId: order.seller_id });

      const refreshTokenDecrypted = decrypt(connection.refresh_token);
      const newCredentials = await refreshAccessToken(refreshTokenDecrypted);
      accessToken = newCredentials.access_token;

      // Update stored token
      await supabaseAdmin
        .from('google_sheets_connections')
        .update({
          access_token: newCredentials.access_token,
          token_expires_at: new Date(newCredentials.expiry_date).toISOString()
        })
        .eq('id', connection.id);
    }

    // 3. Append order row to spreadsheet
    const { rowNumber } = await appendOrderRow(
      accessToken,
      connection.spreadsheet_id,
      order
    );

    // 4. Mark order as synced
    await supabaseAdmin
      .from('orders')
      .update({
        google_sheets_synced: true,
        google_sheets_row_number: rowNumber
      })
      .eq('id', order.id);

    // 5. Update last_sync_at timestamp
    await supabaseAdmin
      .from('google_sheets_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    logger.info('Sheets sync success', {
      orderId: order.id,
      orderNumber: order.order_number,
      sellerId: order.seller_id,
      spreadsheetId: connection.spreadsheet_id,
      rowNumber
    });
  } catch (error) {
    logger.error('Sheets sync failed', {
      orderId: order.id,
      orderNumber: order.order_number,
      sellerId: order.seller_id,
      error: error.message,
      errorCode: error.code
    });

    // Handle specific error cases
    const shouldDeleteConnection =
      error.message === 'REFRESH_TOKEN_REVOKED' ||
      error.message === 'SPREADSHEET_NOT_FOUND';

    if (shouldDeleteConnection) {
      // Delete the connection - seller needs to reconnect
      await supabaseAdmin
        .from('google_sheets_connections')
        .delete()
        .eq('seller_id', order.seller_id);

      logger.warn('Sheets connection removed due to error', {
        sellerId: order.seller_id,
        reason: error.message
      });
    }

    // Mark order as not synced + increment retry count
    await supabaseAdmin
      .from('orders')
      .update({
        google_sheets_synced: false,
        sync_retry_count: (order.sync_retry_count || 0) + 1
      })
      .eq('id', order.id);

    // Re-throw error so caller knows it failed
    throw error;
  }
};
