# Livey MVP Specification

**Version:** 2.0 (Simplified)
**Target Market:** Algerian E-commerce Sellers
**Core Bet:** Customer clicks ad → watches video → orders in 30 seconds → seller gets it in their Sheet.

Everything else is decoration until that loop proves it converts at 3x.

---

## 🛍️ Seller Workflow (My MVP)

1. **Signs up** on livey.io (email + password)

2. **Adds products** (name, price, image, stock)

3. **Connects Google Sheet** (OAuth, one-click)

4. **Copies embed code** → pastes into their product page

5. **When ready to go live:**
   - Starts YouTube live on phone
   - Pastes YouTube live ID into Livey
   - Picks which products to feature
   - Hits "Start Session"

6. **During live** — opens control panel on phone:
   - Taps products to pin them (viewers see it change)
   - Sees order notifications pop in ("Amina just ordered!")
   - Can delete spam chat messages (just a delete button, no fancy moderation)

7. **Hits "End Live"** → replay activates automatically on the same embed, 24/7

8. **Checks Google Sheet** for all orders, calls customers to confirm COD

### What's Cut:
❌ Moderator role
❌ Chat auto-moderation/word filters/mute timers
❌ Analytics dashboard
❌ Quick-reply templates
❌ Revenue counters
❌ Moderation logs

**The seller IS the moderator.**

---

## 🛒 Customer Workflow (Coming from Ad)

1. **Sees Facebook/TikTok ad** → clicks → lands on seller's product page

2. **Sees the Livey widget:** video playing (live or replay), product card visible, chat scrolling

3. **Watches** the seller demo the product

4. **Can type in chat** (just enters a name first time, then messages — simple, no frills)

5. **Seller pins a product** → product card updates with name, price, image

6. **Customer taps "ORDER NOW"**

7. **Form slides up** (mobile drawer):
   - Full Name
   - Phone (Algerian format)
   - Full Address (text area — they write wilaya, commune, street, everything)
   - Quantity

8. **Taps "Confirm Order"**

9. **Sees:** "Order confirmed! We'll contact you soon." + order summary

10. **Order instantly lands** in seller's Google Sheet

11. **Customer can close or keep watching**

### What's Cut:
❌ Product timestamps/jumping in replay
❌ Share to WhatsApp/Facebook
❌ Step-by-step form wizard
❌ Language switching
❌ Wilaya → Commune filtered dropdown

**Just one clean form, one confirmation screen.**

---

## 📝 Customer Order Form (Simplified)

1. **Full Name** (text, required)
2. **Phone** (Algerian format, required)
3. **Full Address** (text area — they write wilaya, commune, street, everything, required)
4. **Quantity** (number, default 1)

**That's it. Four fields.**

### Why So Simple?
The seller already calls the customer to confirm COD anyway — they'll sort out any address issues on that call. No need to engineer a perfect address system when a human conversation is already baked into the flow.

---

## 🎯 Core Features (MVP Only)

### 1. Embeddable Widget
- YouTube video player (live or replay)
- Product card overlay (name, price, image)
- ORDER NOW button (always visible)
- Simple chat panel
- Works on any website (Shopify, WordPress, static HTML)

### 2. Seller Dashboard (Minimal)
- Add/edit products
- Get embed code (copy-paste)
- Connect Google Sheets (OAuth)
- Start live session (paste YouTube ID, select products)
- View recent orders list

### 3. Seller Control Panel (Mobile-First)
- Pin products during live (tap to switch)
- See live chat messages
- Delete spam messages (one button)
- Order notifications in real-time
- "End Live" button

### 4. Live & Replay
- Live: YouTube stream embeds when seller pastes ID
- Replay: Automatically switches when live ends
- Same embed code works for both
- No seller action needed for transition

### 5. Real-Time Chat (Basic)
- Customer enters name (once)
- Types messages, everyone sees instantly
- Seller messages highlighted
- That's it — no moderation tools, no filters, no muting

### 6. Order Processing
- Form submission → saves to database
- Instantly appends to Google Sheet
- Shows confirmation to customer
- Notification to seller control panel

---

## 📱 Mobile-First Design

### Customer Widget (Mobile)
- Full-width video
- Product card below video
- ORDER NOW button sticky at bottom
- Chat collapses (tap to expand)

### Seller Control Panel (Mobile)
- Vertical layout (scroll down)
- Large tap targets for product pins
- Chat messages with delete button
- Order count at top

### Performance
- Loads in under 3 seconds on 3G
- Works on 5-year-old Android phones
- Video starts playing within 5 seconds

---

## 🇩🇿 Algeria-Specific

### Language
- French interface (primary)
- Arabic support in chat

### Phone Format
- 05XX XX XX XX (auto-format as user types)
- Validation on submit

### Currency
- Algerian Dinar (DA) only

### COD Focus
- No payment gateway
- Orders are "intent to buy"
- Seller confirms via phone call
- Payment on delivery

---

## ✅ MVP Success Criteria

**Week 4:**
- 5 sellers tested
- 3+ completed one live session
- 10+ total orders captured
- Widget works on mobile without crashes
- 2+ sellers say: "I'd pay for this"

**Month 3:**
- 20+ active sellers
- 10+ paying customers
- Average conversion: 3x improvement

---

## 🚫 NOT in MVP

❌ Analytics dashboard
❌ Moderator role
❌ Chat auto-moderation/filters
❌ Product timestamps in replay
❌ Share buttons (WhatsApp/Facebook)
❌ Multi-language switching
❌ Advanced form (wilaya/commune dropdowns)
❌ Email notifications
❌ SMS alerts
❌ Landing page builder
❌ Team management
❌ Custom branding
❌ Scheduling lives
❌ Replay editing

**Why?** Focus on core value. Does it convert? Everything else can wait.

---

## 🎯 The Bet

**One sentence:**
Customer clicks ad → watches video → orders in 30 seconds → seller gets it in their Sheet.

If that loop works and converts at 3x, we have a business.
If it doesn't, we pivot or quit.

**Simple as that.**

---

## 📋 Technical Deliverables

### For Sellers:
- Dashboard (signup, add products, get embed code, connect Sheets)
- Control panel (pin products, see chat, delete spam, see orders)

### For Customers:
- Embeddable widget (video + product card + chat + order form)
- Order confirmation screen

### Backend:
- API endpoints (products, orders, chat, live sessions)
- Database (users, products, orders, messages)
- Google Sheets integration (OAuth + append rows)
- Real-time updates (WebSocket or SSE)

### Frontend:
- Widget (React, embeddable via script tag)
- Dashboard (React)
- Control panel (React, mobile-optimized)

---

## 🚀 Build Timeline

**Week 1-2:** Backend + Database + Google Sheets
**Week 2-3:** Widget (video, product card, order form)
**Week 3-4:** Chat (real-time messages, basic display)
**Week 4-5:** Seller dashboard + control panel
**Week 5-6:** Testing, mobile optimization, bug fixes

**Total: 6 weeks**

---

## 🎨 Design Principles

**Simple:** One action per screen
**Fast:** Works on 3G, old phones
**Familiar:** Looks like WhatsApp/Instagram/Shopify
**Mobile-First:** Design for phone, enhance for desktop

---

**END OF SPEC**

Ready to build. 🚀
