<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Deploying the API to Render with Docker

Create a Render **Web Service** from this repository, set **Root Directory** to `backend`, and select **Docker** as the runtime. Render will build `backend/Dockerfile`; the container serves Laravel's `public/` directory and listens on Render's assigned `PORT`. The `/up` endpoint is available as a health check.

Set these environment variables in Render (use your actual service/domain values):

- `APP_ENV=production`, `APP_DEBUG=false`, and a persistent `APP_KEY` generated with `php artisan key:generate --show`.
- `APP_URL=https://<your-render-service>.onrender.com`.
- `FRONTEND_URL` and `FRONTEND_URLS` to the Vercel origin, e.g. `https://<your-app>.vercel.app` (no path).
- `DB_CONNECTION=mysql` and the `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` values for a MySQL database reachable from Render. Do not use `127.0.0.1` for a remote database.
- `LOG_CHANNEL=stderr`.

The Docker entrypoint runs `php artisan migrate --force` and `php artisan db:seed --force` before Apache starts, so migrations and seeders run automatically on Render deployments, including the Free plan where Shell and pre-deploy commands may be unavailable. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Render to create the production admin account; optionally set `STAFF_EMAIL` and `STAFF_PASSWORD` to create a staff account. Use strong unique passwords. Without these variables, the seeder skips those accounts in production rather than using the development-only default credentials. Seeding uses `firstOrCreate`, so it will not change passwords on existing accounts. A migration or seeding failure stops the container from serving requests; check deploy logs and database connectivity if startup fails. Render's local filesystem is ephemeral; use a managed database and durable object storage if the app later needs persistent uploads.

The Docker image explicitly installs PHP GD (for PNG QR generation) and `pdo_mysql`, and Composer verifies those requirements during image build. To build and smoke-test locally, run `docker build -t inventory-api .` from `backend/`, then start the container with a valid `.env`/database configuration and verify `GET /up`.

## Realtime notifications

Notifications use Laravel Reverb and authenticated private user channels. Set
`BROADCAST_CONNECTION=reverb` and configure `REVERB_APP_ID`,
`REVERB_APP_KEY`, `REVERB_APP_SECRET`, `REVERB_HOST`, `REVERB_PORT`, and
`REVERB_SCHEME` in the backend environment. The frontend build needs matching
`VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, and
`VITE_REVERB_SCHEME` values. Ensure `FRONTEND_URLS` contains each allowed
frontend origin.

For live delivery, deploy `php artisan reverb:start` as a persistent WebSocket
service and `php artisan queue:work` as a persistent worker. Expose Reverb over
TLS in production. The frontend keeps periodic notification refresh as a
fallback if the WebSocket is unavailable.
