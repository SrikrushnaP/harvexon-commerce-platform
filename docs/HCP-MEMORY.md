# HCP — Project Memory

> Last updated: 2026-07-27

## Status: Phase 2 ✅ Complete

## Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Backend language | TypeScript | Type safety, team familiarity |
| Backend framework | Express | Lightweight, flexible |
| Database | MongoDB + Mongoose | Flexible schema, fast iteration |
| Validation | Zod | TypeScript-first, composable |
| Auth | JWT (access + refresh) | Stateless, mobile-friendly |
| Frontend | Angular 20 | Signals, standalone components |
| Monorepo | Nx 21 | Code sharing, task orchestration |
| Package manager | pnpm | Fast, disk-efficient |
| Port (backend) | 3001 | 3000 was in use |
| Port (admin) | 4200 | Angular default |
| Port (customer) | 4300 | Separate from admin |
| Architecture | Modular monolith | Simple to start, split later |
| Pricing | Layered (customer > slab > group > base) | Flexible per-business rules |
| Inventory | Transaction-based (no stored stock field) | Auditability, accuracy |
| Soft delete | isActive flag via baseSchemaPlugin | Data preservation |
| Image upload | Multer + disk storage | Simple, local files |
| PDF generation | pdfkit | Lightweight, no deps |
| Cart storage | Angular signals + localStorage | Offline-capable |

## Phase 2 Completed

### Admin Portal (all CRUD UIs)
- **Catalog** — Product list/create/edit, categories, units (search, filters, pagination)
- **Customers** — List, detail (with addresses + order history), create/edit, customer groups
- **Orders** — List with status/date filters, detail view with full status workflow transitions
- **Inventory** — Stock report (low stock alerts), transaction history, manual adjustments
- **Purchasing** — Suppliers CRUD, purchase orders (create, status workflow, receive)
- **Delivery** — Staff management (availability toggle), assignment tracking (status updates)
- **Settings** — 5 tabs (General, Order Settings, Invoice, Pricing Rules, Notifications)
- **Dashboard** — Live analytics from API (stats, status breakdown, recent orders)

### Backend Enhancements
- **Image Upload** — POST /api/upload/image, /images, DELETE. Multer, 5MB, jpeg/png/webp only
- **Analytics** — GET /api/analytics/dashboard (today/week/month stats, top products, revenue by day)
- **PDF Invoice** — GET /api/invoice/:orderId streams PDF (pdfkit, full invoice layout)

### Customer PWA
- **Auth** — Login + Registration pages
- **Cart** — CartService (signals + localStorage), cart page with qty controls
- **Checkout** — Address selection, payment method, place order
- **Order Tracking** — Order history list + detail with status timeline
- **Profile** — User info, saved addresses, logout
- **Catalog/Product** — Updated with Add to Cart buttons

### Delivery Driver
- **Dashboard** — Active assignments, availability toggle, auto-refresh
- **Task View** — Order detail, status actions (pick up → deliver), Google Maps link, failure handling

## Modules Completed

1. **Auth** — Register, login, JWT, role-based access
2. **Settings** — Business profile, order config, branding
3. **Catalog** — Products, categories, units, brands
4. **Customer** — Customer groups, customers, addresses
5. **Pricing** — Price rules, layered resolution
6. **Order** — Full lifecycle (draft → delivered/cancelled)
7. **Inventory** — Transaction-based stock tracking
8. **Purchasing** — Suppliers, purchase orders, auto stock-in
9. **Delivery** — Staff, assignments, order integration
10. **Frontend** — Nx monorepo, Admin Portal, Customer PWA

## Cross-Module Integrations

- Order → Pricing (auto-resolves price at creation)
- Order → Settings (delivery charge, free delivery threshold)
- Order → Customer (stats update on delivery)
- Purchase → Inventory (auto stock-in on received)
- Purchase → Supplier (stats update)
- Delivery → Order (status sync: assigned/out_for_delivery/delivered)
- Delivery → Staff (completedDeliveries counter)

## Key Files

- Backend entry: `backend/src/server.ts`
- App setup: `backend/src/app.ts`
- Constants: `backend/src/config/constants.ts`
- Base schema: `backend/src/database/baseSchema.ts`
- Testing doc: `docs/TESTING-AND-ROADMAP.md`

## Database

- Name: `hcp_dev`
- URI: `mongodb://localhost:27017/hcp_dev`
- Seeded admin: `admin@hrfressh.com` / `admin123` (super_admin)

## Known Issues

- Multer 1.x deprecated warning (upgrade to 2.x in Phase 2)
- No file upload implemented yet (placeholder for images)
- Frontend pages are stubs (except login, dashboard, catalog browse)
