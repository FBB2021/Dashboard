# 📊 Data Visualisation Dashboard

A web-based dashboard system for analysing **procurement, sales, and inventory history** of products.
This project was implemented as part of the *Coding Challenge – Data Visualisation Dashboard*.

## 📖 Documentation & Design

- **User Stories:** [Confluence Link](https://fbao860.atlassian.net/wiki/external/MjliYTMyODIzNzFhNDc4MTg2NDE0MTkxN2MxMzk0Zjk)  
- **Figma Design:** [Figma Dashboard Prototype](https://www.figma.com/design/ZdjAZJQd1N7jm5LkZuaqhN/Dashboard?node-id=0-1&t=vA8f2zp4Zix01Miy-1)

---
## 👤 Author

- **Name:** Feng Bao  
- **Email:** [f.bao86@outlook.com](mailto:f.bao86@outlook.com)  
- **LinkedIn:** <https://www.linkedin.com/in/fbb1>
---

## 🌐 Live Demo

- **App (Prod):**  
  <https://main.djdzb40a8m63f.amplifyapp.com>

- **API Base:**  
  <https://main.djdzb40a8m63f.amplifyapp.com/api>

- **Web App Health Check:**  
  (GET) <https://main.djdzb40a8m63f.amplifyapp.com/api/health>

### 🔐 Demo Accounts

| Role   | Username                | Password |
|--------|-------------------------|----------|
| Admin  | admin@example.com       | 123456   |
| Editor | editor@example.com      | 123456   |
| Viewer | viewer@example.com      | 123456   |

> Tip: After login you’ll be redirected to `/dashboard`.  

---

## 🚀 Features

### 🔹 Core Features

- **User Authentication**
  - Basic login with username & password
  - Passwords are securely stored using bcrypt hashing
- **Excel Import**
  - Upload Excel files containing product procurement & sales history
  - Data automatically parsed and stored in the database
- **Interactive Dashboard**
  - Line chart with **3 curves per product**:
    - Inventory over time
    - Procurement Amount (Qty × Price)
    - Sales Amount (Qty × Price)
  - View multiple products on the same page (each with its own chart)
  - Time ranges: Week / Month / Year / Custom

### 🔹 Additional Features

- **Summary Board**
  - Display key KPIs such as total products, procurement total, sales total, low stock count, and out-of-stock alerts
  - Users can quickly understand warehouse-wide or per-product status
- **User Management**
  - Admin can manage users within the system (create, update, delete)
  - Full CRUD with search and sorting
- **Product Management**
  - Manage all products stored in the system
  - Full CRUD with search and sorting
- **Excel Data Validation**
  - Before importing, uploaded data can be previewed, checked, and corrected to avoid invalid entries
- **Password Encryption**
  - All user passwords are hashed before being saved
- **Multi-role Access Control**
  - Role-based Access Control (RBAC):
    - Regular users can manage product inventory
    - Admin users can additionally manage users

---

### 🔹 Non-functional Improvements

- **RBAC implementation** to ensure proper separation of privileges
- **Layered backend architecture** (controllers, services,DTOs & converters) for better maintainability
- **Coding style and conventions** enforced throughout the project
- **Consistent API Design**
  - Implemented a global API response wrapper to standardise success and error messages
  - All endpoints return a consistent structure (`code`, `message`, `data`), improving client-side integration
  - Centralised API handler ensures uniform error handling, reduces boilerplate, and makes the backend more maintainable

## 🛠 Tech Stack

### 🔹 Frontend

- **Next.js (App Router)** — React framework for routing, SSR, and API endpoints
- **React** — Component-based UI development
- **Recharts** — Interactive charts for data visualisation
- **TailwindCSS** — Utility-first CSS framework for responsive, clean UI

### 🔹 Backend

- **Next.js API Routes** — Used as lightweight backend endpoints
- **Prisma ORM** — Database schema & queries
- **bcryptjs** — Password hashing and secure authentication
- **RBAC (Role-Based Access Control)** — Implemented custom roles (admin, user)
- **Centralised API Handler** — Unified response format & error handling

### 🔹 Database

- **MySQL** — Eliable ACID relational DB with strong indexing/joins and a mature ecosystem, Prisma-ready for type-safe queries and easy migrations. Ideal for this project: clean product↔user↔order modeling, transactional Excel/CSV bulk imports, fast KPI/report queries (filters/totals/trends), easy scaling, and mature backups—fits seamlessly with Next.js API + Prisma.

### 🔹 Infrastructure & Deployment

- **AWS Amplify** — Zero-ops CI/CD and hosting for the web app; preview deployments, and HTTPS.
- **Amazon RDS for MySQL** — Fully managed MySQL with Multi-AZ HA, automated backups, and point-in-time recovery.
  
### 🔹 Tooling & Libraries

- **xlsx** — Excel file parsing and validation
- **ESLint + Prettier** — Code formatting & linting
- **TypeScript** — Type-safe development

## 📂 Project Structure
```
src/
├─ app/                                 # Next.js App Router (pages & layouts)
│  ├─ (private)/                        # Auth-protected area (guarded by middleware/guards)
│  │  ├─ dashboard/                     # Dashboard page (KPIs, charts)
│  │  ├─ products/                      # Products module entry + child routes
│  │  │  ├─ new/                        # Create product page
│  │  │  └─ [id]/                       # Dynamic route: view/edit a specific product
│  │  └─ users/                         # User management page (list/CRUD)
│  ├─ login/                            # Login page (posts to /pages/api/auth)
│  └─ logout/                           # Logout page (clears session then redirects)
├─ common/
│  └─ auth/                             # Shared auth helpers (cookie/token utilities, guards)
├─ components/                          # Reusable UI components & page sections
│  ├─ dashboard/                        # Dashboard-specific components (KPI cards, charts)
│  ├─ products/                         # Product components (forms, tables, filters)
│  └─ sidebar/                          # Sidebar navigation & layout shell
├─ dtos/                                # Data Transfer Objects (types + mapping)
│  ├─ request_dtos/                     # Request DTOs (form/input validation & types)
│  └─ response_dtos/                    # Response DTOs (API response models)
├─ hooks/                               # Custom React hooks (data fetching, form state, etc.)
├─ lib/                                 # General libraries (Prisma, HTTP wrapper, helpers)
├─ pages/                               # Next.js Pages Router (used here only for API routes)
│  └─ api/                              # Serverless API endpoints (Node/Edge)
│      ├─ admin/                        # Admin endpoints (stats, configs)
│      ├─ auth/                         # Auth endpoints (login, logout, session check)
│      ├─ products/                     # Product endpoints
│      │  ├─ import/                    # Bulk import (e.g., Excel/CSV upload & processing)
│      │  └─ [id]/                      # Product detail/update/delete (RESTful)
│      └─ users/                        # User endpoints (list/create/update/delete)
├─ services/                            # Business service layer (DB/third-party integrations)
├─ types/                               # Global TypeScript types & enums (avoid cycles)
└─ utils                                # Utility functions (formatting, dates, constants)

Notes:

Routing strategy: App UI uses app/ (App Router). Backend endpoints live under pages/api/ (serverless). They run side-by-side.

Private area: Pages in app/(private) check auth (e.g., read a token or pass middleware) before render.

DTOs & services: Components/pages depend on DTO types and the services layer instead of raw DB access to keep concerns clean.

Dynamic routes: [id] folders indicate dynamic params (e.g., /products/123).

Import flow: /pages/api/products/import handles uploads & batch ingestion, typically paired with a front-end upload form/drag-drop.

```

## ⚙️ Getting Started

### 1. Clone the Repository
```
git clone https://github.com/FBB2021/Dashboard.git
cd Dashboard
```
### 2. Install Dependencies
```
npm install
```
### 3. Launch project
```
npm run dev
```
### 4. Testing users
```
- Admin user: admin@example.com | admin123
- General user: demo@example.com | user123
```
---

✅ That's it

This project demonstrates a complete end-to-end solution for data import, visualisation, and management.
Thank you for your time and consideration.
