# Inventory Management Cloud App

This workspace is now aligned to the business case:
A cloud app for small shops (grocery stores, pharmacies, local retailers) to manage inventory in real time.

## Tech Stack
- Backend: Node.js + Express + PostgreSQL
- Frontend: React (Vite)
- Database bootstrap: SQL file mounted with Docker Compose

## ERD Implemented
- `businesses`
  - `id (uuid, pk)`
  - `name`
  - `created_at`
- `users`
  - `id (uuid, pk)`
  - `email (unique)`
  - `password_hash`
  - `role`
  - `business_id (fk -> businesses.id)`
  - `created_at`
- `products`
  - `id (uuid, pk)`
  - `name`
  - `sku (unique)`
  - `price`
  - `quantity`
  - `category`
  - `business_id (fk -> businesses.id)`
  - `created_at`
  - `updated_at`

## API Contract Implemented
Base URL: `http://localhost:4000/api/v1`

### Auth
- `POST /auth/register`
  - Request: `email`, `password`, `business_name`
  - Response: `user_id`, `token`
- `POST /auth/login`
  - Request: `email`, `password`
  - Response: `token`

### Products (Bearer token required)
- `POST /products`
  - Request: `name`, `sku`, `price`, `quantity`, `category`
  - Response: `product_id`
- `GET /products`
  - Response: `products` array
- `GET /products/:id`
  - Response: `id`, `name`, `sku`, `price`, `quantity`, `category`
- `PUT /products/:id`
  - Request: `name`, `price`, `quantity`, `category`
  - Response: `status`
- `DELETE /products/:id`
  - Response: `status`

## Run Locally

### 1) Start PostgreSQL
From workspace root:

```bash
docker compose up -d
```

This starts PostgreSQL on host port `5433` with database `inventory_db`.

### 2) Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend URL: `http://localhost:4000`
Health check: `GET http://localhost:4000/api/v1/health`

### 3) Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`
API base can be overridden with `VITE_API_BASE_URL`.

## Environment Variables (Backend)
- `PORT` (default `4000`)
- `DB_HOST` (default `localhost`)
- `DB_PORT` (default `5433`)
- `DB_NAME` (default `inventory_db`)
- `DB_USER` (default `postgres`)
- `DB_PASSWORD` (default `postgres`)
- `JWT_SECRET` (default `dev-secret-change-me`, change this in production)

## Notes
If you need to reinitialize schema from `db/init.sql`, remove volumes first:

```bash
docker compose down -v
docker compose up -d
```
