# MERN Quantum

MERN Quantum is a JavaScript-only full-stack app for interactive quantum circuit simulation.

## What You Can Do

- Build circuits with `H`, `X`, `M`, and `CNOT` gates.
- Run simulations with configurable shots.
- Execute circuits in step-by-step educational mode.
- Save circuits and templates with JWT-based authentication.
- Browse public templates and personal dashboard data.

## Architecture

- `frontend`: React + Vite client.
- `backend`: Express + Mongoose API.
- `frontend/src/features`: feature-first modules:
	- `multi-run`
	- `circuit-builder`
	- `templates`
	- `step-by-step`

## Tech Stack

- Frontend: React 19, Vite 8, Bootstrap 5.
- Backend: Node.js, Express 5, Mongoose 9.
- Auth: JWT (access + refresh cookies), bcrypt.
- Testing: Vitest + Supertest + mongodb-memory-server.

## Setup

1. Clone and install:

```bash
git clone https://github.com/mattiagiuliani/mern-quantum.git
cd mern-quantum
npm install
npm install --workspace=backend
npm install --workspace=frontend
```

2. Configure env files.

`backend/.env`:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Run

```bash
npm run dev:backend
npm run dev:frontend
```

Open `http://localhost:5173`.

## Test

```bash
npm run test:backend
npm run test:frontend
```

Note: integration route tests use `mongodb-memory-server` and may fail if local binary cache/download is corrupted.

## API Docs

Detailed backend endpoints are documented in `backend/API.md`.

## Feature Docs

- `frontend/src/features/multi-run/README.md`
- `frontend/src/features/circuit-builder/README.md`
- `frontend/src/features/templates/README.md`
- `frontend/src/features/step-by-step/README.md`

## License

MIT License © 2026 Mattia Giuliani
