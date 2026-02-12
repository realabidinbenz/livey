# Phase 2 Manual Testing Guide

**For:** Non-technical users learning to test their product  
**Tools Needed:** Web browser (Chrome/Firefox), Postman (free app), your Google account, text editor (like Notepad)  
**Time Required:** 60-90 minutes (including setup)  
**Prerequisites:** None - this guide covers everything!

---

## PART 0: Setup Your Environment (Do This First!)

Don't skip this section! You need to set up your testing environment before you can run any tests.

### Step 1: Install Required Software

**1. Install Node.js (Backend Runtime)**
1. Go to https://nodejs.org/
2. Click the big green "LTS" button (Recommended for most users)
3. Download and run the installer
4. Click "Next" through all the steps (keep default settings)
5. **Verify installation:** Open Command Prompt (Windows key + R, type "cmd", press Enter)
6. Type: `node --version`
7. You should see something like: `v20.11.0` (any version 18+ works)

**2. Install Git (Version Control)**
1. Go to https://git-scm.com/downloads
2. Click "Windows" (or your operating system)
3. Download and run the installer
4. Accept all default settings (just click "Next" repeatedly)
5. **Verify installation:** In Command Prompt, type: `git --version`
6. You should see something like: `git version 2.43.0`

**3. Install Postman (API Testing Tool)**
1. Go to https://www.postman.com/downloads/
2. Download and install the free version
3. Create a free account when it asks (or skip)
4. **You'll use this for ALL testing!**

**4. Install VS Code (Text Editor) - Optional but Recommended**
1. Go to https://code.visualstudio.com/
2. Download and install
3. This makes editing files much easier than Notepad

---

### Step 2: Download the Project Files

**1. Create a folder for your project:**
1. Open File Explorer
2. Go to your Documents folder
3. Right-click → New → Folder
4. Name it: `Livey-Testing`

**2. Download the code from GitHub:**
1. Open Command Prompt
2. Navigate to your folder:
   ```
   cd Documents\Livey-Testing
   ```
3. Clone the repository:
   ```
   git clone https://github.com/realabidinbenz/livey.git
   ```
4. **Wait for it to finish** (you'll see progress messages)
5. You should now have a `livey` folder inside `Livey-Testing`

---

### Step 3: Set Up Environment Variables

**1. Create the environment file:**
1. Open File Explorer
2. Navigate to: `Documents\Livey-Testing\livey\backend`
3. Right-click in the folder → New → Text Document
4. Name it: `.env` (yes, just ".env" - if Windows says "change extension?" click Yes)

**2. Edit the .env file:**
1. Right-click the `.env` file → Open with → Notepad (or VS Code)
2. Copy and paste this entire block:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase (Database)
SUPABASE_URL=https://mbrilepioeqvwqxplape.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth (Google Sheets Integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/sheets/callback

# Encryption (For securing tokens)
ENCRYPTION_KEY=your-32-char-encryption-key-here!!

# Cron Secret (For background jobs)
CRON_SECRET=your-cron-secret-for-testing

# CORS (Allowed websites)
WIDGET_ORIGINS=http://localhost:5174,https://your-widget-domain.com
```

**3. Fill in the real values:**

You need to get real values for these placeholders. Here's how:

**For Supabase (Database):**
Since you're testing, you have two options:

**Option A: Use the existing Supabase project (if you have access)**
Ask the project owner for:
- SUPABASE_SERVICE_KEY
- SUPABASE_ANON_KEY

**Option B: Create your own free Supabase project (Recommended for full control)**
1. Go to https://supabase.com/
2. Click "Start your project" and sign up (free)
3. Click "New Project"
4. Fill in:
   - Name: `livey-test`
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to you (e.g., `Central EU`)
5. Click "Create new project" and wait (takes 2-3 minutes)
6. Once created, click the "Connect" button
7. Click "Node.js" 
8. Copy these values:
   - `SUPABASE_URL` = the URL value
   - `SUPABASE_ANON_KEY` = the `anon public` key
9. Go to Project Settings (gear icon) → API
10. Copy the `service_role secret` → this is your `SUPABASE_SERVICE_KEY`

**For Google OAuth (to test Google Sheets):**
You need a Google Cloud project:
1. Go to https://console.cloud.google.com/
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Project name: `Livey Testing`
5. Click "Create"
6. Wait for it to create, then select the project
7. Click the "hamburger menu" (☰) → "APIs & Services" → "OAuth consent screen"
8. Click "External" → "Create"
9. Fill in:
   - App name: `Livey Test App`
   - User support email: your email
   - Developer contact: your email
10. Click "Save and Continue" 3 times
11. Click "Back to Dashboard"
12. Click "Publish App" → "Confirm"
13. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
14. Application type: `Web application`
15. Name: `Livey Web Client`
16. Under "Authorized redirect URIs" click "Add URI"
17. Add: `http://localhost:3001/api/sheets/callback`
18. Click "Create"
19. **Copy the Client ID and Client Secret** (you'll only see the secret once!)
20. Paste them into your `.env` file
21. Also enable Google Sheets API:
    - Go to "Library" in the left menu
    - Search for "Google Sheets API"
    - Click it → "Enable"

**For Encryption Key:**
Generate a random 32-character string:
1. Go to https://passwordsgenerator.net/
2. Length: 32
3. Uncheck all boxes except "Include Numbers"
4. Click "Generate Password"
5. Copy it and paste as `ENCRYPTION_KEY`

**For CRON_SECRET:**
Create any random password (for testing security of background jobs):
Example: `test-cron-secret-12345`

**4. Save the .env file:**
- Press Ctrl+S (or File → Save)
- Close Notepad

---

### Step 4: Set Up the Database Tables

You need to create tables in Supabase for the app to work.

**1. Go to Supabase Dashboard:**
1. Open https://supabase.com/dashboard
2. Sign in and select your project
3. Click "Table Editor" in the left menu

**2. Run the migration SQL:**
You need to create the database schema. Here's the easiest way:

**Option A: Use the SQL Editor (Recommended)**
1. In Supabase, click "SQL Editor" in the left menu
2. Click "New query"
3. Copy this entire SQL block and paste it:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'delivered', 'cancelled');
CREATE TYPE session_status AS ENUM ('live', 'ended', 'replay');

-- 1. Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  store_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  stock INTEGER,
  description TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Live sessions table
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  status session_status DEFAULT 'live',
  embed_code TEXT NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Session products (many-to-many)
CREATE TABLE session_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

-- 5. Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  session_id UUID REFERENCES live_sessions(id),
  order_number TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status order_status DEFAULT 'pending',
  google_sheets_synced BOOLEAN DEFAULT FALSE,
  google_sheets_row_number INTEGER,
  sync_retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_seller BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Google Sheets connections table
CREATE TABLE google_sheets_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_url TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- Create indexes for performance
CREATE INDEX idx_products_seller ON products(seller_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at DESC);
CREATE INDEX idx_live_sessions_seller ON live_sessions(seller_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_session_products_session ON session_products(session_id);
CREATE INDEX idx_session_products_product ON session_products(product_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_sheets_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can only access their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Sellers can only see their own products"
  ON products FOR ALL
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can only see their own sessions"
  ON live_sessions FOR ALL
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can only see session products for their sessions"
  ON session_products FOR ALL
  USING (session_id IN (
    SELECT id FROM live_sessions WHERE seller_id = auth.uid()
  ));

CREATE POLICY "Sellers can only see their own orders"
  ON orders FOR ALL
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can only see chat for their sessions"
  ON chat_messages FOR ALL
  USING (session_id IN (
    SELECT id FROM live_sessions WHERE seller_id = auth.uid()
  ));

CREATE POLICY "Sellers can only see their own sheet connections"
  ON google_sheets_connections FOR ALL
  USING (seller_id = auth.uid());
```

4. Click "Run" (top right)
5. Wait for it to complete (should say "Success" with checkmarks)

---

### Step 5: Install Dependencies and Start the Server

**1. Open Command Prompt:**
1. Press Windows key + R
2. Type: `cmd`
3. Press Enter

**2. Navigate to the backend folder:**
```
cd Documents\Livey-Testing\livey\backend
```

**3. Install dependencies (this takes 2-5 minutes):**
```
npm install
```

You'll see lots of progress bars and text. Wait until you see:
```
added XXX packages in XXs
```

**4. Start the server:**
```
npm run dev
```

**You should see:**
```
🚀 Livey Backend running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

**5. Test that it's working:**
1. Open your web browser
2. Go to: http://localhost:3001/health
3. You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "livey-backend",
  "version": "1.0.0"
}
```

**🎉 Great! Your backend is running!**

**Important:** Keep the Command Prompt window open! The server runs in this window. If you close it, the server stops.

---

### Step 6: Create Test Seller Accounts (Seller A and Seller B)

Now you need to create two test accounts so you can test data isolation.

**1. Open Postman**

**2. Create Seller A:**

   a. **Create a new request:**
      - Click the "+" tab
      - Name it: "Signup - Seller A"
   
   b. **Set up the request:**
      - Method: `POST`
      - URL: `http://localhost:3001/api/auth/signup`
   
   c. **Add the request body:**
      - Click "Body" tab
      - Select "raw"
      - Change to "JSON"
      - Paste this:
      ```json
      {
        "email": "test-seller-a@example.com",
        "password": "TestSellerA123!"
      }
      ```
   
   d. **Send the request:**
      - Click the blue "Send" button
   
   e. **Expected result:**
      ```json
      {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
          "id": "some-uuid-here",
          "email": "test-seller-a@example.com"
        }
      }
      ```
   
   f. **Save the token!**
      - Copy the "token" value (long string)
      - Open Notepad
      - Paste it and label it: `TOKEN A`
      - Save this file as `test-credentials.txt`

**3. Create Seller B:**

   a. **Duplicate the request:**
      - Right-click "Signup - Seller A" → "Duplicate"
      - Rename to: "Signup - Seller B"
   
   b. **Change the body:**
      ```json
      {
        "email": "test-seller-b@example.com",
        "password": "TestSellerB123!"
      }
      ```
   
   c. **Send the request**
   
   d. **Save the token** as `TOKEN B` in your text file

**4. Verify both sellers exist (optional but recommended):**

   Try to signup Seller A again:
   - Send the same "Signup - Seller A" request again
   - You should get an error: "User already registered"
   - This confirms the account was created!

---

### Step 7: Create Your Testing Checklist Document

Create a document to track all your test data. Open Notepad and save as `phase2-test-data.txt`:

```
=== PHASE 2 TEST DATA ===
Date: ___________

=== SELLER ACCOUNTS ===
Seller A Email: test-seller-a@example.com
Seller A Password: TestSellerA123!
Seller A Token: (paste from Step 6)

Seller B Email: test-seller-b@example.com  
Seller B Password: TestSellerB123!
Seller B Token: (paste from Step 6)

=== PRODUCTS ===
Product A ID: (fill in after Test 2 Step 1)
Product B ID: (fill in after Test 5 Step 6)

=== ORDERS ===
Order A ID: (fill in after Test 2 Step 2)
Order B ID: (fill in after Test 5 Step 8)

=== GOOGLE SHEETS ===
Spreadsheet URL: (fill in after Test 1 Step 5)
Google Account: ___________

=== TEST RESULTS ===
Test 1 - OAuth Flow: [ ] PASS [ ] FAIL
Test 2 - Order Sync: [ ] PASS [ ] FAIL
Test 3 - Retry Logic: [ ] PASS [ ] FAIL
Test 4 - Disconnect: [ ] PASS [ ] FAIL
Test 5 - Data Isolation: [ ] PASS [ ] FAIL
```

You'll fill this in as you go through the tests!

---

## Before You Start (The Actual Testing!)

### Your Backend URL

Since you're running locally:
- **Base URL:** `http://localhost:3001`
- **Server must be running** (that Command Prompt window from Step 5 should still be open)

### Quick Check Before Testing

1. **Is the server running?**
   - Look at your Command Prompt window
   - Do you see the "Livey Backend running" message?
   - If not, go back to Step 5 and start it again

2. **Do you have your tokens?**
   - Open your `test-credentials.txt` file
   - You should have Token A and Token B saved

3. **Is Postman ready?**
   - Open Postman
   - You should see your "Signup - Seller A" and "Signup - Seller B" requests

---

## Your Testing Begins Here! 🎉

You've completed the setup. Now you can run the actual tests below!

**Important Tips:**
- **Keep the server running** (don't close that Command Prompt window!)
- **Save everything** - tokens, IDs, URLs - you'll need them
- **Go slow** - read each step completely before doing it
- **If something fails** - check the "Troubleshooting" section at the end

---

---

## Test 1: OAuth Flow with Real Google Account

**What we're testing:** Connecting your Google account to automatically save orders to Google Sheets.

### Step 1: Get a Login Token

1. **Open Postman**
2. **Create a new request:**
   - Click the "+" tab to create a new request
   - Name it "Login - Seller A"
   
3. **Set up the request:**
   - Method: `POST` (select from dropdown)
   - URL: `YOUR_BACKEND_URL/api/auth/login`
   - Example: `http://localhost:3001/api/auth/login`
   
4. **Add the request body:**
   - Click the "Body" tab
   - Select "raw" option
   - Change dropdown from "Text" to "JSON"
   - Paste this:
   ```json
   {
     "email": "test-seller-a@example.com",
     "password": "your-password-here"
   }
   ```
   
5. **Send the request:**
   - Click the blue "Send" button
   - You should see a response with a "token" field
   - **Copy the token** (long string of letters/numbers)
   - Save it somewhere - you'll need it for all other requests

**Expected Result:** 
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "test-seller-a@example.com"
  }
}
```

### Step 2: Start Google Sheets Connection

1. **Create a new request in Postman:**
   - Name: "Connect Google Sheets"
   - Method: `POST`
   - URL: `YOUR_BACKEND_URL/api/sheets/connect`
   
2. **Add authentication:**
   - Click the "Headers" tab
   - Add a new header:
     - Key: `Authorization`
     - Value: `Bearer YOUR_TOKEN_HERE` (paste the token from Step 1)
     
3. **Send the request:**
   - Click "Send"
   - You should get a response with an "authUrl"

**Expected Result:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/auth?...",
  "state": "some-random-string"
}
```

### Step 3: Authorize in Browser

1. **Copy the authUrl** from the response
2. **Paste it in your browser** and press Enter
3. **Sign in with your Google account** if not already signed in
4. **Review the permissions:**
   - The app will ask for permission to create and edit Google Sheets
   - Click "Allow" or "Continue"
5. **You'll be redirected** to your frontend URL (or see a success message)

**What to check:**
- [ ] You saw the Google permissions screen
- [ ] You clicked "Allow"
- [ ] You were redirected back (or got a success message)

### Step 4: Verify Connection Status

1. **Back in Postman, create a new request:**
   - Name: "Check Sheets Status"
   - Method: `GET`
   - URL: `YOUR_BACKEND_URL/api/sheets/status`
   
2. **Add the same Authorization header** (Bearer token from Step 1)

3. **Send the request**

**Expected Result:**
```json
{
  "connected": true,
  "email": "your-google-email@gmail.com",
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "pendingSyncCount": 0
}
```

**✅ Test 1 PASSED if:** You see `"connected": true` and a `spreadsheetUrl`

### Step 5: View Your Google Sheet

1. **Copy the `spreadsheetUrl`** from the response
2. **Paste it in your browser**
3. **You should see a new Google Sheet** with:
   - Title: "Livey Orders - [Your Store Name]"
   - Header row with columns: Order ID, Date/Time, Customer Name, Phone, Full Address, Product Name, Price (DA), Quantity, Total (DA), Status
   - The header row should be frozen (stays visible when scrolling)

**Take a screenshot** of your empty sheet - you'll compare it later!

---

## Test 2: Verify Order Auto-Syncs to Sheet

**What we're testing:** When a customer places an order, it automatically appears in your Google Sheet.

### Step 1: Create a Product First

Before testing orders, you need a product to order:

1. **In Postman, create a new request:**
   - Name: "Create Product"
   - Method: `POST`
   - URL: `YOUR_BACKEND_URL/api/products`
   
2. **Add Authorization header** (same token)

3. **Add request body** (Body tab → raw → JSON):
   ```json
   {
     "name": "Test Product - iPhone Case",
     "price": 1500,
     "stock": 10,
     "description": "A protective case for iPhone"
   }
   ```

4. **Send and save the response:**
   - You should get back a product with an "id" field
   - **Copy the product ID** (looks like: `a1b2c3d4-e5f6-...`)

### Step 2: Create an Order

Now pretend you're a customer placing an order:

1. **Create a new request:**
   - Name: "Create Order"
   - Method: `POST`
   - URL: `YOUR_BACKEND_URL/api/orders`
   - **Note:** No Authorization header needed (this is a public endpoint)

2. **Add request body**:
   ```json
   {
     "product_id": "PASTE_PRODUCT_ID_HERE",
     "quantity": 2,
     "customer_name": "Ahmed Benali",
     "customer_phone": "0550123456",
     "customer_address": "123 Rue Didouche Mourad, Algiers"
   }
   ```

3. **Send the request**

**Expected Result:**
```json
{
  "order": {
    "id": "order-uuid-here",
    "order_number": "ORD-20250212-9f8e",
    "status": "pending",
    "total_price": 3000,
    "google_sheets_synced": true
  }
}
```

**Important:** Note the `google_sheets_synced: true` field!

### Step 3: Check Your Google Sheet

1. **Go back to your Google Sheet** in the browser (refresh the page)
2. **Look for a new row** with the order details

**What you should see:**
| Order ID | Date/Time | Customer Name | Phone | Full Address | Product Name | Price (DA) | Quantity | Total (DA) | Status |
|----------|-----------|---------------|-------|--------------|--------------|------------|----------|------------|--------|
| ORD-20250212-9f8e | 2025-02-12 10:30:15 | Ahmed Benali | 0550123456 | 123 Rue Didouche Mourad, Algiers | Test Product - iPhone Case | 1500 | 2 | 3000 | Pending |

**✅ Test 2 PASSED if:** You see your order in the Google Sheet within 5 seconds!

### Troubleshooting

**If the order doesn't appear:**
- Check Postman response - was `google_sheets_synced: false`?
- Check Sheets status again - is it still connected?
- Check your Sheet URL - is it the same one?
- Wait 10 seconds and refresh - sometimes there's a slight delay

---

## Test 3: Verify Background Retry Processes Failed Orders

**What we're testing:** If Google Sheets fails temporarily, the system will automatically retry later.

### Step 1: Create a Disconnected Scenario

We need to simulate a failure. There are two ways:

**Option A: Delete Your Sheet (Recommended)**
1. Go to your Google Sheet
2. Click "File" → "Move to trash"
3. The sheet is now deleted (you can restore it later from trash)

**Option B: Disconnect from Backend**
1. In Postman, create request:
   - Method: `DELETE`
   - URL: `YOUR_BACKEND_URL/api/sheets/disconnect`
   - Add Authorization header
2. Send it

### Step 2: Create an Order While Disconnected

1. **Create another order** using the same steps as Test 2
2. **Check the response** - you should see:
   ```json
   {
     "order": {
       ...
       "google_sheets_synced": false,
       "sync_retry_count": 0
     }
   }
   ```

**Important:** The order is still saved! It just hasn't synced to Sheets yet.

### Step 3: Check Pending Sync Count

1. **Get Sheets status** (same request as before)
2. **Check the response**:
   ```json
   {
     "connected": false,  // or true if you deleted the Sheet
     "pendingSyncCount": 1  // This should be 1 or more!
   }
   ```

### Step 4: Fix the Connection

**If you deleted the Sheet:**
1. Go to Google Drive trash
2. Find your Sheet and restore it

**If you disconnected:**
1. Run through Test 1 again to reconnect

### Step 5: Trigger the Retry

The retry happens automatically every 5 minutes via a background job. To test it manually:

1. **Create a new request in Postman:**
   - Name: "Trigger Retry"
   - Method: `POST`
   - URL: `YOUR_BACKEND_URL/api/cron/sync-sheets`
   
2. **Add a special header:**
   - Key: `X-Cron-Secret`
   - Value: `your-cron-secret-here` (ask your developer for this)
   
3. **Send the request**

**Expected Result:**
```json
{
  "processed": 1,
  "successful": 1,
  "failed": 0
}
```

### Step 6: Verify Order Now Synced

1. **Check your Google Sheet** (refresh it)
2. **The failed order should now appear!**

**✅ Test 3 PASSED if:** The order that failed to sync initially now appears in your Sheet after retry

---

## Test 4: Verify Disconnect Revokes Token and Removes Connection

**What we're testing:** When you disconnect, the app properly revokes permissions from your Google account.

### Step 1: Verify You're Connected

1. **Get Sheets status** (you did this in Test 1, Step 4)
2. **Confirm you see:** `"connected": true`

### Step 2: Disconnect

1. **Create a new request in Postman:**
   - Name: "Disconnect Google Sheets"
   - Method: `DELETE`
   - URL: `YOUR_BACKEND_URL/api/sheets/disconnect`
   
2. **Add Authorization header**

3. **Send the request**

**Expected Result:**
```json
{
  "message": "Google Sheets disconnected successfully"
}
```

### Step 3: Verify Connection Removed

1. **Get Sheets status again**
2. **You should see:**
   ```json
   {
     "connected": false
   }
   ```

### Step 4: Check Google Account Permissions (Optional but Recommended)

1. **Go to https://myaccount.google.com/security**
2. **Click "Third-party apps with account access"**
3. **Look for your app** (might be called "Livey" or your app name)
4. **Verify it's been removed** or shows as disconnected

**✅ Test 4 PASSED if:**
- [ ] Status shows `"connected": false`
- [ ] New orders show `google_sheets_synced: false`
- [ ] (Optional) App no longer appears in Google permissions

### Step 5: Reconnect (Optional)

If you want to continue using Sheets, run through Test 1 again to reconnect.

---

## Test 5: Test with 2 Sellers (Data Isolation)

**What we're testing:** Seller A cannot see Seller B's data (products, orders, sessions). This is CRITICAL for security.

### Step 1: Login as Seller A

You should already be logged in as Seller A from previous tests. If not:

1. **Login request** (like Test 1, Step 1):
   - Email: `test-seller-a@example.com`
   - Save the token as "Token A"

### Step 2: Create Product as Seller A

1. **Create a product** (like Test 2, Step 1):
   - Name: "Product A - Only Seller A can see this"
   - Save the product ID as "Product A ID"

### Step 3: Login as Seller B

1. **Create a new login request:**
   - Name: "Login - Seller B"
   - Method: `POST`
   - URL: `YOUR_BACKEND_URL/api/auth/login`
   - Body:
   ```json
   {
     "email": "test-seller-b@example.com",
     "password": "password-for-seller-b"
   }
   ```

2. **Send and save token as "Token B"**

### Step 4: Try to Get Seller A's Product (as Seller B)

This should FAIL - Seller B should NOT see Seller A's product:

1. **Create a new request:**
   - Name: "Get Product A (as Seller B) - SHOULD FAIL"
   - Method: `GET`
   - URL: `YOUR_BACKEND_URL/api/products/PRODUCT_A_ID_HERE`
   
2. **Use Token B** in Authorization header

3. **Send the request**

**Expected Result:**
```json
{
  "error": {
    "message": "Product not found",
    "status": 404
  }
}
```

**✅ This is GOOD!** Seller B cannot see Seller A's product.

### Step 5: List Products as Seller B

1. **Create a request:**
   - Name: "List Products (Seller B)"
   - Method: `GET`
   - URL: `YOUR_BACKEND_URL/api/products`
   - Use Token B

2. **Send and check the response**

**Expected Result:** 
- Products array should be empty OR only show products created by Seller B
- Should NOT include "Product A - Only Seller A can see this"

### Step 6: Create Product as Seller B

1. **Create a product:**
   - Name: "Product B - Only Seller B can see this"
   - Save as "Product B ID"

### Step 7: Verify Seller A Cannot See Product B

1. **Create a request:**
   - Name: "Get Product B (as Seller A) - SHOULD FAIL"
   - Method: `GET`
   - URL: `YOUR_BACKEND_URL/api/products/PRODUCT_B_ID_HERE`
   - Use Token A

2. **Send**

**Expected Result:** 404 error (not found)

### Step 8: Create Orders for Both Sellers

**As Seller A:**
1. Create an order for Product A (public endpoint, no token needed)
2. Note the order ID

**As Seller B:**
1. Create an order for Product B (public endpoint, no token needed)
2. Note the order ID

### Step 9: List Orders and Verify Isolation

**As Seller A:**
1. **Create request:**
   - Method: `GET`
   - URL: `YOUR_BACKEND_URL/api/orders`
   - Use Token A
   
2. **Verify:** You only see orders for Product A, NOT Product B

**As Seller B:**
1. **Same request** but with Token B
2. **Verify:** You only see orders for Product B, NOT Product A

### Step 10: Try to Access Another Seller's Order Directly

**As Seller A, try to get Seller B's order:**
1. Method: `GET`
2. URL: `YOUR_BACKEND_URL/api/orders/ORDER_B_ID_HERE`
3. Use Token A

**Expected Result:** 404 error (not found)

**✅ Test 5 PASSED if:**
- [ ] Seller B gets 404 when trying to get Seller A's product
- [ ] Seller A gets 404 when trying to get Seller B's product
- [ ] Each seller only sees their own orders
- [ ] Product lists are isolated per seller

---

## Test Summary Checklist

After completing all tests, you should have:

**Test 1: OAuth Flow**
- [ ] Successfully logged in and got token
- [ ] Generated Google auth URL
- [ ] Authorized app in browser
- [ ] Status shows `"connected": true`
- [ ] Google Sheet was created and accessible

**Test 2: Order Auto-Sync**
- [ ] Created a product
- [ ] Created an order
- [ ] Order appeared in Google Sheet within 5 seconds
- [ ] `google_sheets_synced: true` in response

**Test 3: Background Retry**
- [ ] Disconnected or deleted Sheet
- [ ] Created order while disconnected (`synced: false`)
- [ ] Saw pending sync count > 0
- [ ] Fixed connection
- [ ] Triggered retry manually
- [ ] Order appeared in Sheet after retry

**Test 4: Disconnect**
- [ ] Successfully disconnected
- [ ] Status shows `"connected": false`
- [ ] New orders don't sync (`synced: false`)
- [ ] (Optional) App removed from Google permissions

**Test 5: Data Isolation (2 Sellers)**
- [ ] Seller B cannot see Seller A's products (404 error)
- [ ] Seller A cannot see Seller B's products (404 error)
- [ ] Orders are isolated per seller
- [ ] Cannot access another seller's order by ID

---

## Troubleshooting Common Issues

### "401 Unauthorized" Error
- Your token expired (tokens last 1 hour)
- Log in again to get a new token

### "404 Not Found" When Creating Order
- Check that `product_id` is correct
- Product might belong to a different seller
- Product might be deleted (soft deleted)

### Google Sheet Not Updating
- Check Sheets status - is it still connected?
- Verify you're looking at the right Sheet URL
- Check if the Sheet was deleted
- Look at backend logs for errors

### "Too Many Requests" Error
- You hit the rate limit
- Wait 15 minutes and try again
- Or use a different IP address

---

### Additional Setup Troubleshooting

### Server Won't Start (Step 5)
**Error: "Cannot find module"**
- You forgot to run `npm install`
- Go back to Step 5 and run it

**Error: "Port 3001 is already in use"**
- The server is already running somewhere else
- Check if you have another Command Prompt window open
- Or change the port in `.env` file to `PORT=3002`

**Error: "SUPABASE_URL is required"**
- Your `.env` file is missing or has wrong values
- Check Step 3 again
- Make sure the file is named exactly `.env` (not `env.txt` or `.env.txt`)

### Database Errors
**Error: "Table 'products' does not exist" or "relation does not exist"**
- You skipped Step 4 (database setup)
- Go back and run all the SQL in Supabase
- Refresh Supabase Table Editor to confirm tables exist

**"Failed to create session" or "Failed to create product"**
- Your database tables weren't created properly
- Go back to Step 4 and run the SQL again
- Make sure all tables show up in Supabase Table Editor

### Signup Problems
**Error: "User already registered" but you can't login**
- The user exists in Supabase Auth but not in the `profiles` table
- Go to Supabase → Authentication → Users
- Delete the user `test-seller-a@example.com`
- Signup again

**Signup succeeds but login fails**
- You might be using the wrong password
- Check your `test-credentials.txt` file
- Try signing up again with a different password

### Google OAuth Issues
**Error: "redirect_uri_mismatch"**
- Your Google OAuth settings have the wrong redirect URL
- Go to Google Cloud Console → APIs & Services → Credentials
- Click your OAuth client ID
- Make sure this exact URL is in "Authorized redirect URIs":
  - `http://localhost:3001/api/sheets/callback`
- Save and try again

**Error: "invalid_client"**
- Your GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is wrong
- Check your `.env` file
- Make sure you copied them exactly from Google Cloud Console

**"Google hasn't verified this app" warning**
- This is normal for testing!
- Click "Advanced" → "Go to [your-app] (unsafe)"
- Or wait for the OAuth consent screen to be approved by Google (takes days)

### CRON Secret Issues (Test 3)
**"Unauthorized" or "Invalid cron secret"**
- The secret is whatever you put in your `.env` file
- Open your `.env` file in Notepad
- Find the line: `CRON_SECRET=your-cron-secret-for-testing`
- Whatever is after the `=` is your secret
- Use that exact value in Postman
- Common mistake: Copying the example text instead of your actual secret

### Postman Connection Issues
**"Could not get any response"**
- Your server is not running
- Check that Command Prompt window is still open
- Try refreshing http://localhost:3001/health in your browser
- If that doesn't work, restart the server (Step 5)

**"Connection refused" or "Network error"**
- Server is not running OR wrong URL
- Double-check you're using: `http://localhost:3001`
- Make sure you included `http://` not just `localhost:3001`

### Forgot Your Tokens
**Lost your tokens or closed Postman?**
1. Create a new request: `POST http://localhost:3001/api/auth/login`
2. Body → raw → JSON:
   ```json
   {
     "email": "test-seller-a@example.com",
     "password": "TestSellerA123!"
   }
   ```
3. Send and copy the new token
4. Do the same for Seller B with their email/password

### Need to Start Over Completely
**If you want to wipe everything and start fresh:**

1. **Stop the server:** Close the Command Prompt window
2. **Delete test sellers:**
   - Go to Supabase → Authentication → Users
   - Find and delete: `test-seller-a@example.com` and `test-seller-b@example.com`
3. **Clear test data (optional):**
   - Go to Supabase → Table Editor
   - Delete all rows from tables: products, orders, live_sessions, google_sheets_connections
   - (Keep the tables themselves, just delete the data inside)
4. **Restart server:** Follow Step 5 again
5. **Recreate sellers:** Follow Step 6 again
6. **Start testing over** from Test 1

---

## Next Steps

Once all tests pass:
1. **🎉 Congratulations!** Phase 2 is working correctly!
2. **Save your Google Sheet URL** - you can reuse this Sheet in production
3. **Keep your test products/orders** - they're useful for Phase 3 testing
4. **Update your `docs/CONTEXT.md`** - mark Phase 2 tests as complete
5. **Move on to Phase 3** - Live Sessions testing (next guide)
6. **Keep the server running** - Phase 3 tests will use the same backend

### How to Stop the Server (When You're Done)

When you want to stop testing:
1. Go to your Command Prompt window (where the server is running)
2. Press `Ctrl + C` on your keyboard
3. It will ask "Terminate batch job?"
4. Type `Y` and press Enter
5. The server stops

### How to Restart Later

If you want to test again another day:
1. Open Command Prompt
2. Type: `cd Documents\Livey-Testing\livey\backend`
3. Type: `npm run dev`
4. Server is running again!
5. Your data is still saved in Supabase (unless you deleted it)

### Important Files to Save

Keep these files safe:
- `Documents\Livey-Testing\livey\backend\.env` - Has all your secrets
- `Documents\Livey-Testing\test-credentials.txt` - Has your tokens
- `Documents\Livey-Testing\phase2-test-data.txt` - Your test results

**Never share your .env file or tokens with anyone!**

---

## Glossary of Terms

| Term | Meaning |
|------|---------|
| **Token** | A temporary password that proves you're logged in |
| **OAuth** | A way to let apps access your Google account safely |
| **Endpoint** | A specific URL that does one thing (like /api/orders) |
| **JSON** | A format for organizing data (looks like `{ "key": "value" }`) |
| **UUID** | A unique ID that looks like `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| **Sync** | Copy data from one place to another automatically |
| **Retry** | Trying again when something fails |
| **Data Isolation** | Making sure users can't see each other's data |

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-12  
**For Phase:** Phase 2 - Google Sheets Integration
