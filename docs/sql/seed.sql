-- =========================================================
-- ANTLY - Seed data
-- Cubre: usuario, fuentes de ingreso, presupuesto,
--        categorías (nivel 1 y 2), allocations,
--        ingresos, transacciones y log de cambio.
-- Contraseña de demo: Demo1234!
-- =========================================================

-- UUIDs fijos para poder referenciarlos entre tablas
DO $$
DECLARE
  -- usuario
  u1 UUID := '00000000-0000-0000-0000-000000000001';

  -- income sources
  is1 UUID := '00000000-0000-0000-0000-000000000010';
  is2 UUID := '00000000-0000-0000-0000-000000000011';

  -- budget (abril 2026)
  b1 UUID := '00000000-0000-0000-0000-000000000020';

  -- categorías nivel 1
  c_vivienda  UUID := '00000000-0000-0000-0000-000000000030';
  c_alimentos UUID := '00000000-0000-0000-0000-000000000031';
  c_transporte UUID := '00000000-0000-0000-0000-000000000032';
  c_ahorro    UUID := '00000000-0000-0000-0000-000000000033';

  -- subcategorías nivel 2
  c_arriendo  UUID := '00000000-0000-0000-0000-000000000040';
  c_servicios UUID := '00000000-0000-0000-0000-000000000041';
  c_super     UUID := '00000000-0000-0000-0000-000000000042';
  c_rest      UUID := '00000000-0000-0000-0000-000000000043';
  c_bus       UUID := '00000000-0000-0000-0000-000000000044';
  c_emergencia UUID := '00000000-0000-0000-0000-000000000045';

BEGIN

  -- -------------------------------------------------------
  -- USUARIO
  -- email: demo@antly.com  /  password: Demo1234!
  -- hash generado con bcrypt (cost 10)
  -- -------------------------------------------------------
  INSERT INTO users (id, email, password_hash, first_name, last_name)
  VALUES (
    u1,
    'demo@antly.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'Demo',
    'Antly'
  );

  -- -------------------------------------------------------
  -- FUENTES DE INGRESO
  -- -------------------------------------------------------
  INSERT INTO income_sources (id, user_id, name) VALUES
    (is1, u1, 'Salario'),
    (is2, u1, 'Freelance');

  -- -------------------------------------------------------
  -- PRESUPUESTO  (abril 2026)
  -- -------------------------------------------------------
  INSERT INTO budgets (id, user_id, year, month, total_income_amount, total_allocated_amount, status)
  VALUES (b1, u1, 2026, 4, 3000000.00, 2800000.00, 'ACTIVE');

  -- -------------------------------------------------------
  -- CATEGORÍAS NIVEL 1
  -- -------------------------------------------------------
  INSERT INTO categories (id, user_id, parent_id, name, level, type, source_type, sort_order) VALUES
    (c_vivienda,   u1, NULL, 'Vivienda',    1, 'EXPENSE', 'DEFAULT', 1),
    (c_alimentos,  u1, NULL, 'Alimentos',   1, 'EXPENSE', 'DEFAULT', 2),
    (c_transporte, u1, NULL, 'Transporte',  1, 'EXPENSE', 'DEFAULT', 3),
    (c_ahorro,     u1, NULL, 'Ahorro',      1, 'SAVING',  'DEFAULT', 4);

  -- -------------------------------------------------------
  -- SUBCATEGORÍAS NIVEL 2
  -- -------------------------------------------------------
  INSERT INTO categories (id, user_id, parent_id, name, level, type, source_type, sort_order) VALUES
    (c_arriendo,   u1, c_vivienda,   'Arriendo',         2, 'EXPENSE', 'DEFAULT', 1),
    (c_servicios,  u1, c_vivienda,   'Servicios',        2, 'EXPENSE', 'DEFAULT', 2),
    (c_super,      u1, c_alimentos,  'Supermercado',     2, 'EXPENSE', 'DEFAULT', 1),
    (c_rest,       u1, c_alimentos,  'Restaurantes',     2, 'EXPENSE', 'DEFAULT', 2),
    (c_bus,        u1, c_transporte, 'Transporte público', 2, 'EXPENSE', 'DEFAULT', 1),
    (c_emergencia, u1, c_ahorro,     'Fondo de emergencia', 2, 'SAVING', 'DEFAULT', 1);

  -- -------------------------------------------------------
  -- ALLOCATIONS (distribución del presupuesto)
  -- -------------------------------------------------------
  INSERT INTO budget_allocations (budget_id, category_id, allocated_amount) VALUES
    (b1, c_arriendo,   900000.00),
    (b1, c_servicios,  200000.00),
    (b1, c_super,      400000.00),
    (b1, c_rest,       150000.00),
    (b1, c_bus,         80000.00),
    (b1, c_emergencia, 500000.00);

  -- -------------------------------------------------------
  -- INGRESOS
  -- -------------------------------------------------------
  INSERT INTO incomes (user_id, income_source_id, budget_id, amount, received_date, description) VALUES
    (u1, is1, b1, 2500000.00, '2026-04-01', 'Salario abril'),
    (u1, is2, b1,  500000.00, '2026-04-10', 'Proyecto web freelance');

  -- -------------------------------------------------------
  -- TRANSACCIONES
  -- -------------------------------------------------------
  INSERT INTO transactions (user_id, budget_id, category_id, amount, type, transaction_date, description) VALUES
    (u1, b1, c_arriendo,   900000.00, 'EXPENSE', '2026-04-01', 'Arriendo abril'),
    (u1, b1, c_servicios,   85000.00, 'EXPENSE', '2026-04-05', 'Electricidad'),
    (u1, b1, c_servicios,   60000.00, 'EXPENSE', '2026-04-05', 'Internet'),
    (u1, b1, c_super,      180000.00, 'EXPENSE', '2026-04-07', 'Compra semanal'),
    (u1, b1, c_super,      160000.00, 'EXPENSE', '2026-04-14', 'Compra semanal'),
    (u1, b1, c_rest,        45000.00, 'EXPENSE', '2026-04-12', 'Almuerzo con equipo'),
    (u1, b1, c_bus,         40000.00, 'EXPENSE', '2026-04-01', 'Recarga tarjeta transporte'),
    (u1, b1, c_emergencia, 500000.00, 'SAVING',  '2026-04-01', 'Aporte fondo emergencia');

  -- -------------------------------------------------------
  -- LOG DE CAMBIO DE PRESUPUESTO
  -- -------------------------------------------------------
  INSERT INTO budget_change_logs (budget_id, changed_by_user_id, change_type, reason, old_value, new_value)
  VALUES (
    b1, u1,
    'AMOUNT_UPDATE',
    'Ajuste por ingreso freelance adicional',
    '2500000.00',
    '3000000.00'
  );

END $$;
