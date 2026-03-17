# Data Visualisation Dashboard

A full-stack web dashboard for analysing product procurement, sales, and inventory trends.

This project was built as an end-to-end data visualisation system that transforms Excel-based business records into structured, interactive insights. Users can upload procurement and sales data, validate records before import, and explore KPIs and trend charts through a clean dashboard interface.

## Overview

In many small and medium-sized business scenarios, procurement, sales, and inventory data are often stored in spreadsheets, which makes long-term tracking and operational analysis difficult.

This dashboard solves that problem by providing a system where users can:

- upload Excel files containing procurement and sales history
- validate and correct records before import
- track inventory trends over time
- compare procurement amount, sales amount, and stock movement
- monitor warehouse and product-level KPIs through charts and summary cards

## Key Highlights

- Built a complete **full-stack dashboard** using Next.js, TypeScript, Prisma, and MySQL
- Designed an **Excel import and validation workflow**, not just a simple file upload
- Implemented **interactive time-series charts** for inventory, procurement amount, and sales amount
- Added **role-based access control (RBAC)** with separate admin and general user permissions
- Applied a **layered backend structure** with DTOs, services, and a centralised API response handler
- Deployed the project using **AWS Amplify** and **Amazon RDS**

## My Contribution

I designed and implemented the project end to end, including:

- frontend dashboard pages and reusable UI components
- backend API routes and business logic
- Prisma data model and MySQL schema
- authentication and password encryption
- role-based access control
- Excel parsing, validation, preview, and batch import
- KPI calculation and chart-ready data transformation
- deployment setup and environment configuration

## Features

### Core Features

- **User Authentication**
  - Login with username/email and password
  - Passwords securely stored using bcrypt hashing

- **Excel Import**
  - Upload Excel files containing product procurement and sales history
  - Parse and store data into the database

- **Interactive Dashboard**
  - Visualise product history with charts
  - Each product includes:
    - Inventory over time
    - Procurement Amount (Qty × Price)
    - Sales Amount (Qty × Price)
  - Support for multiple products on the same page
  - Time filters: Week / Month / Year / Custom

### Additional Features

- **Summary Board**
  - Display key KPIs such as:
    - total products
    - total procurement amount
    - total sales amount
    - low stock count
    - out-of-stock alerts

- **User Management**
  - Admin can create, update, delete, search, and sort users

- **Product Management**
  - Manage all products stored in the system
  - Full CRUD with search and sorting

- **Excel Data Validation**
  - Preview and validate uploaded data before importing
  - Reduce invalid entries and improve data quality

- **Multi-role Access Control**
  - Regular users can manage product inventory
  - Admin users can additionally manage users

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts

### Backend
- Next.js API Routes
- Prisma ORM
- bcryptjs
- Custom RBAC
- Centralised API response handler

### Database
- MySQL

### Infrastructure & Deployment
- AWS Amplify
- Amazon RDS for MySQL

### Tooling & Libraries
- xlsx
- ESLint
- Prettier

## Engineering Focus

This project was built with maintainability and practical business use in mind. Key engineering considerations include:

- clear separation between UI, API, services, and DTOs
- consistent API response structure
- secure password storage
- validation before data persistence
- relational schema suitable for transactional data and reporting
- role separation for system administration and daily operations

## Live Demo

### App
`https://main.djdzb40a8m63f.amplifyapp.com`

### API Base
`https://main.djdzb40a8m63f.amplifyapp.com/api`

### Health Check
`GET /api/health`

## Demo Accounts

| Role         | Email             | Password  |
|--------------|------------------|-----------|
| Admin        | admin@example.com | admin123  |
| General User | demo@example.com  | user123   |

> After login, users will be redirected to `/dashboard`.

---

# Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/FBB2021/Dashboard.git
cd Dashboard
