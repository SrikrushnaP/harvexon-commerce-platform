# HCP — Harvexon Commerce Platform

## Quick Start

### Prerequisites
- Node.js 20+ (via nvm)
- MongoDB running locally on default port (27017)
- pnpm (installed globally)

### Start Backend
```bash
cd backend
pnpm install
pnpm dev
# → http://localhost:3001/api
```

### Start Frontend (Admin Portal)
```bash
cd frontend
pnpm install
npx nx serve admin
# → http://localhost:4200
```

### Start Frontend (Customer PWA)
```bash
cd frontend
npx nx serve customer
# → http://localhost:4300
```

---

## Phase 1 — Testing Guide

### Seed Data
After starting the backend for the first time, create an admin user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@hrfressh.com",
    "password": "admin123",
    "phone": "9000000000",
    "role": "super_admin"
  }'
```

### Login (get token for all protected requests)
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrfressh.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

echo $TOKEN
```

---

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

### 2. Auth Module
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test1234","phone":"9111111111"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrfressh.com","password":"admin123"}'

# Profile (requires token)
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# Change Password
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currentPassword":"admin123","newPassword":"newpass123"}'
```

### 3. Settings Module
```bash
# Create/Update Settings (admin)
curl -X PATCH http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "business": {"name":"HrFressh","tagline":"Fresh vegetables delivered daily"},
    "contact": {"phone":"9876543210","email":"hello@hrfressh.com","city":"Bengaluru","state":"Karnataka","pincode":"560001"},
    "regional": {"currency":"INR","timezone":"Asia/Kolkata"},
    "orderSettings": {"minOrderAmount":100,"deliveryCharge":30,"freeDeliveryAbove":500,"orderCutoffTime":"18:00"}
  }'

# Get Settings (public — for Customer PWA)
curl http://localhost:3001/api/settings/public
```

### 4. Catalog Module
```bash
# Create Units
curl -X POST http://localhost:3001/api/catalog/units \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Kilogram","shortName":"kg"}'

curl -X POST http://localhost:3001/api/catalog/units \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Piece","shortName":"pc"}'

curl -X POST http://localhost:3001/api/catalog/units \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Bunch","shortName":"bunch"}'

# Create Category
curl -X POST http://localhost:3001/api/catalog/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Leafy Vegetables","description":"Fresh leafy greens"}'

curl -X POST http://localhost:3001/api/catalog/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Root Vegetables","description":"Tubers and roots"}'

# Create Product (replace CATEGORY_ID and UNIT_ID with actual IDs from above)
curl -X POST http://localhost:3001/api/catalog/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Fresh Spinach",
    "category":"CATEGORY_ID",
    "unit":"UNIT_ID",
    "basePrice":30,
    "description":"Farm fresh spinach leaves",
    "tags":["leafy","green","iron-rich"],
    "trackInventory":true,
    "lowStockThreshold":10
  }'

# Browse Products (public — no auth)
curl http://localhost:3001/api/catalog/products
curl http://localhost:3001/api/catalog/products?search=spinach
curl http://localhost:3001/api/catalog/categories
curl http://localhost:3001/api/catalog/units
```

### 5. Customer Module
```bash
# Create Customer Groups
curl -X POST http://localhost:3001/api/customers/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Retail Customers","type":"retail","discountPercent":0}'

curl -X POST http://localhost:3001/api/customers/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Wholesale Buyers","type":"wholesale","discountPercent":10,"creditLimit":50000,"creditPeriodDays":15}'

# List Groups (public)
curl http://localhost:3001/api/customers/groups

# Create Customer (replace GROUP_ID)
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Ramesh Kumar",
    "phone":"9876543210",
    "email":"ramesh@example.com",
    "group":"GROUP_ID",
    "tags":["regular","morning-delivery"]
  }'

# Create Address (replace CUSTOMER_ID)
curl -X POST http://localhost:3001/api/customers/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer":"CUSTOMER_ID",
    "label":"Home",
    "line1":"42, MG Road",
    "city":"Bengaluru",
    "state":"Karnataka",
    "pincode":"560001",
    "isDefault":true
  }'

# List Customers (admin only)
curl http://localhost:3001/api/customers -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3001/api/customers?search=Ramesh" -H "Authorization: Bearer $TOKEN"

# List Addresses for Customer
curl "http://localhost:3001/api/customers/addresses?customer=CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Pricing Module
```bash
# Create Group Pricing (replace PRODUCT_ID, GROUP_ID)
curl -X POST http://localhost:3001/api/pricing/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"PRODUCT_ID","type":"group","group":"GROUP_ID","price":25}'

# Create Customer-Specific Pricing (replace CUSTOMER_ID)
curl -X POST http://localhost:3001/api/pricing/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"PRODUCT_ID","type":"customer","customer":"CUSTOMER_ID","price":22}'

# Create Quantity Slabs
curl -X POST http://localhost:3001/api/pricing/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"PRODUCT_ID","type":"quantity_slab","price":27,"minQuantity":5,"maxQuantity":19}'

curl -X POST http://localhost:3001/api/pricing/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"PRODUCT_ID","type":"quantity_slab","price":23,"minQuantity":20}'

# Resolve Price (public)
curl "http://localhost:3001/api/pricing/resolve?productId=PRODUCT_ID"
curl "http://localhost:3001/api/pricing/resolve?productId=PRODUCT_ID&customerId=CUSTOMER_ID"
curl "http://localhost:3001/api/pricing/resolve?productId=PRODUCT_ID&quantity=10"

# Bulk Resolve (public)
curl -X POST http://localhost:3001/api/pricing/resolve/bulk \
  -H "Content-Type: application/json" \
  -d '{"productIds":["PRODUCT_ID"],"customerId":"CUSTOMER_ID","quantity":5}'

# List Rules (admin)
curl http://localhost:3001/api/pricing/rules -H "Authorization: Bearer $TOKEN"
```

### 7. Order Module
```bash
# Create Order (replace CUSTOMER_ID, PRODUCT_ID)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer":"CUSTOMER_ID",
    "deliveryAddress":{"line1":"42 MG Road","city":"Bengaluru","state":"Karnataka","pincode":"560001"},
    "items":[{"product":"PRODUCT_ID","quantity":5}],
    "paymentMethod":"cash"
  }'

# List Orders
curl http://localhost:3001/api/orders -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3001/api/orders?status=draft" -H "Authorization: Bearer $TOKEN"

# Get Order by Number
curl http://localhost:3001/api/orders/number/HCP-20260724-00001 \
  -H "Authorization: Bearer $TOKEN"

# Update Status (replace ORDER_ID): draft → confirmed → processing → packed
curl -X PATCH http://localhost:3001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"confirmed","notes":"Customer confirmed"}'

curl -X PATCH http://localhost:3001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"processing"}'

curl -X PATCH http://localhost:3001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"packed"}'

# Cancel Order (separate order)
curl -X POST http://localhost:3001/api/orders/ORDER_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason":"Customer changed mind"}'
```

### 8. Inventory Module
```bash
# Add Stock (purchase)
curl -X POST http://localhost:3001/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "product":"PRODUCT_ID",
    "type":"purchase",
    "quantity":100,
    "direction":"in",
    "unitCost":15,
    "batchNumber":"BATCH-001",
    "notes":"Initial stock"
  }'

# Record Sale
curl -X POST http://localhost:3001/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"PRODUCT_ID","type":"sale","quantity":5,"direction":"out"}'

# Record Damage
curl -X POST http://localhost:3001/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"PRODUCT_ID","type":"damage","quantity":3,"direction":"out","notes":"Spoiled"}'

# Check Stock
curl http://localhost:3001/api/inventory/stock/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN"

# Bulk Stock Check
curl -X POST http://localhost:3001/api/inventory/stock/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productIds":["PRODUCT_ID"]}'

# Manual Adjustment
curl -X POST http://localhost:3001/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"PRODUCT_ID","quantity":10,"direction":"in","notes":"Count correction"}'

# Stock Report (low stock filter)
curl http://localhost:3001/api/inventory/report \
  -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3001/api/inventory/report?lowStock=true" \
  -H "Authorization: Bearer $TOKEN"

# Transaction History
curl "http://localhost:3001/api/inventory/transactions?product=PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Purchasing Module
```bash
# Create Supplier
curl -X POST http://localhost:3001/api/purchasing/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Green Valley Farms",
    "contactPerson":"Ramaiah",
    "phone":"9876500001",
    "email":"supply@greenvalley.in",
    "address":{"line1":"Survey 42, Hoskote","city":"Bengaluru","state":"Karnataka","pincode":"562114"},
    "paymentTerms":"Net 15",
    "tags":["organic","local"]
  }'

# Create Purchase Order (replace SUPPLIER_ID, PRODUCT_ID)
curl -X POST http://localhost:3001/api/purchasing/purchases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplier":"SUPPLIER_ID",
    "items":[{"product":"PRODUCT_ID","quantity":50,"unitCost":12,"batchNumber":"BATCH-002"}],
    "tax":50,
    "shippingCost":100
  }'

# Transition: draft → ordered → received (auto-creates inventory)
curl -X PATCH http://localhost:3001/api/purchasing/purchases/PO_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"ordered"}'

curl -X PATCH http://localhost:3001/api/purchasing/purchases/PO_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"received"}'

# Verify stock increased
curl http://localhost:3001/api/inventory/stock/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN"

# List Suppliers & Purchases
curl http://localhost:3001/api/purchasing/suppliers -H "Authorization: Bearer $TOKEN"
curl http://localhost:3001/api/purchasing/purchases -H "Authorization: Bearer $TOKEN"
```

### 10. Delivery Module
```bash
# Create Delivery Staff
curl -X POST http://localhost:3001/api/delivery/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Rajesh Kumar","phone":"9876512345","vehicleType":"bike","vehicleNumber":"KA-01-AB-1234"}'

# Assign Order to Staff (order must be in 'packed' status)
curl -X POST http://localhost:3001/api/delivery/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"order":"ORDER_ID","deliveryStaff":"STAFF_ID","distance":5.2,"estimatedTime":30}'

# Progress Delivery: assigned → picked_up → in_transit → delivered
curl -X PATCH http://localhost:3001/api/delivery/assignments/ASSIGNMENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"picked_up"}'

curl -X PATCH http://localhost:3001/api/delivery/assignments/ASSIGNMENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"in_transit"}'

curl -X PATCH http://localhost:3001/api/delivery/assignments/ASSIGNMENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"delivered","proofOfDelivery":"signature_base64_data"}'

# Update Staff Location (delivery app would call this)
curl -X PATCH http://localhost:3001/api/delivery/staff/STAFF_ID/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"lat":12.9716,"lng":77.5946}'

# Toggle Availability
curl -X PATCH http://localhost:3001/api/delivery/staff/STAFF_ID/availability \
  -H "Authorization: Bearer $TOKEN"

# List Assignments
curl http://localhost:3001/api/delivery/assignments -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3001/api/delivery/assignments/staff/STAFF_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 11. Frontend Testing

**Admin Portal** (http://localhost:4200):
1. Open browser → redirects to /login
2. Login with `admin@hrfressh.com` / `admin123`
3. Dashboard loads with sidebar navigation
4. Click through each section (Catalog, Customers, Orders, etc.)

**Customer PWA** (http://localhost:4300):
1. Open browser → home page with hero
2. Click "Browse Catalog" → loads products from API
3. Click a product → detail page with price and tags

---

## Full End-to-End Flow

Test the complete business flow in sequence:

```bash
# 1. Setup catalog
# Create units → categories → products

# 2. Setup customers
# Create groups → customers → addresses

# 3. Setup pricing
# Create group/slab/customer pricing rules

# 4. Stock up
# Create supplier → purchase order → mark received → verify stock

# 5. Take an order
# Create order → price auto-resolves → delivery charge applied

# 6. Process order
# Confirm → Process → Pack

# 7. Deliver
# Create delivery staff → assign order → picked_up → in_transit → delivered

# 8. Verify
# Check customer stats (totalOrders, totalSpent updated)
# Check stock decreased (inventory transaction created)
# Check delivery staff completedDeliveries++
```

---

## API Endpoint Summary

| Module | Endpoint | Auth | Methods |
|--------|----------|------|---------|
| Auth | `/api/auth` | Mixed | POST register/login/logout, GET profile |
| Settings | `/api/settings` | Admin | GET public, PATCH |
| Catalog | `/api/catalog/products` | Public/Admin | GET, POST, PATCH, DELETE |
| Catalog | `/api/catalog/categories` | Public/Admin | GET, POST, PATCH, DELETE |
| Catalog | `/api/catalog/units` | Public/Admin | GET, POST, PATCH, DELETE |
| Catalog | `/api/catalog/brands` | Public/Admin | GET, POST, PATCH, DELETE |
| Customers | `/api/customers` | Admin | GET, POST, PATCH, DELETE |
| Customers | `/api/customers/groups` | Public/Admin | GET, POST, PATCH, DELETE |
| Customers | `/api/customers/addresses` | Admin | GET, POST, PATCH, DELETE |
| Pricing | `/api/pricing/rules` | Admin | GET, POST, PATCH, DELETE |
| Pricing | `/api/pricing/resolve` | Public | GET, POST bulk |
| Orders | `/api/orders` | Staff+ | GET, POST, PATCH status/items, POST cancel |
| Inventory | `/api/inventory/transactions` | Staff+ | GET, POST |
| Inventory | `/api/inventory/stock` | Staff+ | GET, POST bulk |
| Inventory | `/api/inventory/report` | Admin | GET |
| Inventory | `/api/inventory/adjust` | Admin | POST |
| Purchasing | `/api/purchasing/suppliers` | Admin | GET, POST, PATCH, DELETE |
| Purchasing | `/api/purchasing/purchases` | Admin | GET, POST, PATCH status/items |
| Delivery | `/api/delivery/staff` | Admin | GET, POST, PATCH, DELETE |
| Delivery | `/api/delivery/assignments` | Staff+ | GET, POST, PATCH status |

---

## Phase 2 — Planned Features

### 2.1 Admin Portal (Full CRUD UI)
- [ ] Products CRUD with image upload
- [ ] Categories tree view with drag-and-drop reorder
- [ ] Customers list with filters, search, export
- [ ] Order management: create, status flow, print invoice
- [ ] Inventory dashboard: stock levels, low stock alerts
- [ ] Purchase order creation with supplier selection
- [ ] Delivery board: map view, assignment drag-and-drop
- [ ] Settings page: all business config in one place
- [ ] User management: invite staff, assign roles

### 2.2 Customer PWA (Shopping Experience)
- [ ] Customer registration (OTP-based phone login)
- [ ] Product catalog with category filters
- [ ] Cart management (add/remove/update quantity)
- [ ] Checkout with address selection
- [ ] Order tracking (real-time status)
- [ ] Order history
- [ ] Push notifications (order updates)
- [ ] PWA: installable, offline-capable catalog
- [ ] Reorder from previous orders

### 2.3 Delivery App (Driver Interface)
- [ ] Driver login (separate app or route)
- [ ] Today's assignments list
- [ ] Navigation integration (Google Maps)
- [ ] Status update buttons (picked up → delivered)
- [ ] Proof of delivery (photo capture)
- [ ] Earnings summary

### 2.4 Backend Enhancements
- [ ] File upload service (product images, POD photos)
- [ ] Invoice PDF generation (with GST)
- [ ] Payment tracking (reconciliation, credits)
- [ ] Notification service (SMS via MSG91, email via SES, WhatsApp)
- [ ] Reporting & analytics (daily summary, top products, customer LTV)
- [ ] Bulk import/export (CSV for products, customers)
- [ ] Rate limiting & security hardening
- [ ] Cron jobs (order cutoff, daily reports, expiry alerts)
- [ ] Search indexing (Elasticsearch for product search)
- [ ] Webhook system (order status changes → external integrations)

---

## Phase 3 — Scale & Multi-Tenancy

### 3.1 Multi-Tenancy
- [ ] Tenant isolation (database per tenant or discriminator field)
- [ ] Onboarding flow (new business signup)
- [ ] Subscription & billing (Razorpay/Stripe)
- [ ] White-label branding per tenant
- [ ] Custom domain mapping

### 3.2 Operations
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (health checks, error tracking via Sentry)
- [ ] Database backups (automated daily)
- [ ] CDN for static assets (CloudFront)
- [ ] Auto-scaling (ECS/EKS or Railway)

### 3.3 Advanced Features
- [ ] AI-powered demand forecasting
- [ ] Route optimization for deliveries
- [ ] Customer segmentation & targeted offers
- [ ] Loyalty program (points/rewards)
- [ ] Marketplace mode (multiple vendors)
- [ ] B2B portal with credit management
- [ ] Accounting integration (Tally, Zoho Books)
- [ ] POS integration (for walk-in customers)

---

## Project Structure

```
commerce/
├── backend/                    (Express + MongoDB API)
│   ├── src/
│   │   ├── common/            (Middleware, utils, types)
│   │   ├── config/            (Environment + constants)
│   │   ├── database/          (Connection + base schema plugin)
│   │   └── modules/
│   │       ├── auth/          (Users, JWT, roles)
│   │       ├── settings/      (Business config)
│   │       ├── catalog/       (Products, categories, units, brands)
│   │       ├── customer/      (Customers, groups, addresses)
│   │       ├── pricing/       (Price rules, resolution)
│   │       ├── order/         (Orders, lifecycle)
│   │       ├── inventory/     (Stock transactions)
│   │       ├── purchasing/    (Suppliers, POs)
│   │       └── delivery/      (Staff, assignments)
│   └── package.json
├── frontend/                   (Nx + Angular monorepo)
│   ├── apps/
│   │   ├── admin/             (Admin Portal — port 4200)
│   │   └── customer/          (Customer PWA — port 4300)
│   ├── libs/shared/
│   │   ├── data-access/       (API, Auth, Guards)
│   │   └── ui/                (Shared components)
│   └── package.json
└── docs/
    └── HCP-MEMORY.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js 20 + TypeScript 5.7 |
| Backend Framework | Express 4.21 |
| Database | MongoDB 8 + Mongoose 8.9 |
| Validation | Zod 3.24 |
| Auth | JWT (access + refresh tokens) |
| Frontend | Angular 20 + SCSS |
| Monorepo | Nx 21 |
| Package Manager | pnpm |
| Dev Server | tsx (backend), @angular/build (frontend) |
