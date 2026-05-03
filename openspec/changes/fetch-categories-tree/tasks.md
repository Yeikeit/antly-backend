## 1. Backend — Module wiring

- [x] 1.1 In `src/modules/categories/categories.module.ts`, add `TypeOrmModule.forFeature([Category])` to the `imports` array so the repository is available for injection
- [x] 1.2 Export `TypeOrmModule` from the module if other modules will need to inject `CategoryRepository` in the future

## 2. Backend — Response DTOs

- [x] 2.1 In `src/modules/categories/dto/category.dto.ts`, add `CategoryResponseDto` with fields: `id`, `name`, `type`, `sortOrder`
- [x] 2.2 Add `CategoryTreeDto` extending `CategoryResponseDto` with a `subcategories: CategoryResponseDto[]` field

## 3. Backend — Service implementation

- [x] 3.1 In `src/modules/categories/categories.service.ts`, inject `@InjectRepository(Category) private readonly categoryRepo: Repository<Category>`
- [x] 3.2 Implement `findAllByUser(userId: string): Promise<CategoryTreeDto[]>` — query level-1 categories for the user with `isActive: true`, eager-load `children` relation
- [x] 3.3 Filter the loaded `children` array to exclude entries where `isActive = false` before mapping
- [x] 3.4 Map the result to `CategoryTreeDto[]` (rename `children` → `subcategories`, pick only DTO fields)

## 4. Backend — Controller wiring

- [x] 4.1 In `src/modules/categories/categories.controller.ts`, apply `@UseGuards(JwtAuthGuard)` at the class level
- [x] 4.2 Update the `@Get()` handler to use `@CurrentUser()` to extract the authenticated user and call `categoriesService.findAllByUser(user.id)`
- [x] 4.3 Add Swagger decorators (`@ApiTags`, `@ApiBearerAuth`, `@ApiOkResponse`) to the controller and the GET handler

## 5. Frontend — Types

- [x] 5.1 Create `antly-frontend/types/category.ts` with `CategoryResponse` and `CategoryTree` TypeScript interfaces matching the API response shape

## 6. Frontend — API function

- [x] 6.1 Create `antly-frontend/lib/api/categories.ts` with a `getCategories()` function that calls `GET /categories` using the existing `client.ts` fetch wrapper and returns `CategoryTree[]`

## 7. Frontend — Hook

- [x] 7.1 Create `antly-frontend/hooks/categories/useCategories.ts` that calls `getCategories()` on mount, manages `categories`, `loading`, and `error` state, and returns all three
