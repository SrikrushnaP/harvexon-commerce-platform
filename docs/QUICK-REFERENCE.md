# HCP — Quick Reference

## Start the App

```bash
# 1. Backend (Terminal 1)
cd backend
pnpm dev
# → http://localhost:3001

# 2. Admin Portal (Terminal 2)
cd frontend
npx nx serve admin
# → http://localhost:4200

# 3. Customer PWA (Terminal 3)
cd frontend
npx nx serve customer
# → http://localhost:4300
```

## Seed Database (fresh data)

```bash
cd backend
npm run seed
```

---

## Login Credentials

| Role | Email | Password | Where to Login |
|------|-------|----------|----------------|
| Admin | admin@hrfressh.com | admin123 | http://localhost:4200 |
| Manager | priya.sharma@hrfressh.com | manager123 | http://localhost:4200 |
| Staff | vikram@hrfressh.com | staff123 | http://localhost:4200 |
| Delivery | rafi@hrfressh.com | delivery123 | http://localhost:4300/delivery |
| Customer | meena.r@gmail.com | customer123 | http://localhost:4300 |
| Customer | arjun.k@gmail.com | customer123 | http://localhost:4300 |

---

## What to Check

### Admin Portal (localhost:4200)
1. Login with admin credentials
2. **Dashboard** — stats cards, recent orders, order status breakdown
3. **Catalog** → Products (34 items), Categories (8), Units (8)
4. **Customers** → 12 customers, 5 groups (retail, wholesale, restaurant, VIP, distributor)
5. **Orders** → 12 orders in various statuses (draft, confirmed, processing, packed, delivered, cancelled)
6. **Inventory** → Stock report with transactions
7. **Purchasing** → 6 suppliers
8. **Delivery** → 6 staff members with assignments
9. **Settings** → Business configuration

### Customer PWA (localhost:4300)
1. Browse catalog (no login needed)
2. Login with customer credentials
3. Add items to cart
4. Checkout with address
5. View order history & tracking

### Delivery App (localhost:4300/delivery)
1. Login with delivery credentials
2. View assigned deliveries
3. Update delivery status

---

## API (for Postman/curl)

Base URL: `http://localhost:3001/api`

```bash
# Get token
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrfressh.com","password":"admin123"}'

# Use token in requests
curl http://localhost:3001/api/orders \
  -H "Authorization: Bearer <token>"
```
