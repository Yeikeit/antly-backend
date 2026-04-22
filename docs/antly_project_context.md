# Antly — Contexto Integral del Proyecto para Asistente de Código

## 1. Identidad del proyecto
**Nombre:** Antly  
**Tipo de solución:** Aplicación web de gestión de presupuestos personales.  
**Estado esperado:** MVP funcional, demostrable y extensible.

Antly es una solución pensada para ayudar a estudiantes, jóvenes y trabajadores a organizar sus finanzas personales mediante una experiencia web simple, clara y útil. El sistema debe permitir registrar ingresos, definir un presupuesto mensual, crear categorías y subcategorías, asignar montos por subcategoría, registrar gastos diarios y visualizar cuánto se ha gastado y cuánto queda disponible, tanto a nivel general como por categoría y subcategoría.

## 2. Problema que resuelve
Actualmente muchas personas controlan sus finanzas usando planillas, notas o memoria, lo que genera:
- falta de centralización
- dificultad para mantener el hábito de registro
- poca visibilidad del gasto real
- dificultad para tomar decisiones informadas
- bajo control del presupuesto disponible
- problemas para identificar patrones de gasto

Antly busca reemplazar ese control manual por una experiencia digital centralizada, comprensible y orientada al seguimiento presupuestario mensual.

## 3. Objetivo del sistema
Construir una aplicación web funcional, accesible y orientada al usuario que facilite la gestión de presupuestos personales mediante el registro, organización y visualización de información financiera.

### Objetivos funcionales del MVP
- autenticación segura de usuarios
- gestión de múltiples fuentes de ingreso
- registro de ingresos reales del mes
- creación de un presupuesto mensual por usuario
- gestión de categorías y subcategorías
- asignación de montos por subcategoría
- registro de gastos diarios
- visualización de saldos y métricas básicas
- trazabilidad de cambios sobre el presupuesto

## 4. Alcance del MVP
### Incluye
- registro e inicio/cierre de sesión
- JWT + refresh tokens
- gestión de fuentes de ingreso
- registro de ingresos del mes
- creación y edición de presupuesto mensual
- gestión jerárquica de categorías y subcategorías
- asignación de presupuesto a subcategorías
- registro, edición y eliminación de gastos
- dashboard con resumen financiero básico
- trazabilidad de cambios presupuestarios

### Excluye
- integraciones bancarias
- sincronización automática de cartolas
- inteligencia artificial aplicada al producto
- análisis financiero avanzado
- notificaciones inteligentes
- aplicación móvil nativa
- presupuestos compartidos entre usuarios

## 5. Reglas de negocio clave
1. Un usuario tiene un solo presupuesto por mes y año.
2. Un usuario puede tener múltiples fuentes de ingreso.
3. Un usuario puede registrar múltiples ingresos dentro de un mismo mes.
4. Las categorías padre solo agrupan.
5. Las subcategorías son la unidad operativa real.
6. Solo las subcategorías reciben asignaciones presupuestarias y gastos.
7. La jerarquía máxima es de dos niveles: categoría padre y subcategoría.
8. El presupuesto mensual puede editarse, pero debe quedar trazabilidad del cambio.
9. Si una subcategoría se excede, el sistema debe advertir, no bloquear.
10. Las métricas básicas se calculan a partir de los datos existentes.
11. La estructura inicial de categorías puede venir desde una plantilla en código.

## 6. Modelo conceptual del dominio
### Entidades principales
- User
- RefreshToken
- IncomeSource
- Income
- Budget
- Category
- BudgetAllocation
- Transaction
- BudgetChangeLog

### Lógica general del dominio
- User crea Budgets
- User define IncomeSources
- User registra Incomes
- User define Categories
- Budget agrupa Incomes
- Budget tiene BudgetAllocations
- Budget tiene Transactions
- Budget tiene BudgetChangeLogs
- Category puede tener Category hija
- BudgetAllocation apunta a una subcategoría
- Transaction apunta a una subcategoría

## 7. Modelo de datos simplificado
### Tablas principales
- users
- refresh_tokens
- income_sources
- budgets
- incomes
- categories
- budget_allocations
- transactions
- budget_change_logs

### Justificación resumida
- `users`: entidad central
- `refresh_tokens`: manejo seguro de sesiones
- `income_sources`: origen del dinero
- `incomes`: ingresos efectivos
- `budgets`: presupuesto mensual
- `categories`: jerarquía de categorías y subcategorías
- `budget_allocations`: distribución planificada
- `transactions`: ejecución real
- `budget_change_logs`: trazabilidad de cambios

### Relaciones clave
- `users -> budgets`
- `users -> categories`
- `users -> transactions`
- `users -> incomes`
- `users -> income_sources`
- `users -> refresh_tokens`
- `users -> budget_change_logs`
- `income_sources -> incomes`
- `budgets -> incomes`
- `budgets -> budget_allocations`
- `budgets -> transactions`
- `budgets -> budget_change_logs`
- `categories -> categories`
- `categories -> budget_allocations`
- `categories -> transactions`

### Consideración importante
La tabla `categories` modela tanto categorías padre como subcategorías usando `parent_id` y `level`.

## 8. Casos de uso principales
### Acceso y configuración
- Registrarse
- Iniciar sesión
- Cerrar sesión
- Gestionar fuentes de ingreso
- Crear presupuesto mensual
- Editar presupuesto mensual
- Configurar estructura presupuestaria
- Aplicar plantilla inicial
- Crear estructura desde cero
- Gestionar categorías
- Gestionar subcategorías
- Asignar presupuesto a subcategorías

### Operación y seguimiento
- Registrar ingreso
- Registrar gasto
- Editar gasto
- Eliminar gasto
- Consultar estado financiero
- Consultar resumen mensual
- Consultar saldo general
- Consultar saldo por categoría
- Consultar saldo por subcategoría
- Consultar métricas básicas
- Consultar presupuesto por categoría
- Consultar presupuesto por subcategoría

## 9. Procesos críticos
### 1. Creación y asignación del presupuesto mensual
1. El usuario crea el presupuesto del mes.
2. El sistema valida que no exista otro para el mismo período.
3. El usuario asigna montos a subcategorías.
4. El sistema valida y guarda asignaciones.
5. El presupuesto queda listo para operar.

### 2. Registro de gasto y actualización del estado financiero
1. El usuario registra un gasto en una subcategoría.
2. El sistema valida la subcategoría y la asignación.
3. El sistema guarda la transacción.
4. El sistema recalcula saldos y métricas.
5. Si hay sobreconsumo, advierte visualmente.

### 3. Inicio de sesión
1. El usuario ingresa credenciales.
2. El backend valida usuario y contraseña.
3. Se emite JWT.
4. Se persiste refresh token.
5. Se devuelve sesión autenticada al frontend.

## 10. Requerimientos no funcionales
### Seguridad
- contraseñas hasheadas con bcrypt
- autenticación con JWT
- refresh tokens persistidos
- acceso restringido por usuario
- validación de entradas

### Disponibilidad
- despliegue cloud accesible por navegador
- solución preparada para uso remoto
- factibilidad de despliegue en servicios gratuitos o de bajo costo

### Usabilidad
- diseño mobile first
- interfaz clara e intuitiva
- formularios simples
- visualización comprensible de métricas y saldos

### Mantenibilidad
- separación de frontend y backend
- arquitectura modular
- dominio organizado por módulos
- documentación técnica de API

### Escalabilidad
- arquitectura cliente-servidor desacoplada
- backend expuesto vía API REST
- base relacional consistente

## 11. Stack tecnológico
### Frontend
- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- React Hook Form
- Zod
- Axios o wrapper de fetch

### Backend
- NestJS
- Node.js
- TypeScript
- JWT
- class-validator
- TypeORM

### Base de datos
- PostgreSQL

### Herramientas
- Docker
- Docker Compose
- Swagger / OpenAPI
- Jest
- Postman / Insomnia
- GitHub
- GitHub Copilot / Claude

## 12. Criterios de despliegue y entorno
### Entorno local
Se debe poder levantar el proyecto en local con frontend, backend, PostgreSQL, variables de entorno y Docker Compose cuando corresponda.

### Alternativas de despliegue para MVP
- Frontend: Vercel Hobby
- Backend: Render Free
- Base de datos: Neon Free o Supabase Free

### Criterios de elección
- compatibilidad con Next.js, NestJS y PostgreSQL
- facilidad de configuración
- costo cero o muy bajo
- adecuación al contexto académico

## 13. Estructura esperada del repositorio frontend
**Nombre sugerido:** `antly-web`

### Objetivo
Contener la interfaz del sistema, navegación, formularios, vistas de presupuesto, dashboard y autenticación del lado cliente.

### Estructura sugerida
```txt
antly-web/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/
│  │  │  └─ register/
│  │  ├─ dashboard/
│  │  ├─ budget/
│  │  │  ├─ new/
│  │  │  ├─ [budgetId]/
│  │  │  └─ edit/
│  │  ├─ categories/
│  │  ├─ incomes/
│  │  ├─ transactions/
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ forms/
│  │  ├─ budget/
│  │  ├─ category/
│  │  ├─ income/
│  │  ├─ transaction/
│  │  └─ dashboard/
│  ├─ lib/
│  │  ├─ api/
│  │  │  ├─ client.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ budgets.ts
│  │  │  ├─ categories.ts
│  │  │  ├─ incomes.ts
│  │  │  └─ transactions.ts
│  │  ├─ utils/
│  │  ├─ constants/
│  │  └─ validations/
│  ├─ hooks/
│  ├─ types/
│  ├─ services/
│  ├─ store/
│  └─ styles/
├─ .env.local
├─ package.json
└─ README.md
```

### Criterios de organización frontend
- organizar por dominio y no solo por tipo técnico
- centralizar llamadas API en `lib/api`
- usar formularios reutilizables
- usar validaciones Zod por dominio
- evitar lógica de negocio compleja dentro de páginas

### Pantallas mínimas
- Login
- Registro
- Dashboard
- Crear presupuesto
- Editar presupuesto
- Gestión de categorías y subcategorías
- Registro de ingresos
- Registro de gastos
- Resumen financiero mensual

## 14. Estructura esperada del repositorio backend
**Nombre sugerido:** `antly-api`

### Objetivo
Contener la lógica de negocio, autenticación, acceso a base de datos, validaciones, documentación Swagger y endpoints REST.

### Estructura sugerida
```txt
antly-api/
├─ src/
│  ├─ common/
│  │  ├─ decorators/
│  │  ├─ filters/
│  │  ├─ guards/
│  │  ├─ interceptors/
│  │  ├─ pipes/
│  │  ├─ enums/
│  │  ├─ utils/
│  │  └─ dto/
│  ├─ config/
│  ├─ database/
│  │  ├─ migrations/
│  │  ├─ seeds/
│  │  └─ data-source.ts
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ dto/
│  │  │  ├─ entities/
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ auth.module.ts
│  │  │  ├─ jwt.strategy.ts
│  │  │  └─ refresh-token.service.ts
│  │  ├─ users/
│  │  ├─ budgets/
│  │  │  ├─ dto/
│  │  │  ├─ entities/
│  │  │  ├─ budgets.controller.ts
│  │  │  ├─ budgets.service.ts
│  │  │  ├─ budgets.module.ts
│  │  │  └─ budget-change-log.service.ts
│  │  ├─ categories/
│  │  ├─ income-sources/
│  │  ├─ incomes/
│  │  ├─ transactions/
│  │  └─ dashboard/
│  ├─ app.module.ts
│  └─ main.ts
├─ test/
├─ .env
├─ docker-compose.yml
├─ package.json
└─ README.md
```

### Criterios de organización backend
- arquitectura modular por dominio
- cada módulo debe contener controller, service, dto, entities y module
- centralizar enums y utilidades compartidas en `common`
- separar autenticación del dominio financiero
- incluir módulo `dashboard` para resúmenes y métricas derivadas

## 15. Módulos funcionales backend
### auth
- register
- login
- refresh token
- logout
- protección JWT

### users
- datos del usuario autenticado
- perfil básico

### income-sources
- CRUD de fuentes de ingreso

### incomes
- registrar ingresos
- listar ingresos por período

### budgets
- crear presupuesto mensual
- editar presupuesto
- validar unicidad por período
- registrar cambios

### categories
- CRUD de categorías
- CRUD de subcategorías
- validación de jerarquía

### transactions
- registrar gasto
- editar gasto
- eliminar gasto
- actualizar saldos

### dashboard
- resumen mensual
- saldo general
- saldos por categoría
- saldos por subcategoría
- métricas básicas

## 16. Endpoints mínimos sugeridos
### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Income sources
- `GET /income-sources`
- `POST /income-sources`
- `PATCH /income-sources/:id`
- `DELETE /income-sources/:id`

### Incomes
- `GET /incomes`
- `POST /incomes`
- `PATCH /incomes/:id`
- `DELETE /incomes/:id`

### Budgets
- `GET /budgets/:year/:month`
- `POST /budgets`
- `PATCH /budgets/:id`
- `POST /budgets/:id/allocations`

### Categories
- `GET /categories`
- `POST /categories`
- `POST /categories/:id/subcategories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Transactions
- `GET /transactions`
- `POST /transactions`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`

### Dashboard
- `GET /dashboard/:year/:month/summary`
- `GET /dashboard/:year/:month/categories`
- `GET /dashboard/:year/:month/subcategories`

## 17. Convenciones de implementación
### Frontend
- componentes en PascalCase
- hooks con prefijo `use`
- validaciones Zod por dominio
- formularios reutilizables
- llamadas API centralizadas

### Backend
- DTOs de entrada y salida
- controllers delgados
- services con lógica de negocio
- TypeORM para entidades y repositorios
- documentación Swagger por módulo

### Base de datos
- relaciones claras
- control de FK
- timestamps en entidades principales
- migraciones versionadas

## 18. Consideraciones para un asistente de código
1. El proyecto está en etapa MVP.
2. No debe sobrearquitecturarse la solución.
3. El dominio principal gira en torno a presupuesto mensual, ingresos, categorías y gastos.
4. Las métricas básicas son derivadas, no una capa analítica separada.
5. La plantilla inicial de categorías se resuelve desde código.
6. La estructura de carpetas debe priorizar claridad y separación por dominio.
7. Las subcategorías son el nivel real de operación.
8. El modelo debe permitir crecimiento futuro sin incorporar todavía funcionalidades fuera de alcance.

## 19. Prompt corto reutilizable para otro asistente
```txt
Actúa como arquitecto y asistente de implementación para Antly, una aplicación web de gestión de presupuestos personales. El MVP incluye autenticación con JWT y refresh tokens, fuentes de ingreso, ingresos del mes, presupuesto mensual, categorías jerárquicas, asignaciones a subcategorías, registro de gastos y dashboard con métricas básicas. Stack: Next.js + React + TypeScript + Tailwind + React Hook Form + Zod en frontend; NestJS + TypeORM + JWT en backend; PostgreSQL como base de datos. Necesito ayuda para estructurar correctamente los repositorios frontend y backend por dominio, proponiendo carpetas, módulos, convenciones, endpoints REST y una base técnica clara, mantenible y alineada con el MVP. No sobreingenierizar.
```
