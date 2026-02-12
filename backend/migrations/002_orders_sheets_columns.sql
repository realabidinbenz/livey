-- Livey MVP - Phase 2 Schema Additions
-- Adds Google Sheets sync tracking columns to orders table
-- Run AFTER 001_initial_schema.sql
-- Created: 2026-02-11

-- Add sync retry tracking to orders
-- (google_sheets_synced and google_sheets_row_number already in 001)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS sync_retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sync_attempt TIMESTAMPTZ;

-- Index for cron job: find unsynced orders efficiently
CREATE INDEX IF NOT EXISTS idx_orders_unsynced
  ON orders(google_sheets_synced, sync_retry_count)
  WHERE google_sheets_synced = FALSE AND sync_retry_count < 10;
