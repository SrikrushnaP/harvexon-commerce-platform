# Harvexon Commerce Platform — Deployment Guide

Production deployment guide for HCP (backend API + admin dashboard + customer storefront).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Nginx Reverse Proxy](#nginx-reverse-proxy)
6. [MongoDB Setup](#mongodb-setup)
7. [Security Checklist](#security-checklist)
8. [Monitoring](#monitoring)
9. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Node.js | 18.x | LTS recommended (20.x preferred) |
| pnpm | 8.x | Install globally: `npm i -g pnpm` |
| MongoDB | 6.x | Atlas (managed) or self-hosted |
| Nginx | 1.24+ | Reverse proxy & static file serving |
| PM2 | 5.x | Process manager for Node.js (optional but recommended) |

---

## Environment Variables

Create a `.env` file in the `backend/` directory. **All variables marked [REQUIRED] must be set in production.**

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `3001` | No | Port the backend API listens on |
| `NODE_ENV` | `development` | Yes | Set to `production` in prod |
| `MONGODB_URI` | `mongodb://localhost:27017/hcp_dev` | Yes | MongoDB connection string (use Atlas URI or replica set URI in prod) |
| `JWT_SECRET` | — | Yes | Secret for signing access tokens. Generate with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` | No | Access token TTL (e.g., `15m`, `1h`, `7d`) |
| `JWT_REFRESH_SECRET` | — | Yes | Secret for signing refresh tokens. Generate with `openssl rand -hex 32` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | No | Refresh token TTL |
| `UPLOAD_DIR` | `uploads` | No | Directory for file uploads (relative to backend root or absolute path) |
| `MAX_FILE_SIZE` | `5242880` | No | Max upload size in bytes (default 5 MB) |
| `CORS_ORIGIN` | `*` | Yes | Comma-separated allowed origins. **Never use `*` in production.** |

### Example production `.env`

```bash
PORT=3001
NODE_ENV=production

MONGODB_URI=mongodb+srv://hcp_user:S3cur3Pa$$@cluster0.abc123.mongodb.net/hcp_prod?retryWrites=true&w=majority

JWT_SECRET=a1b2c3d4e5f6...  # openssl rand -hex 32
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=f6e5d4c3b2a1...  # openssl rand -hex 32
JWT_REFRESH_EXPIRES_IN=7d

UPLOAD_DIR=/var/www/hcp/uploads
MAX_FILE_SIZE=10485760

CORS_ORIGIN=https://admin.harvexon.com,https://shop.harvexon.com
```

---

## Backend Deployment

### Build

```bash
cd backend
pnpm install --frozen-lockfile
pnpm run build   # Compiles TypeScript to dist/
```

### Run directly

```bash
NODE_ENV=production node dist/index.js
```

### Run with PM2 (recommended)

```bash
# Install PM2 globally
npm i -g pm2

# Start the app
pm2 start dist/index.js --name hcp-api \
  --env production \
  --max-memory-restart 512M \
  --instances 2 \
  --exec-mode cluster

# Save process list for auto-restart on reboot
pm2 save
pm2 startup
```

#### PM2 ecosystem file (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'hcp-api',
      script: './dist/index.js',
      cwd: '/var/www/hcp/backend',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '512M',
      error_file: '/var/log/hcp/api-error.log',
      out_file: '/var/log/hcp/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js --env production
```

### Uploads directory

Ensure the upload directory exists and is writable by the Node.js process:

```bash
mkdir -p /var/www/hcp/uploads
chown www-data:www-data /var/www/hcp/uploads
```

---

## Frontend Deployment

### Build both apps

```bash
cd frontend
pnpm install --frozen-lockfile

# Build admin dashboard
npx nx build admin --configuration=production

# Build customer storefront
npx nx build customer --configuration=production
```

Build output lands in:
- `frontend/dist/apps/admin/browser/`
- `frontend/dist/apps/customer/browser/`

### Deploy as static files

Copy build artifacts to your web server:

```bash
# Admin
rsync -avz frontend/dist/apps/admin/browser/ /var/www/hcp/admin/

# Customer
rsync -avz frontend/dist/apps/customer/browser/ /var/www/hcp/customer/
```

---

## Nginx Reverse Proxy

### Full configuration

```nginx
# /etc/nginx/sites-available/hcp.conf

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

# Upstream for Node.js backend
upstream hcp_api {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name admin.harvexon.com shop.harvexon.com;
    return 301 https://$host$request_uri;
}

# Admin Dashboard
server {
    listen 443 ssl http2;
    server_name admin.harvexon.com;

    ssl_certificate     /etc/letsencrypt/live/admin.harvexon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.harvexon.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www/hcp/admin;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # Static assets with cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://hcp_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;

        # File upload size
        client_max_body_size 10M;
    }

    # Auth endpoints — stricter rate limit
    location /api/auth/ {
        limit_req zone=auth_limit burst=10 nodelay;
        proxy_pass http://hcp_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files (served directly by Nginx)
    location /uploads/ {
        alias /var/www/hcp/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Angular SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Customer Storefront
server {
    listen 443 ssl http2;
    server_name shop.harvexon.com;

    ssl_certificate     /etc/letsencrypt/live/shop.harvexon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shop.harvexon.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www/hcp/customer;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://hcp_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /api/auth/ {
        limit_req zone=auth_limit burst=10 nodelay;
        proxy_pass http://hcp_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /var/www/hcp/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Enable and test

```bash
ln -s /etc/nginx/sites-available/hcp.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## MongoDB Setup

### Option A: MongoDB Atlas (recommended for production)

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write access to your database
3. Whitelist your server IP (or use VPC peering)
4. Copy the connection string to `MONGODB_URI`

### Option B: Self-hosted MongoDB

```bash
# Install MongoDB 6+ (Ubuntu example)
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

### Recommended indexes

Run these in the Mongo shell or via a migration script:

```javascript
// Orders — queried by status, customer, and date
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ customer: 1, createdAt: -1 });

// Products — text search and category filtering
db.products.createIndex({ name: "text", description: "text" });
db.products.createIndex({ category: 1, isActive: 1 });

// Customers — lookup by email and phone
db.customers.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ phone: 1 });

// Delivery staff — assignment lookups
db.deliverystaff.createIndex({ isActive: 1, isAvailable: 1 });

// Inventory — product lookup
db.inventory.createIndex({ product: 1 }, { unique: true });
```

### Backups

```bash
# Daily backup via cron
0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backups/mongo/$(date +\%Y-\%m-\%d) --gzip
```

---

## Security Checklist

- [ ] **JWT secrets**: Generate unique, strong secrets (`openssl rand -hex 32`). Never reuse across environments.
- [ ] **CORS**: Set `CORS_ORIGIN` to exact production domains. Never use `*` in production.
- [ ] **HTTPS**: Enforce TLS everywhere. Use Let's Encrypt or a managed certificate.
- [ ] **Rate limiting**: Configure Nginx rate limits (see config above). Consider `express-rate-limit` as a second layer.
- [ ] **Helmet**: Ensure `helmet` middleware is enabled for security headers.
- [ ] **MongoDB auth**: Enable authentication. Use a dedicated user with minimal privileges (readWrite on the app database only).
- [ ] **MongoDB network**: Restrict access to app servers only (firewall rules or VPC).
- [ ] **File uploads**: Validate file types and sizes server-side. Store outside the web root or behind access control.
- [ ] **Dependencies**: Run `pnpm audit` regularly. Keep dependencies updated.
- [ ] **Secrets management**: Use environment variables or a secrets manager (AWS Secrets Manager, Vault). Never commit `.env` files.
- [ ] **Disable debug info**: Ensure `NODE_ENV=production` so stack traces aren't leaked to clients.
- [ ] **Firewall**: Only expose ports 80, 443 externally. Backend port (3001) should only be accessible from localhost/Nginx.
- [ ] **SSH**: Disable password auth, use key-based only. Disable root login.

---

## Monitoring

### Application-level

- **PM2 Monitoring**: `pm2 monit` for real-time CPU/memory. Use `pm2 plus` for a hosted dashboard.
- **Health endpoint**: Add a `GET /api/health` route that returns DB connection status.
- **Logging**: Use structured JSON logging (e.g., `pino` or `winston`). Ship logs to a centralized service (CloudWatch, Datadog, ELK).

### Infrastructure

- **Uptime monitoring**: Use UptimeRobot, Pingdom, or AWS CloudWatch Synthetics to ping endpoints.
- **Server metrics**: Install `node-exporter` + Prometheus + Grafana, or use cloud-native monitoring.
- **Alerts**: Set up alerts for:
  - API response time > 2s
  - Error rate > 5%
  - Disk usage > 80%
  - Memory usage > 90%
  - MongoDB connection failures

### Log rotation

```bash
# /etc/logrotate.d/hcp
/var/log/hcp/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Common Issues & Troubleshooting

### Backend won't start

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` on MongoDB | MongoDB not running or wrong URI | Check `mongosh` connects; verify `MONGODB_URI` |
| `EADDRINUSE :3001` | Port already in use | Kill the existing process: `lsof -i :3001` then `kill <PID>` |
| `Cannot find module 'dist/index.js'` | Missing build step | Run `pnpm run build` first |
| JWT errors on startup | Missing env vars | Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set |

### Frontend build fails

| Symptom | Cause | Fix |
|---------|-------|-----|
| `nx: command not found` | Nx not installed | Run `pnpm install` in `frontend/` |
| Out of memory during build | Default Node heap too small | `export NODE_OPTIONS="--max-old-space-size=4096"` |
| Stale cache causing errors | Corrupted Nx cache | Delete `.nx/cache` and `.angular/cache`, rebuild |

### Nginx issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| 502 Bad Gateway | Backend not running | Check `pm2 status`; verify backend is on port 3001 |
| 413 Request Entity Too Large | Upload exceeds `client_max_body_size` | Increase `client_max_body_size` in Nginx config |
| SPA routes return 404 | Missing `try_files` fallback | Add `try_files $uri $uri/ /index.html;` |

### General

- **CORS errors in browser**: Verify `CORS_ORIGIN` includes the exact origin (protocol + domain + port).
- **Slow queries**: Enable MongoDB profiler (`db.setProfilingLevel(1, { slowms: 100 })`), add missing indexes.
- **File upload failures**: Check directory permissions, available disk space, and `MAX_FILE_SIZE` setting.
- **Token expiry issues**: If users are logged out unexpectedly, check `JWT_EXPIRES_IN` and ensure client handles refresh token rotation correctly.

---

## Deployment Checklist (Quick Reference)

```bash
# 1. Pull latest code
git pull origin main

# 2. Backend
cd backend
pnpm install --frozen-lockfile
pnpm run build
pm2 restart hcp-api

# 3. Frontend
cd ../frontend
pnpm install --frozen-lockfile
npx nx build admin --configuration=production
npx nx build customer --configuration=production
rsync -avz dist/apps/admin/browser/ /var/www/hcp/admin/
rsync -avz dist/apps/customer/browser/ /var/www/hcp/customer/

# 4. Verify
curl -s https://admin.harvexon.com/api/health | jq .
curl -s https://shop.harvexon.com | head -5
```
