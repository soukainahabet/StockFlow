# StockFlow — Frontend

Modern SaaS frontend for the **StockFlow** stock management platform. Built with React 19, TypeScript, Vite, Tailwind CSS, React Query and Recharts. Connects to the existing Spring Boot backend via REST + JWT.

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** (Pro SaaS palette: blue primary `#2563EB`, slate secondary)
- **React Router DOM 7** (private routes + role guards)
- **@tanstack/react-query** (server state, caching, mutations)
- **Axios** (typed API client + JWT interceptor + 401 auto-logout)
- **Recharts** (dashboard charts)
- **react-hot-toast** (notifications)
- **lucide-react** (icons)

## Getting started

```bash
npm install
npm run dev
```

The app runs at <http://localhost:5173> and proxies `/auth/**` and `/api/**` to the backend at `http://localhost:8080` (see `vite.config.ts`).

For a production build:

```bash
npm run build
npm run preview
```

## Project structure (feature-based)

```
src/
├── app/                  # Root <App/> + QueryClient
├── components/
│   ├── layout/           # DashboardLayout, Sidebar, Topbar
│   └── ui/               # Modal, Pagination, Spinner, ConfirmDialog, …
├── features/
│   ├── auth/             # AuthContext, Login, Register
│   ├── dashboard/
│   ├── products/
│   ├── categories/
│   ├── ventes/
│   ├── stock/
│   ├── users/
│   └── roles/
├── routes/               # AppRoutes, PrivateRoute, RoleGuard
├── services/             # api.ts (axios), authService, dashboardService
├── types/                # Backend DTO type definitions
├── utils/                # storage (token), formatters
└── main.tsx
```

## Authentication

JWT is stored in `localStorage` (key `stockflow.token`). The Axios interceptor attaches `Authorization: Bearer <token>` on every request and triggers an automatic logout on `401`. On boot, `AuthContext` validates the stored token via `GET /api/profile`.

## RBAC

Four roles supported: `ADMIN`, `STOCK_MANAGER`, `SELLER`, `MANAGER`.

- `<PrivateRoute />` — any authenticated user
- `<RoleGuard allowed={["ADMIN"]} />` — restricts a route subtree

UI affordances (action buttons, sidebar entries) are also gated client-side via `useAuth().hasRole(...)`. The backend remains the source of truth.

## Demo accounts (dev profile)

| Email                   | Password   | Role           |
|-------------------------|------------|----------------|
| admin@stockflow.com     | admin123   | ADMIN          |
| stock@stockflow.com     | stock123   | STOCK_MANAGER  |
| seller@stockflow.com    | seller123  | SELLER         |
| manager@stockflow.com   | manager123 | MANAGER        |

## Environment

Copy `.env.example` to `.env` if you want to point at a different backend URL. In dev, leaving it empty is fine — the Vite proxy handles it.
