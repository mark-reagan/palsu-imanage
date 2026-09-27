# Backend API

This Laravel backend powers the inventory, request, approval, release/return, and reporting workflows for the app.

## Local development setup

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

### Default development accounts

- Admin: `admin@school.edu` / `password123`
- Staff: `staff@school.edu` / `password123`

### Useful commands

```bash
php artisan test
php artisan route:list
php artisan migrate:fresh --seed
```

## Notes

- This app uses Laravel Sanctum for authentication.
- API routes are grouped under `/api/v1`.
- The frontend should point to `http://localhost:8000/api/v1` in local development.
- Production deployment configuration belongs in the hosting environment and should not be documented in the app setup guide.
