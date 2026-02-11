# Livey.io - MVP Project Specification

**Version:** 1.0  
**Date:** February 2026  
**Project Type:** Embeddable Video Commerce Widget  
**Target Market:** Algerian E-commerce Sellers  

---

## 📋 PROJECT OVERVIEW

### What We're Building:
A lightweight embeddable widget that turns any product page into a live or replay video shopping experience with real-time chat and one-click ordering.

### Core Value Proposition:
Help Algerian sellers increase their Facebook/TikTok ad ROI from 2-3% conversion to 10-15% conversion by replacing static product pages with engaging video content.

### Primary Use Case:
Seller runs paid ads → Customer clicks → Lands on product page with live/replay video → Watches seller demonstrate product → Orders directly from video → Order goes to seller's Google Sheet.

---

## 🎯 WHO THIS IS FOR

### Primary User: The Seller
- Small to medium Algerian e-commerce merchants
- Spending 20-50K DA/month on Facebook/TikTok ads
- Currently using Shopify, WordPress, or basic websites
- Comfortable using smartphones (not necessarily tech-savvy)
- Rely on COD (Cash on Delivery) business model
- Want better return on ad spend

### Secondary User: The Customer
- Algerian online shoppers
- Mobile-first (90% browse on phones)
- Prefer COD over online payment
- Speak Darija/French/Arabic
- Respond better to video than static images
- Want to see product before buying

### Optional User: The Moderator
- Friend/employee helping seller during busy lives
- Manages chat while seller focuses on presenting
- No technical skills required

---

## ✨ CORE FEATURES (MVP)

### 1. Embeddable Widget

**What It Does:**
Displays a video player with overlay elements on any webpage via simple embed code.

**Components:**
- YouTube video embed (live or replay)
- Product card overlay (shows current product: name, price, image)
- Order button (always visible)
- Live chat panel
- Viewer counter ("X people watching")

**Where It Works:**
- Shopify product pages
- WordPress posts/pages
- Static HTML websites
- Linktree pages
- Any webpage that allows custom HTML/JavaScript

**Embed Process:**
1. Seller copies one line of code from Livey dashboard
2. Pastes it into their product page
3. Widget automatically appears and works

---

### 2. Live & Replay Video

**Live Mode:**
- Seller goes live on YouTube from their phone
- Enters YouTube live ID into Livey control panel
- Widget automatically connects and shows live stream
- Live badge appears ("LIVE NOW" in red)
- Real-time viewer count updates

**Replay Mode:**
- When live ends, video automatically becomes replay
- Same URL continues working 24/7
- Replay plays in loop
- Product timestamps allow jumping to specific moments
- No seller action needed for transition

**Video Controls:**
- Play/pause button
- Volume control
- Full-screen option (optional)
- Mobile-optimized player

---

### 3. Product Display

**Product Card:**
- Floats over video (bottom-left or bottom-right)
- Shows:
  - Product image (thumbnail)
  - Product name
  - Price in Algerian Dinars (DA)
  - Stock status ("In stock" or "Only X left")
  - ORDER NOW button (prominent, contrasting color)

**Product Pinning:**
- Seller can pin different products during live
- Opens control panel on phone
- Taps product to pin it
- Widget updates in real-time for all viewers
- Product card changes to show newly pinned item

**Multiple Products:**
- Seller can feature 5-10 products in one video
- Switches between them during presentation
- Each product gets timestamp in replay
- Customers can jump to product they want

---

### 4. Order Form

**Trigger:**
Customer clicks "ORDER NOW" button on product card

**Form Appears:**
- Modal overlay (dims video in background)
- OR slide-up drawer from bottom (mobile-friendly)
- Video keeps playing in background (muted/paused)

**Form Fields:**
1. **Full Name** (text input, required)
2. **Phone Number** (Algerian format: 05XX XX XX XX, required)
3. **Wilaya** (dropdown, all 58 wilayas, required)
4. **Commune** (dropdown, filtered based on wilaya selection, required)
5. **Delivery Address** (text area, required)
6. **Product** (auto-filled, shows what they're ordering)
7. **Quantity** (number, default: 1)
8. **Special Requests** (text area, optional)

**Validation:**
- All required fields must be filled
- Phone number must match Algerian format
- Commune must belong to selected wilaya
- Clear error messages in French/Arabic

**Submit Button:**
- "Confirm Order" (large, prominent)
- Shows loading spinner during submission
- Disabled after click (prevent double orders)

---

### 5. Order Processing

**What Happens on Submit:**

**Step 1: Save to Database**
- Order captured in Livey database
- Includes: timestamp, customer info, product, price, seller ID

**Step 2: Send to Google Sheets**
- Automatically appends row to seller's Google Sheet
- Columns: Order ID, Date/Time, Customer Name, Phone, Wilaya, Commune, Address, Product, Price, Quantity, Notes
- Seller sees new row appear instantly (if sheet is open)

**Step 3: Real-time Notification**
- Broadcast to control panel (if seller is watching during live)
- Show notification: "New order from [Customer Name]!"
- Play notification sound (optional)
- Update order counter

**Step 4: Customer Confirmation**
- Show success message: "Order confirmed! We'll contact you soon."
- Display order summary (what they ordered, delivery info)
- Option to close and continue watching video
- Option to share on WhatsApp/Facebook

---

### 6. Live Chat

**Chat Panel:**
- Positioned next to video (side on desktop, below on mobile)
- Shows scrolling messages in real-time
- Auto-scrolls to newest message
- Shows username and timestamp for each message

**Sending Messages:**
- Customer enters name (first time only, saved locally)
- Types message in input box at bottom
- Presses enter or click send button
- Message appears instantly for everyone watching

**Message Display:**
- Customer messages: Regular text, left-aligned
- Seller messages: Highlighted background (blue), seller badge
- System messages: Centered, gray text ("Sarah just ordered!")
- Pinned messages: Sticky at top, yellow background

**Features:**
- Message character limit (200 characters)
- Rate limiting (max 3 messages per minute to prevent spam)
- Emoji support (basic smileys)
- Clickable links (auto-detected, open in new tab)

---

### 7. Chat Moderation

**Auto-Moderation:**
- Bad words filter (Arabic, French, Darija profanity list)
- Blocked words replaced with "***" or message rejected
- Spam detection (same message repeated = auto-blocked)
- Link blocking (prevent competitor URLs)
- Seller can customize word list

**Manual Moderation (Control Panel):**
- Seller/moderator sees all messages streaming
- Options per message:
  - Delete message (removes for everyone)
  - Mute user (blocks for 5 min, 30 min, or permanently)
  - Pin message (sticks to top of chat for all viewers)
  - Reply (seller response highlighted)

**Moderator Role:**
- Seller can invite moderator via email
- Moderator gets access to control panel
- Can moderate chat but cannot pin products or end live
- Good for busy lives when seller can't watch chat closely

**Moderation Log:**
- Track who deleted/muted what
- Review past actions
- Restore accidentally deleted messages (within 24 hours)

---

### 8. Seller Control Panel

**Purpose:**
Simple mobile-friendly page for managing active live session

**URL Format:**
`livey.io/control/[session-id]`

**What Seller Sees:**

**Top Section:**
- Live status indicator (green dot + "LIVE")
- Timer (how long they've been live)
- Viewer count (real-time)
- Order count (how many orders received)
- Revenue counter (total DA earned this session)

**Product Section:**
- Grid of seller's products (thumbnails)
- Tap any product to pin it
- Currently pinned product highlighted
- Quick stats per product (times ordered this session)

**Chat Section:**
- Scrolling chat messages
- Moderation buttons (delete, mute, pin)
- Quick reply templates:
  - "Available in all colors!"
  - "Free delivery to your wilaya"
  - "Last 5 pieces!"
  - (Seller can customize templates)

**Actions:**
- End Live button (big, red, requires confirmation)
- Share live link (WhatsApp, Facebook)
- Pause chat (emergency disable if overwhelmed)

---

### 9. Seller Dashboard (Minimal)

**Purpose:**
Basic interface for setup and management (not fancy, just functional)

**URL:**
`livey.io/dashboard`

**Pages:**

**Home:**
- Welcome message
- Quick stats (total orders, total revenue, active replays)
- Quick action buttons: "Add Product", "Go Live", "View Orders"

**Products:**
- List of all products (table view)
- Add new product form:
  - Name
  - Price (DA)
  - Image (upload or URL)
  - Stock quantity
  - Description (optional)
- Edit/delete existing products

**Setup:**
- Get embed code (copy-paste box)
- YouTube connection (paste live IDs)
- Google Sheets setup:
  - Connect Google account (OAuth)
  - Select spreadsheet
  - Column mapping
  - Test connection button

**Orders:**
- Recent orders list (last 50)
- Filter by date, product, wilaya
- Export to CSV
- Link to Google Sheet

**Billing:**
- Current plan (Free or Pro)
- Usage stats (orders this month, replays active)
- Upgrade button (links to Chargily checkout)
- Billing history (invoices)

**Settings:**
- Business name
- Contact info (phone, email)
- Moderation settings (banned words list)
- Invite moderator
- API key (for advanced users)

---

### 10. Pricing & Payments

**Free Tier:**
- 1 active replay at a time
- Up to 50 orders per month
- Livey watermark on widget
- Basic chat (no auto-moderation)
- Community support only

**Pro Tier - 4,500 DA/month:**
- Unlimited active replays
- Unlimited orders
- No watermark
- Auto-moderation + custom word lists
- Moderator role (invite 1-3 people)
- Priority support (WhatsApp)
- Analytics (which replays convert best)

**Payment Methods:**

**Algeria (Chargily):**
- CCP (Compte Courant Postal)
- EDAHABIA card
- Baridi Mob
- Credit cards via Satim

**International (Stripe):**
- Visa/Mastercard
- Accept payments in USD/EUR

**Billing:**
- Monthly subscription (auto-renew)
- Cancel anytime
- Prorated refunds (if cancelled mid-month)
- Invoice sent via email

---

## 🎨 USER EXPERIENCE FLOWS

### Flow 1: Seller Setup (First Time)

1. Seller visits livey.io
2. Clicks "Get Started"
3. Signs up (email + password)
4. Lands on dashboard
5. Sees onboarding wizard:
   - Step 1: Add first product (name, price, image)
   - Step 2: Connect Google Sheet
   - Step 3: Get embed code
   - Step 4: Test widget (preview page)
6. Copies embed code
7. Pastes into Shopify product page
8. Widget appears on product page
9. Done! (5-10 minutes total)

---

### Flow 2: Seller Going Live

1. Seller opens YouTube app on phone
2. Starts live stream (shows product)
3. Copies YouTube live ID
4. Opens Livey dashboard on phone
5. Taps "Go Live"
6. Pastes YouTube live ID
7. Selects products to feature
8. Taps "Start Session"
9. Opens control panel link
10. Widget on product page now shows live stream
11. During live:
    - Seller taps products to pin them
    - Watches chat, moderates if needed
    - Sees order notifications in real-time
12. When done, taps "End Live"
13. Replay automatically activates on same page

---

### Flow 3: Customer Ordering from Live

1. Customer sees Facebook ad
2. Clicks ad → lands on Shopify product page
3. Sees "LIVE NOW" badge on video
4. Video auto-plays (or clicks play)
5. Watches seller demonstrate product
6. Reads chat messages (sees others asking questions)
7. Seller pins product (card appears over video)
8. Customer clicks "ORDER NOW"
9. Form slides up
10. Fills in:
    - Name: Amina Benali
    - Phone: 0555 12 34 56
    - Wilaya: Algiers
    - Commune: Bab El Oued
    - Address: Rue xyz, Building 5, Apt 12
11. Clicks "Confirm Order"
12. Sees success message: "Order confirmed! Seller will contact you."
13. Order appears in seller's Google Sheet instantly
14. Customer can continue watching or close

---

### Flow 4: Customer Ordering from Replay (24/7)

1. Customer sees Facebook ad (2 AM, seller asleep)
2. Clicks ad → lands on product page
3. Sees replay video playing
4. Watches seller's recorded demo
5. Sees product timestamps ("Jump to Handbag Demo")
6. Clicks timestamp, video skips to that moment
7. Decides to order
8. Clicks "ORDER NOW"
9. Fills form (same as live flow)
10. Submits order
11. Order goes to Google Sheet
12. Seller wakes up, sees new orders from night before
13. Contacts customers to confirm

---

### Flow 5: Moderator Helping During Live

1. Seller invites friend as moderator (via email)
2. Moderator receives invite link
3. Creates account (or logs in)
4. Gets access to control panel
5. During live, moderator watches chat
6. Customer asks: "Do you ship to Oran?"
7. Moderator replies: "Yes! Free delivery to Oran"
8. Another message appears with spam link
9. Moderator deletes it, mutes the user
10. Important question comes in
11. Moderator pins it so seller sees
12. Seller answers on camera
13. Moderator unpins after answer given

---

## 📱 MOBILE EXPERIENCE (Critical)

### Why Mobile Matters:
90% of Algerian traffic is mobile. If it doesn't work perfectly on phones, it fails.

### Mobile Optimizations:

**Widget on Mobile:**
- Full-width video (no wasted space)
- Product card stacks below video (not overlay)
- Order button sticky at bottom (always visible)
- Chat collapses (tap to expand)
- Touch-friendly buttons (minimum 44x44 pixels)

**Control Panel on Mobile:**
- Vertical layout (scroll down for sections)
- Large tap targets for product pins
- Swipe to delete chat messages
- Bottom navigation (Products | Chat | Stats)
- Works on slow 3G connections

**Order Form on Mobile:**
- One field at a time (step-by-step)
- OR compact form (all fields visible, scroll)
- Autocomplete for wilayas/communes
- Numeric keyboard for phone input
- Address auto-expand when typing

**Performance:**
- Widget loads in under 3 seconds on 3G
- Video starts playing within 5 seconds
- Chat messages appear instantly (no lag)
- Works on older Android phones (5+ years old)

---

## 🌍 ALGERIA-SPECIFIC FEATURES

### Language Support:
- Interface in French (primary) and Arabic (secondary)
- Customer can switch language
- Darija support in chat (mixed Arabic/French)
- Right-to-left (RTL) layout for Arabic

### Wilaya & Commune System:
- Complete list of 58 wilayas
- Accurate commune lists per wilaya (1,500+ communes)
- Fast filtering (type-ahead search)
- Mobile-optimized dropdowns

### Phone Number Format:
- Algerian mobile: 05XX XX XX XX or 06XX XX XX XX or 07XX XX XX XX
- Auto-formatting as user types
- Validation (reject if wrong format)
- Click-to-call on seller side

### COD Focus:
- No payment gateway needed in MVP
- Orders are "intent to buy"
- Seller confirms via phone call
- Payment happens on delivery

### Delivery Zones:
- Seller can specify which wilayas they deliver to
- Order form only shows deliverable wilayas
- Clear message: "We deliver to X wilayas"

---

## 🔄 REAL-TIME FEATURES

### What Updates in Real-Time:

**During Live:**
- Chat messages (appear within 1 second)
- Viewer count (updates every 5 seconds)
- Product pins (change instantly when seller switches)
- Order notifications (seller sees within 2 seconds)
- Moderation actions (deletions/mutes apply instantly)

**Technology Needed:**
- WebSocket or Server-Sent Events
- Database with real-time subscriptions
- Low latency (under 2 seconds for critical updates)

---

## 📊 ANALYTICS (Basic for MVP)

### What Seller Can See:

**Per Replay:**
- Total views
- Total orders
- Conversion rate (orders / views)
- Average watch time
- Peak viewer count
- Revenue generated

**Overall:**
- Total revenue (all time)
- Total orders (all time)
- Best-performing product (most orders)
- Best-performing replay (highest conversion)
- Orders by wilaya (which regions buy most)

**What We DON'T Track (MVP):**
- Detailed viewer journey
- Heatmaps of where people click
- A/B testing
- Cohort analysis
(These can come in v2)

---

## 🚫 OUT OF SCOPE (NOT in MVP)

### Features We're Skipping:

❌ **Full marketing website** (homepage, about, blog)  
❌ **Advanced analytics dashboard** (just basic stats)  
❌ **Team management** (just 1 moderator, no complex roles)  
❌ **Custom branding** (no white-label, just Livey branding)  
❌ **Landing page builder** (sellers use existing sites)  
❌ **Multiple languages** (just French + Arabic, no English initially)  
❌ **Email marketing** (no automated campaigns)  
❌ **SMS notifications** (just Google Sheets, seller handles follow-up)  
❌ **Inventory sync** (no Shopify product sync)  
❌ **Multi-currency** (just Algerian Dinar)  
❌ **Advanced moderation** (no AI content detection, just word filters)  
❌ **Video hosting** (we use YouTube, not our own servers)  
❌ **Scheduling lives** (manual only)  
❌ **Replay editing** (use full video, no trimming)  

### Why We're Skipping These:
Focus on core value: Does the widget increase conversions? Everything else can wait.

---

## ✅ SUCCESS CRITERIA

### MVP is Successful If:

**Validation Metrics (Week 4):**
- 5 sellers tested the widget
- 3+ sellers completed at least one live session
- 10+ total orders captured across all sellers
- Widget worked on mobile without crashes
- At least 2 sellers said: "I'd pay 4,500 DA/month for this"

**Business Metrics (Month 3):**
- 20+ active sellers using widget
- 10+ paying customers (Pro tier)
- 45,000 DA+ MRR (Monthly Recurring Revenue)
- Average conversion improvement: 3x or better
- Customer support load: Under 5 hours/week

**Technical Metrics:**
- Widget loads in under 3 seconds (mobile 3G)
- 99% uptime (widget available 24/7)
- Chat latency under 2 seconds
- Zero order data loss (all orders reach Google Sheets)

---

## 📅 TIMELINE

### Week 1-2: Core Widget
- Embed system (works on any site)
- YouTube video player
- Product card overlay
- Order form
- Google Sheets integration

### Week 3: Chat + Moderation
- Real-time chat
- Auto-moderation filters
- Manual moderation tools
- Moderator role

### Week 4: Seller Tools
- Control panel (pin products, manage chat)
- Basic dashboard (add products, get embed code, view orders)
- Google Sheets setup flow

### Week 5: Testing
- Test with 5 sellers
- Fix critical bugs
- Improve UX based on feedback
- Mobile optimization

### Week 6: Billing + Launch
- Chargily payment integration
- Pro tier subscription flow
- Soft launch with beta testers
- Gather testimonials

**Total: 6 weeks to working MVP**

---

## 🎯 CORE ASSUMPTIONS TO VALIDATE

**We're betting that:**

1. **Sellers will go live** (even if uncomfortable initially)
2. **Video converts better than images** (at least 3x improvement)
3. **Customers will order from widget** (not just watch and leave)
4. **Embed approach works** (sellers can paste code successfully)
5. **Chat adds value** (doesn't just create noise/spam)
6. **Sellers will pay 4,500 DA/month** (if it proves ROI)
7. **Google Sheets is enough** (sellers don't need fancy CRM)
8. **Mobile experience is acceptable** (works on old phones)

**If any of these fail, we pivot or improve.**

---

## 📋 DELIVERABLES

### What We Ship:

**For Sellers:**
- Widget embed code
- Seller dashboard (livey.io/dashboard)
- Control panel (livey.io/control/[session-id])
- Setup guide (PDF or video tutorial)

**For Customers:**
- Embedded widget (on seller's site)
- Order confirmation page
- (No separate customer app/account needed)

**For Moderators:**
- Access to control panel
- Moderation interface

**Technical:**
- CDN-hosted widget file (widget.js)
- API endpoints for orders, chat, products
- Database (users, products, orders, chat messages)
- Chargily payment integration
- Google Sheets integration

---

## 🎨 DESIGN PRINCIPLES

### Keep It:

**Simple:**
- One primary action per screen
- Minimal text, maximum clarity
- No unnecessary features

**Fast:**
- Loads quickly even on slow connections
- No loading screens (use skeletons/progressive enhancement)
- Instant feedback on actions

**Familiar:**
- Looks like apps sellers already use (WhatsApp, Instagram, Shopify)
- Standard UI patterns (no reinventing)
- Predictable behavior

**Algerian:**
- Feels local, not foreign
- Language, currency, delivery zones all correct
- Cultural fit (respect for COD, phone-first communication)

**Mobile-First:**
- Design for phone, enhance for desktop
- Touch-friendly, thumb-reachable buttons
- Works on small screens (5-inch phones)

---

## 🔐 SECURITY & PRIVACY

### Data Protection:
- Customer data encrypted at rest and in transit
- Seller data isolated (can't see other sellers' data)
- No public access to order details
- Google Sheets only accessible by authenticated seller

### Authentication:
- Secure password requirements (8+ characters, mix of types)
- Rate limiting on login (prevent brute force)
- Session timeout after 7 days
- API keys for widget (can be regenerated if compromised)

### Moderation:
- Muted users can't see they're muted (prevent evasion)
- Deleted messages logged (can be reviewed if appealed)
- Moderator actions audited (prevent abuse)

### Compliance:
- GDPR-ready (customers can request data deletion)
- Terms of Service (what sellers can/can't sell)
- Privacy Policy (how we use data)
- Prohibited items list (no illegal goods, weapons, etc.)

---

## 📞 SUPPORT

### For Sellers:

**Free Tier:**
- Help documentation (FAQs, guides)
- Email support (48-hour response)
- Community forum (coming in v2)

**Pro Tier:**
- WhatsApp support (business hours)
- Priority email (24-hour response)
- Setup assistance (one-time onboarding call)

**Common Issues:**
- How to connect Google Sheets
- How to get YouTube live ID
- Where to paste embed code
- Why orders aren't showing up
- How to manage chat spam

---

## 🚀 LAUNCH STRATEGY

### Beta Phase (Week 5-6):
- Invite 5-10 sellers personally
- Free access for 1 month
- Daily check-ins (WhatsApp group)
- Fix bugs immediately
- Gather testimonials

### Soft Launch (Week 7-8):
- Open to anyone (free tier)
- Post in Algerian e-commerce Facebook groups
- Reach out to sellers you know
- Offer: "First 50 users get 50% off Pro forever"

### Messaging:
- "Turn your ad traffic into sales with live video"
- "3x your Facebook ad ROI in one week"
- "The Algerian seller's secret weapon"

---

## 📝 NEXT STEPS

With this spec, you can now:

1. **Share with developer** (human or AI) to get technical plan
2. **Estimate build time** (developer gives timeline)
3. **Identify risks** (what could go wrong)
4. **Prioritize features** (if 6 weeks is too long, what to cut)
5. **Start building** (once plan is approved)

**This spec describes WHAT we want, not HOW to build it.**  
That's for the technical team to figure out.

---

## 🎯 PROOF OF CONCEPT

### Real-World Validation:

**Chirine - Algerian Influencer:**
- Currently does live shopping on TikTok
- Manually takes orders via phone calls during lives
- Gets high order volume per live session
- Loses orders due to manual chaos
- **Perfect first customer for Livey**

**Market Evidence:**
- Live shopping is trending globally (US, China, Southeast Asia)
- Billions in annual sales
- 40-60% conversion rates (vs 2-3% for static pages)
- People are ADDICTED to live shopping experiences
- FOMO, gamification, social proof drive purchases

**Competitive Landscape:**
- TikTok Shop, YouTube Shopping, Instagram Shopping (global)
- Taobao Live, Douyin (China - $60B+ market)
- Shopee Live, Lazada Live (Southeast Asia)
- **No competitor in Algeria** = first mover advantage

---

**END OF SPECIFICATION**

**Ready to build.** 🚀
