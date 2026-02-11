# API Documentation - Phase 1

**Base URL:** `http://localhost:3001/api`
**Production:** `https://livey-api.vercel.app/api` (when deployed)

---

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

Get `access_token` from login/signup response: `response.session.access_token`

---

## 📋 Endpoints

### Health Check
```
GET /health
```
**Public:** Yes
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T10:30:00.000Z",
  "service": "livey-backend",
  "version": "1.0.0"
}
```

---

## 🔐 Authentication Endpoints

### Signup
```
POST /api/auth/signup
```
**Public:** Yes
**Body:**
```json
{
  "email": "seller@example.com",
  "password": "password123"
}
```
**Response:** 201
```json
{
  "user": {
    "id": "uuid",
    "email": "seller@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```
**Errors:**
- 400: Invalid email or password too weak
- 409: Email already exists

---

### Login
```
POST /api/auth/login
```
**Public:** Yes
**Body:**
```json
{
  "email": "seller@example.com",
  "password": "password123"
}
```
**Response:** 200
```json
{
  "user": {
    "id": "uuid",
    "email": "seller@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```
**Errors:**
- 400: Invalid credentials

---

### Logout
```
POST /api/auth/logout
```
**Authenticated:** Yes
**Response:** 200
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User
```
GET /api/auth/me
```
**Authenticated:** Yes
**Response:** 200
```json
{
  "user": {
    "id": "uuid",
    "email": "seller@example.com",
    "business_name": "My Store",
    "created_at": "2026-02-11T10:00:00.000Z"
  }
}
```
**Errors:**
- 401: Invalid or expired token

---

## 📦 Products Endpoints

### List Products
```
GET /api/products?limit=50&offset=0
```
**Authenticated:** Yes (seller only)
**Query Params:**
- `limit` (optional): Max 100, default 50
- `offset` (optional): Default 0

**Response:** 200
```json
{
  "products": [
    {
      "id": "uuid",
      "seller_id": "uuid",
      "name": "Samsung Galaxy S24",
      "price": 120000,
      "stock": 10,
      "image_url": "https://example.com/image.jpg",
      "description": "Latest flagship",
      "created_at": "2026-02-11T10:00:00.000Z",
      "updated_at": "2026-02-11T10:00:00.000Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### Create Product
```
POST /api/products
```
**Authenticated:** Yes (seller only)
**Body:**
```json
{
  "name": "Product Name",
  "price": 50000,
  "stock": 10,
  "image_url": "https://example.com/image.jpg",
  "description": "Product description"
}
```
**Required:** `name`, `price`
**Optional:** `stock` (null = unlimited), `image_url`, `description`

**Response:** 201
```json
{
  "product": {
    "id": "uuid",
    "seller_id": "uuid",
    "name": "Product Name",
    "price": 50000,
    "stock": 10,
    "image_url": "https://example.com/image.jpg",
    "description": "Product description",
    "created_at": "2026-02-11T10:00:00.000Z"
  }
}
```
**Errors:**
- 400: Missing name or price, invalid price/stock
- 401: Not authenticated

---

### Get Product by ID
```
GET /api/products/:id
```
**Authenticated:** Yes (seller only)
**Response:** 200
```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    ...
  }
}
```
**Errors:**
- 404: Product not found or not owned by seller

---

### Update Product
```
PUT /api/products/:id
```
**Authenticated:** Yes (seller only)
**Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "price": 55000,
  "stock": 15
}
```
**Response:** 200
```json
{
  "product": {
    "id": "uuid",
    "name": "Updated Name",
    ...
  }
}
```
**Errors:**
- 400: Invalid price or stock
- 404: Product not found or not owned by seller

---

### Delete Product
```
DELETE /api/products/:id
```
**Authenticated:** Yes (seller only)
**Note:** Soft delete (sets `deleted_at` timestamp)

**Response:** 200
```json
{
  "message": "Product deleted successfully",
  "product": {
    "id": "uuid",
    "name": "Product Name"
  }
}
```
**Errors:**
- 404: Product not found or not owned by seller

---

## 🛒 Orders Endpoints

### Create Order
```
POST /api/orders
```
**Public:** Yes (no auth required - from widget)
**Body:**
```json
{
  "product_id": "uuid",
  "session_id": "uuid",
  "customer_name": "Ahmed Benali",
  "customer_phone": "0551234567",
  "customer_address": "Rue 123, Alger Centre, Alger 16000",
  "quantity": 2
}
```
**Required:** `product_id`, `customer_name`, `customer_phone`, `customer_address`
**Optional:** `session_id` (uuid), `quantity` (default: 1)

**Phone Format:** Must be 10 digits starting with 05, 06, or 07

**Response:** 201
```json
{
  "order": {
    "id": "uuid",
    "order_number": "ORD-20260211-001",
    "session_id": "uuid",
    "product_id": "uuid",
    "seller_id": "uuid",
    "customer_name": "Ahmed Benali",
    "customer_phone": "0551234567",
    "customer_address": "Rue 123, Alger Centre, Alger 16000",
    "product_name": "Samsung Galaxy S24",
    "product_price": 120000,
    "quantity": 2,
    "total_price": 240000,
    "status": "pending",
    "google_sheets_synced": false,
    "created_at": "2026-02-11T10:00:00.000Z"
  }
}
```
**Errors:**
- 400: Missing fields, invalid phone format, invalid quantity
- 404: Product not found

**Side Effects:**
- Product stock decreases by quantity (if stock tracking enabled)
- Order number auto-generated: `ORD-YYYYMMDD-###`

---

### List Orders
```
GET /api/orders?limit=50&offset=0
```
**Authenticated:** Yes (seller only)
**Query Params:**
- `limit` (optional): Max 100, default 50
- `offset` (optional): Default 0

**Response:** 200
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-20260211-001",
      "customer_name": "Ahmed Benali",
      "customer_phone": "0551234567",
      "product_name": "Samsung Galaxy S24",
      "quantity": 2,
      "total_price": 240000,
      "status": "pending",
      "created_at": "2026-02-11T10:00:00.000Z",
      ...
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Order by ID
```
GET /api/orders/:id
```
**Authenticated:** Yes (seller only)
**Response:** 200
```json
{
  "order": {
    "id": "uuid",
    "order_number": "ORD-20260211-001",
    ...
  }
}
```
**Errors:**
- 404: Order not found or not owned by seller

---

### Update Order Status
```
PUT /api/orders/:id/status
```
**Authenticated:** Yes (seller only)
**Body:**
```json
{
  "status": "confirmed"
}
```
**Valid Statuses:** `pending`, `confirmed`, `cancelled`, `delivered`

**Response:** 200
```json
{
  "order": {
    "id": "uuid",
    "order_number": "ORD-20260211-001",
    "status": "confirmed",
    ...
  }
}
```
**Errors:**
- 400: Invalid status value
- 404: Order not found or not owned by seller

---

## 🔒 Security

### Row Level Security (RLS)
All tables have RLS policies:
- **Products:** Sellers can only see/modify their own products
- **Orders:** Sellers can only see/modify their own orders
- **Profiles:** Users can only see/modify their own profile

### Data Isolation
- Seller A cannot access Seller B's products/orders via API
- Attempts return 404 (not 403) to prevent information disclosure

### Authentication
- JWT tokens via Supabase Auth
- Tokens expire after 1 hour (configurable)
- Refresh tokens for session extension

---

## 📊 Business Rules

### Products
- `stock = null` → Unlimited stock
- `stock >= 0` → Stock tracking enabled
- Soft delete: `deleted_at` timestamp (not removed from DB)

### Orders
- Order number format: `ORD-YYYYMMDD-###` (sequential per day per seller)
- Total price calculated server-side (never trust client)
- Stock decreases even if goes negative (overselling allowed per MVP spec)
- Orders cannot be deleted (only status changes)
- Product data snapshotted at order time (price/name preserved)

### Pagination
- Default limit: 50
- Maximum limit: 100
- Results ordered by `created_at DESC` (newest first)

---

## 🐛 Error Response Format

All errors follow this structure:
```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

### Common HTTP Status Codes
- **200:** Success
- **201:** Created
- **400:** Bad Request (validation failed)
- **401:** Unauthorized (missing or invalid token)
- **404:** Not Found
- **409:** Conflict (duplicate email, etc.)
- **500:** Internal Server Error

---

## 📝 Notes

- All timestamps in ISO 8601 format (UTC)
- All prices in Algerian Dinars (integer, no decimals)
- Phone numbers must match Algerian format: `(05|06|07)\d{8}`
- Email validation on signup

---

**Last Updated:** 2026-02-11
**Phase:** 1 (Foundation)
**Next Phase:** Google Sheets Integration
