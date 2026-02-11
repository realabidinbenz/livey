-- Livey MVP - Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- Last updated: 2026-02-11

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE 1: profiles (extends auth.users)
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- =============================================
-- TABLE 2: products
-- =============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0), -- Algerian Dinars (no decimals)
  image_url TEXT,
  stock INTEGER CHECK (stock >= 0), -- NULL means unlimited
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes
CREATE INDEX idx_products_seller ON products(seller_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_created ON products(created_at DESC);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own products"
  ON products FOR SELECT
  USING (seller_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Sellers can insert their own products"
  ON products FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own products"
  ON products FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own products"
  ON products FOR DELETE
  USING (seller_id = auth.uid());

-- =============================================
-- TABLE 3: live_sessions
-- =============================================

CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended', 'replay')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  embed_code TEXT, -- Pre-generated embed code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_seller ON live_sessions(seller_id);
CREATE INDEX idx_sessions_status ON live_sessions(status);
CREATE INDEX idx_sessions_created ON live_sessions(created_at DESC);

-- RLS Policies
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own sessions"
  ON live_sessions FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert their own sessions"
  ON live_sessions FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own sessions"
  ON live_sessions FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Public can view live/replay sessions (for widget)"
  ON live_sessions FOR SELECT
  USING (status IN ('live', 'replay'));

-- =============================================
-- TABLE 4: session_products (many-to-many)
-- =============================================

CREATE TABLE session_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ, -- NULL if not currently pinned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

-- Indexes
CREATE INDEX idx_session_products_session ON session_products(session_id);
CREATE INDEX idx_session_products_product ON session_products(product_id);
CREATE INDEX idx_session_products_pinned ON session_products(session_id, pinned_at DESC) WHERE pinned_at IS NOT NULL;

-- RLS Policies
ALTER TABLE session_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can manage their session products"
  ON session_products FOR ALL
  USING (
    session_id IN (SELECT id FROM live_sessions WHERE seller_id = auth.uid())
  );

CREATE POLICY "Public can view session products (for widget)"
  ON session_products FOR SELECT
  USING (true);

-- =============================================
-- TABLE 5: orders
-- =============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL, -- ORD-YYYYMMDD-001
  session_id UUID REFERENCES live_sessions(id),
  product_id UUID REFERENCES products(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL CHECK (customer_phone ~ '^(05|06|07)[0-9]{8}$'),
  customer_address TEXT NOT NULL,

  -- Order details (snapshot - in case product deleted/changed)
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL CHECK (product_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered')),

  -- Google Sheets sync
  google_sheets_synced BOOLEAN DEFAULT FALSE,
  google_sheets_row_number INTEGER,
  sync_retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_sheets_sync ON orders(google_sheets_synced) WHERE google_sheets_synced = FALSE;

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own orders"
  ON orders FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own orders"
  ON orders FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Public can create orders (from widget)"
  ON orders FOR INSERT
  WITH CHECK (true);

-- =============================================
-- TABLE 6: chat_messages
-- =============================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(message) <= 200),
  is_seller BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ, -- Soft delete for moderation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at DESC);
CREATE INDEX idx_chat_not_deleted ON chat_messages(session_id, created_at DESC) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view non-deleted messages"
  ON chat_messages FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Public can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sellers can delete messages in their sessions"
  ON chat_messages FOR UPDATE
  USING (
    session_id IN (SELECT id FROM live_sessions WHERE seller_id = auth.uid())
  );

-- =============================================
-- TABLE 7: google_sheets_connections
-- =============================================

CREATE TABLE google_sheets_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_url TEXT,
  refresh_token TEXT NOT NULL, -- Encrypted
  access_token TEXT, -- Temporary
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE google_sheets_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own connection"
  ON google_sheets_connections FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert their own connection"
  ON google_sheets_connections FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own connection"
  ON google_sheets_connections FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own connection"
  ON google_sheets_connections FOR DELETE
  USING (seller_id = auth.uid());

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update products.updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate order number (ORD-YYYYMMDD-NNN)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  order_count INTEGER;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');

  -- Count orders created today
  SELECT COUNT(*) INTO order_count
  FROM orders
  WHERE order_number LIKE 'ORD-' || today_date || '%';

  -- Generate order number
  NEW.order_number := 'ORD-' || today_date || '-' || LPAD((order_count + 1)::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate order number on insert
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- =============================================
-- INITIAL DATA (Optional - for testing)
-- =============================================

-- You can add test data here if needed
-- Example:
-- INSERT INTO profiles (id, email, business_name)
-- VALUES ('uuid-here', 'test@example.com', 'Test Business');

-- =============================================
-- DONE!
-- =============================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
