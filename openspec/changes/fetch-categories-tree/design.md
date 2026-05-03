## Context

The `categories` NestJS module is scaffolded but fully stubbed — `findAll()` returns a hardcoded string, no TypeORM repository is injected, and no auth guard is applied. The `Category` entity is fully defined with a self-referential relation (`parent` / `children`) supporting a two-level hierarchy via `parentId` and `level` columns. The frontend has no category API layer or hook.

This change touches two repos (backend service + frontend consumer) but is architecturally straightforward: wire a standard TypeORM repository query with JWT auth on the backend, and add a thin fetch function + hook on the frontend.

## Goals / Non-Goals

**Goals:**
- Implement `GET /categories` to return the authenticated user's active categories as a nested tree
- Scope all data to `userId` from the JWT — no user can see another user's categories
- Return a stable, typed response shape the frontend can depend on
- Add a reusable `useCategories` hook for frontend consumers

**Non-Goals:**
- CRUD for categories (create, update, delete) — out of scope for this change
- Filtering by type (`EXPENSE`, `SAVING`, `INCOME`) at the API level — callers can filter client-side
- Caching or pagination — category lists are small per user
- Zod validation schema for categories — not needed until a form creates/edits categories

## Decisions

### 1. Tree assembly strategy: query parents, rely on TypeORM eager `children`

**Decision:** Query only level-1 categories for the user, with `relations: ['children']` to let TypeORM join subcategories in one query. Filter `isActive: true` at the DB level.

**Alternatives considered:**
- *Query all rows then assemble tree in JS:* More control but requires manual grouping; unnecessary complexity for a fixed 2-level hierarchy.
- *Two separate queries (parents, then children):* Extra round-trips, no benefit over a single join.

**Rationale:** TypeORM's `find` with `relations` produces an efficient LEFT JOIN. With a known max depth of 2, this is the simplest correct approach.

### 2. Response shape: flat DTO with nested `subcategories` array

**Decision:** Return an array of `CategoryTreeDto` — each parent has a `subcategories: CategoryResponseDto[]` array. The field is renamed from the entity's `children` to `subcategories` to be explicit in the API contract.

```jsonc
[
  {
    "id": "uuid",
    "name": "Alimentación",
    "type": "EXPENSE",
    "sortOrder": 0,
    "subcategories": [
      { "id": "uuid", "name": "Supermercado", "type": "EXPENSE", "sortOrder": 0 }
    ]
  }
]
```

**Rationale:** Consumers (allocation forms, transaction selectors) need parents and subcategories together. A flat list would force every consumer to re-group client-side.

### 3. Auth: `JwtAuthGuard` + `@CurrentUser()` decorator

**Decision:** Apply `@UseGuards(JwtAuthGuard)` at the controller class level. Extract `userId` via the existing `@CurrentUser()` decorator and pass it to the service.

**Rationale:** Consistent with the rest of the codebase (auth and users modules use the same pattern). No new infrastructure needed.

### 4. Frontend: plain `fetch` wrapper, no external state library

**Decision:** Use the existing `lib/api/client.ts` fetch wrapper. State lives in `useCategories` hook local state (`useState` + `useEffect`). No global store.

**Rationale:** Category data is only needed in specific screens (budget allocation, transaction form). Global state would be premature for MVP. The hook can be lifted to context later if needed.

## Risks / Trade-offs

- **Inactive subcategories under active parents:** The query filters `isActive: true` at the parent level but TypeORM's `relations` join will include all children regardless. → Mitigation: filter `children` to `isActive: true` in the service before mapping to DTOs.
- **No pagination:** If a user creates hundreds of categories the response grows. → Acceptable for MVP; category counts are naturally bounded by personal use. Add pagination only when needed.
- **Frontend hook re-fetches on every mount:** No caching. → Acceptable for MVP; category list is lightweight. Deduplicate with React Query or SWR if performance becomes an issue.
