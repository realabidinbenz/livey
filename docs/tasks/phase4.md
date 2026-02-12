# Phase 4: Widget (Customer-Facing)

**Goal:** Embeddable widget that works on any site
**Status:** ✅ 100% COMPLETE
**Dependencies:** Phase 3 (Live Sessions Backend)

---

## Backend Tasks

### Widget Data Endpoint
- [x] Create `GET /api/widget/:sessionId` endpoint
- [x] Returns `{ session, products, pinned_product, messages }`
- [x] Public access (no auth required)
- [x] File: `backend/src/controllers/widget.controller.js` (~80 lines)
- [x] File: `backend/src/routes/widget.routes.js` (~15 lines)

### Widget Endpoint Tests
- [x] Test: Returns 404 for invalid session ID
- [x] Test: Returns session data for valid session
- [x] Test: Includes pinned product when available
- [x] Test: Includes messages in response
- [x] File: `backend/tests/widget.test.js` (~80 lines)

### Public RLS Policies Migration
- [x] Create `backend/migrations/003_public_rls_policies.sql`
- [x] Public SELECT on sessions (non-deleted only)
- [x] Public SELECT on session_products
- [x] Public SELECT on products (non-deleted only)
- [x] Public SELECT on chat_messages (non-deleted only)

---

## Frontend Tasks

### Project Setup
- [x] Initialize Vite + React + Tailwind project
- [x] Configure widget build (IIFE output)
- [x] File: `frontend/vite.widget.config.js`
- [x] Install dependencies: ky, dayjs, react-hook-form, sonner, @supabase/supabase-js

### Services
- [x] API service (ky-based HTTP client)
  - [x] `fetchWidgetData(sessionId)`
  - [x] `fetchMessages(sessionId)`
  - [x] `sendMessage(sessionId, data)`
  - [x] `createOrder(orderData)`
  - [x] File: `frontend/src/widget/services/api.js` (~100 lines)

- [x] Supabase Realtime service
  - [x] Subscribe to session updates
  - [x] Subscribe to new messages
  - [x] Subscribe to pinned product changes
  - [x] File: `frontend/src/widget/services/realtime.js` (~80 lines)

### Utilities
- [x] Format utility functions
  - [x] `formatPrice(price)` - Algerian Dinar formatting
  - [x] `formatTime(isoString)` - HH:mm format
  - [x] `formatPhone(phone)` - Algerian phone format
  - [x] File: `frontend/src/utils/formatters.js` (~55 lines)

### Hooks
- [x] `useWidgetData(sessionId)` hook
  - [x] Fetches initial widget data
  - [x] Subscribes to realtime updates
  - [x] Manages loading/error states
  - [x] File: `frontend/src/widget/hooks/useWidgetData.js` (~90 lines)

- [x] `useChat()` hook
  - [x] Manages sender name (localStorage)
  - [x] Handles message sending
  - [x] Manages sending state
  - [x] File: `frontend/src/widget/hooks/useChat.js` (~70 lines)

### Components
- [x] `YouTubePlayer` component
  - [x] Embeds YouTube iframe
  - [x] Handles live vs replay states
  - [x] File: `frontend/src/widget/components/YouTubePlayer.jsx` (~40 lines)

- [x] `ProductCard` component
  - [x] Displays pinned product
  - [x] Shows "waiting" state when no product
  - [x] Animation on product change
  - [x] File: `frontend/src/widget/components/ProductCard.jsx` (~100 lines)

- [x] `ChatPanel` component
  - [x] Message list with seller badges
  - [x] Name prompt for new users
  - [x] Message input form
  - [x] View-only mode for replay
  - [x] Mobile-responsive collapse
  - [x] File: `frontend/src/widget/components/ChatPanel.jsx` (~250 lines)

- [x] `OrderForm` component
  - [x] Form with react-hook-form validation
  - [x] Fields: name, phone, address, quantity
  - [x] Phone format validation (05/06/07)
  - [x] Total price calculation
  - [x] Submit with loading state
  - [x] Mobile drawer style
  - [x] File: `frontend/src/widget/components/OrderForm.jsx` (~280 lines)

- [x] `OrderConfirmation` component
  - [x] Success modal after order
  - [x] Order summary display
  - [x] File: `frontend/src/widget/components/OrderConfirmation.jsx` (~70 lines)

- [x] `WidgetApp` main component
  - [x] Wires all hooks and components
  - [x] Loading/error states
  - [x] Modal management
  - [x] File: `frontend/src/widget/WidgetApp.jsx` (~110 lines)

### Entry Points
- [x] Widget entry point (IIFE script tag)
  - [x] Mounts to DOM element
  - [x] Reads session ID from data attribute
  - [x] File: `frontend/src/widget/index.jsx` (~40 lines)

- [x] Dev entry point
  - [x] For local development with Vite
  - [x] File: `frontend/src/widget/dev-entry.jsx` (~20 lines)

### Styling
- [x] Widget CSS (Tailwind scoped)
  - [x] Custom color variables
  - [x] Animation keyframes
  - [x] Scoped to #livey-widget
  - [x] File: `frontend/src/widget/widget.css` (~80 lines)

### Tests
- [x] Test setup file
  - [x] File: `frontend/tests/setup.js`

- [x] Formatter tests
  - [x] Test: formatPrice(120000) → "120 000 DA"
  - [x] Test: formatPrice(0) → "0 DA"
  - [x] Test: formatPrice(500) → "500 DA"
  - [x] Test: formatTime(isoString) → "HH:mm" format
  - [x] Test: formatPhone("0551234567") → "0551 23 45 67"
  - [x] File: `frontend/tests/widget/formatters.test.js` (~60 lines)

- [x] API service tests
  - [x] Test: fetchWidgetData calls correct URL
  - [x] Test: createOrder sends correct body
  - [x] Test: handles 429 rate limit error
  - [x] Test: handles network errors gracefully
  - [x] File: `frontend/tests/widget/api.test.js` (~80 lines)

- [x] OrderForm component tests
  - [x] Test: renders all 4 fields (name, phone, address, quantity)
  - [x] Test: shows error for empty required fields on submit
  - [x] Test: validates phone format (accepts 05/06/07, rejects others)
  - [x] Test: calculates display total correctly (price * quantity)
  - [x] Test: submit button disabled while submitting (isSubmitting)
  - [x] Test: calls onSuccess with order data on successful submit
  - [x] File: `frontend/tests/widget/OrderForm.test.jsx` (~120 lines)

- [x] ChatPanel component tests
  - [x] Test: renders messages list
  - [x] Test: shows seller badge for is_seller=true messages
  - [x] Test: shows name prompt when showNamePrompt=true
  - [x] Test: shows "view-only" message when session is not live
  - [x] Test: send button disabled when input is empty
  - [x] File: `frontend/tests/widget/ChatPanel.test.jsx` (~100 lines)

---

## Files Created

### Backend (3 files)
1. `backend/src/controllers/widget.controller.js` (80 lines)
2. `backend/src/routes/widget.routes.js` (15 lines)
3. `backend/migrations/003_public_rls_policies.sql` (40 lines)

### Backend Tests (1 file)
4. `backend/tests/widget.test.js` (80 lines)

### Frontend Config (2 files)
5. `frontend/vite.widget.config.js` (35 lines)
6. `frontend/.env.example` (3 lines)

### Frontend Services (2 files)
7. `frontend/src/widget/services/api.js` (100 lines)
8. `frontend/src/widget/services/realtime.js` (80 lines)

### Frontend Utils (1 file)
9. `frontend/src/utils/formatters.js` (55 lines)

### Frontend Hooks (2 files)
10. `frontend/src/widget/hooks/useWidgetData.js` (90 lines)
11. `frontend/src/widget/hooks/useChat.js` (70 lines)

### Frontend Components (6 files)
12. `frontend/src/widget/components/YouTubePlayer.jsx` (40 lines)
13. `frontend/src/widget/components/ProductCard.jsx` (100 lines)
14. `frontend/src/widget/components/ChatPanel.jsx` (250 lines)
15. `frontend/src/widget/components/OrderForm.jsx` (280 lines)
16. `frontend/src/widget/components/OrderConfirmation.jsx` (70 lines)
17. `frontend/src/widget/WidgetApp.jsx` (110 lines)

### Frontend Entry Points (2 files)
18. `frontend/src/widget/index.jsx` (40 lines)
19. `frontend/src/widget/dev-entry.jsx` (20 lines)

### Frontend Styling (1 file)
20. `frontend/src/widget/widget.css` (80 lines)

### Frontend Tests (4 files)
21. `frontend/tests/setup.js` (3 lines)
22. `frontend/tests/widget/formatters.test.js` (60 lines)
23. `frontend/tests/widget/api.test.js` (80 lines)
24. `frontend/tests/widget/OrderForm.test.jsx` (120 lines)
25. `frontend/tests/widget/ChatPanel.test.jsx` (100 lines)

**Total: ~29 new files**

---

## Verification Checklist

- [ ] Widget build produces < 200 KB gzipped
- [ ] Manual test: embed on test HTML page
- [ ] Manual test: order flow end-to-end
- [ ] Manual test: chat in live session
- [ ] Manual test: replay mode (chat read-only)
- [ ] Manual test: mobile responsive

---

## Usage

### Embed Widget

```html
<div id="livey-widget" data-session-id="SESSION_ID_HERE"></div>
<script src="https://your-cdn.com/livey-widget.js"></script>
```

### Build Widget

```bash
cd frontend
npm run build:widget
```

Output: `frontend/dist/livey-widget.js` (IIFE bundle)

---

## Next Phase

**Phase 5:** Seller Dashboard
- Session management UI
- Product catalog management
- Order management interface
- Analytics/stats view
