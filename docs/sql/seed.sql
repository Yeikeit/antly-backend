-- =========================================================
-- ANTLY - Seed data
-- Cubre: usuarios, refresh_tokens, fuentes de ingreso,
--        presupuestos (ACTIVE + CLOSED), categorías (nivel 1
--        y 2, tipos EXPENSE/SAVING/INCOME), allocations,
--        ingresos, transacciones y log de cambios.
-- Credenciales de demo:
--   demo@antly.com   / Demo1234!
--   extra@antly.com  / Demo1234!
-- =========================================================

DO $$
DECLARE
  -- usuarios
  u1 UUID := '00000000-0000-0000-0000-000000000001';
  u2 UUID := '00000000-0000-0000-0000-000000000002';

  -- refresh tokens
  rt1 UUID := '00000000-0000-0000-0000-000000000005';
  rt2 UUID := '00000000-0000-0000-0000-000000000006';

  -- income sources (u1)
  is1 UUID := '00000000-0000-0000-0000-000000000010';
  is2 UUID := '00000000-0000-0000-0000-000000000011';

  -- presupuestos u1
  b1 UUID := '00000000-0000-0000-0000-000000000020'; -- ACTIVE  abril 2026
  b2 UUID := '00000000-0000-0000-0000-000000000021'; -- CLOSED  marzo 2026

  -- categorías nivel 1  (u1)
  c_vivienda   UUID := '00000000-0000-0000-0000-000000000030';
  c_alimentos  UUID := '00000000-0000-0000-0000-000000000031';
  c_transporte UUID := '00000000-0000-0000-0000-000000000032';
  c_ahorro     UUID := '00000000-0000-0000-0000-000000000033';
  c_ingresos   UUID := '00000000-0000-0000-0000-000000000034'; -- tipo INCOME

  -- subcategorías nivel 2  (u1)
  c_arriendo   UUID := '00000000-0000-0000-0000-000000000040';
  c_servicios  UUID := '00000000-0000-0000-0000-000000000041';
  c_super      UUID := '00000000-0000-0000-0000-000000000042';
  c_rest       UUID := '00000000-0000-0000-0000-000000000043';
  c_bus        UUID := '00000000-0000-0000-0000-000000000044';
  c_emergencia UUID := '00000000-0000-0000-0000-000000000045';
  c_salario    UUID := '00000000-0000-0000-0000-000000000046'; -- tipo INCOME

BEGIN

  -- -------------------------------------------------------
  -- USUARIOS
  -- password para ambos: Demo1234!
  -- hash bcrypt cost 10: $2b$10$Se6dBHEx3oEM2NS98lCDFOH6bWuj8YfstNJgYb/6HvHRb1QAb/o/2
  -- -------------------------------------------------------
  INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES
    (u1, 'demo@antly.com',  '$2b$10$Se6dBHEx3oEM2NS98lCDFOH6bWuj8YfstNJgYb/6HvHRb1QAb/o/2', 'Demo',  'Antly'),
    (u2, 'extra@antly.com', '$2b$10$Se6dBHEx3oEM2NS98lCDFOH6bWuj8YfstNJgYb/6HvHRb1QAb/o/2', 'Extra', 'User');

  -- -------------------------------------------------------
  -- REFRESH TOKENS
  -- rt1: token activo de u1
  -- rt2: token revocado de u1 (para probar revocación)
  -- -------------------------------------------------------
  INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at) VALUES
    (rt1, u1,
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
     CURRENT_TIMESTAMP + INTERVAL '7 days',
     NULL),
    (rt2, u1,
     'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
     CURRENT_TIMESTAMP + INTERVAL '7 days',
     CURRENT_TIMESTAMP - INTERVAL '1 day');

  -- -------------------------------------------------------
  -- FUENTES DE INGRESO  (u1)
  -- -------------------------------------------------------
  INSERT INTO income_sources (id, user_id, name) VALUES
    (is1, u1, 'Salario'),
    (is2, u1, 'Freelance');

  -- -------------------------------------------------------
  -- PRESUPUESTOS  (u1)
  -- total_allocated_amount = suma real de las allocations:
  --   abril : 900k+200k+400k+150k+80k+500k = 2.230.000
  --   marzo : 900k+200k+350k+100k+70k+450k = 2.070.000
  -- -------------------------------------------------------
  INSERT INTO budgets (id, user_id, year, month, total_income_amount, total_allocated_amount, status) VALUES
    (b1, u1, 2026, 4, 3000000.00, 2230000.00, 'ACTIVE'),
    (b2, u1, 2026, 3, 2800000.00, 2070000.00, 'CLOSED');

  -- -------------------------------------------------------
  -- CATEGORÍAS NIVEL 1  (u1)
  -- -------------------------------------------------------
  INSERT INTO categories (id, user_id, parent_id, name, level, type, source_type, sort_order) VALUES
    (c_vivienda,   u1, NULL, 'Vivienda',    1, 'EXPENSE', 'DEFAULT', 1),
    (c_alimentos,  u1, NULL, 'Alimentos',   1, 'EXPENSE', 'DEFAULT', 2),
    (c_transporte, u1, NULL, 'Transporte',  1, 'EXPENSE', 'DEFAULT', 3),
    (c_ahorro,     u1, NULL, 'Ahorro',      1, 'SAVING',  'DEFAULT', 4),
    (c_ingresos,   u1, NULL, 'Ingresos',    1, 'INCOME',  'DEFAULT', 5);

  -- -------------------------------------------------------
  -- SUBCATEGORÍAS NIVEL 2  (u1)
  -- -------------------------------------------------------
  INSERT INTO categories (id, user_id, parent_id, name, level, type, source_type, sort_order) VALUES
    (c_arriendo,   u1, c_vivienda,   'Arriendo',             2, 'EXPENSE', 'DEFAULT', 1),
    (c_servicios,  u1, c_vivienda,   'Servicios',            2, 'EXPENSE', 'DEFAULT', 2),
    (c_super,      u1, c_alimentos,  'Supermercado',         2, 'EXPENSE', 'DEFAULT', 1),
    (c_rest,       u1, c_alimentos,  'Restaurantes',         2, 'EXPENSE', 'DEFAULT', 2),
    (c_bus,        u1, c_transporte, 'Transporte público',   2, 'EXPENSE', 'DEFAULT', 1),
    (c_emergencia, u1, c_ahorro,     'Fondo de emergencia',  2, 'SAVING',  'DEFAULT', 1),
    (c_salario,    u1, c_ingresos,   'Salario mensual',      2, 'INCOME',  'DEFAULT', 1);

  -- -------------------------------------------------------
  -- ALLOCATIONS — presupuesto ACTIVE (abril)
  -- Suma = 2.230.000  coincide con total_allocated_amount de b1
  -- -------------------------------------------------------
  INSERT INTO budget_allocations (budget_id, category_id, allocated_amount) VALUES
    (b1, c_arriendo,    900000.00),
    (b1, c_servicios,   200000.00),
    (b1, c_super,       400000.00),
    (b1, c_rest,        150000.00),
    (b1, c_bus,          80000.00),
    (b1, c_emergencia,  500000.00);

  -- ALLOCATIONS — presupuesto CLOSED (marzo)
  -- Suma = 2.070.000  coincide con total_allocated_amount de b2
  INSERT INTO budget_allocations (budget_id, category_id, allocated_amount) VALUES
    (b2, c_arriendo,    900000.00),
    (b2, c_servicios,   200000.00),
    (b2, c_super,       350000.00),
    (b2, c_rest,        100000.00),
    (b2, c_bus,          70000.00),
    (b2, c_emergencia,  450000.00);

  -- -------------------------------------------------------
  -- INGRESOS
  -- -------------------------------------------------------
  INSERT INTO incomes (user_id, income_source_id, budget_id, amount, received_date, description) VALUES
    (u1, is1, b1, 2500000.00, '2026-04-01', 'Salario abril'),
    (u1, is2, b1,  500000.00, '2026-04-10', 'Proyecto web freelance'),
    (u1, is1, b2, 2800000.00, '2026-03-01', 'Salario marzo');

  -- -------------------------------------------------------
  -- TRANSACCIONES — presupuesto ACTIVE (abril)
  -- -------------------------------------------------------
  INSERT INTO transactions (user_id, budget_id, category_id, amount, type, transaction_date, description) VALUES
    (u1, b1, c_arriendo,    900000.00, 'EXPENSE', '2026-04-01', 'Arriendo abril'),
    (u1, b1, c_servicios,    85000.00, 'EXPENSE', '2026-04-05', 'Electricidad'),
    (u1, b1, c_servicios,    60000.00, 'EXPENSE', '2026-04-05', 'Internet'),
    (u1, b1, c_super,       180000.00, 'EXPENSE', '2026-04-07', 'Compra semanal'),
    (u1, b1, c_super,       160000.00, 'EXPENSE', '2026-04-14', 'Compra semanal'),
    (u1, b1, c_rest,         45000.00, 'EXPENSE', '2026-04-12', 'Almuerzo con equipo'),
    (u1, b1, c_bus,          40000.00, 'EXPENSE', '2026-04-01', 'Recarga tarjeta transporte'),
    (u1, b1, c_emergencia,  500000.00, 'SAVING',  '2026-04-01', 'Aporte fondo emergencia');

  -- TRANSACCIONES — presupuesto CLOSED (marzo)
  INSERT INTO transactions (user_id, budget_id, category_id, amount, type, transaction_date, description) VALUES
    (u1, b2, c_arriendo,    900000.00, 'EXPENSE', '2026-03-01', 'Arriendo marzo'),
    (u1, b2, c_servicios,   145000.00, 'EXPENSE', '2026-03-05', 'Servicios marzo'),
    (u1, b2, c_super,       320000.00, 'EXPENSE', '2026-03-10', 'Supermercado marzo'),
    (u1, b2, c_emergencia,  450000.00, 'SAVING',  '2026-03-01', 'Aporte fondo emergencia marzo');

  -- -------------------------------------------------------
  -- LOGS DE CAMBIO DE PRESUPUESTO
  -- -------------------------------------------------------
  INSERT INTO budget_change_logs (budget_id, changed_by_user_id, change_type, reason, old_value, new_value) VALUES
    (b1, u1, 'AMOUNT_UPDATE',  'Ajuste por ingreso freelance adicional', '2500000.00', '3000000.00'),
    (b1, u1, 'REALLOCATION',   'Se redujo transporte para aumentar ahorro', '80000.00',  '80000.00'),
    (b2, u1, 'STATUS_CHANGE',  'Cierre de mes de marzo', 'ACTIVE', 'CLOSED');

END $$;
