# Antly — Project Reference

## What This Is

Antly is a personal finance and budget management web app. It helps students, young professionals, and individuals replace spreadsheets and notes with a centralized, structured monthly budgeting experience.

Core loop: define income sources → record monthly income → create a monthly budget → allocate budget to subcategories → record daily expenses → view financial summary and remaining balances.

## Tech Stack

### Frontend (`antly-frontend/`)
- **Next.js 16** with App Router (`app/` directory, route groups)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** via PostCSS
- **React Hook Form** for form handling
- **Zod 4** for schema validation (one schema per domain in `lib/validations/`)
- **React Context API** for global auth state (`store/auth-context.tsx`)
- **Fetch API** with a custom wrapper (`lib/api/client.ts`) that handles token refresh automatically
- Standalone Next.js output (for Docker)

### Backend (`antly-backend/`)
- **NestJS 11** — modular architecture, one module per domain
- **Node.js** + **TypeScript 5**
- **TypeORM 0.3** with PostgreSQL driver
- **JWT** via `@nestjs/jwt` — access token + refresh token pattern
- **class-validator** + **class-transformer** for DTO validation
- **bcrypt** for password hashing
- **Jest** + **Supertest** for testing

### Database
- **PostgreSQL 16** (Docker: `postgres:16-alpine`)
- UUID primary keys (`gen_random_uuid()`)
- `NUMERIC(14,2)` for all monetary values
- Schema defined in `antly-backend/docs/sql/create.sql`

### Infrastructure
- **Docker Compose** at repo root — spins up: PostgreSQL (5432), NestJS (8080), Next.js (3000), Adminer (8888)
- **Neon** (free tier) for cloud PostgreSQL
- Deployment targets: Vercel (frontend), Render (backend), Neon/Supabase (database)

## Repository Layout

```
Antly/
├── antly-frontend/         # Next.js app
│   ├── app/
│   │   ├── (auth)/         # login, register
│   │   ├── (budget)/       # budget setup flows
│   │   └── dashboard/
│   ├── components/         # auth, dashboard, budget, forms
│   ├── hooks/              # custom hooks (prefix: use*)
│   ├── lib/
│   │   ├── api/            # fetch wrapper + per-domain API fns
│   │   └── validations/    # Zod schemas by domain
│   ├── store/              # auth-context.tsx
│   └── types/
│
├── antly-backend/          # NestJS API
│   ├── src/
│   │   ├── common/         # guards, decorators, shared utilities
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── budgets/
│   │       ├── budget-allocations/
│   │       ├── categories/
│   │       ├── income-sources/
│   │       ├── incomes/
│   │       └── transactions/
│   └── docs/
│       └── sql/            # create.sql, seed.sql
│
└── docker-compose.yml      # full-stack local dev
```

## Domain Model

| Entity | Purpose |
|---|---|
| `User` | Account — central owner of all data |
| `RefreshToken` | Persisted JWT refresh tokens |
| `IncomeSource` | Named source of income (e.g. "Job", "Freelance") |
| `Income` | Actual monthly income amount linked to a source and budget |
| `Budget` | One per user per month/year — container for all financial activity |
| `Category` | Hierarchical (parent + subcategory via `parent_id` / `level`) |
| `BudgetAllocation` | Planned spend for a subcategory in a budget period |
| `Transaction` | A single recorded expense against a subcategory |
| `BudgetChangeLog` | Audit trail for budget modifications |

### Key Business Rules
1. One budget per user per (year, month) — enforced by unique constraint.
2. Parent categories group only — subcategories are the unit of allocation and spending.
3. Max 2 hierarchy levels: category → subcategory.
4. `BudgetAllocation` and `Transaction` always reference a subcategory (level 2).
5. Exceeding an allocation shows a warning, does not block.
6. Budget can be edited; every edit must produce a `BudgetChangeLog` entry.
7. All monetary values stored as `NUMERIC(14,2)`.
8. All data is user-scoped — FK to `users` with CASCADE delete.

## API Conventions (Backend)

- REST, JSON, versioned by URL prefix when needed
- All protected routes use `JwtAuthGuard` via `@UseGuards` or global guard
- Controllers are thin — business logic lives in services
- DTOs for every input; separate response shapes as needed
- Swagger enabled (`/api` docs endpoint)

### Endpoint Summary
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /income-sources
POST   /income-sources
PATCH  /income-sources/:id
DELETE /income-sources/:id

GET    /incomes
POST   /incomes
PATCH  /incomes/:id
DELETE /incomes/:id

GET    /budgets/:year/:month
POST   /budgets
PATCH  /budgets/:id
POST   /budgets/:id/allocations

GET    /categories
POST   /categories
POST   /categories/:id/subcategories
PATCH  /categories/:id
DELETE /categories/:id

GET    /transactions
POST   /transactions
PATCH  /transactions/:id
DELETE /transactions/:id

GET    /dashboard/:year/:month/summary
GET    /dashboard/:year/:month/categories
GET    /dashboard/:year/:month/subcategories
```

## Coding Conventions

### Frontend
- Components: PascalCase files, default export
- Hooks: `use` prefix, one concern per hook
- API calls: centralized in `lib/api/<domain>.ts`, never inline in components
- Validation: Zod schemas in `lib/validations/<domain>.ts`
- Forms: React Hook Form + Zod resolver
- No complex business logic inside page components — delegate to hooks and services

### Backend
- One NestJS module per domain (controller + service + DTOs + entity + module file)
- Shared utilities and guards go in `src/common/`
- Use `@CurrentUser()` decorator to inject the authenticated user into controllers
- TypeORM repositories injected into services — no raw SQL except where TypeORM is inadequate
- Validate all inputs with `class-validator` decorators on DTOs
- Snake_case for database columns, camelCase for TypeScript properties (mapped via `@Column({ name: '...' })`)

### General
- Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- Prettier: single quotes, trailing commas
- ESLint enforced on both frontend and backend
- No over-engineering — MVP scope is the ceiling

## MVP Scope

**In scope:**
- Auth (register, login, logout, refresh)
- Income sources + income recording
- Monthly budget creation and editing
- Hierarchical categories and subcategories
- Budget allocation per subcategory
- Transaction (expense) recording, editing, deletion
- Dashboard with financial summary and per-category/subcategory balances
- Budget change audit log

**Out of scope:**
- Bank integrations or automatic import
- AI/ML features
- Push notifications or alerts
- Native mobile app
- Shared/multi-user budgets
- Advanced analytics

## Environment Variables

### Root `.env` (used by Docker Compose)
```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
```

### Backend `.env`
```
DATABASE_URL=
DATABASE_SSL=false
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=8080
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Local Development

```bash
# Full stack (Postgres + Backend + Frontend + Adminer)
docker compose up -d --build

# Services
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080
# API docs:  http://localhost:8080/api
# Adminer:   http://localhost:8888
```
