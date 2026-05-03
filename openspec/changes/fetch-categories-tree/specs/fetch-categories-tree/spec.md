## ADDED Requirements

### Requirement: Authenticated user can retrieve their category tree
The system SHALL provide a `GET /categories` endpoint that returns the authenticated user's active categories structured as a nested tree, where each level-1 category contains its active level-2 subcategories.

#### Scenario: User with categories receives nested tree
- **WHEN** an authenticated user sends `GET /categories`
- **THEN** the system returns HTTP 200 with an array of category objects, each containing `id`, `name`, `type`, `sortOrder`, and a `subcategories` array of their active children

#### Scenario: User with no categories receives empty array
- **WHEN** an authenticated user sends `GET /categories` and has no categories in the database
- **THEN** the system returns HTTP 200 with an empty array `[]`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request is sent to `GET /categories` without a valid JWT access token
- **THEN** the system returns HTTP 401 Unauthorized

#### Scenario: Inactive categories are excluded
- **WHEN** an authenticated user has categories where `isActive = false`
- **THEN** those categories (and their subcategories) are NOT included in the response

#### Scenario: Inactive subcategories are excluded from active parents
- **WHEN** a level-1 category is active but one or more of its subcategories have `isActive = false`
- **THEN** the parent appears in the response but the inactive subcategories are omitted from its `subcategories` array

#### Scenario: User only sees their own categories
- **WHEN** two different users each have categories and user A sends `GET /categories`
- **THEN** the response contains only user A's categories and no categories belonging to user B

### Requirement: Frontend hook exposes category tree with loading and error state
The system SHALL provide a `useCategories` React hook that fetches the category tree on mount and exposes the result with loading and error states for consumer components.

#### Scenario: Hook fetches on mount and returns data
- **WHEN** a component mounts and uses `useCategories()`
- **THEN** the hook calls `GET /categories`, sets `loading: true` during the request, and sets `categories` to the response array and `loading: false` upon success

#### Scenario: Hook exposes error state on failure
- **WHEN** the `GET /categories` request fails (network error or non-2xx response)
- **THEN** the hook sets `error` to a non-null value and `loading: false`

#### Scenario: Hook returns empty array before first fetch completes
- **WHEN** a component first renders and the fetch has not yet resolved
- **THEN** `categories` is an empty array and `loading` is `true`
