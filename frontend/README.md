# School Inventory Property Management System — Frontend

A React (JS, Vite) + Tailwind CSS frontend for the Laravel API, using a
**feature-based architecture** and role-aware routing for Admin, Staff,
Faculty, and Outsider/Municipal/LGU users.

---

## 1. Install & configure

```bash
cd school-inventory-frontend
npm install
cp .env.example .env
```

Edit `.env` if your API isn't on the default host:

```
VITE_API_URL=http://localhost:8000/api/v1
```

## 2. Run it

```bash
npm run dev       # local dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build locally
npm run lint       # ESLint
```

`npm run build` outputs a minified, tree-shaken bundle to `dist/`, with
`vendor` (React/Router) split into its own chunk and every route lazy-loaded
(see below), plus a minified CSS file produced from Tailwind's purge.

## Deploy to Cloudflare Pages

Create a Pages project with these settings (the repository contains the
frontend in the `frontend/` subdirectory):

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** 20.19 or newer
- **Build environment variable:** `VITE_API_URL=https://<your-api-host>/api/v1`

Set `VITE_API_URL` in the Pages project for both production and preview
deployments as needed. Set the production value only in Cloudflare Pages
project settings; do not put the production hostname in source files. The
production build fails if `VITE_API_URL` is missing or points to localhost.
The variable is embedded in the browser bundle at build time, so it is a public
endpoint rather than a secret; never include credentials or secrets in it.
Local development uses localhost by default. Do not rely on a local
`.env.production` file in Cloudflare builds.
The app uses browser-side routes; Cloudflare Pages serves the SPA fallback
automatically when the output has no `404.html`.

The Laravel API must also allow the deployed Pages domain(s) in its
`FRONTEND_URLS` environment variable for CORS. Include preview domains only
if previews are expected to call the API.

For realtime notifications, configure `VITE_REVERB_APP_KEY`,
`VITE_REVERB_HOST`, `VITE_REVERB_PORT`, and `VITE_REVERB_SCHEME` in the
frontend build environment to match the backend Reverb app. The backend must
also run `php artisan reverb:start` and a persistent `php artisan queue:work`
service; otherwise the notification API continues working using its periodic
refresh fallback, but updates will not be pushed live.

---

## Architecture

```
src/
  app/            App.jsx (providers, error boundary, router) + routes.jsx
  layouts/        AuthLayout, AppLayout (role-aware sidebar), navConfig.js
  components/ui/  Shared, presentation-only building blocks
  lib/             apiClient.js (fetch wrapper), format.js, constants.js
  hooks/           useApiRequest / useApiAction (generic data-fetching hooks)
  features/
    auth/               login, register, AuthContext, route guards
    dashboard/          role-specific landing pages (admin/staff/requester)
    equipment/           inventory CRUD + QR view (admin/staff/everyone-read)
    supplies/             inventory CRUD (admin/everyone-read)
    equipment-requests/  request + reservation, approve/decline/cancel
    supply-requests/     request, approve/decline/cancel
    release-return/       staff-only release & return workflow
    qrcode/                staff-only QR scan workflow
    concerns/              damage/concern reporting + admin review
    notifications/         notification bell (polling)
    users/                  admin user management
    reports/               admin dashboard/report tabs
    profile/                shared profile page
```

Each feature owns its own `api.js` (a thin wrapper around the shared
`lib/apiClient.js`), its page component(s), and any modals it needs — so a
feature can be understood, tested, or removed without touching unrelated
code. Shared, generic UI (buttons, modals, tables) lives in
`components/ui` and is feature-agnostic.

### Routing & role guards

`app/routes.jsx` defines every route in one place, using `React.lazy()` +
a single `<Suspense>` boundary (in `AppLayout`) for route-level code
splitting. `ProtectedRoute` (auth required, optional `roles` prop) and
`PublicOnlyRoute` (redirects already-logged-in users away from
`/login`/`/register`) compose with plain `react-router-dom` nesting — no
extra routing library needed. The sidebar's visible links
(`layouts/navConfig.js`) are filtered by the same role list used by the
route guards, so the nav and access rules can't drift apart.

### Data fetching

`hooks/useApiRequest.js` provides a small `useApiRequest(fetcher, deps)`
hook (loading/error/data/refetch) used by every list page, and
`useApiAction` for imperative mutations. No extra state-management or
data-fetching library was added — the API surface is small enough that a
~40-line hook keeps things simple and avoids unnecessary dependencies.

### Error handling

- `components/ui/ErrorBoundary.jsx` wraps the whole app in `App.jsx`, and
  a second instance wraps just the routed page content inside
  `AppLayout` (keyed by the current path, so it resets on navigation) —
  a crash in one page shows a "try again" panel instead of blanking the
  whole app, sidebar and header included.
- `lib/apiClient.js` throws a typed `ApiError` (message + status +
  Laravel's `errors` validation payload), and `components/ui/ErrorAlert.jsx`
  renders it consistently everywhere.

---

## Build & code quality

- **Clean build**: no `console.log`/`debugger`/TODO markers in the
  source, and every import was checked for usage (see the sandbox note
  above re: not being able to run the build directly here).
- **ESLint**: `eslint.config.js` uses the flat-config format (ESLint 9)
  with `eslint-plugin-react`, `-hooks`, and `-refresh`, mirroring the
  official Vite React template. Run `npm run lint`.
- **Error boundaries**: see above.

## Tailwind CSS optimization

- `tailwind.config.js` → `content: ['./index.html', './src/**/*.{js,jsx}']`
  so the production build purges every unused utility class.
- Vite's production build minifies the generated CSS automatically
  (no extra config needed) — check `dist/assets/*.css` after building.

## Performance & assets

- **Images**: the app is data/table-driven (no photography), so instead
  of raster assets it uses a single scalable vector logo (`public/logo.svg`)
  and a small set of purpose-generated PNG icons (favicons, touch icon,
  manifest icons — each just a few KB, generated at exact target sizes
  rather than scaled from a large source image). Every `<img>` in the app
  (the QR code image, the logo) has descriptive `alt` text.
- **Favicons & manifest**: `public/favicon.ico`, `favicon-16x16.png`,
  `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`,
  `icon-512.png`, and `public/manifest.json` are all wired up in
  `index.html`.
- **Lazy loading**: every route is `React.lazy()`-loaded (see
  `app/routes.jsx`) behind a single `<Suspense>` boundary, and
  `vite.config.js` splits `react`/`react-dom`/`react-router-dom` into a
  dedicated `vendor` chunk so route bundles stay small.

---

## Known minor backend note

`QrCodeController::scan()` doesn't eager-load the `user` relation on the
"awaiting release" request, so the requester's name will show a generic
"requester" fallback in the QR Scan page until you add `->with('user')`
to that query in the API project:

```php
$awaitingRelease = EquipmentRequest::with('user')
    ->where('equipment_id', $equipment->id)
    ->where('status', 'approved')
    ->orderBy('start_date')
    ->first();
```

Purely cosmetic — everything else (release/return actions, condition
checks, stock updates) works without it.

## Default accounts (from the API's seeder)

| Role  | Email            | Password    |
| ----- | ---------------- | ----------- |
| Admin | admin@school.edu | password123 |
| Staff | staff@school.edu | password123 |

Faculty and Outsider/LGU accounts self-register via the Register page.
