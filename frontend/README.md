# Frontend App

This React frontend provides the user interface for the school inventory and property management system.

## Local development setup

```bash
cd frontend
npm install
cp .env.example .env
```

Set the backend URL in your local `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Then start the app:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Useful commands

```bash
npm run lint
npm run build
npm run preview
```

## Notes

- This app expects the Laravel backend to be running on `http://localhost:8000` in development.
- The frontend should not be configured for production values in local setup files.
- Production deployment values belong in the hosting environment, not in the app documentation.
