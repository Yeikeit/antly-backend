# Antly — Backend

API REST para la gestión de presupuestos personales. Provee autenticación JWT, gestión de usuarios, categorías, presupuestos mensuales, transacciones e ingresos.

## Stack

- **NestJS 11** — framework modular para Node.js
- **TypeORM 0.3** — ORM con PostgreSQL
- **PostgreSQL** — base de datos relacional
- **JWT + Refresh Tokens** — autenticación stateless
- **Swagger** — documentación automática de la API (solo en desarrollo)
- **class-validator / class-transformer** — validación y transformación de DTOs
- **@nestjs/schedule** — tareas programadas (automatización de presupuestos)

## Requisitos

- Node.js ≥ 20
- PostgreSQL ≥ 14

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=antly

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Instalación y desarrollo

```bash
$ npm install
```

```bash
npm install
npm run start:dev
```

La API estará disponible en [http://localhost:8080](http://localhost:8080).

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Servidor de desarrollo con hot-reload |
| `npm run start:debug` | Modo debug con watch |
| `npm run build` | Compilación para producción |
| `npm run start:prod` | Servidor de producción (requiere build previo) |
| `npm run lint` | Análisis estático con ESLint |
| `npm run test` | Tests unitarios |
| `npm run test:e2e` | Tests end-to-end |
| `npm run test:cov` | Cobertura de tests |

## Documentación de la API

En modo desarrollo, Swagger está disponible en:

```
http://localhost:8080/api/docs
```

## Estructura de carpetas

```
src/
  common/           # Piezas transversales reutilizables
    decorators/     # Decoradores custom (ej: @CurrentUser)
    filters/        # Filtros de excepción globales
    guards/         # Guards de autenticación y roles
    interceptors/   # Interceptores (transform, logging)
    pipes/          # Pipes de validación
    dto/            # DTOs compartidos (paginación, etc.)

  config/           # Configuración de la app (TypeORM, JWT, env)

  database/
    migrations/     # Migraciones TypeORM
    seeds/          # Seeds de datos iniciales

  modules/
    auth/           # Registro, login, refresh token, logout
    users/          # Perfil y preferencias de usuario
    income-sources/ # Fuentes de ingreso configurables por usuario
    incomes/        # Ingresos registrados del mes
    budgets/        # Presupuesto mensual + wizard de creación + resumen
    budget-allocations/  # Asignaciones de montos a subcategorías
    budget-automation/   # Automatización y cierre de presupuestos
    categories/     # Categorías y subcategorías jerárquicas
    transactions/   # Registro de gastos e ingresos diarios

  app.module.ts
  main.ts
```

## Módulos principales

| Módulo | Descripción |
|--------|-------------|
| `auth` | Autenticación con JWT. Access token (15 min) + refresh token (7 días) con rotación. |
| `budgets` | Presupuesto mensual por usuario. Máximo uno por mes/año. Incluye wizard de creación, resumen con métricas y cierre manual. |
| `categories` | Árbol jerárquico de dos niveles: categoría padre + subcategorías. Tipos: `EXPENSE`, `SAVING`, `INCOME`. |
| `transactions` | Gastos e ingresos diarios asociados a subcategorías. Tipos: `EXPENSE`, `INCOME`, `SAVING`. |
| `incomes` | Ingresos reales del mes, asociados a fuentes de ingreso. |
| `income-sources` | Fuentes de ingreso del usuario (salario, freelance, etc.). |
| `budget-automation` | Tarea programada que procesa cierres automáticos de presupuestos. |

## Reglas de negocio clave

- Un usuario tiene **un solo presupuesto por mes y año**.
- Las categorías tienen **dos niveles**: padre (agrupación) e hijo (subcategoría). Las asignaciones de presupuesto siempre son sobre subcategorías.
- El tipo `SAVING` en categorías permite separar métricas de ahorro del gasto corriente.
- Un presupuesto cerrado es de **solo lectura**.

## CORS

En producción, configurar la variable `CORS_ORIGIN`:

```env
# Un solo origen
CORS_ORIGIN=https://app.ejemplo.com

# Múltiples orígenes (separados por coma)
CORS_ORIGIN=https://app.ejemplo.com,https://admin.ejemplo.com
```

Si no se define, el backend permite el origen de `FRONTEND_URL` o `http://localhost:3000`.

## Docker

```bash
# Desde la raíz del monorepo
docker compose up --build
```

El backend corre en el puerto `8080` dentro del contenedor.

