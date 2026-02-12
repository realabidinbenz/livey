# Phase 1: Foundation (Week 1)

**Goal:** Solid backend + database with proper logging and security

**Status:** ✅ 100% COMPLETE (Sessions 2-3)
**Priority:** Critical (everything depends on this)

---

## 📋 BACKEND TASKS

### Setup & Structure
- [x] Create `backend/` folder structure
  - [x] `src/index.js` (Express app setup)
  - [x] `src/routes/` (route files)
  - [x] `src/controllers/` (business logic)
  - [x] `src/services/` (third-party integrations)
  - [x] `src/middleware/` (auth, validation, logging, error handling)
  - [x] `src/utils/` (helper functions)
- [x] Create `backend/package.json`
- [x] Install dependencies:
  - [x] express
  - [x] @supabase/supabase-js
  - [x] dotenv
  - [x] cors
  - [x] helmet (security headers)
- [x] Create `backend/.env` (Supabase keys, encryption key)
- [x] Create `backend/.env.example` (template without secrets)

### Express App
- [x] Set up Express server (`src/index.js`)
  - [x] CORS configuration
  - [x] Helmet (security)
  - [x] JSON body parser
  - [x] Logging middleware (log all requests)
  - [x] Error handling middleware
- [x] Health check endpoint (`GET /health` → returns `{ status: 'ok' }`)
- [x] Test server runs (`npm run dev`)

### Middleware
- [x] Create `middleware/logger.js`
  - [x] Log: method, path, status, response time
  - [x] Log: user ID (if authenticated)
  - [x] Log: errors with stack trace
- [x] Create `middleware/auth.js`
  - [x] Verify Supabase JWT token
  - [x] Attach user to `req.user`
  - [x] Return 401 if invalid/missing token
- [x] Create `middleware/validation.js`
  - [x] Phone validation: `^(05|06|07)\d{8}$`
  - [x] Email validation
  - [x] Required fields validation

### Authentication
- [x] Create `routes/auth.routes.js`
  - [x] POST /api/auth/signup
  - [x] POST /api/auth/login
  - [x] POST /api/auth/logout
  - [x] GET /api/auth/me
- [x] Create `controllers/auth.controller.js`
  - [x] signup(email, password) → Supabase Auth
  - [x] login(email, password) → Supabase Auth
  - [x] logout(token) → Supabase Auth
  - [x] me(token) → Get current user
- [x] Test with Postman/Thunder Client:
  - [x] Signup with valid email
  - [x] Signup with duplicate email (should fail)
  - [x] Login with correct password
  - [x] Login with wrong password (should fail)
  - [x] GET /me with valid token
  - [x] GET /me with invalid token (should 401)

### Products
- [x] Create `routes/products.routes.js`
  - [x] GET /api/products (list seller's products)
  - [x] POST /api/products (create)
  - [x] GET /api/products/:id (get one)
  - [x] PUT /api/products/:id (update)
  - [x] DELETE /api/products/:id (soft delete)
- [x] Create `controllers/products.controller.js`
  - [x] list(sellerId) → Query with RLS
  - [x] create(sellerId, data) → Insert product
  - [x] getById(sellerId, productId) → Single product
  - [x] update(sellerId, productId, data) → Update
  - [x] softDelete(sellerId, productId) → Set deleted_at
- [x] Test with Postman:
  - [x] Create product (with all fields)
  - [x] Create product (image URL)
  - [x] List products (should return only seller's products)
  - [x] Update product price
  - [x] Delete product (soft delete, still in DB)
  - [x] Try to access another seller's product (should fail with RLS)

### Orders (Basic - No Sheets Yet)
- [x] Create `routes/orders.routes.js`
  - [x] POST /api/orders (public - from widget)
  - [x] GET /api/orders (seller only - list their orders)
  - [x] GET /api/orders/:id (seller only - get one order)
  - [x] PUT /api/orders/:id/status (seller only - update status)
- [x] Create `controllers/orders.controller.js`
  - [x] create(orderData) → Validate, snapshot product, insert
  - [x] list(sellerId, pagination) → Query with RLS + pagination
  - [x] getById(sellerId, orderId) → Single order
  - [x] updateStatus(sellerId, orderId, status) → Update
- [x] Test with Postman:
  - [x] Create order (valid data)
  - [x] Create order (invalid phone - should fail validation)
  - [x] Create order (product not found - should fail)
  - [x] List orders (paginated, first 50)
  - [x] Get single order
  - [x] Update order status to "confirmed"
  - [x] Verify stock decreased after order

---

## 🗄️ DATABASE TASKS

### Supabase Setup
- [x] Get Supabase keys from dashboard (URL, anon key, service role key)
- [x] Add to `backend/.env`

### Create Tables (Run SQL in Supabase Dashboard)
- [x] Create `profiles` table (extends auth.users)
  ```sql
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    business_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Create `products` table (with indexes)
- [x] Create `live_sessions` table
- [x] Create `session_products` table (many-to-many)
- [x] Create `orders` table (with indexes)
- [x] Create `chat_messages` table (with indexes)
- [x] Create `google_sheets_connections` table

### Apply Row Level Security (RLS)
- [x] Enable RLS on `profiles`
  ```sql
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can only see their own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());
  ```
- [x] Enable RLS on `products`
  ```sql
  CREATE POLICY "Sellers can only see their own products"
  ON products FOR ALL
  USING (seller_id = auth.uid());
  ```
- [x] Enable RLS on `orders` (sellers see only their orders)
- [x] Enable RLS on `live_sessions`
- [x] Enable RLS on `session_products`
- [x] Enable RLS on `chat_messages` (public read, seller can delete)
- [x] Enable RLS on `google_sheets_connections`

### Test Data Isolation (CRITICAL)
- [x] Create 2 test seller accounts (Seller A, Seller B)
- [x] Seller A creates 3 products
- [x] Seller B creates 2 products
- [x] Verify Seller A can't see Seller B's products (via API)
- [x] Verify Seller A can't delete Seller B's products (should 403)
- [x] Same test for orders, sessions

---

## 🧪 TESTING TASKS

### Unit Tests Setup
- [x] Install testing dependencies (Jest or Vitest)
- [x] Create `backend/tests/` folder
- [x] Configure test script in package.json

### Write Unit Tests
- [x] `tests/auth.controller.test.js`
  - [x] Signup with valid email
  - [x] Signup with invalid email (should fail)
  - [x] Signup with duplicate email (should fail)
  - [x] Login with correct password
  - [x] Login with wrong password (should fail)
- [x] `tests/products.controller.test.js`
  - [x] Create product with all fields
  - [x] Create product with missing name (should fail)
  - [x] Update product price
  - [x] Soft delete product (deleted_at set)
  - [x] List products returns only seller's products
- [x] `tests/orders.controller.test.js`
  - [x] Create order with valid data
  - [x] Create order with invalid phone (should fail)
  - [x] Create order decreases product stock
  - [x] Product snapshot captured (name, price)

---

## 📝 DOCUMENTATION TASKS

- [x] Create `docs/API_MAP.md`
  - [x] Document all Phase 1 endpoints (auth, products, orders)
  - [x] Include request/response examples
  - [x] Include error codes
- [x] Create `docs/DECISIONS.md`
  - [x] Record tech stack choices (why Express, why Supabase)
  - [x] Record dual storage decision (Supabase + Sheets)
- [x] Update `docs/CONTEXT.md`
  - [x] Mark Phase 1 tasks as complete
  - [x] Note any issues encountered
  - [x] Write summary for next session

---

## ✅ DEFINITION OF DONE

Phase 1 is complete when:
- [x] Backend API runs locally (npm run dev)
- [x] All 7 tables exist in Supabase
- [x] RLS policies applied and tested (Seller A can't see Seller B's data)
- [x] Auth endpoints work (signup, login, logout, me)
- [x] Products CRUD works (create, list, update, delete)
- [x] Orders endpoint works (create, list, get, update status)
- [x] Stock decreases when order is placed
- [x] All unit tests pass (15+ tests)
- [x] Logging middleware logs all requests
- [x] Error handling middleware catches errors gracefully
- [x] Code committed to git (feature/phase1-foundation branch)
- [x] Documentation updated (CONTEXT.md, API_MAP.md, DECISIONS.md)

---

## 🚨 KNOWN RISKS

- **Supabase RLS complexity:** If RLS policies are wrong, data leaks. Test thoroughly.
- **Token handling:** Must verify JWT tokens correctly or security fails.
- **Stock race condition:** If 2 orders happen simultaneously, stock might be wrong (acceptable for MVP, seller handles manually).

---

## 📚 RESOURCES

- Supabase Docs: https://supabase.com/docs
- Express.js Docs: https://expressjs.com/
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

**Estimated Time:** 5-7 days (assuming 3-4 hours of work per day)

**Next Phase:** Phase 2 - Google Sheets Integration
