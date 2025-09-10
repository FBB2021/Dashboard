# 📊 Data Visualisation Dashboard

A web-based dashboard system for analysing **procurement, sales, and inventory history** of products.
This project was implemented as part of the *Coding Challenge – Data Visualisation Dashboard*.

Author: Feng Bao

Email: f.bao86@outlook.com

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

- **SQLite (dev)** — Lightweight local database for prototyping
- **MySQL / PostgreSQL (prod-ready)** — Prisma-supported relational DBs

### 🔹 Infrastructure & Deployment

- **Vercel** (optional) — For fast frontend + backend hosting
- **Docker** (optional) — Containerised local development

### 🔹 Tooling & Libraries

- **xlsx** — Excel file parsing and validation
- **ESLint + Prettier** — Code formatting & linting
- **TypeScript** — Type-safe development

## 📂 Project Structure
```
src/
├─ app/                     # Next.js App Router pages
│  ├─ (private)/            # Auth-protected routes
│  │  ├─ dashboard/         # Dashboard (summary board + charts)
│  │  ├─ products/          # Product management
│  │  │  ├─ new/            # Create product page
│  │  │  └─ [id]/           # Product detail/edit page
│  │  └─ users/             # User management
│  ├─ login/                # Login page
│  └─ logout/               # Logout page
│
├─ common/
│  └─ auth/                 # Authentication helpers (RBAC, session utils)
│
├─ components/
│  ├─ dashboard/            # Dashboard-specific UI components
│  ├─ products/             # Product UI components (tables, forms, cards)
│  └─ sidebar/              # Sidebar navigation component
│
├─ dtos/
│  ├─ request_dtos/         # Data Transfer Objects for requests
│  └─ response_dtos/        # Data Transfer Objects for API responses
│
├─ hooks/                   # Custom React hooks
│
├─ lib/                     # Shared libraries (Prisma client, configs)
│
├─ pages/
│  └─ api/                  # Next.js API routes (backend logic)
│      ├─ admin/            # Admin-related APIs (user management, RBAC)
│      ├─ auth/             # Auth APIs (login, logout, session)
│      ├─ products/         # Product APIs
│      │  ├─ import/        # Excel import endpoint
│      │  └─ [id]/          # Product detail API
│      └─ users/            # User CRUD APIs
│
├─ services/                # Business logic (user service, product service)
│
├─ types/                   # TypeScript type definitions
│
└─ utils/                   # Utility functions (date formatter, Excel parser, etc.)
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
