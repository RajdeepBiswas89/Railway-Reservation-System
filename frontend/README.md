# RAILNEX Frontend

React, TypeScript, and Vite frontend for the RAILNEX railway reservation system. Authentication, station lookup, train search, and bookings use the FastAPI backend; PostgreSQL is the system of record.

## Run locally

Prerequisites: Node.js and the backend running at `http://127.0.0.1:8000`.

1. Install dependencies with `npm install`.
2. Copy [.env.example](.env.example) to `.env.local` if the API is not at the default URL, then set `VITE_API_BASE_URL` to the backend API base (for example, `http://127.0.0.1:8000/api`).
3. Start the frontend with `npm run dev` (Vite serves at port 3000).

The backend must have a valid PostgreSQL connection configured in its local environment. Do not place database credentials or payment secrets in frontend environment variables; Vite variables are exposed to the browser.
