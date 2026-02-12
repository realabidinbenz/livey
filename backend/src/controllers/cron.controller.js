import { supabaseAdmin } from '../config/supabase.js';
import { syncOrderToSheets } from '../services/sheets.sync.service.js';
import logger from '../utils/logger.js';

/**
 * Cron Controller
 * Background job endpoints (called by Vercel Cron or manually)
 */

/**
 * Calculate exponential backoff delay in seconds
 * Formula: 300s * 3^retry_count (5min, 15min, 45min, 2.25hr, etc.)
 * @param {number} retryCount - Number of retries so far
 * @returns {number} Delay in seconds
 */
const getBackoffSeconds = (retryCount) => {
  return 300 * Math.pow(3, retryCount);
};

/**
 * Check if enough time has passed since last attempt
 * @param {Object} order - Order with updated_at and sync_retry_count
 * @returns {boolean} true if retry is due
 */
const isRetryDue = (order) => {
  if (!order.updated_at) {
    return true; // No previous attempt, retry immediately
  }

  const secondsSinceUpdate = (Date.now() - new Date(order.updated_at).getTime()) / 1000;
  const backoffSeconds = getBackoffSeconds(order.sync_retry_count || 0);

  return secondsSinceUpdate >= backoffSeconds;
};

/**
 * POST /api/cron/sync-sheets
 * Background retry job - syncs all failed orders
 */
export const syncSheets = async (req, res, next) => {
  try {
    // Verify cron secret
    const secret =
      req.headers['x-cron-secret'] ||
      req.headers.authorization?.replace('Bearer ', '');

    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      logger.error('CRON_SECRET not configured');
      return res.status(500).json({
        error: { message: 'Cron secret not configured', status: 500 }
      });
    }

    if (secret !== expectedSecret) {
      logger.warn('Invalid cron secret', { providedSecret: secret?.substring(0, 5) });
      return res.status(401).json({
        error: { message: 'Unauthorized', status: 401 }
      });
    }

    // Find unsynced orders eligible for retry (max 50 per run)
    const { data: orders, error: queryError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('google_sheets_synced', false)
      .lt('sync_retry_count', 10) // Give up after 10 retries (0-9)
      .order('created_at', { ascending: true })
      .limit(50);

    if (queryError) {
      logger.error('Failed to query unsynced orders', { error: queryError.message });
      return res.status(500).json({
        error: { message: 'Database query failed', status: 500 }
      });
    }

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const order of orders || []) {
      // Check if enough time has passed (exponential backoff)
      if (!isRetryDue(order)) {
        skipped++;
        continue;
      }

      processed++;

      try {
        await syncOrderToSheets(order);
        succeeded++;
      } catch (error) {
        failed++;
        // Error already logged in syncOrderToSheets
      }
    }

    logger.info('Cron sync-sheets completed', {
      total: orders?.length || 0,
      processed,
      succeeded,
      failed,
      skipped
    });

    res.json({
      success: true,
      total: orders?.length || 0,
      processed,
      succeeded,
      failed,
      skipped,
      message: `Processed ${processed} orders: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped (backoff)`
    });
  } catch (error) {
    logger.error('Cron sync-sheets error', { error: error.message });
    next(error);
  }
};
