# Kroger Inventory Visibility Miniature (V1)

Miniature prototype of a Kroger-style inventory visibility domain:
- React + TypeScript micro-frontend prototype (`apps/frontend`)
- Node.js + Express aggregation service/BFF (`apps/backend`)
- Shared API contracts (`packages/contracts`)

## Quick Start

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health: `http://localhost:4000/healthz`
- Metrics: `http://localhost:4000/metrics`

## Monorepo Structure

- `apps/frontend`: inventory list/detail UI, folder tree, bulk tagging, scan resolution input, MFE `mount()` entry
- `apps/backend`: normalized BFF routes, mock legacy upstream aggregation, in-memory folders/tags state, observability middleware
- `packages/contracts`: shared TypeScript interfaces for frontend/backend

## Implemented API Endpoints

- `GET /api/inventory/items`
- `GET /api/inventory/items/:id`
- `GET /api/folders`
- `POST /api/folders`
- `PATCH /api/folders/:id`
- `GET /api/tags`
- `POST /api/tags/apply`
- `POST /api/scans/resolve`

## Testing

```bash
npm run test:backend
npm run test:frontend
```

Frontend E2E (requires frontend/backend running):

```bash
npm run e2e --workspace @kroger-mini/frontend
```

## Notes

- All data persistence is in-memory and reset on restart.
- Internal Kroger APIs are replaced with local mock upstream adapters.
- Scanner integration in V1 uses payload simulation and keeps a `ScannerAdapter` interface for real camera integration later.

## Challenge 1 Replay (Concurrency Problem Baseline)

This miniature intentionally keeps shared folder updates as last-write-wins (no OCC), so concurrency conflicts can be replayed before implementing the fix.

1. Start frontend/backend (`npm run dev`), then open two manager sessions (A/B) on `/inventory`.
2. In both sessions, wait for the same initial folder tree to load.
3. In session A, drag `Seasonal` onto `Dairy`.
4. Without refreshing B, in session B drag `Seasonal` to another parent (for example to root level).
5. Both operations return success.
6. Refresh session A. The folder tree now reflects B's later write, showing the silent overwrite conflict.

For deterministic automated replay, use:
- backend reset endpoint: `POST /api/dev/reset` (non-production only)
- Cypress spec: `apps/frontend/cypress/e2e/folder_concurrency_problem.cy.ts`
