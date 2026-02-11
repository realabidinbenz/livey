# Known Issues & TODOs

This file tracks bugs, edge cases, and future improvements.

---

## 🐛 BUGS (Need to Fix)

_None yet (no code written)._

---

## ⚠️ EDGE CASES TO HANDLE

### Orders
- [ ] Customer submits order form twice rapidly (duplicate orders)
  - **Solution:** Disable submit button after first click
- [ ] Product deleted while customer has order form open
  - **Solution:** Order stores product snapshot (name, price), still succeeds
- [ ] Stock overselling (2 orders for last item)
  - **Decision:** Allowed for MVP, seller handles manually

### Google Sheets
- [ ] Sheets API quota exceeded (100 requests/100 seconds)
  - **Solution:** Batch writes (queue orders, write every 10 seconds)
- [ ] Seller deletes spreadsheet (we keep writing to 404)
  - **Solution:** Catch 404 error, show "reconnect Sheet" message in dashboard
- [ ] OAuth token expires (after 6 months of no use)
  - **Solution:** Refresh token flow, fallback to "reconnect" prompt

### YouTube Integration
- [ ] Seller pastes invalid YouTube URL
  - **Solution:** Validate URL before creating session (YouTube Data API)
- [ ] Stream interrupted (internet drops)
  - **Solution:** YouTube player shows "offline", widget stays visible
- [ ] Stream ends but widget doesn't switch to replay
  - **Solution:** Listen to YouTube IFrame onStateChange event

### Chat
- [ ] Chat messages lag > 5 seconds (Supabase Realtime slow)
  - **Solution:** Fallback to polling (every 3 seconds) if Realtime fails
- [ ] Customer sends 100 messages in 10 seconds (spam)
  - **Solution:** Rate limit (max 5 messages/minute per customer)
- [ ] Old messages bloat database (10,000+ messages per session)
  - **Solution:** Keep only last 100 messages (nightly cleanup job)

---

## 📝 TODOS (Future Improvements)

### Phase 1 (Foundation)
_See `docs/tasks/phase1.md` for detailed checklist._

### Phase 2 (Google Sheets Integration)
- [ ] OAuth flow (connect Google account)
- [ ] Append to Sheet (with proper columns)
- [ ] Retry logic (exponential backoff)
- [ ] Dashboard shows sync status ("3 orders pending sync")

### Phase 3 (Live Sessions)
- [ ] YouTube URL validation
- [ ] Session creation (start live)
- [ ] Session end (transition to replay)
- [ ] Product pinning (real-time updates)

### Phase 4 (Widget)
- [ ] Embeddable JavaScript file (widget.js)
- [ ] YouTube player integration
- [ ] Product card overlay
- [ ] Chat panel (real-time)
- [ ] Order form (validation, submit)

### Phase 5 (Dashboard)
- [ ] Login/signup pages
- [ ] Products CRUD UI
- [ ] Go Live page (paste YouTube URL)
- [ ] Orders table (paginated)
- [ ] Settings (Sheets connection, embed code)

### Phase 6 (Control Panel)
- [ ] Mobile layout (vertical)
- [ ] Product grid (tap to pin)
- [ ] Chat moderation (delete button)
- [ ] Order notifications (toast)
- [ ] End Live button

### Phase 7 (Testing)
- [ ] Manual testing checklist (60+ items)
- [ ] Performance testing (10k orders, slow queries)
- [ ] Security testing (data isolation, XSS, SQL injection)

### Phase 8 (Launch)
- [ ] Invite 3-5 beta testers
- [ ] Monitor logs daily
- [ ] Fix bugs as reported
- [ ] Gather feedback

---

## 🔮 FUTURE FEATURES (Post-MVP)

_Not in MVP, but might add later based on user feedback._

- [ ] Analytics dashboard (conversion rates, revenue per replay)
- [ ] Email notifications (order confirmations)
- [ ] SMS notifications (via Twilio)
- [ ] Product timestamps in replay (jump to specific product demo)
- [ ] Wilaya/Commune dropdown (replace free-text address)
- [ ] Multi-language support (Arabic UI)
- [ ] Moderator role (invite helper to manage chat)
- [ ] Subscription billing (Chargily integration)
- [ ] Export orders to CSV
- [ ] Inventory sync with Shopify

---

## 🚨 CRITICAL ISSUES (Block Launch)

_None yet._

---

**Last Updated:** 2026-02-11
