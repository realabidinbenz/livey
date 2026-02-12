# Livey MVP - Implementation Plan
## (With Production-Ready Mindset)

**Last Updated:** February 11, 2026
**Mindset:** AI gets us 60% there. We're planning for the other 40% upfront.

---

## 🎯 PHILOSOPHY: BUILD FOR PRODUCTION, NOT JUST DEV

### Lessons We're Learning From (Before Getting Burned)

**Don't Trust AI Blindly:**
- AI will suggest code that "works" in dev but breaks in production
- We need to understand WHAT we're building, not just copy-paste
- Question everything: "What happens when this fails?"

**Production Issues AI Won't Warn You About:**
1. Database performance with real traffic (queries, indexes, pagination)
2. Payment/integration failures (webhooks, retries, error handling)
3. Session management edge cases (expiry, multiple tabs, race conditions)
4. Data isolation bugs (sellers seeing each other's data)
5. Edge cases in business logic (what if Google Sheets API is down?)

**Our Approach:**
- ✅ Learn fundamentals as we build (don't just copy code)
- ✅ Add logging for EVERY critical action (orders, payments, API calls)
- ✅ Test edge cases before launching (not after customers complain)
- ✅ Build proper error handling from day 1 (not as an afterthought)
- ✅ Keep it simple initially, but with proper foundations

---

## 🚨 CRITICAL PRODUCTION CONCERNS (Address Upfront)

### 1. DATA ISOLATION (Security Critical)

**The Risk:**
Seller A sees Seller B's products/orders/chat. This destroys trust instantly.

**Our Defense:**
```sql
-- Row Level Security (RLS) on EVERY table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can only see their own products"
ON products FOR ALL
USING (seller_id = auth.uid());

-- Repeat for: orders, live_sessions, chat_messages, etc.
```

**Testing:**
- Create 2 test seller accounts
- Try to access Seller B's data while logged in as Seller A (via API, direct SQL, everything)
- If you can see it, we failed

**Claude's Job:** Implement RLS on every table, verify with tests
**Your Job:** Test with 2 accounts before launch - try to break it

---

### 2. DATABASE PERFORMANCE (Will Break at Scale)

**The Risk:**
Works fine with 10 users. With 1,000+ users, queries timeout, dashboard loads for 30 seconds.

**Our Defense:**

**A) Proper Indexes (from REQUIREMENTS.md)**
```sql
-- Already planned:
CREATE INDEX idx_products_seller ON products(seller_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at DESC);
```

**B) Pagination (Never Load "All" Data)**
```javascript
// ❌ BAD (AI will suggest this):
const orders = await db.from('orders').select('*').eq('seller_id', sellerId);

// ✅ GOOD (paginate from day 1):
const orders = await db.from('orders')
  .select('*')
  .eq('seller_id', sellerId)
  .order('created_at', { ascending: false })
  .range(0, 49); // First 50 orders only
```

**C) Limit Chat Messages (Already in Requirements)**
- Keep only last 100 messages per session
- Nightly cleanup job deletes old messages

**Testing:**
- Seed database with 10,000 fake orders
- Load dashboard - if it takes > 2 seconds, fix queries
- Use Supabase query analyzer to find slow queries

**Claude's Job:** Write paginated queries, add indexes, set up cleanup jobs
**Your Job:** Monitor query performance in Supabase dashboard (weekly)

---

### 3. GOOGLE SHEETS INTEGRATION (Will Fail)

**The Risk:**
- API quota exceeded (Google limits: 100 requests/100 seconds)
- Network timeout (Sheets is down, seller's internet drops)
- Token expiry (refresh token invalidated after 6 months of no use)
- Seller deletes spreadsheet (we keep writing to 404)

**Our Defense:**

**A) Dual Storage (Already Planned)**
- Order saves to Supabase first (our source of truth)
- Google Sheets write happens async (can fail without losing order)

**B) Retry Logic with Exponential Backoff**
```javascript
async function syncToSheets(order) {
  try {
    await appendToGoogleSheet(order);
    await db.from('orders').update({ google_sheets_synced: true }).eq('id', order.id);
  } catch (error) {
    // Log error
    logger.error('Sheets sync failed', { orderId: order.id, error });

    // Mark as failed, retry later
    await db.from('orders').update({
      google_sheets_synced: false,
      sync_retry_count: order.sync_retry_count + 1
    }).eq('id', order.id);

    // Background job will retry in 5 min, 15 min, 1 hour (exponential backoff)
  }
}
```

**C) Quota Management**
- Batch writes (queue orders, write every 10 seconds instead of instantly)
- Rate limiting (max 50 writes/minute)

**D) Clear Error Messages to Seller**
- Dashboard shows: "3 orders pending sync (Sheet may be unreachable)"
- Button to "Retry Failed Syncs"

**Testing:**
- Disconnect internet, place order (should save to DB, show "sync pending")
- Delete Google Sheet, place order (should fail gracefully)
- Revoke OAuth token, place order (should show "reconnect Sheets" message)

**Claude's Job:** Build retry logic, queue system, error handling
**Your Job:** Test with real Google account, revoke permissions, see what breaks

---

### 4. SESSION MANAGEMENT (Random Logouts)

**The Risk:**
- User logged out randomly while using app
- Multiple browser tabs out of sync
- Session expires mid-live session (seller gets kicked out)

**Our Defense:**

**A) Use Supabase Auth (Handles Most of This)**
- Tokens refresh automatically
- Sessions persist across tabs (localStorage)

**B) Handle Expiry Gracefully**
```javascript
// In frontend, listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Don't break app, just redirect to login
    router.push('/login?session_expired=true');
  }

  if (event === 'TOKEN_REFRESHED') {
    // Silent refresh, user doesn't notice
  }
});
```

**C) Long Session Duration**
- Set token expiry to 7 days (not 1 hour)
- Seller stays logged in even if app is closed

**D) Persist Critical State**
- If seller is mid-live, session ID stored in localStorage
- If they reload page, control panel reconnects to same session

**Testing:**
- Manually expire token (set to 1 minute), see what happens
- Open 2 browser tabs, log out in one, check the other
- Start live session, close browser, reopen (should resume)

**Claude's Job:** Implement auth state listeners, localStorage persistence
**Your Job:** Test multi-tab scenarios, forced logouts

---

### 5. REAL-TIME CHAT (Will Lag or Break)

**The Risk:**
- Chat messages take 10+ seconds to appear (latency)
- Messages appear out of order
- Supabase Realtime connection drops, chat stops working

**Our Defense:**

**A) Use Supabase Realtime (Best We Can Do for MVP)**
- PostgreSQL subscriptions (fast, built-in)
- Fallback: Poll API every 5 seconds if Realtime fails

**B) Optimistic UI Updates**
```javascript
// When user sends message, show it immediately (don't wait for server)
const tempId = `temp-${Date.now()}`;
setMessages([...messages, { id: tempId, text: userMessage, sender: 'You' }]);

// Then send to server
const { data } = await api.post('/chat', { message: userMessage });

// Replace temp message with real one (has server timestamp)
setMessages(msgs => msgs.map(m => m.id === tempId ? data : m));
```

**C) Connection Status Indicator**
- Show "Connected" (green dot) or "Reconnecting..." (yellow) in chat panel
- If Realtime drops, auto-reconnect

**D) Message Deduplication**
- If Realtime sends duplicate message (can happen on reconnect), filter it out

**Testing:**
- Throttle network to 3G, send message (should still appear fast)
- Disable internet mid-chat, re-enable (should reconnect)
- Send 50 messages rapidly (should all appear in order)

**Claude's Job:** Implement Realtime subscription, fallback polling, optimistic UI
**Your Job:** Test on slow mobile connection, airplane mode toggle

---

### 6. ORDER EDGE CASES (Business Logic Bugs)

**The Risk:**
- Customer orders 5, but stock is 3 (overselling or hard block?)
- Customer submits form twice (double order)
- Product deleted while customer is filling order form
- Price changed during live (customer sees old price, server sees new)

**Our Defense:**

**A) Stock Overselling (Allowed, Already Decided)**
- Stock decreases but doesn't block orders (seller handles on phone call)

**B) Duplicate Order Prevention**
```javascript
// Disable submit button after first click
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleSubmit() {
  if (isSubmitting) return; // Already submitting
  setIsSubmitting(true);

  try {
    await api.post('/orders', orderData);
  } finally {
    setIsSubmitting(false); // Re-enable only after response
  }
}
```

**C) Product Snapshot in Orders**
- Order stores `product_name` and `product_price` (snapshot)
- If product deleted or price changed, order keeps original values

**D) Form Validation (Already Planned)**
- Phone: `^(05|06|07)\d{8}$`
- All fields required
- Validate on submit (not as you type - less annoying)

**Testing:**
- Click submit button 5 times rapidly (should only create 1 order)
- Change product price mid-session (old orders have old price, new have new)
- Delete product while customer has order form open (submit should still work)

**Claude's Job:** Implement duplicate prevention, product snapshots, validation
**Your Job:** Try to break the order form (double submit, weird inputs)

---

### 7. YOUTUBE INTEGRATION (Live Stream Fails)

**The Risk:**
- Seller's stream crashes (internet drops, phone dies)
- YouTube video ID is invalid (seller pastes wrong URL)
- Video is private/unlisted (can't embed)
- Live stream ends but widget doesn't switch to replay

**Our Defense:**

**A) Validate YouTube URL Before Starting Session**
```javascript
async function validateYouTubeVideo(url) {
  const videoId = extractVideoId(url); // Parse URL

  // Call YouTube Data API to check if video exists and is embeddable
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}`
  );

  const data = await response.json();

  if (data.items.length === 0) {
    throw new Error('Video not found. Check the URL and try again.');
  }

  if (!data.items[0].status.embeddable) {
    throw new Error('This video cannot be embedded. Make sure it\'s public.');
  }

  return videoId; // Valid!
}
```

**B) Handle Stream Interruption**
- YouTube IFrame Player fires `onStateChange` when stream goes offline
- Show message: "Stream interrupted. Waiting for seller to reconnect..."
- Don't end session automatically (seller might come back)

**C) Auto-Detect Replay Transition**
```javascript
player.addEventListener('onStateChange', (event) => {
  if (event.data === YT.PlayerState.ENDED) {
    // Live stream ended, now it's a replay
    updateSessionStatus('replay');
    showReplayBadge();
  }
});
```

**Testing:**
- Paste invalid YouTube URL (should show error before creating session)
- Paste private video URL (should reject)
- Manually end YouTube stream (widget should detect and show replay)

**Claude's Job:** YouTube URL validation, player state listeners, error messages
**Your Job:** Test with real YouTube live (start, end, paste wrong URLs)

---

## 🪵 LOGGING STRATEGY (Debug Production Issues)

**Philosophy:** Log everything critical. Disk space is cheap, debugging blind is expensive.

### What to Log

**1. Orders (Every Single One)**
```javascript
logger.info('Order created', {
  orderId: order.id,
  sellerId: order.seller_id,
  productId: order.product_id,
  total: order.total_price,
  googleSheetsSynced: order.google_sheets_synced,
  timestamp: new Date().toISOString()
});
```

**2. Google Sheets Sync Attempts**
```javascript
logger.info('Sheets sync attempt', { orderId, attempt: 1 });
logger.error('Sheets sync failed', { orderId, error: error.message, retryIn: '5min' });
logger.info('Sheets sync success', { orderId, rowNumber: 42 });
```

**3. Authentication Events**
```javascript
logger.info('User login', { userId, email });
logger.warn('Login failed', { email, reason: 'Invalid password' });
logger.info('User logout', { userId });
```

**4. Live Session State Changes**
```javascript
logger.info('Session started', { sessionId, sellerId, youtubeVideoId });
logger.info('Product pinned', { sessionId, productId });
logger.info('Session ended', { sessionId, duration: '45min', totalOrders: 12 });
```

**5. API Errors (All 500s)**
```javascript
logger.error('API error', {
  endpoint: '/api/orders',
  method: 'POST',
  userId: req.user?.id,
  error: error.stack,
  requestBody: req.body // Careful: don't log sensitive data
});
```

### Logging Tool
- **Option 1:** Console.log (free, works in Railway logs)
- **Option 2:** Sentry (error tracking, free tier: 5k events/month)
- **Option 3:** LogTail / Better Stack (structured logs, searchable)

**For MVP:** Start with console.log + Railway logs. Upgrade to Sentry if we get real users.

---

## 🧪 TESTING STRATEGY (Before Launch)

### Manual Testing Checklist

**Seller Workflow:**
- [ ] Sign up with new account
- [ ] Add 3 products (one with stock: 5, one unlimited, one with image URL)
- [ ] Connect Google Sheets (use real Google account)
- [ ] Verify Sheet has correct columns
- [ ] Start live session (paste real YouTube live URL)
- [ ] Open control panel on phone
- [ ] Pin product #1 (check widget updates)
- [ ] Pin product #2 (check widget updates)
- [ ] Delete a chat message
- [ ] End live session
- [ ] Verify replay activates
- [ ] Check Google Sheet has all orders

**Customer Workflow:**
- [ ] Open widget in incognito browser
- [ ] Watch video (verify auto-play muted)
- [ ] Send chat message (enter name first time)
- [ ] Click ORDER NOW (verify form appears)
- [ ] Fill invalid phone (verify error on submit)
- [ ] Fill valid data, submit (verify success message)
- [ ] Check order appears in seller's dashboard
- [ ] Check order in Google Sheet

**Edge Cases:**
- [ ] Start live with invalid YouTube URL (should reject)
- [ ] Order product with stock: 2, quantity: 5 (should allow overselling)
- [ ] Click submit button 3 times rapidly (should only create 1 order)
- [ ] Disconnect internet mid-order (should show error, not lose data)
- [ ] Revoke Google Sheets access, place order (should save to DB, show warning)
- [ ] Create 2 seller accounts, verify Seller A can't see Seller B's data

**Performance Testing:**
- [ ] Seed 1,000 fake orders, load dashboard (should be < 2 seconds)
- [ ] Send 50 chat messages rapidly (should all appear)
- [ ] Load widget on 3G connection (should load < 5 seconds)

---

## 📅 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
**Goal:** Solid backend + database with proper logging and security

**Tasks:**
- [ ] Set up monorepo structure (backend/, frontend/)
- [ ] Initialize Supabase (create tables with RLS policies)
- [ ] Set up backend API (Express, routes, middleware)
- [ ] Add logging to ALL critical endpoints
- [ ] Test data isolation (create 2 test sellers, verify RLS works)
- [ ] Set up .env files (Supabase keys, encryption key)

**Deliverable:** Backend API that can create users, products, orders (with logging)

**Your Role:** Test with 2 accounts, try to see other seller's data

---

### Phase 2: Google Sheets Integration (Week 1-2)
**Goal:** Bulletproof Sheets sync with retry logic

**Tasks:**
- [ ] OAuth flow (connect Google account)
- [ ] Append to Sheet (with proper column order)
- [ ] Retry logic (exponential backoff)
- [ ] Error handling (token expiry, quota exceeded, Sheet deleted)
- [ ] Dashboard UI (connection status, retry button)
- [ ] Test all failure modes (revoke token, delete Sheet, exceed quota)

**Deliverable:** Orders sync to Sheets even when API fails

**Your Role:** Connect real Google account, revoke access mid-session, verify errors

---

### Phase 3: Live Sessions + YouTube (Week 2)
**Goal:** Start/end live, embed YouTube, detect replay

**Tasks:**
- [ ] YouTube URL validation (via Data API)
- [ ] Session creation (with YouTube video ID)
- [ ] YouTube IFrame Player integration
- [ ] Detect stream end → switch to replay
- [ ] Session status updates (live → ended → replay)
- [ ] Test with real YouTube live (start, end, interrupt)

**Deliverable:** Seller can go live, embed works, replay auto-activates

**Your Role:** Test with real YouTube stream on phone

---

### Phase 4: Widget (Customer-Facing) (Week 2-3)
**Goal:** Embeddable widget that works on any site

**Tasks:**
- [ ] Widget JavaScript file (loads via script tag)
- [ ] YouTube player embed
- [ ] Product card (name, price, image, ORDER NOW button)
- [ ] Chat panel (real-time messages via Supabase Realtime)
- [ ] Order form (validation, submit)
- [ ] Order confirmation screen
- [ ] Mobile responsive (full-width video, sticky button)
- [ ] Test on Shopify, WordPress, static HTML page

**Deliverable:** Widget script tag seller can paste anywhere

**Your Role:** Test on your own website, phone, slow connection

---

### Phase 5: Seller Dashboard (Week 3-4)
**Goal:** Seller can manage products, view orders, get embed code

**Tasks:**
- [ ] Login/signup pages
- [ ] Products page (CRUD with image upload)
- [ ] Go Live page (YouTube URL input, start session)
- [ ] Orders page (table with pagination - first 50 orders)
- [ ] Settings page (Google Sheets connection, embed code)
- [ ] Test with 1,000+ orders (verify pagination works)

**Deliverable:** Functional dashboard (simple, no fancy design yet)

**Your Role:** Use dashboard daily, report confusing UX

---

### Phase 6: Control Panel (Week 4)
**Goal:** Mobile-first control panel for live sessions

**Tasks:**
- [ ] Mobile layout (vertical, touch-friendly)
- [ ] Product grid (tap to pin)
- [ ] Chat panel (messages, delete button)
- [ ] Order notifications (toast popups)
- [ ] End Live button (with confirmation)
- [ ] Real-time updates (via Supabase Realtime)
- [ ] Test on phone (tap targets, scrolling, notifications)

**Deliverable:** Control panel that works smoothly on phone during live

**Your Role:** Test on real phone while doing mock live session

---

### Phase 7: Testing & Bug Fixes (Week 5)
**Goal:** Break everything, fix everything

**Tasks:**
- [ ] Run full manual testing checklist (above)
- [ ] Test all edge cases (double submit, stock, deleted products)
- [ ] Performance test (1,000 orders, slow queries, pagination)
- [ ] Security test (data isolation, SQL injection, XSS)
- [ ] Mobile test (3G connection, old Android phone)
- [ ] Fix critical bugs (anything that loses data or breaks UX)

**Deliverable:** MVP that doesn't break in obvious ways

**Your Role:** Full-time tester - try to break everything

---

### Phase 8: Soft Launch (Week 6)
**Goal:** Real users, real feedback, real issues

**Tasks:**
- [ ] Invite 3-5 sellers to test (friends, family, anyone)
- [ ] Monitor Railway + Vercel logs daily (check for errors)
- [ ] Monitor Supabase dashboard (query performance, storage)
- [ ] Fix bugs as they're reported
- [ ] Gather feedback (what's confusing, what's missing)
- [ ] Iterate on UX (move buttons, add help text)

**Deliverable:** MVP that 3+ sellers can use without major issues

**Your Role:** Daily check-ins with testers, fix issues same-day

---

## 🎓 WHAT YOU NEED TO LEARN (Just Enough)

You don't need to become a senior dev. You need to understand enough to supervise Claude and debug when things break.

### Database Basics (2-3 hours)
- What is an index and why does it make queries fast?
- How to read a slow query log in Supabase
- What is Row Level Security (RLS) and why does it prevent data leaks?

**Resource:** Supabase docs (5-minute quickstarts)

---

### API Basics (2-3 hours)
- What is REST? (GET, POST, PUT, DELETE)
- How does authentication work? (JWT tokens, sessions)
- What is a 200 vs 400 vs 500 error?

**Resource:** freeCodeCamp "APIs for Beginners" (YouTube)

---

### JavaScript Async/Await (1 hour)
- What is a Promise?
- Why use `async/await` instead of `.then()`?
- What happens when an API call fails?

**Resource:** JavaScript.info (async/await section)

---

### Debugging Basics (1 hour)
- How to read Vercel logs (where errors show up)
- How to use browser DevTools (Network tab, Console)
- How to add `console.log()` to see what's happening

**Resource:** Chrome DevTools tutorial (Google)

---

### Google Sheets API (1 hour)
- How OAuth works (why we need tokens)
- What is a refresh token vs access token?
- How to append a row to a Sheet (Google API docs)

**Resource:** Google Sheets API quickstart (Node.js)

---

**Total Learning Time:** ~10 hours spread over 6 weeks (20 minutes/day)

**Goal:** Understand WHAT Claude is building, so you can spot bad code and ask better questions.

---

## 🚀 FINAL PRE-LAUNCH CHECKLIST

Before showing Livey to real sellers:

### Security
- [ ] All tables have Row Level Security (RLS) enabled
- [ ] sellerQuery() helper used in all seller-facing controllers
- [ ] Tested data isolation (Seller A can't see Seller B's data)
- [ ] Google refresh tokens encrypted in database
- [ ] No API keys in frontend code (only public keys)
- [ ] CORS enabled only for widget domains
- [ ] Rate limiting on all routes (global, auth, orders)
- [ ] Input sanitization (XSS prevention) on all inputs

### Performance
- [ ] All queries use indexes (check Supabase query analyzer)
- [ ] Dashboard paginates orders (doesn't load all)
- [ ] Chat cleanup job runs nightly (delete old messages)
- [ ] Widget loads in < 3 seconds on 3G

### Error Handling
- [ ] Logging enabled for all critical actions (orders, Sheets sync, auth)
- [ ] Google Sheets failures don't break order creation
- [ ] YouTube URL validation before starting session
- [ ] Duplicate order prevention (disable submit button)
- [ ] Graceful session expiry (redirect to login, not crash)

### Testing
- [ ] Manual testing checklist completed (all checkboxes ✅)
- [ ] Tested with 2+ seller accounts (data isolation verified)
- [ ] Tested with real YouTube live stream (start, end, interrupt)
- [ ] Tested with real Google account (revoke, reconnect, delete Sheet)
- [ ] Tested on mobile (phone, 3G, old Android)

### Monitoring
- [ ] Can access Vercel logs (know where to look for errors)
- [ ] Can access Supabase logs (query performance, errors)
- [ ] Can access Google Cloud Console (API quota usage)
- [ ] Have a spreadsheet to track: what broke, how we fixed it

---

## 🤝 CLAUDE'S ROLE vs YOUR ROLE

### Claude Does:
- Write code (components, API routes, database queries)
- Set up configurations (Vercel, Supabase, package.json)
- Implement features (Google Sheets, YouTube, real-time chat)
- Fix bugs you report

### You Do:
- Test everything (manual testing checklist)
- Monitor production (Vercel logs, Supabase dashboard)
- Make product decisions (UX changes, feature priorities)
- Talk to users (gather feedback, understand pain points)
- Learn fundamentals (10 hours over 6 weeks)
- Supervise Claude (question bad code, spot edge cases)

### Together We:
- Debug production issues (you report, Claude investigates, you verify fix)
- Iterate on UX (you say "this is confusing", Claude redesigns)
- Make technical tradeoffs (you decide business priority, Claude suggests solutions)

---

## ✅ READY TO BUILD

We have:
- ✅ Spec (what we're building)
- ✅ Requirements (how we're building it)
- ✅ Plan (when we're building it, with production in mind)

We've learned from others' mistakes:
- ✅ Database indexes from day 1 (not after it's slow)
- ✅ Logging for critical actions (not after customers complain)
- ✅ Error handling for integrations (not after Sheets breaks)
- ✅ Data isolation with RLS (not after a data leak)
- ✅ Pagination and performance (not after 1,000 users)

**Next step:** Build Phase 1 (Foundation) - backend + database + logging

**Your call:** Ready to start building? 🚀
