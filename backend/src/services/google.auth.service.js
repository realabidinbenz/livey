import { google } from 'googleapis';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Google OAuth Service
 * Handles all Google OAuth operations: auth URL generation, token exchange, refresh
 */

// Required scopes for Sheets + Drive access
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

// In-memory state store for OAuth CSRF protection
// Maps state -> { sellerId, createdAt }
// Simple for MVP (single server). For multi-server, move to DB/Redis.
const oauthStates = new Map();

// Cleanup old states (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  const tenMinutesAgo = now - (10 * 60 * 1000);

  for (const [state, data] of oauthStates.entries()) {
    if (data.createdAt < tenMinutesAgo) {
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

/**
 * Create OAuth2 client instance
 */
const createOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Google OAuth credentials. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Generate Google OAuth consent URL
 * @param {string} sellerId - Seller's user ID (for CSRF protection)
 * @returns {string} Authorization URL to redirect user to
 */
export const getAuthUrl = (sellerId) => {
  const state = crypto.randomUUID();

  // Store state for validation
  oauthStates.set(state, {
    sellerId,
    createdAt: Date.now()
  });

  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh token
    scope: SCOPES,
    state,
    prompt: 'consent' // Force consent screen to always get refresh token
  });

  logger.info('OAuth URL generated', { sellerId, state });

  return authUrl;
};

/**
 * Validate OAuth state parameter (CSRF protection)
 * @param {string} state - State parameter from OAuth callback
 * @returns {Object|null} { sellerId } if valid, null if invalid/expired
 */
export const validateState = (state) => {
  const data = oauthStates.get(state);

  if (!data) {
    logger.warn('Invalid OAuth state', { state });
    return null;
  }

  // Delete state (one-time use)
  oauthStates.delete(state);

  // Check if expired (older than 10 minutes)
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
  if (data.createdAt < tenMinutesAgo) {
    logger.warn('Expired OAuth state', { state });
    return null;
  }

  return { sellerId: data.sellerId };
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google callback
 * @returns {Promise<Object>} { access_token, refresh_token, expiry_date }
 */
export const exchangeCodeForTokens = async (code) => {
  const oauth2Client = createOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);

    logger.info('OAuth token exchange success', {
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 'unknown'
    });

    return tokens;
  } catch (error) {
    logger.error('OAuth token exchange failed', {
      error: error.message,
      code: error.code
    });
    throw new Error(`Failed to exchange code for tokens: ${error.message}`);
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token from database
 * @returns {Promise<Object>} { access_token, expiry_date, refresh_token? }
 */
export const refreshAccessToken = async (refreshToken) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    logger.info('Access token refreshed', {
      expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 'unknown'
    });

    return credentials;
  } catch (error) {
    // Check if token was revoked
    if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been revoked')) {
      logger.warn('Refresh token revoked', { error: error.message });
      throw new Error('REFRESH_TOKEN_REVOKED');
    }

    logger.error('Access token refresh failed', {
      error: error.message,
      code: error.code
    });
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
};

/**
 * Revoke a token (best effort - for disconnect flow)
 * @param {string} token - Access or refresh token to revoke
 * @returns {Promise<boolean>} true if revoked, false if failed
 */
export const revokeToken = async (token) => {
  const oauth2Client = createOAuth2Client();

  try {
    await oauth2Client.revokeToken(token);
    logger.info('Token revoked');
    return true;
  } catch (error) {
    logger.warn('Token revocation failed (non-critical)', { error: error.message });
    return false;
  }
};
