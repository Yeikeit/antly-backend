-- =========================================================
-- DELETE USER CASCADE
-- Pega este bloque en Neon y reemplaza el UUID en la primera línea.
-- =========================================================

DO $$
DECLARE
    target_user_id UUID := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
BEGIN

    -- 1. budget_change_logs (RESTRICT sobre users)
    DELETE FROM budget_change_logs
    WHERE changed_by_user_id = target_user_id;

    -- 2. transactions (RESTRICT sobre categories)
    DELETE FROM transactions
    WHERE user_id = target_user_id;

    -- 3. budget_allocations (RESTRICT sobre categories)
    DELETE FROM budget_allocations
    WHERE budget_id IN (
        SELECT id FROM budgets WHERE user_id = target_user_id
    );

    -- 4. incomes (RESTRICT sobre income_sources)
    DELETE FROM incomes
    WHERE user_id = target_user_id;

    -- 5. budgets
    DELETE FROM budgets
    WHERE user_id = target_user_id;

    -- 6. income_sources
    DELETE FROM income_sources
    WHERE user_id = target_user_id;

    -- 7. categories (nivel 2 primero, tabla auto-referencial)
    DELETE FROM categories
    WHERE user_id = target_user_id AND level = 2;

    DELETE FROM categories
    WHERE user_id = target_user_id AND level = 1;

    -- 8. refresh_tokens
    DELETE FROM refresh_tokens
    WHERE user_id = target_user_id;

    -- 9. users
    DELETE FROM users
    WHERE id = target_user_id;

END $$;
