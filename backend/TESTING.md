# Testing Guide - Auth Endpoints

## Running the Server

```bash
cd backend
npm run dev
```

Server runs on: http://localhost:3001

---

## Testing Auth Endpoints

### 1. Signup (Create New Seller)

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"seller1@example.com","password":"password123"}'
```

**Expected Response (201):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "seller1@example.com"
  },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

**Error Cases:**
- 400: Email already exists
- 400: Password too short (< 8 chars)
- 400: Missing email or password

---

### 2. Login (Existing Seller)

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller1@example.com","password":"password123"}'
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "seller1@example.com"
  },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

**Error Cases:**
- 401: Invalid email or password
- 400: Missing email or password

---

### 3. Get Current User (Me)

**Request:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "seller1@example.com",
    "business_name": null
  }
}
```

**Error Cases:**
- 401: No token provided
- 401: Invalid token

---

### 4. Logout

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Cases:**
- 401: No token provided

---

## Testing with Postman

1. Import this collection or create requests manually
2. After signup/login, save the `access_token`
3. Use it in Authorization header for `/me` and `/logout`

### Environment Variables in Postman:
```
base_url = http://localhost:3001
access_token = (paste token after login)
```

---

## Testing Data Isolation (RLS)

### Create 2 Seller Accounts:

```bash
# Seller A
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"sellera@example.com","password":"password123"}'

# Seller B
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"sellerb@example.com","password":"password123"}'
```

Save both access tokens. We'll use these to test that Seller A can't see Seller B's data (products, orders).

---

## Next: Products Endpoints

After auth works, we'll build:
- POST /api/products (create product)
- GET /api/products (list seller's products)
- PUT /api/products/:id (update product)
- DELETE /api/products/:id (soft delete)

And test that Seller A can only see their own products.
