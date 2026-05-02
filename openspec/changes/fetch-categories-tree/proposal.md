## Why

The categories module exists in the backend but all methods are stubs — no data is read from the database and no auth guard is applied. Until this is implemented, no part of the frontend (budget allocation forms, transaction recording) can populate category or subcategory selectors from real user data.

## What Changes

- Implement `GET /categories` on the backend to query the authenticated user's active categories from PostgreSQL and return them as a nested tree (parents with their subcategories).
- Add response DTOs (`CategoryResponseDto`, `CategoryTreeDto`) to define the public shape of the API response.
- Apply `JwtAuthGuard` and `@CurrentUser()` to scope results to the requesting user.
- Add `lib/api/categories.ts` on the frontend with a `getCategories()` function using the existing fetch wrapper.
- Add `hooks/categories/useCategories.ts` — a React hook that fetches categories on mount and exposes `{ categories, loading, error }`.
- Add `types/category.ts` on the frontend with TypeScript types matching the API response shape.

## Capabilities

### New Capabilities

- `fetch-categories-tree`: Authenticated endpoint that returns the user's active category hierarchy (level-1 parents each containing their level-2 subcategory children), consumed by frontend hooks and forms.

### Modified Capabilities

_(none — no existing spec behavior is changing)_

## Impact

**Backend — `antly-backend/`**
- `src/modules/categories/categories.service.ts` — implement real DB query using TypeORM repository
- `src/modules/categories/categories.controller.ts` — add `JwtAuthGuard`, `@CurrentUser()`, wire to service
- `src/modules/categories/dto/category.dto.ts` — add `CategoryResponseDto` and `CategoryTreeDto`
- `src/modules/categories/categories.module.ts` — register `TypeOrmModule.forFeature([Category])`

**Frontend — `antly-frontend/`**
- `lib/api/categories.ts` — new file
- `hooks/categories/useCategories.ts` — new file
- `types/category.ts` — new file

**Entities involved:** `Category` (existing, fully defined)
**Endpoints involved:** `GET /categories` (stub → implemented)
**Dependencies:** no new packages required
