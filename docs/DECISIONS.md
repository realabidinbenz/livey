# Architecture & Implementation Decisions

This document records WHY we chose specific approaches. When you forget "why did we do it this way?", read this.

---

## 2026-02-11: Monorepo Structure

**Decision:** One repository with `backend/` and `frontend/` folders (separate package.json files).

**Why:**
- Simpler than managing 2 separate repos (livey-backend, livey-frontend)
- Can deploy to Vercel from single repo (Vercel handles monorepo routing)
- Easier to coordinate changes (change API, update frontend in same commit)

**Alternative Considered:**
- Separate repos (backend and frontend)
  - **Pros:** Fully independent deployment, cleaner separation
  - **Cons:** More complex to coordinate changes, need 2 PRs for related work

**Tradeoff:**
- If we need to split later (different teams), monorepo becomes harder
- For MVP with 1 dev (me + Claude), monorepo is simpler

---

## 2026-02-11: Tech Stack (Node + Express + React + Supabase)

**Decision:**
- Backend: Node.js + Express (JavaScript)
- Frontend: React + Vite
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Real-time: Supabase Realtime

**Why:**
- **Node + Express:** Claude knows it well (trained on millions of examples), easy to debug
- **React:** Most popular frontend framework, huge ecosystem, Claude produces clean code
- **Supabase:** All-in-one (database + auth + real-time + storage), free tier, good docs
- **JavaScript (not TypeScript):** Faster to prototype, fewer type errors to fight in MVP

**Alternative Considered:**
- **FastAPI (Python backend):** Good, but team has no Python experience
- **Next.js (full-stack):** Could work, but mixing frontend/backend in same codebase adds complexity
- **TypeScript:** Better for large teams, but slows down solo dev in early MVP stage

**Tradeoff:**
- JavaScript lacks type safety (easier to introduce bugs)
- Can migrate to TypeScript later if project grows

---

## 2026-02-11: Dual Storage (Supabase + Google Sheets)

**Decision:** Save orders to BOTH Supabase (primary) and Google Sheets (async).

**Why:**
- Sellers WANT orders in Google Sheets (familiar, easy to call customers)
- Google Sheets API WILL fail (quota exceeded, network timeout, seller deletes Sheet)
- Can't lose orders → Supabase is source of truth
- Sheets write happens async with retry logic (if fails, retry in background)

**Alternative Considered:**
- **Only Supabase:** Seller has to check dashboard for orders (less convenient)
- **Only Google Sheets:** If API fails, order is lost (unacceptable)

**Implementation:**
```javascript
// Order flow:
1. Customer submits order
2. Save to Supabase (PRIMARY - must succeed)
3. Return success to customer immediately
4. Attempt Sheets write (async, non-blocking)
5. If Sheets fails → log error, mark order as "sync pending"
6. Background job retries every 5 min (exponential backoff)
```

**Tradeoff:**
- More complex code (dual writes, retry logic)
- But bulletproof: orders never lost even if Sheets API is down for hours

---

## 2026-02-11: Supabase Auth (Not Custom JWT)

**Decision:** Use Supabase Auth for seller authentication.

**Why:**
- Built-in email verification, password reset, session management
- Handles token refresh automatically
- Secure by default (bcrypt password hashing, JWT signing)
- Less code to write and maintain

**Alternative Considered:**
- **Custom JWT:** Full control, but more work (write signup, login, password reset, email verification)
- **Clerk/Auth0:** Beautiful UI, but costs money after free tier

**Tradeoff:**
- Locked into Supabase ecosystem (but can migrate to another provider later if needed)
- Less customization (e.g., can't add custom auth flow easily)

---

## 2026-02-11: No Customer Accounts

**Decision:** Customers don't need accounts. Orders are anonymous (just name, phone, address).

**Why:**
- Faster checkout (no signup friction)
- Matches MVP spec: "Customer enters name for chat, that's it"
- COD model = seller calls customer anyway (no need to track customer history)

**Alternative Considered:**
- **Optional accounts:** Customer can sign up to track orders
  - **Pros:** Better UX for repeat customers
  - **Cons:** More complexity, slows down checkout

**When to Revisit:**
- If sellers request "see repeat customers" feature
- If we add payment gateway (then accounts make more sense)

---

## 2026-02-11: Stock Overselling Allowed

**Decision:** If stock is 2 and 2 customers order simultaneously, both orders succeed (stock goes to 0 or negative).

**Why:**
- Seller handles this via phone call anyway (COD model)
- Implementing stock locking (transactions, race condition handling) is complex for MVP
- Edge case is rare (2 orders in same second for last item)

**Implementation:**
```javascript
// When order is created:
1. Fetch product stock
2. Create order (always succeeds)
3. Decrease stock by quantity (UPDATE products SET stock = stock - quantity)
4. If stock goes negative, seller sees it and handles on phone call
```

**When to Revisit:**
- If sellers complain about frequent overselling
- If we add real-time inventory tracking

**Alternative:**
- Lock stock during order (BEGIN TRANSACTION, check stock, create order, decrease stock, COMMIT)
  - **Pros:** Prevents overselling
  - **Cons:** More complex, slower, can cause deadlocks

---

## 2026-02-11: Row Level Security (RLS) for Data Isolation

**Decision:** Use Supabase Row Level Security (RLS) on EVERY table.

**Why:**
- Prevents Seller A from seeing Seller B's data (even if API has bugs)
- Security at database level (can't bypass with direct SQL queries)
- Better than checking `sellerId` in every API endpoint (too easy to forget)

**Implementation:**
```sql
-- Example: Products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can only see their own products"
ON products FOR ALL
USING (seller_id = auth.uid());
```

**Testing:**
- Create 2 seller accounts
- Seller A tries to fetch Seller B's products via API (should return empty array, not 403)

**Tradeoff:**
- Adds complexity (RLS policies can be tricky to debug)
- But critical for security (worth the complexity)

---

## 2026-02-11: Modules < 800 Lines

**Decision:** No file should exceed 800 lines. Break into smaller modules.

**Why:**
- Claude loses context with large files (produces inconsistent code)
- Easier to debug (small files = clear responsibility)
- Easier to refactor (change one module without breaking others)

**Example:**
```
❌ BAD: orders.controller.js (2,000 lines)
  - createOrder
  - listOrders
  - getOrderById
  - updateOrderStatus
  - syncToGoogleSheets
  - retryFailedSyncs
  - generateOrderNumber
  - validateOrderData

✅ GOOD:
  - orders.controller.js (300 lines) - createOrder, listOrders, getOrderById, updateOrderStatus
  - sheets.service.js (400 lines) - syncToGoogleSheets, retryFailedSyncs, OAuth flow
  - order.utils.js (100 lines) - generateOrderNumber, validateOrderData
```

**When to Revisit:**
- If splitting modules creates more confusion than clarity

---

## 2026-02-11: Logging from Day 1

**Decision:** Log EVERY critical action (orders, Sheets sync, auth, errors).

**Why:**
- Production issues are impossible to debug without logs
- Vercel logs are free (no cost to log everything)
- Can find bugs faster ("What happened to order #123?" → check logs)

**What to Log:**
- ✅ All API requests (method, path, status, response time)
- ✅ All orders created (orderId, sellerId, productId, total, timestamp)
- ✅ All Google Sheets sync attempts (success/failure, retry count)
- ✅ All authentication events (login, logout, token refresh)
- ✅ All errors (endpoint, userId, error message, stack trace)

**What NOT to Log:**
- ❌ Passwords (security risk)
- ❌ Full customer addresses (privacy - just log "order created", not full address)

**Tool:**
- Start with `console.log` (shows in Vercel logs)
- Upgrade to Sentry if we get real users (better error tracking)

---

## 2026-02-11: Pagination from Day 1

**Decision:** All list endpoints paginate (default: 50 items, max: 100).

**Why:**
- Loading ALL orders breaks with 1,000+ orders (slow query, slow frontend)
- Easier to add pagination now than retrofit later

**Implementation:**
```javascript
GET /api/orders?limit=50&offset=0  // First 50 orders
GET /api/orders?limit=50&offset=50 // Next 50 orders
```

**Default:**
- Limit: 50
- Offset: 0
- Order by: `created_at DESC` (newest first)

---

## 2026-02-11: Test with 2 Seller Accounts

**Decision:** ALWAYS test data isolation with 2 accounts before considering feature "done".

**Why:**
- Data leaks destroy trust (Seller A sees Seller B's customers = lawsuit)
- RLS policies can be wrong (easy to mess up SQL)
- Manual testing catches bugs Claude might miss

**Process:**
1. Create Seller A account
2. Create Seller B account
3. Seller A creates products/orders/sessions
4. Seller B creates products/orders/sessions
5. Try to access Seller B's data while logged in as Seller A (should fail)
6. Try direct API calls with Seller A's token to Seller B's resource IDs (should 404 or empty)

---

## 2026-02-11: Railway for Backend (Not Vercel)

**Decision:** Deploy backend on Railway ($5/mo), frontend on Vercel (free).

**Why Vercel Won't Work for Backend:**
- Vercel cron on Hobby plan: once per day minimum (we need every 5 min for Sheets retry)
- Vercel cron sends GET only — our `POST /api/cron/sync-sheets` won't be called
- In-memory OAuth state store dies between serverless invocations (OAuth callback always fails)
- No WebSocket support (needed for Supabase Realtime server-side subscriptions)
- Serverless spins down between requests (bad for live sessions)

**What Railway Provides:**
- Always-on process (no cold starts)
- Native cron (5-min minimum)
- WebSocket support
- Persistent in-memory state
- $5/month (acceptable for MVP)

**Total Cost:** ~$5/month (Railway) + $0 (Vercel frontend) + $0 (Supabase free tier)

---

## 2026-02-11: Admin Client + sellerQuery() (Not Per-Request JWT)

**Decision:** Keep using `supabaseAdmin` (service role) for all DB queries, but add `sellerQuery()` helper to enforce seller_id filtering.

**Why:**
- RLS policies exist on all tables but are bypassed by the admin client
- Primary data isolation is enforced by `sellerQuery()` / `sellerSelect()` helpers
- RLS serves as a backup layer (defense in depth)
- Per-request JWT client would be more secure but requires significant refactoring

**Alternative Considered:**
- **Per-request Supabase client using user's JWT:** RLS would actually enforce isolation
  - **Pros:** True database-level security, can't forget seller_id filter
  - **Cons:** More complex middleware, harder to debug, significant refactor of all controllers
  - **When to revisit:** If team grows beyond 1 dev, or if a data isolation bug is found

---

## 2026-02-11: Adjacent Widget Layout (YouTube ToS Compliance)

**Decision:** Product card, chat panel, and order form are placed beside/below the YouTube player, never overlapping it.

**Why:**
YouTube Developer Policies state: "You must not display overlays, frames, or other visual elements in front of any part of a YouTube embedded player, including player controls." Violating this could get API access revoked.

**Layout:**
- Desktop: Player top/left, product card + chat below/right
- Mobile: Stack vertically (player top, product card middle, chat bottom)

---

## 2026-02-11: Random Hex Order Numbers (Not Sequential)

**Decision:** Order numbers use format `ORD-YYYYMMDD-XXXX` (4 random hex chars) instead of sequential `ORD-YYYYMMDD-001`.

**Why:**
- Sequential numbers had a race condition under concurrent requests
- Random hex eliminates DB queries for number generation (faster)
- Collision probability: ~1 in 65,536 per day — acceptable for MVP volume

---

## 2026-02-12: Library Recommendations (All Phases)

**Decision:** Audit and lock in library choices for Phases 3-6 before building further.

### Phase 3 Backend — No New Dependencies

**Decision:** Zero new npm packages for Phase 3.

**Why:**
- **YouTube URL parsing:** 15-line regex in `utils/youtube.js` replaces unmaintained npm packages (`get-youtube-id` last updated 2019, `get-video-id` last updated 2021). Handles all formats: `watch?v=`, `youtu.be/`, `live/`, `embed/`, `shorts/`, `/v/`.
- **YouTube validation:** `googleapis` already installed — use YouTube Data API v3 to verify video exists.
- **Real-time chat:** Built into `@supabase/supabase-js` Realtime — no new library.
- **Logging:** Custom `logger.js` (console.log with JSON format) works for MVP. Upgrade to `pino` only if Railway log volume demands structured search.
- **Validation:** Hand-rolled validators work for current ~5 rules. Consider `zod` only if rules exceed 15+.

### Frontend Libraries (Phases 4-6)

**Decision:** Lean stack targeting < 50 KB gzipped for the widget bundle.

| Package | Size (gzip) | Purpose | Alternative Rejected |
|---------|------------|---------|---------------------|
| `react-router-dom` v7 | 14 KB | Routing (4-5 routes) | — |
| `zustand` | 1.2 KB | State (2-3 stores) | Redux (overkill), Context (re-render issues) |
| `ky` | 3.3 KB | HTTP client (fetch wrapper) | `axios` (11.7 KB, no benefit) |
| `react-hook-form` | 9 KB | Forms (order form) | `formik` (15 KB, 7 deps, more re-renders) |
| `dayjs` | 2 KB | Date formatting (has `ar-dz` locale) | `date-fns` (6 KB), `moment` (67 KB, deprecated) |
| `sonner` | 5 KB | Toast notifications | `react-toastify` (16 KB) |
| `daisyUI` | 3 KB CSS | Tailwind components (no JS) | `shadcn/ui` (slower setup) |
| `vitest` | dev only | Frontend test runner (native Vite) | jest (more config) |

**Total additions: ~37.5 KB** — lighter than jQuery alone.

**Phase-by-phase install plan:**
- Phase 4 (Widget): `ky`, `dayjs`, `sonner`, `react-hook-form`, Tailwind, `vitest`
- Phase 5 (Dashboard): `react-router-dom`, `zustand`, `daisyui`
- Phase 6 (Control Panel): No new libraries

**Explicitly NOT using:** `axios`, `formik`, `luxon`, `react-toastify`, `redux`, `moment`, `winston`.

**Backend keep `node --test`** — zero-dependency, works great. `vitest` is frontend only.

---

**Last Updated:** 2026-02-12
**Next Review:** After Phase 3 completion
