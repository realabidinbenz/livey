# Livey - Development Context

## Current Phase: Phase 4 Complete → Ready for Phase 5
## Last Updated: 2026-02-12 (Session 9 - Phase 4 Implementation)

---

## 📊 Overall Progress

**Completed Phases:** 4/8 (Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅) + Security Hardening ✅
**Current Focus:** Phase 4 complete, ready for Phase 5
**Next:** Phase 5 - Seller Dashboard

---

## ✅ What's Done

### Phase 4 - Widget Frontend (Customer-Facing) ✅ COMPLETE
- [x] Widget data endpoint (GET /api/widget/:sessionId) - public access
- [x] Widget endpoint tests (backend)
- [x] Public RLS policies migration
- [x] Vite + React + Tailwind frontend setup
- [x] Widget build configuration (IIFE output)
- [x] API service (ky-based HTTP client)
- [x] Supabase Realtime service (live updates)
- [x] Utility functions (formatters: price, time, phone)
- [x] useWidgetData hook (data fetching + realtime)
- [x] useChat hook (message sending + name management)
- [x] YouTubePlayer component
- [x] ProductCard component (with animation)
- [x] ChatPanel component (live chat + view-only mode)
- [x] OrderForm component (validation + mobile drawer)
- [x] OrderConfirmation component
- [x] WidgetApp main component
- [x] Widget entry point (IIFE script tag embed)
- [x] Widget CSS (Tailwind scoped styles)
- [x] Frontend tests (formatters, API, OrderForm, ChatPanel)

### Documentation (Phase 0)
- ✅ Product spec (`livey-mvp-spec.md`)
- ✅ Technical requirements (`REQUIREMENTS.md`)
- ✅ Implementation plan (`PLAN.md`)
- ✅ Daily workflow (`WORKFLOW.md`)
- ✅ Strict rules (`CLAUDE.md`)

### Infrastructure (Phase 0)
- ✅ GitHub repository (`github.com/realabidinbenz/livey`)
- ✅ Vercel connected (auto-deploys from main)
- ✅ Supabase project (`mbrilepioeqvwqxplape.supabase.co`)
- ✅ Supabase MCP configured

### Backend Foundation (Phase 1 - ✅ 100%)
- ✅ Express app (logging, error handling, CORS, Helmet)
- ✅ Auth endpoints (signup, login, logout, me)
- ✅ Products CRUD (create, list, update, soft delete)
- ✅ Orders endpoints (create, list, get, update status)
- ✅ Validation middleware (phone, email)
- ✅ 7 database tables with RLS + indexes

### Google Sheets Integration (Phase 2 - ✅ 100% REVIEWED)
- ✅ Encryption utility (AES-256-GCM for refresh tokens)
- ✅ Google OAuth service (auth URL, token exchange, refresh, revoke)
- ✅ Google Sheets service (create spreadsheet, append rows, test connection)
- ✅ Sheets sync service (orchestrate token refresh + row append)
- ✅ Sheets endpoints (connect, callback, status, test, disconnect)
- ✅ Fire-and-forget order sync on creation
- ✅ Background retry job with exponential backoff (5min → 15min → 45min)
- ✅ Error handling (token revoked, sheet deleted, quota exceeded)
- ✅ **41 unit tests passing** (encryption, validation, backoff, orders, sheets)

### Security Hardening (Session 6 - ✅ COMPLETE)
- ✅ Rate limiting: global (100/min), auth (5/15min), orders (10/15min)
- ✅ Input sanitization middleware (strips HTML/script tags, XSS prevention)
- ✅ HPP (HTTP Parameter Pollution) protection
- ✅ Request body size limits (1MB)
- ✅ `sellerQuery()` / `sellerSelect()` helper for data isolation
- ✅ Phone normalization (handles +213, spaces, dashes)
- ✅ Order number race condition fixed (random hex instead of sequential)
- ✅ Migration files created (001_initial_schema, 002_orders_sheets_columns)
- ✅ All docs updated (deployment, RLS, widget layout, decisions)
- ✅ **66 unit tests passing** (+25 new security tests)

### Library Planning (Session 7 - ✅ COMPLETE)
- ✅ YouTube URL parser utility (`utils/youtube.js`) — regex, no npm package
- ✅ 23 tests for YouTube utility (all formats + edge cases)
- ✅ Library decisions documented for Phases 3-6 in `docs/DECISIONS.md`
- ✅ Phase 3: zero new backend dependencies (use existing googleapis + supabase)
- ✅ Frontend stack locked: zustand, ky, react-hook-form, dayjs, sonner, daisyUI, vitest
- ✅ **89 unit tests passing** (+23 new YouTube tests)

### Phase 3 - Live Sessions Backend (Session 8 - ✅ COMPLETE)
- ✅ Sessions controller (6 endpoints: create, get active, get by ID, end, pin, list)
- ✅ Chat controller (3 endpoints: get messages, send message, delete message)
- ✅ Sessions routes with proper ordering (`/active` before `/:id`)
- ✅ Chat routes (public GET/POST, auth-only DELETE)
- ✅ Rate limiting for chat (10 req/15min)
- ✅ Pinned-product guard in products controller (blocks update/delete while pinned)
- ✅ Input validation (YouTube URL, product_ids, sender_name, message)
- ✅ Soft delete for chat messages
- ✅ **126 unit tests passing** (+37 new Phase 3 tests)

---

## 🔧 Bugs Fixed

### Session 5 - Phase 2 Review
1. **Off-by-one retry limit** - `.lte(10)` → `.lt(10)`
2. **Misleading pending sync count** - Now excludes `sync_retry_count >= 10`
3. **Dead code removed** - Unused `getDriveClient`
4. **Missing input length validation** - Added name (100) and address (500) limits
5. **CORS error status** - 500 → 403

### Session 6 - Security Hardening
6. **Order number race condition** - Sequential → random hex (no DB query)
7. **Phone validation too strict** - Added normalizePhone() for +213, spaces, dashes
8. **Zero rate limiting** - Added 3-tier rate limiting
9. **No input sanitization** - Added XSS-stripping middleware
10. **RLS misleading docs** - Updated to reflect sellerQuery() as primary defense

---

## ⚠️ Known Limitations (Documented, Not Blocking)

1. **In-memory OAuth state store** - Fine on Railway (always-on); would need DB-backed state for serverless
2. **Access tokens stored in plain text** - Short-lived (1hr expiry), acceptable for MVP
3. **Stale retry count increment** - Uses in-memory value, not DB atomic. Low risk with sequential cron

---

## 🎯 What's Next

### Phase 3 - Live Sessions Backend ✅ COMPLETE
- [x] Create `docs/tasks/phase3.md` checklist
- [x] Live sessions endpoints (create, get, end, get active, pin, list)
- [x] Product pinning (only 1 active at a time)
- [x] Chat with polling (GET/POST endpoints)
- [x] YouTube video ID validation (URL or raw ID)
- [x] Session status flow (live → ended)
- [x] Create `docs/manual-tests/phase2.md` - Complete manual testing guide for non-coders
  - Step-by-step setup instructions (install Node.js, Git, Postman)
  - How to download and configure the project
  - How to set up Supabase database
  - How to create Google OAuth credentials
  - How to create test seller accounts via API
  - All 5 manual tests with copy-paste ready commands
  - Extensive troubleshooting section

### Before Phase 3
- [ ] Manual testing of Phase 2 OAuth flow with real Google account
- [ ] Verify orders sync automatically when Sheets connected

---

## 🐛 Known Issues

- Network/fetch error when testing Supabase from Git Bash (Windows environment)
  - **Workaround:** Test API endpoints with browser/Postman
  - Server code runs fine

---

## 📝 Session History

| Session | Phase | Summary |
|---------|-------|---------|
| 1 | Phase 0 | Documentation, infrastructure setup |
| 2 | Phase 1 | Auth + Products endpoints |
| 3 | Phase 1 | Orders + validation + tests (Phase 1 complete) |
| 4 | Phase 2 | Google Sheets integration (all endpoints + sync) |
| 5 | Phase 2 | **Code review, bug fixes, 30 new tests, phase2.md created** |
| 6 | Hardening | **Security hardening: rate limiting, sanitization, sellerQuery(), phone normalization, order number fix, migration files, 25 new tests** |
| 7 | Planning | **Library recommendations: YouTube URL parser, frontend stack decisions, 23 new tests** |
| 8 | Phase 3 | **Live sessions backend: sessions controller (6 endpoints), chat controller (3 endpoints), pinned-product guard, 37 new tests, phase3.md** |
| 9 | Phase 4 | **Widget frontend: embeddable widget with YouTube player, product card, chat panel, order form, realtime updates, 25 frontend tests, phase4.md** |

---

## 🏗️ Deployment Architecture

- **Frontend (React/Vite):** Vercel (free)
- **Backend (Express):** Railway ($5/mo) — always-on, native cron, WebSocket support
- **Database:** Supabase (free tier: 500MB DB, 200 Realtime connections)
- **Total cost:** ~$5/month

---

## 📊 Codebase Stats

- **API Endpoints:** 30 (11 Phase 1, 8 Phase 2, 10 Phase 3, 1 Phase 4)
- **Database Tables:** 7 with RLS
- **Unit Tests:** 126 backend passing + 25 frontend tests
- **Backend Files:** 35 source files, all < 800 lines
- **Frontend Files:** 25 source files (widget + tests)
- **Migration Files:** 3 (001_initial_schema, 002_orders_sheets_columns, 003_public_rls_policies)
- **Security:** Rate limiting (4 tiers), input sanitization, HPP, sellerQuery() isolation

---

**Next Session Goal:** Phase 5 - Seller Dashboard
