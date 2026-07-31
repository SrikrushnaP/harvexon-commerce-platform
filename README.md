# Harvexon Commerce Platform (HCP)

Full-stack commerce platform for fresh produce & grocery delivery — admin dashboard, customer storefront, and order fulfillment with delivery tracking.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose, JWT
- **Frontend**: Angular 20, Nx monorepo, standalone components, signals
- **Tooling**: pnpm, tsx

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- MongoDB (local or Atlas)

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env   # adjust values if needed
pnpm install
pnpm run seed          # seeds demo data (users, products, orders, etc.)
pnpm dev               # starts on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
pnpm install
npx nx serve admin     # Admin dashboard → http://localhost:4200
npx nx serve customer  # Customer storefront → http://localhost:4300
```

## Demo Credentials (local dev only)

These are created by the seed script. **Do not use in production.**

| Role     | Email                | Password     |
|----------|----------------------|--------------|
| Admin    | admin@hrfressh.com   | admin123     |
| Customer | meena.r@gmail.com    | customer123  |

## Project Structure

```
├── backend/          # Express REST API
│   ├── src/
│   │   ├── modules/  # auth, catalog, order, customer, delivery, inventory, pricing, purchasing, analytics, settings, invoice
│   │   ├── common/   # middleware, utils, types
│   │   ├── config/   # env validation, constants
│   │   ├── database/ # MongoDB connection, base schema
│   │   └── scripts/  # seed data
│   └── .env.example
├── frontend/         # Nx monorepo
│   ├── apps/
│   │   ├── admin/    # Admin dashboard (port 4200)
│   │   └── customer/ # Customer storefront (port 4300)
│   └── libs/
│       └── shared/   # Shared data-access (API service, auth) & UI
└── docs/
```

## Features

- **Customer App** — Browse catalog, add to cart, checkout with address, track orders
- **Admin Dashboard** — Order lifecycle management (draft → confirmed → processing → packed → assigned → out for delivery → delivered), catalog CRUD, inventory tracking, customer CRM, delivery staff, purchasing/suppliers, pricing rules, business settings
- **Delivery** — Staff management, assignment, route tracking
- **Invoices** — PDF generation
- **Auth** — JWT with refresh tokens, role-based access (super_admin, admin, manager, staff, customer)

## API

Backend runs on `http://localhost:3001/api`. Key endpoints:

- `POST /api/auth/login` — Login
- `GET /api/catalog/products` — Product listing
- `POST /api/orders` — Place order
- `PATCH /api/orders/:id/status` — Update order status (admin)
- `GET /api/analytics/dashboard` — Dashboard stats

## License

Private — All rights reserved.
