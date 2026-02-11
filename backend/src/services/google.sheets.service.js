import { google } from 'googleapis';
import logger from '../utils/logger.js';

/**
 * Google Sheets Service
 * Handles all Google Sheets API operations: create spreadsheet, append rows, test connection
 */

// Fixed column headers for order sheet
const SHEET_HEADERS = [
  'Order ID',
  'Date/Time',
  'Customer Name',
  'Phone',
  'Full Address',
  'Product Name',
  'Price (DA)',
  'Quantity',
  'Total (DA)',
  'Status'
];

/**
 * Get authenticated Sheets API client
 * @param {string} accessToken - Valid Google access token
 * @returns {Object} Sheets API client
 */
const getSheetsClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: 'v4', auth: oauth2Client });
};

/**
 * Get authenticated Drive API client
 * @param {string} accessToken - Valid Google access token
 * @returns {Object} Drive API client
 */
const getDriveClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * Create a new Google Spreadsheet with header row
 * @param {string} accessToken - Valid Google access token
 * @param {string} title - Spreadsheet title (optional)
 * @returns {Promise<Object>} { spreadsheetId, spreadsheetUrl }
 */
export const createSpreadsheet = async (accessToken, title = 'Livey Orders') => {
  const sheets = getSheetsClient(accessToken);

  try {
    // Create spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title
        },
        sheets: [
          {
            properties: {
              title: 'Orders',
              gridProperties: {
                frozenRowCount: 1 // Freeze header row
              }
            }
          }
        ]
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl;

    logger.info('Spreadsheet created', { spreadsheetId, title });

    // Add header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Orders!A1:J1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [SHEET_HEADERS]
      }
    });

    // Format header row (bold, background color)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9
                  },
                  textFormat: {
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });

    logger.info('Header row added and formatted', { spreadsheetId });

    return { spreadsheetId, spreadsheetUrl };
  } catch (error) {
    logger.error('Failed to create spreadsheet', {
      error: error.message,
      code: error.code
    });
    throw new Error(`Failed to create spreadsheet: ${error.message}`);
  }
};

/**
 * Append an order row to the spreadsheet
 * @param {string} accessToken - Valid Google access token
 * @param {string} spreadsheetId - Target spreadsheet ID
 * @param {Object} order - Order object from database
 * @returns {Promise<Object>} { rowNumber }
 */
export const appendOrderRow = async (accessToken, spreadsheetId, order) => {
  const sheets = getSheetsClient(accessToken);

  try {
    // Format date in Africa/Algiers timezone
    const orderDate = new Date(order.created_at);
    const dateTimeStr = orderDate.toLocaleString('en-GB', {
      timeZone: 'Africa/Algiers',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Capitalize first letter of status
    const status = order.status.charAt(0).toUpperCase() + order.status.slice(1);

    // Build row data (10 columns, fixed order)
    const row = [
      order.order_number,
      dateTimeStr,
      order.customer_name,
      order.customer_phone,
      order.customer_address,
      order.product_name,
      order.product_price,
      order.quantity,
      order.total_price,
      status
    ];

    // Append row to sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Orders!A:J',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row]
      }
    });

    // Extract row number from updatedRange (e.g., "Orders!A42:J42" -> 42)
    const updatedRange = response.data.updates?.updatedRange || '';
    const rowMatch = updatedRange.match(/!A(\d+):/);
    const rowNumber = rowMatch ? parseInt(rowMatch[1]) : null;

    logger.info('Order row appended', {
      orderId: order.id,
      orderNumber: order.order_number,
      spreadsheetId,
      rowNumber
    });

    return { rowNumber };
  } catch (error) {
    // Check for specific error types
    if (error.code === 404 || error.message?.includes('not found')) {
      logger.error('Spreadsheet not found', { spreadsheetId, error: error.message });
      throw new Error('SPREADSHEET_NOT_FOUND');
    }

    if (error.code === 429) {
      logger.warn('Google Sheets quota exceeded', { spreadsheetId });
      throw new Error('QUOTA_EXCEEDED');
    }

    logger.error('Failed to append order row', {
      orderId: order.id,
      spreadsheetId,
      error: error.message,
      code: error.code
    });
    throw new Error(`Failed to append order row: ${error.message}`);
  }
};

/**
 * Test connection to spreadsheet (read cell A1)
 * @param {string} accessToken - Valid Google access token
 * @param {string} spreadsheetId - Target spreadsheet ID
 * @returns {Promise<Object>} { success: true, spreadsheetTitle }
 */
export const testConnection = async (accessToken, spreadsheetId) => {
  const sheets = getSheetsClient(accessToken);

  try {
    // Get spreadsheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title'
    });

    const spreadsheetTitle = response.data.properties?.title || 'Unknown';

    logger.info('Connection test successful', { spreadsheetId, spreadsheetTitle });

    return {
      success: true,
      spreadsheetTitle
    };
  } catch (error) {
    if (error.code === 404 || error.message?.includes('not found')) {
      logger.warn('Spreadsheet not found during test', { spreadsheetId });
      throw new Error('SPREADSHEET_NOT_FOUND');
    }

    logger.error('Connection test failed', {
      spreadsheetId,
      error: error.message,
      code: error.code
    });
    throw new Error(`Connection test failed: ${error.message}`);
  }
};
