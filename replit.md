# F1 Live Telecronaca

App web per la telecronaca live di Formula 1 — timing tower in tempo reale, classifica piloti/costruttori, calendario gare, commento live e pannello admin completo.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/f1-live run dev` — run the frontend (port 24755)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle schema files (teams, drivers, races, laps, commentary, race_control, tires, results)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/f1-live/src/` — React frontend
  - `src/pages/` — All pages (home, races, standings, drivers, admin/*)
  - `src/components/layout.tsx` — Main navigation layout

## Architecture decisions

- Contract-first OpenAPI → codegen generates typed React Query hooks and Zod validators
- Single dark theme enforced (no light/dark toggle) — F1 aesthetic
- Admin protected by localStorage password gate (password: "f1admin")
- Live timing auto-refreshes every 5 seconds via queryClient.invalidateQueries
- Standings computed server-side from race_results table using standard F1 points (25-18-15-12-10-8-6-4-2-1)

## Product

- **Live Timing Tower** — positions, gaps, intervals, tire compounds, last lap times, pit stop count
- **Race Calendar** — full 2025 season calendar with status badges
- **Race Detail** — commentary feed, race control messages, tire strategy, race summary stats
- **Standings** — driver + constructor championship with season summary
- **Drivers** — grid of all 20 F1 2025 drivers with team colors
- **Admin Panel** — manage races (status, SC/VSC, weather), drivers, teams, commentary, race control messages

## User preferences

- Dark theme only — F1 red (#E8002D) as primary accent

## Gotchas

- `dark` class must be on `<html>` element (set in main.tsx via `document.documentElement.classList.add("dark")`)
- `layout.tsx` must import `cn` from `@/lib/utils` not `./utils`
- After schema changes: run `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/api-spec run codegen`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
