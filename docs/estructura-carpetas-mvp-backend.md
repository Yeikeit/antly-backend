# Antly Backend - Estructura de Carpetas MVP

## Objetivo de este documento
Este documento detalla como organizar el backend NestJS del MVP de Antly para mantener una arquitectura modular, simple de mantener y alineada al alcance definido.

## Principios de organizacion
- Modulos por dominio funcional.
- Controllers delgados y services con logica de negocio.
- DTOs para validar contratos de entrada/salida.
- Entidades orientadas a persistencia con TypeORM.
- Reutilizacion de piezas transversales en common.

## Estructura base

```txt
antly-backend/
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
│  │  └─ seeds/
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ dto/
│  │  │  └─ entities/
│  │  ├─ users/
│  │  │  ├─ dto/
│  │  │  └─ entities/
│  │  ├─ income-sources/
│  │  │  ├─ dto/
│  │  │  └─ entities/
│  │  ├─ incomes/
│  │  │  ├─ dto/
│  │  │  └─ entities/
│  │  ├─ budgets/
│  │  │  ├─ dto/
│  │  │  └─ entities/
│  │  ├─ categories/
│  │  │  ├─ dto/
│  │  │  └─ entities/
│  │  ├─ transactions/
│  │  │  ├─ dto/
│  │  │  └─ entities/
│  │  └─ dashboard/
│  │     ├─ dto/
│  │     └─ entities/
│  ├─ app.module.ts
│  └─ main.ts
├─ test/
└─ docs/
```

## Detalle por carpeta

### src/
Responsabilidad: codigo fuente principal de la API.

Debe concentrar:
- Inicializacion de aplicacion.
- Carga de modulos.
- Configuracion global.

### src/common/
Responsabilidad: piezas reutilizables en todo el backend.

#### common/decorators/
Decoradores personalizados reutilizables.
Ejemplo de uso: obtener usuario autenticado desde request.

#### common/filters/
Filtros globales de excepciones.
Objetivo: respuestas de error consistentes.

#### common/guards/
Guards de autenticacion/autorizacion.
Objetivo: proteger endpoints privados.

#### common/interceptors/
Interceptors para transformacion de respuesta, logging basico o metadatos.

#### common/pipes/
Pipes de validacion y transformacion de parametros.

#### common/enums/
Enumeraciones compartidas del dominio.
Ejemplo: tipos de transaccion, estados simples.

#### common/utils/
Funciones auxiliares puras.
Regla MVP: pequenas, claras y con responsabilidad unica.

#### common/dto/
DTOs compartidos entre modulos.
Ejemplo: paginacion base, filtros comunes.

### src/config/
Responsabilidad: configuraciones centralizadas.

Debe contener:
- Variables de entorno de JWT, DB, CORS, puerto.
- Validaciones de configuracion para evitar arranques invalidos.

No debe contener:
- Regla de negocio del dominio financiero.

### src/database/
Responsabilidad: capa de persistencia y evolucion de esquema.

#### database/migrations/
Migraciones versionadas de base de datos.
Regla: cada cambio estructural pasa por migracion.

#### database/seeds/
Datos iniciales controlados (si se usan).
Para MVP puede incluir catalogos minimos o plantillas base.

### src/modules/
Responsabilidad: organizar funcionalidad por dominio.

Patron de cada modulo en MVP:
- modulo.controller.ts: recibe requests y delega.
- modulo.service.ts: aplica logica de negocio.
- modulo.module.ts: define providers/imports.
- dto/: contratos de entrada/salida.
- entities/: entidades TypeORM.

## Detalle de modulos funcionales

### modules/auth/
Responsabilidad: autenticacion y sesion.

Debe cubrir:
- registro
- login
- refresh token
- logout

Contenido tipico:
- dto de credenciales y tokens.
- entidad refresh token.
- estrategia JWT.

### modules/users/
Responsabilidad: datos del usuario autenticado.

Debe cubrir:
- perfil basico
- actualizacion minima de datos de usuario (si aplica al MVP)

### modules/income-sources/
Responsabilidad: CRUD de fuentes de ingreso por usuario.

### modules/incomes/
Responsabilidad: registro y consulta de ingresos del mes.

### modules/budgets/
Responsabilidad: presupuesto mensual.

Debe cubrir:
- crear presupuesto por mes/anio.
- validar unicidad por usuario/periodo.
- editar presupuesto.
- registrar trazabilidad de cambios.

### modules/categories/
Responsabilidad: categorias y subcategorias.

Debe cubrir:
- CRUD categoria padre.
- CRUD subcategoria.
- validacion de jerarquia de dos niveles.

### modules/transactions/
Responsabilidad: gastos del usuario.

Debe cubrir:
- registrar gasto.
- editar/eliminar gasto.
- actualizar saldos derivados.

### modules/dashboard/
Responsabilidad: endpoints de resumen mensual.

Debe cubrir:
- saldo general.
- saldos por categoria y subcategoria.
- metricas basicas derivadas.

## Archivos raiz importantes de backend

### src/main.ts
- Bootstrap de NestJS.
- Pipes globales, prefijo global, CORS, swagger (si ya se habilita).

### src/app.module.ts
- Composicion de modulos raiz.

### test/
- Pruebas unitarias y e2e.
- En MVP, priorizar auth y flujos criticos (budget/transaction).

### docs/
- Documentacion interna de arquitectura y convenciones.

## Regla de separacion de responsabilidades
- Controller: traduce HTTP a llamada de servicio.
- Service: aplica reglas del negocio.
- DTO: valida y tipa entradas/salidas.
- Entity: define persistencia.
- Common: herramientas transversales.

Si una clase mezcla 2 o mas de estas responsabilidades, debe refactorizarse.

## Complejidad adecuada para MVP
- Un service principal por modulo al inicio.
- Evitar patrones avanzados (CQRS/event sourcing) sin necesidad real.
- Evitar sobrefragmentar carpetas con subniveles innecesarios.
- Priorizar endpoints funcionales y validaciones claras.

## Checklist de calidad estructural
- Cada endpoint vive dentro de su modulo de dominio.
- Ninguna regla de negocio queda en controllers.
- Todos los inputs publicos tienen DTO.
- Las entidades reflejan relaciones del dominio definido.
- Los recursos compartidos solo van a common si realmente los usa mas de un modulo.
