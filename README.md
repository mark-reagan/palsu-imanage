# School Inventory & Property Management System

A local full-stack web application for managing school equipment and supplies, request approvals, item releases and returns, equipment concerns, and user access by role.

## About the web app

The system provides dedicated workflows for administrators, staff, faculty, and outsiders:

- Maintain equipment and supply inventories.
- Submit, review, approve, decline, and track inventory requests.
- Record equipment releases, returns, and condition updates.
- Look up requests and inventory using QR codes and barcodes.
- Report and review equipment damage or other concerns.
- View dashboards, reports, and notifications appropriate to each role.

## Technology

- Backend: Laravel 13, PHP 8.4, Sanctum
- Frontend: React 18, Vite, Tailwind CSS
- Database: SQLite by default; local MySQL or PostgreSQL can be configured through the backend environment.

The repository is organized into `backend/` for the Laravel API and `frontend/` for the React application.

## Local development

### Backend

From the repository root:

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

The local API is available at `http://localhost:8000`.

Seeded local accounts:

- Admin: `admin@school.edu` / `password123`
- Staff: `staff@school.edu` / `password123`

### Frontend

In another terminal, from the repository root:

```sh
cd frontend
npm install
cp .env.example .env
```

Set the local API endpoint in `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Start the local development server:

```sh
npm run dev
```

The frontend is available at `http://localhost:5173`.

## Local checks

```sh
cd backend && php artisan test
cd frontend && npm run lint
cd frontend && npm run build
```
