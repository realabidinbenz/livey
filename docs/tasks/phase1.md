# Phase 1: Foundation (Week 1)

**Goal:** Solid backend + database with proper logging and security

**Estimated Time:** 5-7 days
**Priority:** Critical (everything depends on this)

---

## 📋 BACKEND TASKS

### Setup & Structure
- [ ] Create `backend/` folder structure
  - [ ] `src/index.js` (Express app setup)
  - [ ] `src/routes/` (route files)
  - [ ] `src/controllers/` (business logic)
  - [ ] `src/services/` (third-party integrations)
  - [ ] `src/middleware/` (auth, validation, logging, error handling)
  - [ ] `src/utils/` (helper functions)
- [ ] Create `backend/package.json`
- [ ] Install dependencies:
  - [ ] express
  - [ ] @supabase/supabase-js
  - [ ] dotenv
  - [ ] cors
  - [ ] helmet (security headers)
- [ ] Create `backend/.env` (Supabase keys, encryption key)
- [ ] Create `backend/.env.example` (template without secrets)

### Express App
- [ ] Set up Express server (`src/index.js`)
  - [ ] CORS configuration
  - [ ] Helmet (security)
  - [ ] JSON body parser
  - [ ] Logging middleware (log all requests)
  - [ ] Error handling middleware
- [ ] Health check endpoint (`GET /health` → returns `{ status: 'ok' }`)
- [ ] Test server runs (`npm run dev`)

### Middleware
- [ ] Create `middleware/logger.js`
  - [ ] Log: method, path, status, response time
  - [ ] Log: user ID (if authenticated)
  - [ ] Log: errors with stack trace
- [ ] Create `middleware/auth.js`
  - [ ] Verify Supabase JWT token
  - [ ] Attach user to `req.user`
  - [ ] Return 401 if invalid/missing token
- [ ] Create `middleware/validation.js`
  - [ ] Phone validation: `^(05|06|07)\d{8}$`
  - [ ] Email validation
  - [ ] Required fields validation

### Authentication
- [ ] Create `routes/auth.routes.js`
  - [ ] POST /api/auth/signup
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/logout
  - [ ] GET /api/auth/me
- [ ] Create `controllers/auth.controller.js`
  - [ ] signup(email, password) → Supabase Auth
  - [ ] login(email, password) → Supabase Auth
  - [ ] logout(token) → Supabase Auth
  - [ ] me(token) → Get current user
- [ ] Test with Postman/Thunder Client:
  - [ ] Signup with valid email
  - [ ] Signup with duplicate email (should fail)
  - [ ] Login with correct password
  - [ ] Login with wrong password (should fail)
  - [ ] GET /me with valid token
  - [ ] GET /me with invalid token (should 401)

### Products
- [ ] Create `routes/products.routes.js`
  - [ ] GET /api/products (list seller's products)
  - [ ] POST /api/products (create)
  - [ ] GET /api/products/:id (get one)
  - [ ] PUT /api/products/:id (update)
  - [ ] DELETE /api/products/:id (soft delete)
- [ ] Create `controllers/products.controller.js`
  - [ ] list(sellerId) → Query with RLS
  - [ ] create(sellerId, data) → Insert product
  - [ ] getById(sellerId, productId) → Single product
  - [ ] update(sellerId, productId, data) → Update
  - [ ] softDelete(sellerId, productId) → Set deleted_at
- [ ] Test with Postman:
  - [ ] Create product (with all fields)
  - [ ] Create product (image URL)
  - [ ] List products (should return only seller's products)
  - [ ] Update product price
  - [ ] Delete product (soft delete, still in DB)
  - [ ] Try to access another seller's product (should fail with RLS)

### Orders (Basic - No Sheets Yet)
- [ ] Create `routes/orders.routes.js`
  - [ ] POST /api/orders (public - from widget)
  - [ ] GET /api/orders (seller only - list their orders)
  - [ ] GET /api/orders/:id (seller only - get one order)
  - [ ] PUT /api/orders/:id/status (seller only - update status)
- [ ] Create `controllers/orders.controller.js`
  - [ ] create(orderData) → Validate, snapshot product, insert
  - [ ] list(sellerId, pagination) → Query with RLS + pagination
  - [ ] getById(sellerId, orderId) → Single order
  - [ ] updateStatus(sellerId, orderId, status) → Update
- [ ] Test with Postman:
  - [ ] Create order (valid data)
  - [ ] Create order (invalid phone - should fail validation)
  - [ ] Create order (product not found - should fail)
  - [ ] List orders (paginated, first 50)
  - [ ] Get single order
  - [ ] Update order status to "confirmed"
  - [ ] Verify stock decreased after order

---

## 🗄️ DATABASE TASKS

### Supabase Setup
- [ ] Get Supabase keys from dashboard (URL, anon key, service role key)
- [ ] Add to `backend/.env`

### Create Tables (Run SQL in Supabase Dashboard)
- [ ] Create `profiles` table (extends auth.users)
  ```sql
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    business_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Create `products` table (with indexes)
- [ ] Create `live_sessions` table
- [ ] Create `session_products` table (many-to-many)
- [ ] Create `orders` table (with indexes)
- [ ] Create `chat_messages` table (with indexes)
- [ ] Create `google_sheets_connections` table

### Apply Row Level Security (RLS)
- [ ] Enable RLS on `profiles`
  ```sql
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can only see their own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());
  ```
- [ ] Enable RLS on `products`
  ```sql
  CREATE POLICY "Sellers can only see their own products"
  ON products FOR ALL
  USING (seller_id = auth.uid());
  ```
- [ ] Enable RLS on `orders` (sellers see only their orders)
- [ ] Enable RLS on `live_sessions`
- [ ] Enable RLS on `session_products`
- [ ] Enable RLS on `chat_messages` (public read, seller can delete)
- [ ] Enable RLS on `google_sheets_connections`

### Test Data Isolation (CRITICAL)
- [ ] Create 2 test seller accounts (Seller A, Seller B)
- [ ] Seller A creates 3 products
- [ ] Seller B creates 2 products
- [ ] Verify Seller A can't see Seller B's products (via API)
- [ ] Verify Seller A can't delete Seller B's products (should 403)
- [ ] Same test for orders, sessions

---

## 🧪 TESTING TASKS

### Unit Tests Setup
- [ ] Install testing dependencies (Jest or Vitest)
- [ ] Create `backend/tests/` folder
- [ ] Configure test script in package.json

### Write Unit Tests
- [ ] `tests/auth.controller.test.js`
  - [ ] Signup with valid email
  - [ ] Signup with invalid email (should fail)
  - [ ] Signup with duplicate email (should fail)
  - [ ] Login with correct password
  - [ ] Login with wrong password (should fail)
- [ ] `tests/products.controller.test.js`
  - [ ] Create product with all fields
  - [ ] Create product with missing name (should fail)
  - [ ] Update product price
  - [ ] Soft delete product (deleted_at set)
  - [ ] List products returns only seller's products
- [ ] `tests/orders.controller.test.js`
  - [ ] Create order with valid data
  - [ ] Create order with invalid phone (should fail)
  - [ ] Create order decreases product stock
  - [ ] Product snapshot captured (name, price)

---

## 📝 DOCUMENTATION TASKS

- [ ] Create `docs/API_MAP.md`
  - [ ] Document all Phase 1 endpoints (auth, products, orders)
  - [ ] Include request/response examples
  - [ ] Include error codes
- [ ] Create `docs/DECISIONS.md`
  - [ ] Record tech stack choices (why Express, why Supabase)
  - [ ] Record dual storage decision (Supabase + Sheets)
- [ ] Update `docs/CONTEXT.md`
  - [ ] Mark Phase 1 tasks as complete
  - [ ] Note any issues encountered
  - [ ] Write summary for next session

---

## ✅ DEFINITION OF DONE

Phase 1 is complete when:
- [ ] Backend API runs locally (npm run dev)
- [ ] All 7 tables exist in Supabase
- [ ] RLS policies applied and tested (Seller A can't see Seller B's data)
- [ ] Auth endpoints work (signup, login, logout, me)
- [ ] Products CRUD works (create, list, update, delete)
- [ ] Orders endpoint works (create, list, get, update status)
- [ ] Stock decreases when order is placed
- [ ] All unit tests pass (15+ tests)
- [ ] Logging middleware logs all requests
- [ ] Error handling middleware catches errors gracefully
- [ ] Code committed to git (feature/phase1-foundation branch)
- [ ] Documentation updated (CONTEXT.md, API_MAP.md, DECISIONS.md)

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
