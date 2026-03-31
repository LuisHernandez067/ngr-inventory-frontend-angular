# NGR Inventory — Frontend

![Angular](https://img.shields.io/badge/Angular-21%2B-dd0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-224%20passing-brightgreen?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

Angular 21+ frontend for the **NGR Inventory** management system. Handles full inventory lifecycle: product catalog, warehouse and location management, stock tracking, movement registration (entries/exits/adjustments), physical counts with reconciliation, kardex, exportable reports, audit log, and user/role/permission administration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21+ (standalone components, no NgModules) |
| Language | TypeScript 5.9 (strict mode) |
| UI | Angular Material 21 + CDK |
| State | Angular Signals |
| HTTP | `HttpClient` with `withFetch()` + functional interceptor chain |
| Unit tests | Jest 30 + jest-preset-angular |
| E2E tests | Playwright 1.58 |
| Styles | SCSS |
| Deployment | nginx |

---

## Architecture

### Structural pattern

The project follows a **Feature-Sliced Design (FSD)**-inspired layered structure. Each layer has a strict dependency rule: outer layers may depend on inner ones, never the reverse.

```
shared → entities → features → widgets → pages → core
```

### Key patterns

- **Adapter/Mapper**: HTTP responses are mapped to domain models at the entity boundary. Raw DTOs never reach templates or business logic.
- **Permission-based access control**: Route guards (`authGuard`, `publicGuard`) protect navigation. A `*hasPermission` structural directive conditionally renders UI elements based on the current user's permissions.
- **HTTP Interceptor chain**: Three functional interceptors applied in order — `authInterceptor` (attaches credentials), `errorInterceptor` (centralised error handling), `traceInterceptor` (request correlation IDs).
- **Reactive Forms**: All create/edit forms use Angular Reactive Forms with typed controls.
- **Server-side pagination**: All list pages delegate pagination, filtering, and sorting to the API.
- **Component Input Binding**: Router data and params are bound directly to component inputs via `withComponentInputBinding()`.

---

## Project Structure

```
src/
├── app/
│   ├── core/               # Interceptors, guards, layout shells
│   │   ├── guards/         # authGuard, publicGuard
│   │   ├── interceptors/   # auth, error, trace
│   │   └── layout/         # AppShellComponent, AuthShellComponent
│   │
│   ├── entities/           # Domain models + mappers
│   │   │                   # auth, product, category, supplier,
│   │   │                   # warehouse, location, movement, stock,
│   │   │                   # count, user, role, permission, audit-event
│   │
│   ├── pages/              # Route-level smart components
│   │   ├── auth/           # login, forgot-password, forbidden
│   │   ├── dashboard/
│   │   ├── catalog/        # products, categories, suppliers
│   │   ├── inventory/      # warehouses, locations, movements,
│   │   │                   # stock, kardex, counts
│   │   ├── reports/        # stock, movements, kardex, low-stock
│   │   └── admin/          # users, roles, permissions, audit
│   │
│   ├── widgets/            # Reusable presentational components
│   ├── shared/             # Types, utils, API client, common services
│   │
│   ├── app.config.ts       # Root providers
│   └── app.routes.ts       # Lazy-loaded route tree
│
├── environments/
│   ├── environment.ts      # Development config
│   └── environment.prod.ts # Production config (used at build time)
│
└── styles.scss             # Global styles
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+ (project uses npm 11.9.0 as `packageManager`)

### Installation

```bash
git clone <repo-url>
cd ngr-inventory-frontend-angular
npm install
```

### Development server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200`. The app reloads automatically on file changes.

### Environment configuration

Development settings live in `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
};
```

Set `apiUrl` to the base URL of your backend API. For production builds, Angular automatically swaps in `src/environments/environment.prod.ts` (see `angular.json` `fileReplacements`).

---

## Running Tests

### Unit tests (Jest)

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

### E2E tests (Playwright)

```bash
# Headless
npm run e2e

# Interactive UI mode
npm run e2e:ui
```

---

## Build & Deployment

### Production build

```bash
npm run build
```

Output is written to `dist/`. The build uses `outputHashing: all` for cache-busting, with bundle size budgets enforced (warning at 500 kB, error at 1 MB for the initial bundle).

### nginx deployment

Production deployment uses the `nginx.conf` included in the repository. Notable configuration:

- **SPA routing**: `try_files $uri /index.html` ensures client-side routes are handled correctly.
- **Static asset caching**: Hashed assets (`*.js`, `*.css`) are served with long-lived `Cache-Control: max-age` headers. `index.html` is served with `no-cache` to ensure clients always fetch the latest shell.
- **Security headers**: CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

See [`docs/security.md`](docs/security.md) for the full security documentation.

---

## Features Overview

| Module | Features |
|---|---|
| **Dashboard** | KPI cards (total products, low-stock alerts, recent movements), at-a-glance inventory health |
| **Products** | Full CRUD, stock-by-warehouse view per product, category and supplier linking |
| **Categories** | CRUD with server-side pagination and search |
| **Suppliers** | CRUD with server-side pagination and search |
| **Warehouses** | CRUD, hierarchical warehouse structure |
| **Locations** | CRUD, locations scoped to a parent warehouse |
| **Movements** | Register entries, exits, and adjustments through a validate → preview → submit flow |
| **Stock** | Current stock overview; view by warehouse; view by location |
| **Kardex** | Global movement history with date range and type filters |
| **Physical Counts** | Create count sessions, record physical quantities, reconcile vs theoretical stock, confirm and auto-generate adjustment movements |
| **Reports** | Stock, movements, kardex, and low-stock reports — all with CSV export |
| **Users** | CRUD, role assignment per user |
| **Roles** | CRUD, permission assignment per role |
| **Permissions** | Read-only permission tree grouped by module and action |
| **Audit Log** | Full event history with filters; detail view with expandable JSON payload diff |

---

## Security

All security-sensitive decisions are documented in [`docs/security.md`](docs/security.md).

Key points:

- **No tokens in localStorage.** Session management relies on HttpOnly cookies — JavaScript never touches the auth token.
- **`withCredentials: true`** is applied globally via `authInterceptor`, so cookies are sent on every API request.
- **Zero `innerHTML` usage.** All dynamic content is bound through Angular's template engine, which escapes by default.
- **CSP enforced at the nginx level.** The Content Security Policy is defined in the nginx configuration, not as a `<meta>` tag, so it cannot be bypassed by script injection.

---

## Accessibility

Accessibility targets and patterns are documented in [`docs/accessibility.md`](docs/accessibility.md).

Key points:

- **Target**: WCAG 2.2 AA compliance.
- **Skip-link component** allows keyboard users to bypass navigation and jump to main content.
- **Keyboard-navigable sidebar and data tables** — all interactive elements are reachable and operable via keyboard alone.
- **ARIA roles** applied to layout shell elements (`role="navigation"`, `role="main"`, `role="banner"`, etc.).

---

## Scripts Reference

| Script | Description |
|---|---|
| `npm start` | Start the development server (`ng serve`) |
| `npm run build` | Production build to `dist/` |
| `npm run watch` | Development build in watch mode |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Jest in interactive watch mode |
| `npm run test:coverage` | Jest with coverage report |
| `npm run lint` | Run ESLint on all files |
| `npm run lint:fix` | Run ESLint and auto-fix fixable issues |
| `npm run e2e` | Run Playwright E2E tests (headless) |
| `npm run e2e:ui` | Run Playwright E2E tests with interactive UI |

---

## License

MIT
