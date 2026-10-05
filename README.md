# RAILNEX

Rail reservation application with a React/Vite frontend, FastAPI API, and PostgreSQL source of truth.

## Deployment layout

- Frontend: Vercel, using the `frontend` directory as the project root.
- API: Render, using the included `render.yaml` blueprint (or another Python host).
- Database: managed PostgreSQL reachable from the API host. Vercel does not host this FastAPI/PostgreSQL backend as part of the static frontend deployment.

## Deploy the API

1. Provision a managed PostgreSQL database and allow the API host to connect to it.
2. Apply `database/RAILNEX_complete_postgresql.sql` to the empty database.
3. In Render, create a Blueprint from this repository and set `DATABASE_URL` and `CORS_ORIGINS` when prompted. Use the provider's internal database URL where available. `CORS_ORIGINS` must be a JSON array containing the exact Vercel origin, for example `["https://your-project.vercel.app"]`.
4. Keep the generated `JWT_SECRET`; do not place database credentials or JWT secrets in GitHub or Vercel frontend variables.
5. Wait for the API health endpoint (`/api/health`) to report a connected database.

## Deploy the frontend

1. Import the repository in Vercel and set the Root Directory to `frontend`.
2. Use `npm run build` as the build command and `dist` as the output directory (Vercel should detect Vite automatically).
3. Add the environment variable `VITE_API_BASE_URL` with the deployed API base URL, including `/api` and no trailing slash, such as `https://your-api.onrender.com/api`.
4. Deploy, then add the final Vercel origin to the API's `CORS_ORIGINS` JSON array and redeploy/restart the API.

## Local development

- Frontend: copy `frontend/.env.example` to `frontend/.env.local`, install dependencies in `frontend`, and run `npm run dev`.
- Backend: copy `backend/.env.example` to `backend/.env`, set your local database URL and a local-only JWT secret, install `backend/requirements.txt`, and run Uvicorn from the `backend` directory.
- Never commit `.env` files. Only the `.env.example` templates belong in Git.

## Push to GitHub

Create an empty repository on GitHub (do not initialize it with a README or license), then add that repository as the `origin` remote and push the `main` branch. Review `git status` first to ensure local environment files, virtual environments, and build artifacts are ignored.