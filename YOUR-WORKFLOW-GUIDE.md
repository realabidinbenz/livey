# Your Livey MVP Development Workflow Guide
## (For Non-Developers Working with Claude)

Hey! This guide will walk you through **exactly** how to work with me to build your Livey MVP, step by step. Think of this as your roadmap. No tech jargon, just clear actions.

---

## 🎯 The Big Picture: What We're Doing

We're building Livey in **phases**, like building a house:
1. **Foundation** (Planning & Setup) ← You are here
2. **Backend** (The engine that makes everything work)
3. **Frontend** (What people see and click)
4. **Connect Them** (Make them talk to each other)
5. **Deploy** (Put it on the internet)
6. **Test & Fix** (Make sure it works)

Each phase has clear steps, and I'll guide you through every single one.

---

## 📋 PHASE 0: Before We Write Any Code (TODAY)

### Step 1: Sign Up for These Services (15 minutes)

You'll need accounts on these platforms. Don't worry about setting them up perfectly—just create accounts:

| Service | Why You Need It | Sign Up Link | What to Do After |
|---------|----------------|--------------|------------------|
| **GitHub** | Stores your code safely | https://github.com/signup | 1. Verify your email<br>2. Choose the free plan<br>3. Tell me your username |
| **Vercel** | Hosts your website for free | https://vercel.com/signup | Sign up with your GitHub account (it connects automatically) |
| **Supabase** | Your database (stores products, orders, etc.) | https://supabase.com | Sign up with GitHub—it's free for MVPs |
| **Google Cloud Console** | For Google Sheets integration | https://console.cloud.google.com | Sign up with your Gmail (we'll set this up later together) |

**Action for you:** Create these 4 accounts. Once done, tell me "Accounts created!" and share your GitHub username.

---

### Step 2: Connect Claude to Your Tools (10 minutes)

I'm already connected to some tools, but let's make sure everything's ready:

✅ **Already Connected:**
- Vercel MCP (I can deploy your app, check logs, manage domains)
- GitHub (I can create repos, push code, manage PRs)

**Action for you:** Just confirm you see "GitHub Actions setup complete!" above (you do! ✅)

---

### Step 3: Create Your GitHub Repository (I'll do this with you)

We're going to use **one repository** (called a "monorepo") that holds everything. This is simpler than juggling multiple repos.

**What I'll create:**
```
livey/
├── backend/          ← The brain (Node.js, API, database)
├── frontend/         ← The face (React, what customers see)
├── README.md         ← Project overview
└── .gitignore        ← Tells Git what NOT to save
```

**Why one repo?** Based on current best practices, a [monorepo keeps your frontend and backend in sync](https://www.highlight.io/blog/keeping-your-frontend-and-backend-in-sync-with-a-monorepo), makes deployment simpler, and is perfect for small teams (or just you + Claude).

**Action for you:** Just say "Create the repo!" and I'll set it up.

---

## 🏗️ PHASE 1: Building Order (The Workflow You Asked For!)

Based on [current MVP development best practices](https://www.weweb.io/blog/mvp-development-complete-guide-from-idea-to-launch), here's the order we'll build Livey:

### Week 1: Spec & Backend Foundation
**Why backend first?** [Building the backend first establishes a robust foundation](https://www.linkedin.com/pulse/benefits-building-backend-first-vice-versa-austin-stewart) for data storage, business logic, and security. For your MVP, we need the "order flow" working ASAP, and that lives in the backend.

**What we'll build:**
1. ✅ **Finalize the spec** (we already have it—your `livey-mvp-spec.md`)
2. **Set up the backend skeleton:**
   - Database schema (products, orders, users, live sessions)
   - API endpoints (the "connectors" between frontend and database)
   - Google Sheets integration (OAuth + writing orders)
3. **Test the backend** (I'll write tests so we know it works)

**How we work together:**
- **You tell me:** "Start the backend skeleton"
- **I do:** Set up folders, install tools, write the code
- **You do:** Test it by telling me "Create a test order" and I'll show you it landing in a Google Sheet

---

### Week 2: Frontend (The Pretty Part)
**Why after backend?** [Frontend-first allows faster releases](https://xbsoftware.com/blog/front-end-or-back-end-development/), but for YOUR MVP, the backend IS the product (orders flowing to Sheets). We need that solid first. Now we build what customers see.

**What we'll build:**
1. **The embed widget** (video player + chat + product card)
2. **Seller dashboard** (add products, start live, see orders)
3. **Order form** (the 4 fields: name, phone, address, quantity)

**How we work together:**
- **You tell me:** "Let's build the widget" or "Show me the seller dashboard"
- **I do:** Build it piece by piece, showing you screenshots as I go
- **You do:** Look at it in your browser and tell me "move this button" or "make that bigger"

---

### Week 3: Connect, Deploy, Polish
**What we'll do:**
1. Connect frontend to backend (make the buttons actually work)
2. Deploy to Vercel (put it on a real URL like `livey-mvp.vercel.app`)
3. Test with real YouTube live stream
4. Fix bugs you find

**How we work together:**
- **You:** Click around like a customer would, tell me what breaks
- **I:** Fix it immediately
- **You:** Test again until it feels smooth

---

## 🤝 How to Work with Me (Claude) Effectively

### Daily Workflow (Once We Start Coding)

1. **Start your day:** Open Claude Code and say "What's next?" (I'll check our progress and suggest the next task)
2. **Give me tasks ONE AT A TIME:** Instead of "Build the whole dashboard," say "Add a login page"
3. **I'll show you what I'm doing:** I'll explain before I code, so you understand
4. **Test as we go:** After each feature, I'll ask you to test it
5. **End your day:** Say "Save progress" (I'll commit code to GitHub so nothing is lost)

### How to Talk to Me (Examples)

| ❌ Too Vague | ✅ Just Right |
|-------------|--------------|
| "Make it better" | "The order button is too small on mobile—make it bigger" |
| "Build the app" | "Create the product table in the database" |
| "It doesn't work" | "When I click 'Add Product,' nothing happens" |
| "Fix this" | "The video player doesn't show on iPhone—can you check?" |

### When You're Stuck

Just ask me:
- "Explain what you just did like I'm 10"
- "Show me what this file does"
- "What should I test now?"
- "Can we see this in the browser?"

---

## 📁 What Your Project Will Look Like (After Setup)

```
livey/  ← Your GitHub repo
│
├── backend/
│   ├── src/
│   │   ├── routes/          ← API endpoints (e.g., /api/orders)
│   │   ├── controllers/     ← Logic (what happens when you create an order)
│   │   ├── models/          ← Database structure (what an "order" looks like)
│   │   └── services/        ← Third-party stuff (Google Sheets, YouTube API)
│   ├── package.json         ← Backend dependencies (the tools backend needs)
│   └── .env                 ← Secrets (API keys, passwords—NOT committed to GitHub)
│
├── frontend/
│   ├── src/
│   │   ├── components/      ← Reusable UI pieces (buttons, forms)
│   │   ├── pages/           ← Full pages (dashboard, widget)
│   │   └── styles/          ← How it looks (colors, fonts)
│   ├── package.json         ← Frontend dependencies
│   └── public/              ← Images, icons
│
├── livey-mvp-spec.md        ← The master plan (what we're building)
├── YOUR-WORKFLOW-GUIDE.md   ← This file!
└── README.md                ← Project overview for GitHub
```

**You don't need to touch these files yourself**—just know they exist. I'll edit them.

---

## 🎬 Your Next 3 Actions (Right Now)

1. **Create accounts** (GitHub, Vercel, Supabase, Google Cloud—see Step 1 above)
2. **Tell me:** "Accounts created! My GitHub username is `yourname`"
3. **I'll create the repo and we'll start!**

---

## ❓ FAQ

**Q: What if I want to change something in the spec?**
A: Just tell me! Say "Actually, let's add a 5th field to the order form" and I'll update everything.

**Q: Can I see the code?**
A: Yes! Go to https://github.com/yourusername/livey and click around. But you don't need to read it—I've got that covered.

**Q: What if you make a mistake?**
A: I will (I'm not perfect). Just tell me "This isn't working" and show me the error. I'll fix it.

**Q: How do I test the app?**
A: I'll give you a URL (like `http://localhost:3000`) and you open it in your browser. Click buttons, fill forms, tell me what's weird.

**Q: What if I need to stop for a few days?**
A: No problem! Everything is saved in GitHub. When you come back, say "Catch me up" and I'll remind you where we left off.

---

## 📚 Sources & Further Reading

Based on these expert resources:
- [MVP Development: 2026 Guide From Idea to Launch](https://www.weweb.io/blog/mvp-development-complete-guide-from-idea-to-launch)
- [7 Steps to Build an MVP for Non-Technical Founders](https://doerz.tech/7-steps-to-build-mvp-for-non-technical-founders/)
- [Frontend vs Backend Development: What Comes First](https://xbsoftware.com/blog/front-end-or-back-end-development/)
- [The Benefits of Building a Backend First](https://www.linkedin.com/pulse/benefits-building-backend-first-vice-versa-austin-stewart)
- [GitHub Monorepo Best Practices](https://github.com/orgs/community/discussions/32069)
- [The power of the monorepo](https://www.highlight.io/blog/keeping-your-frontend-and-backend-in-sync-with-a-monorepo)

---

## ✨ Let's Build This!

You're ready. The workflow is clear. The tools are prepped.

**Your move:** Create those accounts and let's ship this MVP in 3 weeks.

*—Claude (Your Dev Partner)*
