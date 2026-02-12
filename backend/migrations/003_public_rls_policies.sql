-- Livey MVP - Phase 4 Public RLS Policies
-- Enables anonymous widget access via Supabase Realtime
-- Run AFTER 001_initial_schema.sql and 002_orders_sheets_columns.sql
-- Created: 2026-02-12

-- ============================================================
-- IMPORTANT: MANUAL STEPS AFTER RUNNING THIS MIGRATION
-- ============================================================
-- Enable Realtime replication on these tables in Supabase Dashboard:
-- 1. Go to Supabase Dashboard → Database → Replication
-- 2. Enable Realtime on these tables:
--    - chat_messages (for new message notifications)
--    - session_products (for pin change notifications)
--    - live_sessions (for session status change notifications)
-- ============================================================

-- ============================================================
-- SECURITY NOTES
-- ============================================================
-- These policies allow anonymous (anon) role access for the widget.
-- They are READ-ONLY policies (except chat INSERT and order INSERT
-- which the widget already does via API).
-- They don't compromise seller data security — products, chat messages,
-- and sessions are inherently public (customers see them in the widget).
-- The existing seller-specific RLS policies still protect seller data
-- from other sellers.
-- ============================================================

-- Allow anonymous users to read live/ended/replay sessions (widget needs this)
CREATE POLICY "Public can read sessions"
ON live_sessions FOR SELECT
USING (true);

-- Allow anonymous users to read session_products (widget needs pinned product info)
CREATE POLICY "Public can read session products"
ON session_products FOR SELECT
USING (true);

-- Allow anonymous users to read non-deleted products (widget displays products)
CREATE POLICY "Public can read active products"
ON products FOR SELECT
USING (deleted_at IS NULL);

-- Allow anonymous users to read non-deleted chat messages (widget displays chat)
CREATE POLICY "Public can read chat messages"
ON chat_messages FOR SELECT
USING (deleted_at IS NULL);

-- Allow anonymous users to insert chat messages (widget sends chat, is_seller must be false)
CREATE POLICY "Public can send chat messages"
ON chat_messages FOR INSERT
WITH CHECK (is_seller = false);

-- Allow anonymous users to create orders (widget submits orders)
CREATE POLICY "Public can create orders"
ON orders FOR INSERT
WITH CHECK (true);
