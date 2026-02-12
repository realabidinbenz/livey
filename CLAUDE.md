# CLAUDE.md - Project Rules & Context

**Project:** Livey MVP - Live shopping widget for Algerian sellers
**Stack:** Node.js + Express, React + Vite, Supabase, Google Sheets API
**Deployment:** Frontend → Vercel | Backend → Railway ($5/mo)
**Status:** Phase 2 complete → Starting Phase 3

---

## 🎯 THE CORE BET

Customer clicks ad → watches video → orders in 30 seconds → seller gets it in Google Sheet.

If this doesn't convert at 3x, nothing else matters.

---

## 🚨 NON-NEGOTIABLE RULES

### 1. MODULES < 800 LINES
- No file exceeds 800 lines
- Break into smaller, reusable modules
- Version files: `auth_service_v2.js` (don't overwrite)

### 2. ARCHITECTURE FIRST, CODE SECOND
- Read these files BEFORE writing any code:
  - `livey-mvp-spec.md` - Product vision
  - `REQUIREMENTS.md` - Technical blueprint
  - `docs/CONTEXT.md` - Current progress
  - `docs/tasks/phaseX.md` - Current phase checklist

### 3. DATA ISOLATION IS CRITICAL
- Primary isolation: `sellerQuery()` / `sellerSelect()` helpers in controller code (filters by seller_id)
- RLS enabled on every table as a backup layer (admin client bypasses RLS, so controller-level filtering is the real defense)
- Test with 2 seller accounts before marking feature "done"
- Seller A MUST NOT see Seller B's data (products, orders, sessions)

### 4. LOG EVERYTHING CRITICAL
Log these with `logger.info()` or `logger.error()`:
- ✅ All orders created (orderId, sellerId, productId, total)
- ✅ All Google Sheets sync attempts (success/failure/retry)
- ✅ All auth events (login, logout, signup)
- ✅ All API errors (endpoint, userId, error stack)

Never log: passwords, full customer addresses (PII)

### 5. PAGINATION FROM DAY 1
- All list endpoints: default limit=50, max=100
- Order by `created_at DESC` (newest first)
- Example: `GET /api/orders?limit=50&offset=0`

### 6. DUAL STORAGE (Supabase + Sheets)
- Orders MUST save to Supabase first (source of truth)
- Google Sheets write is async (can fail without breaking order)
- If Sheets fails → log error, mark `google_sheets_synced = false`, retry in background

### 7. TEST IMMEDIATELY
- Write unit tests AFTER building each feature (not later)
- No feature is "done" until tests pass
- Use separate QA chat to predict failures

### 8. SMALL COMMITS
- Commit after each feature (not end of day)
- Use feature branches: `feature/auth-endpoints`
- Clear messages: `feat: auth signup/login/logout endpoints`

### 9. SELF-REVIEW BEFORE ASKING
After building, ask yourself:
- "What design flaws exist?"
- "What's duplicated?"
- "What error handling is missing?"
- "What could break in production?"

Then fix it. Don't wait for me to find it.

### 10. EXPLAIN FLOW, NOT JUST CODE
Before I run anything, explain end-to-end:
- "When customer clicks ORDER NOW, what happens step-by-step?"
- "How does data flow from form → API → DB → Sheets?"

Catch disconnects before they become bugs.

### 11. SECURITY HARDENING (OWASP)
- Rate limiting on all routes (global: 100/min, auth: 5/15min, orders: 10/15min)
- Input sanitization on all string inputs (strip HTML/script tags)
- Request body size limit: 1MB
- HPP (HTTP Parameter Pollution) protection enabled
- Phone numbers normalized before validation (handles +213, spaces, dashes)
- Never trust client-side calculations (total_price computed server-side)

---

## 📂 FILE STRUCTURE

```
livey/
├── backend/
│   ├── src/
│   │   ├── index.js              (Express setup, < 100 lines)
│   │   ├── routes/               (Route files, ~100 lines each)
│   │   ├── controllers/          (Business logic, < 500 lines each)
│   │   ├── services/             (Third-party: Sheets, YouTube)
│   │   ├── middleware/           (auth, validation, logging, errors)
│   │   └── utils/                (Helper functions)
│   ├── tests/                    (Unit tests, one per controller)
│   ├── package.json
│   └── .env                      (NEVER commit this)
│
├── frontend/
│   ├── src/
│   │   ├── components/           (Reusable UI, < 300 lines each)
│   │   ├── pages/                (Full pages: Dashboard, Control Panel)
│   │   ├── widget/               (Embeddable widget code)
│   │   ├── hooks/                (Custom React hooks)
│   │   ├── services/             (API calls to backend)
│   │   └── utils/                (Helper functions)
│   ├── public/
│   ├── package.json
│   └── .env                      (Public keys only)
│
├── docs/
│   ├── CONTEXT.md                (Updated EVERY session)
│   ├── DECISIONS.md              (Why we chose X over Y)
│   ├── ISSUES.md                 (Bugs, edge cases, TODOs)
│   ├── API_MAP.md                (All endpoints documented)
│   └── tasks/
│       ├── phase1.md             (Current phase checklist)
│       ├── phase2.md
│       └── ...
```

---

## 🗄️ DATABASE (Supabase)

### Tables
1. **profiles** - Seller accounts (extends auth.users)
2. **products** - Seller products (name, price, image, stock)
3. **live_sessions** - Live sessions (YouTube video ID, status)
4. **session_products** - Products featured in session (many-to-many)
5. **orders** - Customer orders (with product snapshot)
6. **chat_messages** - Chat messages (last 100 per session)
7. **google_sheets_connections** - Seller's Sheet OAuth tokens (encrypted)

### RLS Policies (CRITICAL)
Every table MUST have:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can only see their own data"
ON table_name FOR ALL
USING (seller_id = auth.uid());
```

### Indexes (CRITICAL)
```sql
-- Products
CREATE INDEX idx_products_seller ON products(seller_id) WHERE deleted_at IS NULL;

-- Orders
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Chat
CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at DESC);
```

---

## 🔌 API ENDPOINTS

### Authentication
```
POST   /api/auth/signup    (email, password)
POST   /api/auth/login     (email, password)
POST   /api/auth/logout    (token)
GET    /api/auth/me        (token → user info)
```

### Products
```
GET    /api/products           (list seller's products, paginated)
POST   /api/products           (create product)
GET    /api/products/:id       (get one)
PUT    /api/products/:id       (update)
DELETE /api/products/:id       (soft delete: set deleted_at)
```

### Orders
```
POST   /api/orders             (PUBLIC - from widget)
GET    /api/orders             (seller only, paginated)
GET    /api/orders/:id         (seller only)
PUT    /api/orders/:id/status  (seller only: pending→confirmed→delivered)
```

### Live Sessions
```
POST   /api/sessions           (start live: YouTube URL, product IDs)
GET    /api/sessions/:id       (get session details)
PUT    /api/sessions/:id/end   (end live → transition to replay)
POST   /api/sessions/:id/pin   (pin product: { productId })
```

### Chat (Real-time via Supabase)
```
GET    /api/chat/:sessionId/messages     (last 100 messages)
POST   /api/chat/:sessionId/messages     (PUBLIC - send message)
DELETE /api/chat/:sessionId/messages/:id (seller only - delete spam)
```

### Google Sheets
```
POST   /api/sheets/connect     (OAuth flow start)
GET    /api/sheets/callback    (OAuth callback)
GET    /api/sheets/status      (connection status)
DELETE /api/sheets/disconnect  (remove connection)
```

---

## ⚙️ BUSINESS RULES

### Products
- Stock is optional (NULL = unlimited)
- Stock auto-decreases on order (even if goes negative - overselling allowed)
- Can't delete product if pinned in active session
- Can't edit product price/name while pinned (must end session first)

### Orders
- Order number format: `ORD-YYYYMMDD-001` (sequential per day)
- Total = `product_price × quantity` (calculated server-side, never trust client)
- Orders stored in BOTH Supabase (primary) + Google Sheets (async)
- If Sheets fails → retry every 5 min (exponential backoff: 5min, 15min, 1hr)
- Orders can NEVER be deleted (only marked as `status: 'cancelled'`)

### Sessions
- One active session per seller (starting new ends previous)
- Status flow: `live` → `ended` → `replay`
- Same embed code works for live + replay (auto-transitions)

### Chat
- Keep only last 100 messages per session (nightly cleanup)
- Messages in replay are view-only (customers can't post new)
- Seller can delete messages (soft delete: `deleted_at` timestamp)

### Google Sheets
- One connection per seller
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
  10. Status

---

## 🧪 TESTING RULES

### After Each Feature
```javascript
// Write unit test immediately
describe('Auth Controller', () => {
  test('signup creates user', async () => { ... });
  test('signup rejects invalid email', async () => { ... });
  test('login with wrong password fails', async () => { ... });
});
```

### Before Marking Feature "Done"
- [ ] Unit tests written and passing
- [ ] Tested with Postman/Thunder Client (manual API call)
- [ ] Tested data isolation (Seller A can't access Seller B's data)
- [ ] Logged critical actions
- [ ] No file > 800 lines
- [ ] Flow explained end-to-end

### QA Bot Strategy
Open parallel chat: "Livey QA Bot"
Ask: "Review this code. How could it break in production?"
Fix issues BEFORE moving to next feature.

---

## 📝 SESSION WORKFLOW

### Start of Session
1. Read `docs/CONTEXT.md` - know where we left off
2. Read `docs/tasks/phaseX.md` - see checklist
3. Define today's task (clear, specific)

### During Session
1. Build small module (< 800 lines)
2. Explain flow end-to-end
3. Write tests immediately
4. Run tests, fix failures
5. Refactor if messy

### End of Session
1. Self-review: "Find design flaws in what I built"
2. Update `docs/CONTEXT.md`:
   ```markdown
   ## What's Done:
   - ✅ Auth endpoints (signup, login, logout)

   ## What's Next:
   - [ ] Products CRUD endpoints

   ## Issues Found:
   - Password validation too weak (need 8+ chars)
   ```
3. Git commit: `git add . && git commit -m "feat: auth endpoints"`
4. Plan tomorrow: "Next: Products CRUD"

---

## 🚨 WHAT TO AVOID (Will Break in Production)

### ❌ DON'T
- Load all orders/products without pagination (breaks with 1,000+ items)
- Trust client input (always validate server-side)
- Overwrite files (use versioning: `auth_v2.js`)
- Skip RLS testing (data leaks destroy trust)
- Skip logging (can't debug production without logs)
- Write files > 800 lines (Claude loses context)
- Patch bugs endlessly (refactor when messy)
- Trust Google Sheets API (it WILL fail - have retry logic)
- Forget to snapshot product data (price/name can change)

### ✅ DO
- Paginate from day 1 (limit=50, offset=0)
- Validate all inputs (phone format, required fields)
- Version files before major changes
- Test with 2 seller accounts (data isolation)
- Log every critical action (orders, Sheets, auth)
- Break large files into modules
- Refactor when code feels messy
- Retry Sheets writes with exponential backoff
- Store product snapshot in orders (product_name, product_price)

---

## 🎯 CURRENT PHASE

**Phase:** Phase 2 complete
**Next:** Phase 3

**Read before building:** `docs/tasks/phase3.md`

---

## 📚 QUICK REFERENCES

- **Spec:** `livey-mvp-spec.md` (product vision)
- **Requirements:** `REQUIREMENTS.md` (tech blueprint)
- **Plan:** `PLAN.md` (production concerns)
- **Workflow:** `WORKFLOW.md` (daily collaboration)
- **Context:** `docs/CONTEXT.md` (updated daily)
- **Checklist:** `docs/tasks/phase1.md` (current tasks)

---

## 💬 COMMUNICATION STYLE

### When Building
- Explain WHAT you're building first
- Explain WHY you chose this approach
- Explain HOW data flows end-to-end
- Then write code

### When Stuck
- Say: "I'm unsure about X because Y"
- Don't: Guess and hope it works

### When Done
- Say: "Feature complete. Ran tests. Found issues: [list]. Fixed: [list]."
- Update CONTEXT.md with summary
- Ask: "What's next?"

---

**Last Updated:** 2026-02-11

**This file is the source of truth. When in doubt, read this first.**
