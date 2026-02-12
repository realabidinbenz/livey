-- Livey MVP - Initial Schema (Phase 1)
-- Run in Supabase SQL Editor
-- Created: 2026-02-11

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------------------------------------------
-- 1. PROFILES (extends auth.users)
---------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

---------------------------------------------------
-- 2. PRODUCTS
---------------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT,
  stock INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_products_seller ON products(seller_id) WHERE deleted_at IS NULL;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can only see their own products"
  ON products FOR ALL
  USING (seller_id = auth.uid());

---------------------------------------------------
-- 3. LIVE SESSIONS
---------------------------------------------------
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  embed_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_seller ON live_sessions(seller_id);
CREATE INDEX idx_sessions_status ON live_sessions(status);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can only see their own sessions"
  ON live_sessions FOR ALL
  USING (seller_id = auth.uid());

---------------------------------------------------
-- 4. SESSION PRODUCTS (many-to-many)
---------------------------------------------------
CREATE TABLE session_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_session_products_session ON session_products(session_id);

ALTER TABLE session_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can manage their session products"
  ON session_products FOR ALL
  USING (
    session_id IN (
      SELECT id FROM live_sessions WHERE seller_id = auth.uid()
    )
  );

---------------------------------------------------
-- 5. ORDERS
---------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  session_id UUID REFERENCES live_sessions(id),
  product_id UUID REFERENCES products(id),
  seller_id UUID REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  google_sheets_synced BOOLEAN DEFAULT FALSE,
  google_sheets_row_number INTEGER
);

CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can only see their own orders"
  ON orders FOR ALL
  USING (seller_id = auth.uid());

-- Public insert policy (customers can create orders without auth)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

---------------------------------------------------
-- 6. CHAT MESSAGES
---------------------------------------------------
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_seller BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can send chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sellers can delete chat messages in their sessions"
  ON chat_messages FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM live_sessions WHERE seller_id = auth.uid()
    )
  );

---------------------------------------------------
-- 7. GOOGLE SHEETS CONNECTIONS
---------------------------------------------------
CREATE TABLE google_sheets_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_url TEXT,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

ALTER TABLE google_sheets_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can only see their own Sheets connection"
  ON google_sheets_connections FOR ALL
  USING (seller_id = auth.uid());
