# Livey - AI-Assisted Development Workflow
## (How We Actually Work Together)

**Last Updated:** February 11, 2026
**Philosophy:** Manage Claude like a dev team, not a prompt machine.

---

## 📋 THE 10 RULES (From Real Experience)

### 1. Architecture First, Not Code ✅

**We Already Did This:**
- ✅ `livey-mvp-spec.md` - Product vision
- ✅ `REQUIREMENTS.md` - Technical blueprint (stack, DB schema, API contracts)
- ✅ `PLAN.md` - Implementation phases
- ✅ `YOUR-WORKFLOW-GUIDE.md` - Non-dev collaboration guide

**Why It Matters:**
Every decision depends on this foundation. Claude can only build correctly if the architecture is clear.

---

### 2. Keep Modules Small (Max 500-800 Lines)

**Our Rule:**
- ❌ No file over 800 lines
- ✅ Break into smaller, reusable modules
- ✅ Use clear naming: `auth_service_v2.js` (not overwrite `auth_service.js`)

**Examples:**

**❌ BAD (One Giant File):**
```
backend/src/index.js (2,000 lines)
  - Express setup
  - All routes
  - All controllers
  - Database queries
  - Google Sheets logic
```

**✅ GOOD (Small Modules):**
```
backend/src/
  ├── index.js (50 lines - just Express setup)
  ├── routes/
  │   ├── auth.routes.js (100 lines)
  │   ├── products.routes.js (100 lines)
  │   ├── orders.routes.js (100 lines)
  ├── controllers/
  │   ├── auth.controller.js (200 lines)
  │   ├── products.controller.js (250 lines)
  │   ├── orders.controller.js (300 lines)
  ├── services/
  │   ├── sheets.service.js (400 lines - Google Sheets integration)
  │   ├── youtube.service.js (200 lines - YouTube validation)
  ├── middleware/
  │   ├── auth.middleware.js (100 lines)
  │   ├── validation.middleware.js (150 lines)
```

**Why?**
Large files make Claude forget context and write inconsistent logic. Small files = better code.

---

### 3. Separate Frontend & Backend ✅

**We're Using:** Monorepo (one repo, two folders)

```
livey/
├── backend/     (separate package.json, runs on port 3001)
├── frontend/    (separate package.json, runs on port 5173)
```

**Why?**
- Modular (can deploy independently if needed)
- Easy to maintain (clear separation of concerns)
- AI gets better context (knows if it's writing backend or frontend code)

**Alternative:** Could split into 2 repos (`livey-backend`, `livey-frontend`), but monorepo is simpler for MVP.

---

### 4. Document Everything (AI Memory Through Files)

**Our Documentation Strategy:**

#### Core Docs (Already Created)
```
livey/
├── livey-mvp-spec.md       ← Product vision (WHAT we're building)
├── REQUIREMENTS.md         ← Technical blueprint (HOW we're building)
├── PLAN.md                 ← Implementation phases (WHEN we're building)
├── WORKFLOW.md             ← This file (daily workflow)
├── YOUR-WORKFLOW-GUIDE.md  ← Non-dev collaboration guide
```

#### Context Docs (Create As We Build)
```
livey/
├── docs/
│   ├── CONTEXT.md          ← Summary of progress (updated after each session)
│   ├── DECISIONS.md        ← Record of why we chose X over Y
│   ├── API_MAP.md          ← All endpoints, request/response examples
│   ├── ISSUES.md           ← Known bugs, edge cases, TODOs
│   └── tasks/
│       ├── phase1.md       ← Checklist for Phase 1 (Foundation)
│       ├── phase2.md       ← Checklist for Phase 2 (Google Sheets)
│       ├── phase3.md       ← Checklist for Phase 3 (Live Sessions)
│       └── ...
```

**How We Use Them:**

**CONTEXT.md** - Updated after each session:
```markdown
# Livey - Development Context

## Current Phase: Phase 1 - Foundation
## Last Updated: 2026-02-11

### What's Done:
- ✅ Backend structure created (Express, routes, middleware)
- ✅ Database tables created in Supabase (users, products, orders)
- ✅ Row Level Security (RLS) policies applied
- ✅ Auth endpoints working (signup, login, logout)

### What's Next:
- [ ] Products CRUD endpoints
- [ ] Orders endpoint with Google Sheets retry logic
- [ ] Unit tests for auth controller

### Known Issues:
- Google Sheets OAuth flow not started yet
- Need to add indexes to orders table

### Key Decisions:
- Using Supabase Auth (not custom JWT) - easier, built-in
- Orders stored in both Supabase + Sheets (Supabase = source of truth)
```

**DECISIONS.md** - Record WHY we chose something:
```markdown
# Architecture Decisions

## 2026-02-11: Chose Supabase Auth over Custom JWT
**Why:** Built-in email verification, password reset, session management.
**Alternative:** Custom JWT (more work, no benefit for MVP).
**Tradeoff:** Locked into Supabase ecosystem (but can migrate later if needed).

## 2026-02-11: Dual Storage (Supabase + Google Sheets)
**Why:** Sheets can fail (API quota, network timeout), orders must never be lost.
**Alternative:** Only Sheets (risky), only Supabase (seller wants Sheets).
**Tradeoff:** More complexity, but bulletproof.
```

**API_MAP.md** - All endpoints documented:
```markdown
# API Endpoints

## POST /api/auth/signup
**Request:**
```json
{
  "email": "seller@example.com",
  "password": "strongpassword123"
}
```
**Response (200):**
```json
{
  "user": { "id": "uuid", "email": "seller@example.com" },
  "session": { "access_token": "jwt...", "expires_at": 1234567890 }
}
```
**Errors:**
- 400: Email already exists
- 422: Invalid email format
```

**Why This Matters:**
If Claude (or you) forgets something, you paste these files and instantly get context back.

---

### 5. Plan → Build → Refactor → Repeat

**Our Cycle:**

**DON'T:**
- ❌ Build one giant feature and patch bugs forever
- ❌ Let messy code accumulate ("we'll clean it later")

**DO:**
- ✅ Build small feature (e.g., "Auth endpoints")
- ✅ Test it works
- ✅ Refactor if messy (ask Claude: "Refactor this for clarity")
- ✅ Move to next feature
- ✅ Every 3-4 features, ask Claude: "Review the whole architecture, find issues"

**End-of-Session Prompt:**
```
"Rewrite a clean overview of what we built today. Include:
- What's working
- What's left to do
- Any design flaws you noticed
- Recommended next steps"
```

Copy this into `CONTEXT.md` so next session starts clean.

---

### 6. Test Early, Test Often

**Our Testing Strategy:**

#### A) Unit Tests (After Each Feature)
```javascript
// Example: tests/auth.controller.test.js
describe('Auth Controller', () => {
  test('signup creates user with valid email', async () => {
    const result = await signup({ email: 'test@example.com', password: 'pass123' });
    expect(result.user.email).toBe('test@example.com');
  });

  test('signup rejects invalid email', async () => {
    await expect(signup({ email: 'invalid', password: 'pass123' }))
      .rejects.toThrow('Invalid email');
  });
});
```

**After building auth controller, ask Claude:**
> "Write unit tests for the auth controller. Cover: valid signup, invalid email, duplicate email, login with wrong password."

#### B) Integration Tests (After Connecting Features)
```javascript
// Example: tests/order-flow.test.js
test('Order flow: create order → save to DB → sync to Sheets', async () => {
  const order = await createOrder({ productId: 'x', customerName: 'Amina', ... });

  // Check DB
  const dbOrder = await db.from('orders').select('*').eq('id', order.id).single();
  expect(dbOrder).toBeTruthy();

  // Check Sheets (mock or real)
  const sheetRow = await getLastSheetRow();
  expect(sheetRow.customerName).toBe('Amina');
});
```

#### C) Parallel "QA Bot" (Predict Failures)

**How It Works:**
1. Open separate Claude chat titled **"Livey QA Bot"**
2. Feed it ONLY code + tests (no building, only reviewing)
3. Ask prompts like:
   - "Review this order controller. How could it break in production?"
   - "What edge cases are missing from these tests?"
   - "Predict concurrency issues in this code."

**Example QA Prompt:**
```
Here's our order creation endpoint:

[paste code]

Questions:
1. What happens if customer submits form twice (race condition)?
2. What if product gets deleted while customer is ordering?
3. What if Google Sheets API is down?
4. What null checks are missing?
5. What SQL injection risks exist?
```

Claude will catch issues like:
- Missing `if (isSubmitting) return;` (double submit)
- No snapshot of product price (if price changes mid-order)
- No retry logic for Sheets
- No validation on `quantity` (could be negative)

**Why It Works:**
Separate chat = focused QA mindset. Claude doesn't mix building + testing.

---

### 7. Think Like A Project Manager, Not A Coder

**Your Role: Orchestrate, Not Write**

**DON'T:**
- ❌ Try to write code yourself (Claude does this faster)
- ❌ Micromanage every line (trust but verify)

**DO:**
- ✅ Define tasks clearly ("Build products CRUD with image upload")
- ✅ Review outputs (does structure make sense?)
- ✅ Verify it works (manual testing checklist)
- ✅ Ask questions ("Why did you use X instead of Y?")

**Sprint Checklist (Example: Phase 1)**
```markdown
# Phase 1: Foundation (Week 1)

## Backend
- [x] Express app setup (index.js, routes, middleware)
- [x] Supabase tables created (users, products, orders)
- [x] RLS policies applied (data isolation)
- [ ] Auth endpoints (signup, login, logout)
- [ ] Products CRUD endpoints
- [ ] Orders endpoint (with Sheets retry logic)
- [ ] Logging middleware (all API calls logged)

## Testing
- [ ] Unit tests for auth controller
- [ ] Integration test: signup → login → create product
- [ ] Security test: Seller A can't access Seller B's data

## Documentation
- [ ] Update CONTEXT.md with progress
- [ ] Document API endpoints in API_MAP.md
- [ ] Add any decisions to DECISIONS.md
```

Feed this back to Claude:
> "Here's the Phase 1 checklist. Mark what's done, tell me what's next."

**Why It Works:**
Checklists help Claude reason systematically (not randomly jump around).

---

### 8. Use Familiar Stacks ✅

**We're Using:**
- React (frontend) ← Model-friendly
- Node.js + Express (backend) ← Model-friendly
- Supabase (database + auth) ← Model-friendly
- Tailwind CSS (styling) ← Model-friendly

**Why?**
Claude was trained on millions of React/Node/Express examples. It produces cleaner code than if we used obscure frameworks.

**Avoid:**
- ❌ Bleeding-edge frameworks (Claude doesn't know them well)
- ❌ Custom DSLs or internal tools (no training data)

---

### 9. Self-Review Saves Hours

**After Each Phase, Ask:**
> "Review your own architecture for:
> 1. Design flaws
> 2. Code duplication
> 3. Missing error handling
> 4. Inconsistent naming
> 5. Performance bottlenecks
>
> Be critical. Find issues."

**Claude Will Respond:**
```
Issues Found:

1. **Duplication:** `validatePhone()` exists in both order controller and user controller.
   Fix: Move to `utils/validation.js`.

2. **Missing Error Handling:** `createOrder()` doesn't handle Supabase connection errors.
   Fix: Wrap in try/catch, return 500 with proper error message.

3. **Performance:** `getOrders()` loads all orders (no pagination).
   Fix: Add `limit` and `offset` parameters.

4. **Inconsistent Naming:** Some functions use `userId`, others use `sellerId`.
   Fix: Standardize on `sellerId` (more specific).
```

**Then, in New Chat (or Same):**
> "Build a fixed version based on your own feedback from above."

**Why It Works:**
Claude finds flaws faster than you could. Self-review = free code audit.

---

### 10. Review The Flow, Not Just The Code

**Before Running Anything, Ask:**
> "Explain end-to-end how data flows when a customer places an order:
> 1. Customer clicks ORDER NOW
> 2. Form validates
> 3. POST to /api/orders
> 4. What happens in the backend?
> 5. What happens in the database?
> 6. What happens with Google Sheets?
> 7. What does the customer see?
> 8. What does the seller see?"

**Example Response:**
```
Order Flow:

1. Customer clicks ORDER NOW
   → Form slides up (OrderForm.jsx)

2. Customer fills: name, phone, address, quantity
   → Frontend validates phone format (regex)

3. Customer clicks "Confirm Order"
   → Disabled to prevent double submit
   → POST /api/orders with { productId, customerName, customerPhone, ... }

4. Backend (orders.controller.js):
   → Validates request body (middleware)
   → Fetches product from DB (to get price)
   → Creates order object with snapshot (product_name, product_price)
   → Inserts order into Supabase `orders` table
   → Decreases product stock (if not NULL)
   → Calls sheets.service.appendOrder() (async, non-blocking)
   → Returns { order, success: true } to frontend

5. Database (Supabase):
   → New row in `orders` table
   → `google_sheets_synced` = false initially
   → Triggers real-time broadcast to seller's control panel

6. Google Sheets (async):
   → sheets.service tries to append row
   → If success: update `google_sheets_synced` = true
   → If fails: log error, mark for retry (background job runs every 5 min)

7. Customer sees:
   → Success message: "Order confirmed! We'll contact you soon."
   → Order summary (product, price, quantity, total)
   → Can close modal or continue watching

8. Seller sees (if on control panel):
   → Toast notification: "New order from Amina!"
   → Order count increments
   → Can check Google Sheet (row appears if sync succeeded)
```

**Why It Matters:**
Perfect functions that don't connect = broken app. Reviewing flow catches:
- Missing API calls
- Wrong database fields
- Naming mismatches (`userId` vs `sellerId`)
- Missing error responses

---

## 🛠️ DAILY WORKFLOW (How We Actually Work)

### Morning (Start of Session)

**1. Load Context (5 min)**
You:
> "Read CONTEXT.md and tell me where we left off."

Claude:
> "We finished Phase 1 backend setup. Auth endpoints work, products CRUD is done. Next: Orders endpoint with Google Sheets retry logic."

**2. Review Checklist (2 min)**
You:
> "Show me the Phase 1 checklist. What's left?"

Claude:
> [Shows checklist with checkboxes]

**3. Define Today's Task (1 min)**
You:
> "Today we're building the orders endpoint. Break it into steps."

Claude:
> 1. Create orders.routes.js
> 2. Create orders.controller.js (create, list, getById)
> 3. Add Google Sheets retry logic (sheets.service.js)
> 4. Write unit tests
> 5. Test with Postman

---

### Building (Main Work)

**1. Claude Builds (30 min)**
You:
> "Build orders.routes.js and orders.controller.js. Follow the structure we used for products."

Claude writes code.

**2. You Review Structure (5 min)**
- Does it follow our naming conventions?
- Is any file > 800 lines? (break it up)
- Does it log critical actions? (order creation, Sheets sync)

**3. Ask Flow Questions (5 min)**
You:
> "Explain how createOrder() handles Google Sheets failures."

Claude explains. You verify it matches requirements.

**4. Test Immediately (10 min)**
You:
> "Write a unit test for createOrder(). Cover: success, missing fields, product not found, Sheets failure."

Claude writes tests. You run them.

**5. Fix Issues (if any) (10 min)**
If tests fail:
You:
> "Test failed: product_price is null. Why?"

Claude debugs, fixes.

**6. Refactor if Messy (10 min)**
If code feels messy:
You:
> "Refactor createOrder() for clarity. Extract validation into separate function."

---

### End of Session (Wrap Up)

**1. Self-Review (10 min)**
You:
> "Review what we built today. Find design flaws, duplication, missing error handling."

Claude responds with issues found.

**2. Update Context (5 min)**
You:
> "Update CONTEXT.md with what we built today, what's next, and any issues you found."

Claude updates the file. You commit to git.

**3. Git Commit (2 min)**
```bash
git add .
git commit -m "feat: orders endpoint with Sheets retry logic"
git push
```

**4. Plan Tomorrow (2 min)**
You:
> "What should we build tomorrow?"

Claude:
> "Next: Live sessions endpoints (start, end, pin product)."

---

## 📂 FILE STRUCTURE (With All Docs)

```
livey/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── products.test.js
│   │   └── orders.test.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── .env
│
├── docs/
│   ├── CONTEXT.md          ← Updated daily
│   ├── DECISIONS.md        ← Record of why we chose X over Y
│   ├── API_MAP.md          ← All endpoints documented
│   ├── ISSUES.md           ← Known bugs, TODOs
│   └── tasks/
│       ├── phase1.md       ← Checklist for each phase
│       ├── phase2.md
│       └── ...
│
├── livey-mvp-spec.md       ← Product vision
├── REQUIREMENTS.md         ← Technical blueprint
├── PLAN.md                 ← Implementation phases + production concerns
├── WORKFLOW.md             ← This file (daily workflow)
├── YOUR-WORKFLOW-GUIDE.md  ← Non-dev collaboration guide
├── README.md
├── .gitignore
└── .mcp.json
```

---

## 🎯 GIT BRANCHING STRATEGY

**Main Branch:** `main` (production-ready code only)

**Feature Branches:** One per feature
```bash
git checkout -b feature/auth-endpoints
# Build auth endpoints
git commit -m "feat: auth signup/login/logout"
git push origin feature/auth-endpoints

# Merge to main when tested
git checkout main
git merge feature/auth-endpoints
git push
```

**Why?**
If Claude's new code breaks something, you can easily revert to previous branch.

**Naming Pattern:**
- `feature/auth-endpoints`
- `feature/google-sheets-integration`
- `feature/live-sessions`
- `bugfix/order-duplicate-submit`
- `refactor/split-large-controller`

---

## ✅ SESSION CHECKLIST (Every Time We Work)

### Start of Session
- [ ] Read `CONTEXT.md` (know where we left off)
- [ ] Review checklist for current phase
- [ ] Define today's task (clear, specific)

### During Session
- [ ] Claude builds small module (< 800 lines)
- [ ] Review structure (naming, organization)
- [ ] Ask flow questions ("Explain how X connects to Y")
- [ ] Write tests immediately (unit tests for each function)
- [ ] Run tests (fix failures before moving on)
- [ ] Refactor if messy (don't accumulate bad code)

### End of Session
- [ ] Self-review (ask Claude to find flaws)
- [ ] Update `CONTEXT.md` (what's done, what's next)
- [ ] Git commit (clear message)
- [ ] Plan tomorrow (know what to build next)

---

## 🚀 READY TO BUILD WITH THIS WORKFLOW

We have:
- ✅ Architecture docs (spec, requirements, plan)
- ✅ Workflow for daily collaboration (this file)
- ✅ Testing strategy (unit, integration, QA bot)
- ✅ Documentation strategy (context, decisions, API map)
- ✅ Git branching strategy (feature branches)

**Next step:** Create `docs/CONTEXT.md` and `docs/tasks/phase1.md`, then start Phase 1.

**Your call:** Ready to start building? 🔨
