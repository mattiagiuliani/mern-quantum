# mern-quantum · Frontend

React 19 + Vite 6 single-page application for the mern-quantum circuit simulator.

## Stack

- **React 19** with React Router 7 (SPA routing)
- **Vite 6** (dev server + production build)
- **Bootstrap 5** + CSS Modules for styling
- **Vitest** + Testing Library for unit tests
- **ESLint** (flat config, `eslint.config.js`)

## Local development

```bash
# From the repo root (recommended — uses npm workspaces)
npm run dev:frontend

# Or directly inside this directory
npm run dev
```

The dev server starts at **http://localhost:5173**.

## Environment variables

Create `frontend/.env.local` (gitignored):

```env
VITE_API_URL=http://localhost:3001/api/v1
```

In production (Vercel / Docker) `VITE_API_URL` is injected as a build arg.

## Build

```bash
# From the repo root
npm run build --workspace=frontend

# Or directly
npm run build
```

Output goes to `frontend/dist/` (gitignored).

## Tests

```bash
# Unit tests
npm run test --workspace=frontend

# Unit tests + coverage
npm run test:coverage --workspace=frontend

# E2E (from repo root, requires both services running)
npm run test:e2e
```

## Project structure

```
frontend/
├── src/
│   ├── api/            # Axios instance + per-feature API modules
│   ├── components/     # Shared UI components (Navbar, ErrorBoundary …)
│   ├── context/        # AuthContext (user session)
│   ├── features/       # Feature modules: templates, simulation …
│   ├── hooks/          # Custom hooks (useCircuit, useAuth …)
│   ├── pages/          # Route-level page components
│   └── styles/         # Global CSS variables and resets
├── public/             # Static assets served as-is
├── index.html          # Vite entry point
├── vite.config.js
└── eslint.config.js
```

## Deployment

Deployed automatically to **Vercel** on every push to `main`.
See `vercel.json` at the repo root for build / rewrite configuration.
