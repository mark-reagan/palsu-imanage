# Project Instructions for AI Contributors

This repository is a full-stack school inventory and property management system with a Laravel backend and a React + Vite frontend.

## 1. Project overview

- Root structure:
  - `backend/` — Laravel REST API
  - `frontend/` — React single-page application
- Backend stack: Laravel 13, PHP 8.4, Sanctum, SQLite default, PHPUnit
- Frontend stack: React 18, Vite, Tailwind CSS, React Router
- Primary concern: manage equipment, supplies, requests, release/return workflows, QR/barcode scanning, concerns, notifications, admin reporting, and role-based access

## 2. Architecture and repo structure

### Backend

Key directories:
- `backend/app/Models/` — Eloquent models, such as `User`, `Equipment`, `Supply`, request models, transactions, concern models
- `backend/app/Http/Controllers/Api/` — API controllers
- `backend/app/Http/Requests/` — request validation classes
- `backend/app/Http/Resources/` — JSON response shaping
- `backend/app/Http/Middleware/` — role checks and auth enforcement
- `backend/routes/api.php` — all API routes, grouped under `/api/v1`
- `backend/database/migrations/` — database schema changes
- `backend/database/seeders/` — default seed data
- `backend/tests/` — PHPUnit tests

Important backend conventions:
- All API routes are under `Route::prefix('v1')` in `backend/routes/api.php`.
- Authenticated endpoints require `auth:sanctum` and `active` middleware.
- Role protection is done through custom `role` middleware, not ad hoc checks in controllers.
- Admin-only resource actions are grouped under `Route::middleware('role:admin')`.
- Staff-only actions are grouped under `Route::middleware('role:staff')`.
- Public tracking routes exist for request status lookup without login.

### Frontend

Key directories:
- `frontend/src/app/` — app shell, route config, root app provider
- `frontend/src/features/` — per-domain feature modules (auth, dashboard, equipment, supplies, requests, release-return, QR scan, users, reports, profile, notifications, request tracking)
- `frontend/src/layouts/` — auth/app layout and navigation config
- `frontend/src/components/ui/` — reusable generic UI components (Button, Modal, Table, Input, Badge, etc.)
- `frontend/src/lib/` — shared utilities like `apiClient.js`, constants, formatting helpers
- `frontend/src/hooks/` — shared data-fetching hooks such as `useApiRequest` and `useApiAction`

Important frontend conventions:
- The app uses feature-based organization rather than a single giant page structure.
- Each feature owns its own API wrapper and UI components when practical.
- Route protection is centralized in `frontend/src/features/auth/ProtectedRoute.jsx` and `frontend/src/features/auth/PublicOnlyRoute.jsx`.
- Routing is defined in `frontend/src/app/routes.jsx` with lazy-loaded pages using `React.lazy()` and a single `Suspense` boundary.
- Shared API calls go through `frontend/src/lib/apiClient.js`, which attaches bearer tokens and normalizes Laravel validation errors.
- The frontend environment variable `VITE_API_URL` must be configured; production cannot point to localhost.

## 3. Core coding patterns

### Backend patterns

- Keep controllers thin and focused on request/response orchestration.
- Put validation logic in `app/Http/Requests/*`.
- Use `FormRequest` classes for input validation and authorization.
- Use resources when returning structured JSON responses.
- Respect Laravel naming conventions and model relationships.
- Prefer `Route::apiResource()` for standard CRUD endpoints and custom named actions for workflows such as approve, decline, release, and return.
- Use the existing role middleware pattern instead of creating ad hoc permission logic.
- Preserve the API response contract expected by the frontend: Laravel-style `{ message, data, errors? }` is common.

### Frontend patterns

- Keep feature modules isolated; do not place unrelated logic in a single page component.
- Use `useApiRequest` for read/list operations and `useApiAction` for mutations.
- Reuse shared UI primitives from `components/ui` before creating new generic components.
- Add new routes in `src/app/routes.jsx` and ensure the navigation config matches the access rules.
- Do not bypass the `apiClient` wrapper with raw `fetch` calls unless truly necessary.
- Keep route guards and nav rules aligned with the same role list.
- Maintain the existing lazy-loading and error boundary structure.

## 4. Environment and configuration

### Backend

- Typical local setup:
  - `cd backend`
  - `composer install`
  - copy `.env.example` to `.env` if needed
  - `php artisan key:generate`
  - `php artisan migrate`
  - `php artisan db:seed` if demo data is needed

- Common commands:
  - `php artisan serve`
  - `php artisan test`
  - `php artisan route:list`
  - `php artisan migrate:fresh --seed`

### Frontend

- Typical local setup:
  - `cd frontend`
  - `npm install`
  - `cp .env.example .env`
  - set `VITE_API_URL=http://localhost:8000/api/v1` in development

- Common commands:
  - `npm run dev`
  - `npm run build`
  - `npm run preview`
  - `npm run lint`

Important rules:
- Do not hardcode production API URLs in source files.
- Do not commit secrets or tokens to the repo.
- Do not set `VITE_API_URL` to localhost in production builds.
- The frontend is a browser app; any API URL is public by build-time embedding.

## 5. Role model and permissions

The application is role-aware. Respect these roles:
- `admin`
- `staff`
- `faculty`
- `outsider`

Common behavior:
- Admin manages users, inventory, approvals, reports, and reviews.
- Staff handles release/return workflows, QR scanning, and barcode actions.
- Faculty can request equipment and supplies and view their own request history.
- Outsider access is limited to relevant request flows.

When adding or modifying features, ensure that access control matches the intended role restrictions and corresponding routes.

## 6. How to add a feature safely

### Backend addition

1. Identify the correct feature area and route group in `backend/routes/api.php`.
2. Add or update the controller in `backend/app/Http/Controllers/Api/`.
3. Add validation rules in `backend/app/Http/Requests/` if the action accepts input.
4. Add or update model relationships if the feature uses data not already exposed.
5. Add or update resource classes when JSON structure must be standardized.
6. Add tests under `backend/tests/` for the new behavior.
7. Verify with `php artisan test` or the most relevant targeted test subset.

### Frontend addition

1. Create or extend the relevant feature folder under `frontend/src/features/`.
2. Add a thin API wrapper file (for example `api.js`) that uses `api` from `src/lib/apiClient.js`.
3. Build the page or modal using the shared hooks and UI primitives.
4. Register the route in `frontend/src/app/routes.jsx`.
5. Update navigation if the feature should appear in the sidebar (`frontend/src/layouts/navConfig.js` when applicable).
6. Ensure role gates match backend restrictions.
7. Run `npm run lint` and, when possible, `npm run build`.

## 7. Quality and safety rules

- Follow the existing project architecture and naming patterns.
- Do not create a new state management system unless it is clearly required.
- Reuse the current `apiClient`, `useApiRequest`, and `useApiAction` patterns.
- Keep changes focused and scoped to the relevant feature.
- Do not introduce unrelated refactors in the same patch.
- Preserve access controls and validation.
- Do not add debug logging, temporary debugging code, or inline console output in production code.
- Do not leave TODOs or placeholder implementations unless explicitly requested.

## 8. Validation commands to run before completion

At minimum:
- For backend changes: `cd backend && php artisan test`
- For frontend changes: `cd frontend && npm run lint`
- For production build checks: `cd frontend && npm run build`

If the change affects API contracts or route behavior, also confirm that the frontend still builds and the relevant flows remain accessible under the correct roles.

## 9. Default accounts and development notes

The seeded default accounts include:
- Admin: `admin@school.edu` / `password123`
- Staff: `staff@school.edu` / `password123`

Use these only for local testing and do not rely on them in production.

## 10. Summary for AI agents

When making changes in this repo:
- respect the Laravel API + React SPA split,
- follow the feature-based frontend structure,
- enforce role-based access consistently,
- use the shared API utilities instead of ad hoc network code,
- validate using the correct Laravel and Vite commands before finishing.

This project is intentionally organized around domain features and role boundaries. Changes should match those patterns rather than introducing a different architectural style.
