Sells & Prefunds DB

Simple, production-ready skeleton app for managing customers, sales, receipts, and basic reports. Built with Express, MongoDB (Mongoose), Socket.io, and a vanilla JS + Tailwind front-end.

Quick Start

- Requirements: Node 18+, MongoDB running locally (default `mongodb://localhost:27017`).
- Steps:
  1. Copy `.env.example` to `.env` and adjust if needed. Do not commit real credentials.
  2. Install deps: `npm install`
  3. Seed DB: `npm run seed`
  4. Start server: `npm start`
  5. Open http://localhost:3000

Credentials

- Admin: `admin` / `Admin123!`

What’s Included

- Auth (JWT in httpOnly cookie)
  - POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/me`
- Users (admin only)
  - GET `/api/users`, POST `/api/users`, PATCH `/api/users/:id`, PATCH `/api/users/:id/password`, PATCH `/api/users/:id/block`, DELETE `/api/users/:id`
- Customers
  - GET `/api/customers?search=&category=&page=&limit=`
  - GET `/api/customers/:id`
  - POST `/api/customers`
  - PATCH `/api/customers/:id`
  - DELETE `/api/customers/:id`
- Transactions
  - GET `/api/customers/:id/transactions?from=&to=&type=`
  - POST `/api/customers/:id/transactions` body: `{ type, amount, date, description }`
  - DELETE `/api/transactions/:id`
- Stats / Reports
  - GET `/api/stats/overview`
  - GET `/api/stats/sales-trend?range=7|30`
  - GET `/api/reports/export?type=customers|sales|profitloss&from=&to=` (CSV)
  - POST `/api/reports/import?type=customers|sales` body: `{ csv: <string> }`
- Realtime (Socket.io) namespace `/realtime`
  - Emits: `customer:created|updated|deleted`, `transaction:created|deleted`, `stats:updated`

Roles

- `viewer`: read-only
- `manager`: manage customers/transactions
- `admin`: manage users and everything

Frontend

- Served from Express static at `client/` (same origin).
- Pages: `/login.html` and `/` (dashboard + nav).
- Sections: Dashboard, Customers, Reports, Profile, Admin (admins only).
- Vanilla JS modules with fetch API and Socket.io.

Notes

- Cookie is `httpOnly`, `sameSite=lax`; `secure` only in production. "Remember me" issues a persistent cookie (7 days); otherwise it is a session cookie.
- Simple rate limiting on `/api/auth/*`.
- Customer `balance` is maintained as sum(sales) - sum(receipts).
- Profit (very basic): `receipts - sales`.

Development Tips

- Adjust `MONGO_URI` in `.env` if not default.
- Tailwind is via CDN; no build step.
- If you want to enable CORS (e.g. serve client elsewhere), add `cors()` to the Express app and set proper cookie options.
