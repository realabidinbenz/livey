# Livey Backend

Node.js + Express API for Livey MVP

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in your Supabase credentials:

```env
SUPABASE_URL=https://mbrilepioeqvwqxplape.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get keys from:** [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API

### 3. Create Database Tables

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/mbrilepioeqvwqxplape/sql)
2. Copy contents of `supabase-schema.sql`
3. Paste and run

This creates:
- ✅ 7 tables (profiles, products, live_sessions, session_products, orders, chat_messages, google_sheets_connections)
- ✅ Row Level Security (RLS) policies on all tables
- ✅ Indexes for performance
- ✅ Triggers for auto-generating order numbers

### 4. Run Server

```bash
npm run dev
```

Server starts on http://localhost:3001

Test health check: http://localhost:3001/health

## Project Structure

```
backend/
├── src/
│   ├── index.js               # Express app setup
│   ├── config/
│   │   └── supabase.js        # Supabase client
│   ├── routes/                # API routes
│   │   ├── auth.routes.js
│   │   ├── products.routes.js
│   │   └── orders.routes.js
│   ├── controllers/           # Business logic
│   │   ├── auth.controller.js
│   │   ├── products.controller.js
│   │   └── orders.controller.js
│   ├── middleware/            # Middleware functions
│   │   ├── logging.middleware.js
│   │   ├── error.middleware.js
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── services/              # Third-party integrations
│   │   ├── sheets.service.js
│   │   └── youtube.service.js
│   └── utils/                 # Helper functions
│       └── logger.js
├── tests/                     # Unit tests
├── package.json
├── .env                       # Environment variables (NOT committed)
├── .env.example               # Template
└── supabase-schema.sql        # Database schema
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Coming Next)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Products (Coming Next)
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Orders (Coming Next)
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`

## Development

### Running Tests

```bash
npm test
```

### Code Style

- ES6 modules (`import`/`export`)
- Files < 800 lines (break into smaller modules)
- Logging for all critical actions
- RLS on all database tables

## Logging

All API requests and errors are logged to console (visible in Vercel logs).

Example log:
```json
{
  "level": "INFO",
  "timestamp": "2026-02-11T12:00:00.000Z",
  "message": "API request",
  "method": "POST",
  "path": "/api/orders",
  "status": 201,
  "duration": "45ms",
  "userId": "abc-123"
}
```

## Deployment

Deploys automatically to Vercel on push to `main` branch.

Vercel configuration in root `vercel.json`.
