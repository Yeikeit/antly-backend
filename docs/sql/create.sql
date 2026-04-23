-- =========================================================
-- ANTLY / FYNLO - PostgreSQL schema
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- REFRESH TOKENS
-- =========================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);

-- =========================================================
-- INCOME SOURCES
-- =========================================================
CREATE TABLE income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_income_sources_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_income_sources_user_name
        UNIQUE (user_id, name)
);

CREATE INDEX idx_income_sources_user_id
    ON income_sources(user_id);

-- =========================================================
-- BUDGETS
-- =========================================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    total_income_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_allocated_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_budgets_month
        CHECK (month BETWEEN 1 AND 12),
    CONSTRAINT chk_budgets_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    CONSTRAINT chk_budgets_total_income_amount
        CHECK (total_income_amount >= 0),
    CONSTRAINT chk_budgets_total_allocated_amount
        CHECK (total_allocated_amount >= 0),
    CONSTRAINT uq_budgets_user_period
        UNIQUE (user_id, year, month)
);

CREATE INDEX idx_budgets_user_id
    ON budgets(user_id);

CREATE INDEX idx_budgets_year_month
    ON budgets(year, month);

-- =========================================================
-- INCOMES
-- =========================================================
CREATE TABLE incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    income_source_id UUID NOT NULL,
    budget_id UUID NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    received_date DATE NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incomes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_incomes_income_source
        FOREIGN KEY (income_source_id)
        REFERENCES income_sources(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_incomes_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_incomes_amount
        CHECK (amount > 0)
);

CREATE INDEX idx_incomes_user_id
    ON incomes(user_id);

CREATE INDEX idx_incomes_income_source_id
    ON incomes(income_source_id);

CREATE INDEX idx_incomes_budget_id
    ON incomes(budget_id);

CREATE INDEX idx_incomes_received_date
    ON incomes(received_date);

-- =========================================================
-- CATEGORIES
-- Una sola tabla jerárquica para categorías y subcategorías
-- =========================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    parent_id UUID NULL,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    source_type VARCHAR(20) NOT NULL DEFAULT 'CUSTOM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_categories_level
        CHECK (level IN (1, 2)),
    CONSTRAINT chk_categories_type
        CHECK (type IN ('EXPENSE', 'SAVING', 'INCOME')),
    CONSTRAINT chk_categories_source_type
        CHECK (source_type IN ('DEFAULT', 'CUSTOM')),
    CONSTRAINT uq_categories_user_parent_name
        UNIQUE (user_id, parent_id, name)
);

CREATE INDEX idx_categories_user_id
    ON categories(user_id);

CREATE INDEX idx_categories_parent_id
    ON categories(parent_id);

-- =========================================================
-- BUDGET ALLOCATIONS
-- =========================================================
CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL,
    category_id UUID NOT NULL,
    allocated_amount NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_allocations_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_budget_allocations_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_budget_allocations_amount
        CHECK (allocated_amount >= 0),
    CONSTRAINT uq_budget_allocations_budget_category
        UNIQUE (budget_id, category_id)
);

CREATE INDEX idx_budget_allocations_budget_id
    ON budget_allocations(budget_id);

CREATE INDEX idx_budget_allocations_category_id
    ON budget_allocations(category_id);

-- =========================================================
-- TRANSACTIONS
-- =========================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    budget_id UUID NOT NULL,
    category_id UUID NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_transactions_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_transactions_amount
        CHECK (amount > 0),
    CONSTRAINT chk_transactions_type
        CHECK (type IN ('EXPENSE', 'INCOME', 'SAVING'))
);

CREATE INDEX idx_transactions_user_id
    ON transactions(user_id);

CREATE INDEX idx_transactions_budget_id
    ON transactions(budget_id);

CREATE INDEX idx_transactions_category_id
    ON transactions(category_id);

CREATE INDEX idx_transactions_transaction_date
    ON transactions(transaction_date);

-- =========================================================
-- BUDGET CHANGE LOGS
-- =========================================================
CREATE TABLE budget_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL,
    changed_by_user_id UUID NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_change_logs_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_budget_change_logs_user
        FOREIGN KEY (changed_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_budget_change_logs_type
        CHECK (change_type IN ('REALLOCATION', 'AMOUNT_UPDATE', 'STATUS_CHANGE'))
);

CREATE INDEX idx_budget_change_logs_budget_id
    ON budget_change_logs(budget_id);

CREATE INDEX idx_budget_change_logs_user_id
    ON budget_change_logs(changed_by_user_id);