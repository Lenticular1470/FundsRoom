Mini ERP + CRM Operations Portal

A full-stack Mini ERP + CRM Operations Portal built for wholesale and distribution companies. The system empowers internal teams (Admin, Sales, Warehouse, Accounts) to streamline Customer Management, Product Catalog & Inventory Tracking, Stock Audit Logs, and Sales Challans with automated stock deduction.

## Key Features

1. Authentication & Role-Based Access Control (RBAC)
   - JWT-based authentication with 24-hour token validity
   - 4 distinct role permissions:
     - Admin: Full access across all modules, inventory management, CRM, and challans
     - Sales: Customer CRM management, follow-up notes, and creating/confirming Sales Challans
     - Warehouse: Inventory tracking, stock intake/adjustment (IN/OUT), and stock audit movement logs
     - Accounts: View customers, products, stock levels, and sales challans for invoicing
   - 1-Click Role Switcher: Built-in login presets and local role testing

2. Customer CRM Module
   - Manage Wholesale, Retail, and Distributor customer accounts
   - Fields: Customer Name, Mobile, Email, Business Name, GST Number (optional), Address, Status (LEAD, ACTIVE, INACTIVE), Follow-up Date, Notes
   - Search by name, email, mobile, or business name
   - Filter by Status and Customer Type
   - Customer Detail view with an interactive Follow-up Timeline

3. Product & Inventory Module
   - Product fields: Name, SKU code, Category, Unit Price, Current Stock, Min Stock Alert limit, Warehouse Location
   - Low-stock warning badges with pulse animation for items below minimum threshold
   - Stock Movement Log for every intake, dispatch, and manual adjustment (IN/OUT)
   - Tracks quantity changes, reason, staff user, and timestamp
   - Atomic stock adjustment modal for Warehouse staff

4. Sales Challan & Automated Inventory Deduction
   - Create Sales Challans in DRAFT or CONFIRMED status
   - Select customer and add multiple line items with live stock validation
   - Business logic enforcement:
     - Automatically generates sequential challan numbers (SCH-YYYY-XXXX)
     - Upon confirmation, stock is deducted atomically in a database transaction
     - Rejects confirmation with HTTP 400 if stock is insufficient for any line item
     - Stock can never go negative
   - Stores product snapshot data at the time of order placement
   - PDF Export / Print Invoice support

## Tech Stack

- Backend: Node.js, Express.js, TypeScript, Prisma ORM, SQLite / PostgreSQL, JWT, bcrypt
- Frontend: React 18, Vite, TypeScript, Lucide Icons, Modern CSS
- DevOps: Docker-ready architecture, Docker Compose guidance

## Repository Structure

```
/ (root)
├── backend/                  # Backend API + Prisma
│   ├── prisma/               # Prisma schema, migrations, seed scripts
│   ├── src/                  # Express app, controllers, services, routes
│   ├── package.json          # Backend npm scripts and dependencies
│   └── tsconfig.json         # Backend TypeScript config
├── frontend/                 # Next.js / React application
│   ├── app/                  # App Router pages and layouts
│   ├── components/           # UI components and dashboard pieces
│   ├── lib/                  # API client, auth context, utility types
│   ├── public/               # Static assets
│   ├── package.json          # Frontend npm scripts and dependencies
│   └── pnpm-lock.yaml        # Frontend lockfile
├── README.md                 # This project README
└── package.json              # Root package metadata
```

## Quick Start Guide (Local Setup)

### Prerequisites

- Node.js v18 or v20
- npm v9+ or pnpm

### Step 1: Install Dependencies

```bash
cd backend
npm install

cd ../frontend
pnpm install
```

### Step 2: Initialize Database & Seed Demo Data

```bash
cd ../backend
npx prisma db push
npm run prisma:seed
```

### Step 3: Run Development Servers

Terminal 1: Backend Server (http://localhost:5000)
```bash
cd backend
npm run dev
```

Terminal 2: Frontend App (http://localhost:3000)
```bash
cd frontend
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Test Credentials (All 4 Roles)

All accounts share the default password: `password123`

| Role      | Email             | Privileges / Focus |
|-----------|-------------------|---------------------|
| Admin     | admin@erp.com     | Full administrative access across all modules |
| Sales     | sales@erp.com     | Customer CRM, Follow-up notes, Creating & Confirming Challans |
| Warehouse | warehouse@erp.com | Inventory management, Stock IN/OUT adjustments, Stock Audit Logs |
| Accounts  | accounts@erp.com  | View financial totals, customer invoices, and sales challans |

## API Endpoints

- `POST /api/auth/login` - Login with JWT token generation
- `GET /api/auth/me` - Current authenticated user profile
- `GET /api/customers` - List, search, filter, paginate customers
- `POST /api/customers` - Create customer
- `POST /api/customers/:id/notes` - Add follow-up timeline note
- `GET /api/products` - List products, low-stock filter
- `POST /api/products` - Create product
- `POST /api/products/:id/stock` - Manual stock movement IN/OUT
- `GET /api/products/stock-logs/all` - Stock audit logs
- `POST /api/challans` - Create Draft or Confirmed Sales Challan
- `PUT /api/challans/:id/status` - Update status to CONFIRMED or CANCELLED

## Deployment Instructions

### Database

Use PostgreSQL for production hosting (Neon, Supabase, Render Postgres).

1. Create a free PostgreSQL database.
2. Copy your connection URI into `backend/.env` as `DATABASE_URL`.
3. Run:
   ```bash
   cd backend
   npx prisma db push
   npm run prisma:seed
   ```

### Backend

Connect your GitHub repository to Render, Railway, or Fly.io.

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variables:
  - `PORT=5000`
  - `DATABASE_URL=<your-postgres-uri>`
  - `JWT_SECRET=<your-production-secret-key>`

### Frontend

Deploy the frontend to Vercel, Netlify, or Render Static.

- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `pnpm build`
- Output Directory: `dist`
- Set `VITE_API_URL` to your deployed backend URL

## Architecture & Design Overview

                                 ┌─────────────────────────────────┐
                                 │       React + Vite Frontend     │
                                 │ (TypeScript, Lucide Icons, CSS) │
                                 └────────────────┬────────────────┘
                                                  │ REST APIs / JWT Bearer
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │     Node.js + Express Server    │
                                 │     (TypeScript Controllers)    │
                                 └────────────────┬────────────────┘
                                                  │ Prisma ORM
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │  SQLite (Dev) / PostgreSQL (Prod)│
                                 └─────────────────────────────────┘

## Data Integrity

- Challan confirmation and stock deduction are executed inside atomic database transactions (`prisma.$transaction`) to prevent race conditions or negative inventory.
- Snapshot storage ensures sales challans preserve historical product and customer state even if prices or customer data change later.

## Known Limitations & Future Enhancements

- Multi-Warehouse Transfer: Current version tracks stock locations by string labels; future enhancements can introduce full inter-warehouse transfer workflows.
- S3 Image Upload: Product images are represented via category icons; S3 bucket integration can be added with file upload hooks.
- Docker Compose: A Docker Compose file is not included in this repository by default.
