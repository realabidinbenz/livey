# Livey MVP - Technical Requirements Document

**Version:** 1.0
**Last Updated:** February 11, 2026
**Status:** Ready to Build

---

## 📋 TABLE OF CONTENTS

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [User Workflows](#user-workflows)
6. [Feature Requirements](#feature-requirements)
7. [Business Rules](#business-rules)
8. [Environment Variables](#environment-variables)
9. [Deployment](#deployment)
10. [Security](#security)

---

## 🛠️ TECH STACK

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Language:** JavaScript (ES6+)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime (PostgreSQL subscriptions)
- **File Storage:** Supabase Storage

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Real-time Client:** Supabase JS Client

### Third-Party Integrations
- **YouTube:** YouTube IFrame Player API
- **Google Sheets:** Google Sheets API v4 (OAuth 2.0)
- **Deployment:** Vercel (frontend) + Railway (backend)

### Development Tools
- **Version Control:** Git + GitHub
- **Package Manager:** npm
- **Linting:** ESLint
- **Environment:** dotenv

---

## 🏗️ ARCHITECTURE OVERVIEW

### Monorepo Structure
```
livey/
├── backend/
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── controllers/      # Business logic
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── services/         # Third-party integrations (Sheets, YouTube)
│   │   └── utils/            # Helper functions
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Dashboard, Control Panel
│   │   ├── widget/           # Embeddable widget code
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API calls
│   │   └── utils/            # Helper functions
│   ├── public/
│   ├── package.json
│   └── .env
│
├── .gitignore
├── .mcp.json
├── livey-mvp-spec.md
├── REQUIREMENTS.md
├── README.md
└── YOUR-WORKFLOW-GUIDE.md
```

### Deployment Architecture
- **Frontend:** Vercel (static hosting)
- **Backend API:** Railway (always-on process, $5/mo)
- **Database:** Supabase Cloud (PostgreSQL)
- **CDN:** Vercel Edge Network
- **Widget:** Served from `/widget/livey-widget.js` (cached at edge)

---

## 🗄️ DATABASE SCHEMA

### Tables

#### 1. `users` (Sellers)
Managed by Supabase Auth, extended with custom profile table.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- in Algerian Dinars (no decimals)
  image_url TEXT,
  stock INTEGER, -- NULL means unlimited
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- soft delete
);

CREATE INDEX idx_products_seller ON products(seller_id) WHERE deleted_at IS NULL;
```

#### 3. `live_sessions`
```sql
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live', -- 'live', 'ended', 'replay'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  embed_code TEXT, -- Pre-generated embed code for this session
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_seller ON live_sessions(seller_id);
CREATE INDEX idx_sessions_status ON live_sessions(status);
```

#### 4. `session_products` (Many-to-Many)
Products featured in a live session.

```sql
CREATE TABLE session_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ, -- NULL if not currently pinned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_session_products_session ON session_products(session_id);
```

#### 5. `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL, -- Human-readable: ORD-20260211-001
  session_id UUID REFERENCES live_sessions(id),
  product_id UUID REFERENCES products(id),
  seller_id UUID REFERENCES profiles(id),

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,

  -- Order details
  product_name TEXT NOT NULL, -- Snapshot (in case product deleted)
  product_price INTEGER NOT NULL, -- Snapshot
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL, -- price * quantity

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'delivered'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  google_sheets_synced BOOLEAN DEFAULT FALSE,
  google_sheets_row_number INTEGER
);

CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

#### 6. `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_seller BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ, -- Soft delete for moderation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at DESC);

-- Keep only last 100 messages per session (cleanup job)
```

#### 7. `google_sheets_connections`
```sql
CREATE TABLE google_sheets_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_url TEXT,
  refresh_token TEXT NOT NULL, -- Encrypted
  access_token TEXT, -- Temporary, refreshed as needed
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);
```

---

## 🔌 API ENDPOINTS

### Authentication
```
POST   /api/auth/signup          # Create seller account
POST   /api/auth/login           # Login
POST   /api/auth/logout          # Logout
GET    /api/auth/me              # Get current user
```

### Products
```
GET    /api/products             # List all products (seller's)
POST   /api/products             # Create product
GET    /api/products/:id         # Get single product
PUT    /api/products/:id         # Update product
DELETE /api/products/:id         # Soft delete product
```

### Live Sessions
```
POST   /api/sessions             # Start live session
GET    /api/sessions/:id         # Get session details
PUT    /api/sessions/:id/end     # End live session
GET    /api/sessions/active      # Get seller's active session
POST   /api/sessions/:id/pin     # Pin product (body: {productId})
```

### Orders
```
POST   /api/orders               # Create order (public - from widget)
GET    /api/orders               # List orders (seller only)
GET    /api/orders/:id           # Get order details
PUT    /api/orders/:id/status    # Update order status
```

### Chat
```
GET    /api/chat/:sessionId/messages       # Get messages (last 100)
POST   /api/chat/:sessionId/messages       # Send message (public)
DELETE /api/chat/:sessionId/messages/:id   # Delete message (seller only)

# Real-time via Supabase subscriptions, not REST
```

### Google Sheets
```
POST   /api/sheets/connect       # Initiate OAuth flow
GET    /api/sheets/callback      # OAuth callback
GET    /api/sheets/status        # Check connection status
POST   /api/sheets/test          # Test connection
DELETE /api/sheets/disconnect    # Remove connection
```

### Widget (Public)
```
GET    /api/widget/:sessionId    # Get widget data (session, products, chat)
GET    /widget/livey-widget.js   # Widget JavaScript file (served from frontend)
```

---

## 👥 USER WORKFLOWS

### Workflow Decisions (from Q&A)

#### Seller Workflow

**YouTube Integration:**
- Seller uses regular YouTube mobile app to go live
- Pastes full YouTube URL (e.g., `https://youtube.com/watch?v=xyz`) OR just ID (`xyz`)
- System auto-detects and extracts video ID

**Product Pinning:**
- Seller can pin ANY product from their full catalog (not limited to pre-selected)
- Only 1 product visible at a time (old disappears when new is pinned)
- Can re-pin same product multiple times during live

**Control Panel:**
- If accidentally closed, live session CONTINUES
- Seller can re-open control panel anytime via URL

**Ending Live:**
- Confirmation dialog: "End live? This will activate replay." [Cancel] [End Live]
- After ending, seller can start new live immediately
- New live replaces old replay on same embed code

#### Customer Workflow

**Video Playback:**
- Video auto-plays with sound OFF (muted)
- Customer can unmute if interested

**Chat:**
- Pop-up appears on first chat attempt: "Enter your name to chat"
- Name saved in browser for 24 hours
- Name only required for chat, NOT for ordering

**Product Display:**
- When seller pins new product, card flashes/pulses to grab attention
- ORDER NOW button only visible when product is pinned
- Address field placeholder: "Example: Algiers, Bab El Oued, Rue xyz, Building 5, Apt 12"

**Ordering:**
- Can place multiple orders (form resets after each)
- Phone validation on submit (must match Algerian format: 05XX XX XX XX)

#### Replay Mode

**Chat in Replay:**
- Customers can see old chat messages (social proof)
- Cannot post new messages
- "REPLAY" badge visible

**Video Behavior:**
- Loops forever
- Same embed code as live

---

## ✨ FEATURE REQUIREMENTS

### 1. Embeddable Widget

**Technical Specs:**
```javascript
// Embed code seller pastes:
<script src="https://livey.vercel.app/widget/livey-widget.js"
        data-session-id="abc-123-xyz"></script>
```

**Widget Must:**
- Load in under 3 seconds on 3G
- Auto-initialize using `data-session-id`
- Render YouTube IFrame Player
- Display product card (name, price, image, ORDER NOW button)
- Show chat panel (collapsible on mobile)
- Handle live ↔ replay transitions automatically
- Work on mobile (responsive, touch-friendly)

**Widget Components:**
1. YouTube video player (IFrame API)
2. Product card (below/beside player)
3. Chat panel (real-time updates)
4. Order form modal (slides up from bottom on mobile)
5. Order confirmation screen

---

### 2. Seller Dashboard

**Pages:**

**Dashboard Home:**
- Welcome message
- Quick stats: Total orders today, active session status
- Quick actions: "Add Product", "Go Live", "View Orders"

**Products Page:**
- Table of products (name, price, stock, image thumbnail)
- "Add Product" button → form modal
- Edit/delete actions per row
- Form fields: Name, Price (DA), Image (upload or URL), Stock (optional), Description (optional)

**Go Live Page:**
- "YouTube Video URL" input (paste live URL)
- Product selector (checkboxes or multi-select - ALL products available)
- "Start Session" button
- After starting: redirect to control panel

**Orders Page:**
- Table of recent orders (last 100)
- Columns: Order #, Date, Customer, Phone, Product, Quantity, Total, Status
- Filter by date, product, status
- Click order → view details

**Settings Page:**
- Business name
- Google Sheets connection status
- "Connect Google Sheets" button → OAuth flow
- Embed code (copy-paste box)

---

### 3. Control Panel (Mobile-First)

**Layout:**
- Header: Live status (green dot + "LIVE"), timer, viewer count, order count
- Product Grid: Thumbnails of all products, tap to pin (currently pinned is highlighted)
- Chat Section: Scrolling messages, delete button per message
- Order Notifications: Toast notifications when new order arrives
- "End Live" button (bottom, red, requires confirmation)

**Real-time Updates:**
- Chat messages appear instantly
- Order notifications pop up
- Product pins update for all viewers

---

### 4. Google Sheets Integration

**OAuth Flow:**
1. Seller clicks "Connect Google Sheets"
2. Redirects to Google OAuth consent screen
3. Seller grants access to Sheets API
4. Callback saves refresh token (encrypted) in database
5. Success message: "Connected! Orders will sync automatically."

**Writing Orders:**
- On order creation, append row to seller's Sheet
- Columns (fixed order):
  1. Order ID
  2. Date/Time
  3. Customer Name
  4. Phone
  5. Full Address
  6. Product Name
  7. Price (DA)
  8. Quantity
  9. Total (DA)
  10. Status (default: "Pending")

**Error Handling:**
- If Sheets API fails, save to Supabase anyway
- Mark `google_sheets_synced = FALSE`
- Background job retries every 5 minutes
- Seller sees warning: "Order saved, but Sheet sync failed. Retrying..."

**Existing Data:**
- Append to next empty row (don't touch existing data)

---

### 5. Real-Time Chat

**Flow:**
1. Customer types message
2. If first time, pop-up asks for name
3. Message sent via Supabase insert
4. All clients subscribed to `chat_messages` table receive update instantly
5. Message appears in chat panel for everyone

**Seller Moderation:**
- Seller sees delete button (trash icon) next to each message
- Click delete → soft delete (sets `deleted_at` timestamp)
- Message disappears for everyone

**Message Cleanup:**
- Keep only last 100 messages per session
- Nightly cleanup job deletes older messages

**Display:**
- Customer messages: Plain text, left-aligned
- Seller messages: Blue background, "SELLER" badge
- Deleted messages: Hidden

---

### 6. Order Processing

**Flow:**
1. Customer clicks ORDER NOW
2. Form slides up (mobile drawer)
3. Customer fills: Name, Phone, Address, Quantity
4. Clicks "Confirm Order"
5. Frontend validates:
   - All fields filled
   - Phone matches format: `05XX XX XX XX` or `06XX XX XX XX` or `07XX XX XX XX`
6. POST to `/api/orders`
7. Backend:
   - Creates order in Supabase
   - Generates order number (e.g., `ORD-20260211-001`)
   - Calculates total (price × quantity)
   - Decreases product stock (if not unlimited)
   - Appends to Google Sheets (async, with retry)
   - Broadcasts notification to control panel (Supabase Realtime)
8. Frontend shows success: "Order confirmed! We'll contact you soon."
9. Display order summary (name, product, total)
10. Form closes, customer can continue watching

**Stock Management:**
- If stock is set (not NULL), decrease by quantity ordered
- If stock reaches 0, product shows "Out of Stock" (but can still be pinned)
- Overselling allowed (if 2 orders for last item, both go through)

---

### 7. YouTube Integration

**Live Detection:**
- Use YouTube IFrame API
- Listen for state changes
- When video ends (state = 0), session auto-transitions to replay

**Replay Mode:**
- Same video ID (YouTube keeps same URL after live ends)
- Video loops (IFrame parameter: `loop=1`)
- "REPLAY" badge appears

---

## 📐 BUSINESS RULES

### Products
- Stock is optional (NULL = unlimited)
- Stock auto-decreases on order
- Can't delete product if it's currently pinned in active session
- Can't edit product while it's pinned in active session

### Sessions
- Seller can only have 1 active session at a time
- Starting new session ends previous session (if active)
- Session status: `live` → `ended` → `replay`
- Ended sessions stay in database (for order history)

### Orders
- Order numbers are sequential per day: `ORD-YYYYMMDD-NNN`
- Orders can't be deleted, only marked as "Cancelled"
- Total is always calculated: `price × quantity` (not user input)

### Chat
- Maximum message length: 200 characters
- Messages older than active session are hidden
- Only last 100 messages kept per session

### Google Sheets
- One Sheet connection per seller
- If connection fails, orders still save to database
- Seller can disconnect and reconnect anytime

---

## 🔐 ENVIRONMENT VARIABLES

### Backend `.env`
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=https://livey.vercel.app/api/sheets/callback

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://livey.vercel.app

# Encryption (for Google refresh tokens)
ENCRYPTION_KEY=xxxxx (generate with: openssl rand -hex 32)
```

### Frontend `.env`
```bash
# Supabase (public keys only)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# API
VITE_API_URL=https://livey.vercel.app/api
```

---

## 🚀 DEPLOYMENT

### Deployment Split
- **Frontend (React/Vite):** Deploy to Vercel from `frontend/` directory
- **Backend (Express):** Deploy to Railway from `backend/` directory
- Railway provides: always-on process, native cron (5-min minimum), WebSocket support
- Vercel cron limitations (daily only, GET only) make it unsuitable for the backend

### GitHub Actions (Optional - Auto Deploy)
- Push to `main` → Auto-deploy to Vercel production
- Push to `dev` → Deploy to Vercel preview

---

## 🔒 SECURITY

### Authentication
- Supabase Auth handles password hashing (bcrypt)
- JWT tokens for session management
- Tokens expire after 7 days
- Rate limiting on login: 5 attempts per 15 minutes

### API Security
- All seller endpoints require authentication (JWT in `Authorization` header)
- Public endpoints: `/api/orders` (POST), `/api/widget/*`, `/api/chat/*/messages` (GET, POST)
- CORS enabled only for widget domains

### Rate Limiting
- Global: 100 requests/minute per IP
- Auth (login/signup): 5 requests/15 minutes per IP
- Public orders: 10 requests/15 minutes per IP
- Request body size: 1MB maximum

### Input Sanitization
- All string inputs stripped of HTML/script tags (XSS prevention)
- HPP (HTTP Parameter Pollution) protection enabled
- Phone numbers normalized before validation (handles +213, spaces)

### Data Validation
- All inputs sanitized (prevent XSS)
- SQL injection prevented (Supabase uses parameterized queries)
- Phone number regex: `^(05|06|07)\d{8}$`

### Google Sheets Tokens
- Refresh tokens encrypted at rest (AES-256)
- Access tokens refreshed on-demand (never stored in frontend)

### Environment Variables
- Never committed to Git
- Stored in Vercel dashboard
- Encrypted in transit

---

## 📊 PERFORMANCE TARGETS

### Widget
- **Load time:** < 3 seconds (3G connection)
- **Time to Interactive:** < 5 seconds
- **Bundle size:** < 200KB (gzipped)

### API
- **Response time:** < 500ms (p95)
- **Availability:** 99% uptime
- **Chat latency:** < 2 seconds (message sent → received)

### Database
- **Query time:** < 100ms (p95)
- **Connection pooling:** Max 20 concurrent connections

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests
- Backend: Controllers, services (Google Sheets, order processing)
- Frontend: Components, form validation

### Integration Tests
- Auth flow (signup, login, logout)
- Order creation → Supabase → Google Sheets
- Real-time chat (message send/receive)

### E2E Tests (Optional for MVP)
- Complete seller workflow (signup → add product → go live → receive order)
- Complete customer workflow (watch video → chat → order)

---

## 📝 NEXT STEPS

1. **Set up project structure** (backend/ and frontend/ folders)
2. **Initialize Supabase** (create tables, RLS policies)
3. **Build backend API** (Express routes, controllers)
4. **Build frontend** (Dashboard, Control Panel, Widget)
5. **Integrate Google Sheets** (OAuth flow, append rows)
6. **Test end-to-end** (local → staging → production)
7. **Deploy to Vercel**

---

**Ready to build!** 🚀

This document is the source of truth for implementation.
