# School Inventory & Property Management System

A full-stack application for managing equipment and supplies inventory, staff requests, approvals, release/return workflows, concerns, and role-based access for a school or organization.

## Overview

This app helps staff and administrators manage:

- inventory for equipment and supplies
- request and approval workflows
- item release and return tracking
- QR/barcode-based lookup and verification
- damage and issue reporting
- role-based dashboards for admin, staff, faculty, and outsider users

## Stack

- Backend: Laravel 13 + PHP 8.4 + Sanctum
- Frontend: React 18 + Vite + Tailwind CSS
- Database: SQLite by default, or MySQL/PostgreSQL via environment config

## Project structure

```bash
backend/   # Laravel API
frontend/  # React app
```

## Local development setup

### 1) Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

The API runs at `http://localhost:8000`.

Default development accounts seeded by the app:

- Admin: `admin@school.edu` / `password123`
- Staff: `staff@school.edu` / `password123`

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Set the API URL in your local `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Then run:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## App features

- equipment and supply management
- request and approval workflows
- release and return tracking with condition updates
- QR code and barcode scanning
- reporting and dashboards
- concern handling and user notifications

## Useful checks

```bash
cd backend && php artisan test
cd frontend && npm run lint
cd frontend && npm run build
```

This repository is intended for local development and app setup only. Production deployment settings belong in the deployment environment, not in the app documentation.
