# API Testing Guide - Phase 1

Manual testing checklist for all Phase 1 endpoints.
Use Postman, Thunder Client, or curl to test these.

## Setup

1. Start backend: `npm run dev` (in backend/)
2. Base URL: `http://localhost:3001`
3. Get auth token from login response

---

## 🔐 Authentication Tests

### 1. Signup (Create Seller Account)
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "seller1@example.com",
  "password": "password123"
}
```
**Expected:** 201, returns `{ user, session }`

### 2. Signup with duplicate email (should fail)
```
POST /api/auth/signup
(same email as above)
```
**Expected:** 400, error message

### 3. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "seller1@example.com",
  "password": "password123"
}
```
**Expected:** 200, returns `{ user, session }` with access_token

### 4. Get Current User
```
GET /api/auth/me
Authorization: Bearer <access_token>
```
**Expected:** 200, returns user info

### 5. Logout
```
POST /api/auth/logout
Authorization: Bearer <access_token>
```
**Expected:** 200, success message

---

## 📦 Products Tests

### 1. Create Product
```
POST /api/products
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Samsung Galaxy S24",
  "price": 120000,
  "stock": 10,
  "description": "Latest flagship phone"
}
```
**Expected:** 201, returns created product

### 2. Create Product without name (should fail)
```
POST /api/products
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "price": 50000
}
```
**Expected:** 400, error message

### 3. List Products
```
GET /api/products?limit=50&offset=0
Authorization: Bearer <access_token>
```
**Expected:** 200, returns array of products with pagination

### 4. Get Single Product
```
GET /api/products/{product_id}
Authorization: Bearer <access_token>
```
**Expected:** 200, returns product details

### 5. Update Product Price
```
PUT /api/products/{product_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "price": 115000
}
```
**Expected:** 200, returns updated product

### 6. Delete Product (Soft Delete)
```
DELETE /api/products/{product_id}
Authorization: Bearer <access_token>
```
**Expected:** 200, success message
**Verify:** Product no longer appears in list (deleted_at set)

---

## 🛒 Orders Tests

### 1. Create Order (PUBLIC - no auth)
```
POST /api/orders
Content-Type: application/json

{
  "product_id": "{product_id}",
  "customer_name": "Ahmed Benali",
  "customer_phone": "0551234567",
  "customer_address": "Rue 123, Alger Centre, Alger 16000",
  "quantity": 2
}
```
**Expected:** 201, returns created order
**Verify:**
- Order number format: ORD-YYYYMMDD-001
- Total = product_price × quantity
- Stock decreased by quantity

### 2. Create Order with invalid phone (should fail)
```
POST /api/orders
Content-Type: application/json

{
  "product_id": "{product_id}",
  "customer_name": "Ahmed",
  "customer_phone": "1234567890",
  "customer_address": "Address",
  "quantity": 1
}
```
**Expected:** 400, phone validation error

### 3. Create Order with missing fields (should fail)
```
POST /api/orders
Content-Type: application/json

{
  "product_id": "{product_id}",
  "customer_name": "Ahmed"
}
```
**Expected:** 400, missing required fields error

### 4. List Orders (Seller Only)
```
GET /api/orders?limit=50&offset=0
Authorization: Bearer <access_token>
```
**Expected:** 200, returns array of orders with pagination
**Verify:** Only seller's orders returned (not other sellers)

### 5. Get Single Order
```
GET /api/orders/{order_id}
Authorization: Bearer <access_token>
```
**Expected:** 200, returns order details

### 6. Update Order Status
```
PUT /api/orders/{order_id}/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "confirmed"
}
```
**Expected:** 200, returns updated order
**Test statuses:** pending → confirmed → delivered

### 7. Update Order Status with invalid value (should fail)
```
PUT /api/orders/{order_id}/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "invalid"
}
```
**Expected:** 400, invalid status error

---

## 🔒 Data Isolation Tests (CRITICAL)

### Test with 2 Seller Accounts

1. **Create Seller A:**
   - Signup: seller-a@test.com
   - Login and save token A

2. **Create Seller B:**
   - Signup: seller-b@test.com
   - Login and save token B

3. **Seller A creates 2 products**
   - Use token A

4. **Seller B creates 2 products**
   - Use token B

5. **Test Isolation:**
   - Seller A lists products (token A) → Should see only their 2 products
   - Seller B lists products (token B) → Should see only their 2 products
   - Seller A tries to get Seller B's product by ID → Should 404
   - Seller A tries to update Seller B's product → Should 404

6. **Test Orders Isolation:**
   - Create order for Seller A's product
   - Create order for Seller B's product
   - Seller A lists orders → Should see only their orders
   - Seller B lists orders → Should see only their orders
   - Seller A tries to get Seller B's order by ID → Should 404

---

## 🧪 Stock Tracking Tests

1. **Create product with stock = 5**
2. **Create order with quantity = 2**
   - Verify stock = 3 after order
3. **Create order with quantity = 3**
   - Verify stock = 0 after order
4. **Create order with quantity = 1** (overselling allowed)
   - Verify stock = -1 (negative stock allowed per CLAUDE.md rules)

---

## 📊 Pagination Tests

1. **Create 10 products**
2. **List with limit=3, offset=0**
   - Should return 3 products
   - pagination.hasMore = true
3. **List with limit=3, offset=3**
   - Should return next 3 products
4. **List with limit=3, offset=9**
   - Should return 1 product
   - pagination.hasMore = false

---

## ✅ Success Criteria

Phase 1 is complete when:
- [ ] All auth endpoints work (signup, login, logout, me)
- [ ] All products endpoints work (CRUD + pagination)
- [ ] All orders endpoints work (create, list, get, update status)
- [ ] Phone validation works (rejects invalid formats)
- [ ] Data isolation works (Seller A can't access Seller B's data)
- [ ] Stock decreases when order is placed
- [ ] Order number generates correctly (ORD-YYYYMMDD-001)
- [ ] Pagination works (limit, offset, hasMore)
- [ ] All error cases handled gracefully

---

## 🐛 Common Issues

- **401 Unauthorized:** Token expired or invalid (re-login)
- **404 Not Found:** Wrong ID or trying to access another seller's data
- **500 Internal Error:** Check server logs for details
- **CORS Error:** Ensure CORS is configured correctly
