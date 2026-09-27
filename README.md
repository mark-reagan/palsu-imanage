# School Inventory & Property Management System

A full-stack web application for managing school equipment and supplies inventory, requests, and workflows. Built with Laravel 13 (PHP 8.4) backend and React 18 + Vite frontend.

## Overview

This system enables schools to efficiently manage:

- **Equipment & Supplies Inventory** — track assets with QR codes and barcodes
- **Request & Reservation Workflow** — faculty/staff request equipment/supplies with approval process
- **Release & Return Workflow** — staff manage equipment check-out/check-in with condition tracking
- **QR Code Scanning** — fast asset verification during release/return
- **Concern & Damage Reporting** — users report issues; admins review and resolve
- **Role-Based Access** — distinct dashboards and permissions for Admin, Staff, Faculty, and Outsider/LGU users
- **Reporting & Analytics** — admin dashboard with inventory reports and request metrics

---

## Stack

### Backend

- **Framework**: Laravel 13.17
- **Language**: PHP 8.4
- **Database**: SQLite (default) or configurable via `.env`
- **Auth**: Laravel Sanctum (token-based)
- **API Docs**: Scribe (auto-generated)
- **QR Generation**: endroid/qr-code 6.0
- **Testing**: PHPUnit 12.5

### Frontend

- **Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS 3.4
- **Router**: React Router v6
- **Barcode/QR Scanning**: jsbarcode, @zxing/browser
- **Linting**: ESLint 9 (flat config)

---

## Project Structure

```
christian-bundac/
├── backend/                     # Laravel API
│   ├── app/
│   │   ├── Models/             # Equipment, Supply, Request, User, etc.
│   │   ├── Http/Controllers/   # API endpoints
│   │   └── Traits/             # Shared model/controller logic
│   ├── database/
│   │   ├── migrations/         # Schema
│   │   └── seeders/            # Default data (admin, staff accounts)
│   ├── routes/
│   │   └── api.php             # API route definitions
│   ├── config/                 # sanctum, filesystems, logging, scribe
│   ├── tests/                  # PHPUnit tests
│   ├── composer.json
│   └── README.md               # Backend-specific setup
│
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── app/               # App.jsx (root), routes.jsx
│   │   ├── layouts/           # AuthLayout, AppLayout (sidebar)
│   │   ├── components/ui/     # Shared UI (buttons, modals, tables)
│   │   ├── lib/               # apiClient.js, format.js, constants.js
│   │   ├── hooks/             # useApiRequest, useApiAction
│   │   └── features/          # Feature-based modules:
│   │       ├── auth/
│   │       ├── dashboard/
│   │       ├── equipment/
│   │       ├── supplies/
│   │       ├── equipment-requests/
│   │       ├── supply-requests/
│   │       ├── release-return/
│   │       ├── qrcode/
│   │       ├── concerns/
│   │       ├── notifications/
│   │       ├── users/
│   │       ├── reports/
│   │       └── profile/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── eslint.config.js
│   ├── .env.example
│   ├── vercel.json            # SPA routing config for Vercel
│   └── README.md              # Frontend-specific setup
│
└── .git/
```

---

## Quick Start

### Prerequisites

- **PHP 8.4+** with composer
- **Node.js 18+** with npm
- **SQLite** or a configured database (MySQL, PostgreSQL)

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed  # Optional: seed admin/staff accounts

# Start dev server
php artisan dev
```

API runs on `http://localhost:8000`

**Default test accounts** (from seeder):
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.edu | password123 |
| Staff | staff@school.edu | password123 |

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`

Edit `.env` if your backend API isn't on the default host:

```
VITE_API_URL=http://localhost:8000/api
```

### Production Build

```bash
npm run build      # Output → dist/
npm run preview    # Test production build locally
```

---

## Architecture Highlights

### Backend (Laravel)

- **RESTful API** with standardized response formats
- **Token-based auth** via Sanctum (bearer tokens in `Authorization` header)
- **Eloquent ORM** with model relationships (Equipment → Requests, Concerns, etc.)
- **Auto-generated API docs** via Scribe (`/api/documentation`)
- **Role-based middleware** to protect endpoints (admin-only, staff-only, etc.)
- **Database migrations** for schema versioning
- **Seeders** for test data initialization

### Frontend (React + Vite)

- **Feature-based architecture** — each domain (equipment, requests, concerns) owns its API client, pages, and modals
- **Role-aware routing** via `ProtectedRoute` and `PublicOnlyRoute` guards
- **Code splitting** — every route is lazy-loaded with `React.lazy()` behind a `<Suspense>` boundary
- **Error boundaries** — app-level + page-level, so a crash on one page doesn't blank the UI
- **Generic data-fetching hooks** (`useApiRequest`, `useApiAction`) — no Redux/Zustand needed at this scale
- **Tailwind CSS** with purge enabled — production CSS is minimal
- **ESLint + flat config** for modern linting

---

## Key Features

### Equipment & Supplies Management

- Create, read, update, disable equipment/supplies
- Track total and available quantities
- Auto-generate QR codes and barcodes
- Condition tracking (New, Good, Fair, Poor)
- Categorize assets (Lab, Sports, Furniture, etc.)

### Request & Approval Workflow

- Faculty/staff request equipment or supplies
- Set start/end dates for equipment reservations
- Admin/staff approve, decline, or cancel requests
- Automatic availability checks

### Release & Return (Staff Only)

- QR/barcode scan to verify equipment
- Release from approved request to requester
- Accept returns with condition assessment
- Update inventory quantities

### QR Code Scanning

- Fast asset lookup via QR scan
- View equipment details and availability
- See pending release requests

### Damage & Concerns

- Users report damage or issues
- Attach photos and descriptions
- Admin dashboard to review and resolve
- Track resolution status

### Admin Dashboard & Reports

- Request metrics (pending, approved, completed)
- Equipment availability overview
- Concern tracking and resolution
- User activity logs

### Role-Based Access

| Role             | Permissions                                                       |
| ---------------- | ----------------------------------------------------------------- |
| **Admin**        | All features; user management; reports; approval workflows        |
| **Staff**        | Inventory viewing; release/return; QR scanning; concern reporting |
| **Faculty**      | Request equipment/supplies; view own requests; concern reporting  |
| **Outsider/LGU** | Limited supply requests; view own requests                        |

---

## Deployment

### Vercel (Frontend)

```bash
npm run build
# Deploy dist/ to Vercel
```

The `vercel.json` file is pre-configured with SPA rewrite rules — all routes redirect to `index.html` for client-side routing.

### Backend (Heroku, DigitalOcean, AWS, etc.)

1. Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`
2. Run migrations: `php artisan migrate --force`
3. Generate optimized autoloader: `composer install --optimize-autoloader`
4. Start with your server (e.g., `php artisan serve` or via your host's process manager)

Realtime notifications require separate persistent `php artisan reverb:start`
and `php artisan queue:work` services. Configure matching backend `REVERB_*`
and frontend `VITE_REVERB_*` values, and allow the frontend origin in
`FRONTEND_URLS`. The HTTP API container alone does not run these processes;
when Reverb is unavailable, the client periodically refreshes notifications as
a fallback.

---

## Testing

### Backend

```bash
cd backend
php artisan test
```

### Frontend

No automated tests in the initial build, but you can add Jest/Vitest:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

---

## API Documentation

Auto-generated Scribe docs are available at `/api/documentation` once the backend is running.

Key endpoints include:

- `POST /api/auth/login` — User login
- `GET /api/equipment` — List equipment
- `POST /api/equipment-requests` — Request equipment
- `POST /api/equipment-requests/{id}/approve` — Approve request
- `POST /api/equipment/{id}/release` — Release equipment to requester
- `POST /api/equipment/{id}/return` — Accept return
- `GET /api/concerns` — List damage/concerns

See `backend/routes/api.php` for the full route list.

---

## Configuration

### Backend `.env`

```env
APP_NAME="School Inventory"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...              # Generate with `php artisan key:generate`

DB_CONNECTION=sqlite            # or mysql, pgsql
DB_DATABASE=database.sqlite

SANCTUM_STATEFUL_DOMAINS=...   # Your frontend domain

# CRITICAL: QR code generation requires the frontend URL to be set
# Without this, QR codes for equipment/supply request tracking will fail to generate
FRONTEND_URLS=https://your-frontend-domain.com
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Troubleshooting

### QR Codes Not Generating (Local or Deployment)

**Root Cause**: The backend's `FRONTEND_URLS` environment variable is not set or is incorrectly configured.

**Fix**:

1. In your backend `.env` file, ensure `FRONTEND_URLS` is set to your frontend's public URL:

   ```env
   # For local development
   FRONTEND_URLS=http://localhost:5173

   # For production
   FRONTEND_URLS=https://your-frontend-domain.com
   ```

2. Restart your backend server:

   ```bash
   php artisan serve  # or your deployment process
   ```

3. Test by visiting an equipment or supply request tracking page — the "QR" link should now work and render an image.

**Why this matters**: QR codes on equipment/supply request pages are generated by the `/api/v1/public/requests/{token}/qr` endpoint, which encodes the frontend's tracking URL. If the frontend URL is not configured, the endpoint cannot build a valid tracking URL to encode into the QR image, causing the QR generation to fail silently or return an error.

---

## Known Issues & Notes

### Backend

- `QrCodeController::scan()` doesn't eager-load the `user` relation on pending release requests. The requester name shows a fallback until you add `->with('user')` to that query. Purely cosmetic.

### Frontend

- Built in a sandboxed environment without outbound network access — the code was carefully reviewed (imports, hook dependencies, API keys) but please run `npm run build` locally before deploying to verify the build succeeds.
- No automated tests in the initial release, but the codebase is test-ready.

---

## Contributing & Maintenance

- **Code style** — Backend: PSR-12 via Laravel Pint (`composer run lint`). Frontend: ESLint (flat config).
- **Database** — Migrations are version-controlled in `database/migrations/`; always create new migrations for schema changes.
- **API stability** — Maintain backwards compatibility or version endpoints (e.g., `/api/v2/...`) if breaking changes are needed.
- **Frontend components** — Shared UI lives in `components/ui/` (buttons, modals, tables); feature-specific modals live with their feature.

---

## License

MIT

---

## Support & Feedback

For issues, questions, or suggestions, please open an issue in this repository or contact the project maintainers.
