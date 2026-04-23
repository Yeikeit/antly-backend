# Implementación de Autenticación — Antly Backend

## Índice
1. [Visión general](#1-visión-general)
2. [Arquitectura de carpetas](#2-arquitectura-de-carpetas)
3. [Conceptos base antes de leer el código](#3-conceptos-base-antes-de-leer-el-código)
4. [Las dos tablas de base de datos](#4-las-dos-tablas-de-base-de-datos)
5. [Entidades TypeORM](#5-entidades-typeorm)
6. [DTOs — la puerta de entrada de datos](#6-dtos--la-puerta-de-entrada-de-datos)
7. [AuthService — la lógica central](#7-authservice--la-lógica-central)
8. [AuthController — los endpoints HTTP](#8-authcontroller--los-endpoints-http)
9. [JwtAuthGuard — el portero de rutas protegidas](#9-jwtauthguard--el-portero-de-rutas-protegidas)
10. [CurrentUser decorator](#10-currentuser-decorator)
11. [AuthModule — el ensamblador](#11-authmodule--el-ensamblador)
12. [AppModule — la raíz de la aplicación](#12-appmodule--la-raíz-de-la-aplicación)
13. [Flujos completos paso a paso](#13-flujos-completos-paso-a-paso)
14. [Variables de entorno](#14-variables-de-entorno)
15. [Mapa de conexiones entre archivos](#15-mapa-de-conexiones-entre-archivos)

---

## 1. Visión general

El sistema de autenticación usa **JWT (JSON Web Tokens)** con un esquema de dos tokens:

| Token | Tipo | Duración | Dónde vive |
|---|---|---|---|
| **Access Token** | JWT firmado | 15 minutos | Solo en memoria del cliente |
| **Refresh Token** | String aleatorio | 7 días | Tabla `refresh_tokens` en la BD |

**Por qué dos tokens:**
- El access token es corto y viaja en cada request. Si alguien lo roba, expira en 15 min.
- El refresh token dura más y solo se usa para pedir un nuevo access token. Se puede revocar explícitamente (logout).
- Nunca se guarda el access token en la base de datos. Solo existe en la memoria del cliente y en tránsito.

---

## 2. Arquitectura de carpetas

```
src/
├── app.module.ts                          ← Raíz: conecta todo
├── main.ts                                ← Bootstrap: arranca la app
│
├── common/
│   ├── guards/
│   │   └── jwt-auth.guard.ts              ← Protege rutas privadas
│   └── decorators/
│       └── current-user.decorator.ts      ← Extrae el usuario del token
│
└── modules/
    ├── users/
    │   └── entities/
    │       └── user.entity.ts             ← Mapa de la tabla `users`
    └── auth/
        ├── auth.module.ts                 ← Ensambla todas las piezas
        ├── auth.controller.ts             ← Define los endpoints HTTP
        ├── auth.service.ts                ← Toda la lógica de negocio
        ├── dto/
        │   ├── register.dto.ts            ← Forma esperada para registrarse
        │   └── login.dto.ts               ← Forma esperada para iniciar sesión
        └── entities/
            └── refresh-token.entity.ts    ← Mapa de la tabla `refresh_tokens`
```

---

## 3. Conceptos base antes de leer el código

### ¿Qué es un JWT?
Un JWT es una cadena de texto dividida en tres partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWlkLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.FIRMA
     HEADER                              PAYLOAD                                   SIGNATURE
```

- **Header**: algoritmo usado para firmar (HS256).
- **Payload**: datos públicos dentro del token. En este caso: `{ sub: userId, email, iat, exp }`.
  - `sub` = "subject", el identificador del dueño del token.
  - `iat` = "issued at", cuándo se creó.
  - `exp` = "expires at", cuándo expira.
- **Signature**: el header + payload firmados con `JWT_ACCESS_SECRET`. Si alguien modifica el payload, la firma no coincide y el token se rechaza.

El token **no está encriptado**, solo firmado. El payload es legible por cualquiera (base64). Por eso nunca se guarda información sensible ahí (contraseñas, datos privados).

### ¿Qué es bcrypt?
bcrypt es una función de hash diseñada para contraseñas. Dos características clave:
1. **Lento a propósito**: el factor de trabajo (en este caso `10`) hace que calcular un hash tome ~100ms. Si alguien roba la BD, no puede calcular millones de contraseñas por segundo.
2. **Con sal aleatoria**: cada vez que hasheas la misma contraseña, el resultado es diferente. Esto evita ataques con tablas precalculadas (rainbow tables).

```
bcrypt.hash("mipassword", 10)  →  "$2b$10$Xyz...ABC"  (siempre diferente)
bcrypt.compare("mipassword", "$2b$10$Xyz...ABC")  →  true/false
```

### ¿Qué es SHA-256?
SHA-256 es una función de hash criptográfico determinista: la misma entrada siempre produce la misma salida. Se usa para el refresh token porque:
- El refresh token ya tiene alta entropía (256 bits aleatorios).
- Necesitamos buscarlo en la BD por hash, así que debe ser determinista.
- bcrypt no sirve aquí porque produce hashes distintos cada vez y no se puede buscar.

---

## 4. Las dos tablas de base de datos

### Tabla `users`
```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,   -- nunca la contraseña en texto plano
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- `id`: UUID generado por PostgreSQL con `gen_random_uuid()`. Es el identificador único que viaja dentro del JWT.
- `password_hash`: jamás se guarda la contraseña original, solo su hash bcrypt.
- `is_active`: permite desactivar usuarios sin borrarlos. Un usuario inactivo no puede iniciar sesión aunque tenga credenciales válidas.

### Tabla `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,   -- hash SHA-256 del token real
    expires_at  TIMESTAMP NOT NULL,
    revoked_at  TIMESTAMP NULL,          -- NULL = activo, fecha = revocado
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- `token_hash`: nunca se guarda el refresh token real, solo su hash SHA-256.
- `revoked_at`: si es `NULL`, el token está activo. Al hacer logout, se pone la fecha actual aquí. Este patrón (soft delete con timestamp) permite saber cuándo se revocó, útil para auditoría.
- `ON DELETE CASCADE`: si se borra un usuario, todos sus refresh tokens se borran automáticamente.

Un usuario puede tener múltiples refresh tokens activos (por ejemplo, sesión desde el celular y desde el navegador al mismo tiempo).

---

## 5. Entidades TypeORM

TypeORM es un ORM (Object-Relational Mapper). Las entidades son clases TypeScript que TypeORM mapea a tablas de la BD. En lugar de escribir SQL a mano, se trabaja con objetos.

### `user.entity.ts`

```typescript
@Entity('users')           // ← le dice a TypeORM: esta clase = tabla 'users'
export class User {
  @PrimaryGeneratedColumn('uuid')   // ← columna id UUID, generada por la BD
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  //         ↑ el nombre en la BD es snake_case,
  //           en TypeScript usamos camelCase
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  // ↑ TypeORM llena esto automáticamente al crear el registro
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  // ↑ TypeORM actualiza esto automáticamente cada vez que se guarda
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  // ↑ relación: un User tiene muchos RefreshTokens
  //   El segundo argumento es la "inversa": cómo el RefreshToken apunta al User
  refreshTokens: RefreshToken[];
}
```

**`@PrimaryGeneratedColumn('uuid')`** — en lugar de un número autoincremental, usa un UUID. Los UUIDs son seguros para exponer en URLs porque no revelan cuántos usuarios hay ni permiten enumerar IDs consecutivos.

### `refresh-token.entity.ts`

```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;             // ← la FK como campo plano (para crear registros)

  @Column({ name: 'token_hash', length: 255 })
  tokenHash: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', nullable: true, type: 'timestamp' })
  revokedAt: Date | null;     // ← null = activo, Date = revocado

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  // ↑ le dice a TypeORM que la columna FK en esta tabla es 'user_id'
  user: User;                 // ← el objeto User cargado (con relations: ['user'])
}
```

**Dualidad `userId` / `user`:**
- `userId: string` — se usa para crear registros (`{ userId: user.id }`). Solo guarda el UUID.
- `user: User` — se usa cuando se pide `relations: ['user']` en una query. TypeORM hace el JOIN automáticamente y llena este campo con el objeto completo.

---

## 6. DTOs — la puerta de entrada de datos

DTO = Data Transfer Object. Son clases que definen la forma esperada del body de un request. `class-validator` lee los decoradores y valida automáticamente antes de que el código se ejecute.

### `register.dto.ts`
```typescript
export class RegisterDto {
  @IsEmail()          // ← valida formato email (tiene @, dominio, etc.)
  email: string;

  @IsString()
  @MinLength(8)       // ← mínimo 8 caracteres
  password: string;

  @IsString()
  @IsNotEmpty()       // ← no puede ser string vacío ""
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
```

### `login.dto.ts`
```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

**¿Cómo funciona la validación?**

En `main.ts` se configura `ValidationPipe` de forma global:
```typescript
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
);
```

- `whitelist: true` — elimina automáticamente cualquier campo que no esté declarado en el DTO. Si el cliente manda `{ email, password, esAdmin: true }`, el campo `esAdmin` se descarta silenciosamente antes de llegar al service.
- `forbidNonWhitelisted: true` — en lugar de descartar campos extra, lanza un error 400. Más estricto.
- `transform: true` — convierte los valores al tipo TypeScript declarado (strings a números si corresponde, etc.).

Si la validación falla, NestJS devuelve automáticamente un `400 Bad Request` con detalles del error, sin que el código del controller o service se ejecute.

---

## 7. AuthService — la lógica central

El service es donde vive toda la lógica de negocio. El controller solo recibe el request y delega.

### Método `register(dto)`

```
1. Busca si ya existe un usuario con ese email
   → Si existe: lanza ConflictException (HTTP 409)

2. Hashea la contraseña con bcrypt (factor de trabajo = 10, ~100ms)

3. Crea y guarda el usuario en la BD

4. Llama a buildTokenResponse(user) → devuelve access + refresh + datos del usuario
```

**¿Por qué el mismo mensaje de error en login sin importar si el email no existe o si la contraseña es incorrecta?**
Para no revelar si un email está o no registrado. Si dijéramos "email no encontrado", un atacante podría enumerar emails existentes.

### Método `login(dto)`

```
1. Busca usuario por email
   → Si no existe O está inactivo: lanza UnauthorizedException (HTTP 401)

2. Compara la contraseña ingresada con el hash guardado (bcrypt.compare)
   → Si no coincide: lanza UnauthorizedException (HTTP 401)

3. Llama a buildTokenResponse(user)
```

### Método `refresh(rawRefreshToken)`

```
1. Calcula SHA-256 del token recibido

2. Busca en la BD un registro con ese hash donde revokedAt IS NULL
   → IsNull() de TypeORM genera "WHERE revoked_at IS NULL" en SQL

3. Si no existe O ya expiró (expiresAt < ahora): lanza UnauthorizedException

4. Verifica que el usuario siga activo

5. Genera y devuelve un nuevo access token
```

**¿Por qué no se renueva el refresh token también?**
En este diseño, el refresh token mantiene su ventana de 7 días original. Si se quisiera implementar "rolling refresh" (renovar el refresh token en cada uso), se podría revocar el actual y crear uno nuevo. Es una decisión de diseño; el MVP usa refresh estático.

### Método `logout(rawRefreshToken)`

```
1. Calcula SHA-256 del token recibido

2. Actualiza en la BD: pone revokedAt = ahora
   WHERE token_hash = hash AND revoked_at IS NULL

3. No devuelve nada (HTTP 204)
```

El access token NO se invalida (no se puede, no está en la BD). El cliente debe descartarlo. Como dura solo 15 min, expirará pronto de todas formas.

### Método privado `buildTokenResponse(user)`

```
1. Genera el access token JWT (con jwtService.sign)

2. Genera el refresh token:
   - randomBytes(32) → 32 bytes aleatorios = 256 bits de entropía
   - .toString('hex') → string de 64 caracteres hexadecimales

3. Hashea el refresh token con SHA-256

4. Calcula la fecha de expiración (hoy + JWT_REFRESH_EXPIRES_DAYS días)

5. Guarda en la BD: { userId, tokenHash, expiresAt }

6. Devuelve al cliente: { accessToken, refreshToken (el real, no el hash), user: {...} }
```

**Lo clave:** al cliente se le envía el token original (64 chars hex). En la BD se guarda solo su hash SHA-256. Si la BD es comprometida, el atacante tiene los hashes pero no puede reconstruir los tokens originales.

### Método privado `hashToken(token)`

```typescript
private hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

SHA-256 es determinista: el mismo input siempre da el mismo output de 64 chars hex. Esto permite buscar en la BD: `WHERE token_hash = hashToken(tokenRecibido)`.

### Método privado `signAccessToken(user)`

```typescript
private signAccessToken(user: User): string {
  return this.jwtService.sign({ sub: user.id, email: user.email });
}
```

`jwtService.sign()` usa la configuración del `JwtModule` (secret + expiresIn = 900s). El payload `{ sub, email }` se incrusta en el JWT. El cliente puede decodificar el payload (base64), pero no puede modificarlo sin invalidar la firma.

---

## 8. AuthController — los endpoints HTTP

```typescript
@Controller('auth')   // ← todas las rutas empiezan con /auth
export class AuthController {
```

| Decorador | Endpoint | HTTP Status | Descripción |
|---|---|---|---|
| `@Post('register')` | `POST /auth/register` | 201 Created | Crea cuenta y devuelve tokens |
| `@Post('login')` + `@HttpCode(200)` | `POST /auth/login` | 200 OK | Verifica credenciales y devuelve tokens |
| `@Post('refresh')` + `@HttpCode(200)` | `POST /auth/refresh` | 200 OK | Renueva el access token |
| `@Post('logout')` + `@HttpCode(204)` + `@UseGuards(JwtAuthGuard)` | `POST /auth/logout` | 204 No Content | Revoca el refresh token |

**¿Por qué `@HttpCode(200)` en login?**
Por defecto, `@Post` devuelve 201 (Created). Login no crea nada nuevo, solo verifica, así que se sobreescribe a 200.

**¿Por qué logout requiere el guard pero refresh no?**
- `/refresh`: solo necesita el refresh token para funcionar. Si el access token ya expiró (el caso más común de usar refresh), no se puede exigir que lo mande.
- `/logout`: requiere un access token válido como capa extra de seguridad. Quien quiera revocar el refresh token debe demostrar que también tiene el access token activo.

**`@Body('refreshToken')`** en lugar de `@Body()`:
```typescript
refresh(@Body('refreshToken') refreshToken: string)
// vs
refresh(@Body() body: { refreshToken: string })
```
Ambos funcionan. El primero extrae directamente el campo `refreshToken` del body JSON, evitando crear un DTO específico para un solo campo.

---

## 9. JwtAuthGuard — el portero de rutas protegidas

Un `Guard` en NestJS es un interceptor que se ejecuta antes del controller y decide si el request puede continuar.

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtiene el objeto Request de Express
    const request = context.switchToHttp().getRequest<Request>();

    // 2. Extrae el token del header Authorization
    const token = this.extractBearerToken(request);
    // Header esperado: "Authorization: Bearer eyJhbGci..."

    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    try {
      // 3. Verifica la firma y la expiración
      //    Usa el secret configurado en JwtModule (JWT_ACCESS_SECRET)
      //    Lanza error si el token es inválido o expiró
      const payload = this.jwtService.verify(token);

      // 4. Adjunta el payload al request para usarlo en el controller/service
      request['user'] = payload;
      // payload = { sub: userId, email, iat, exp }
      return true;

    } catch {
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }
  }

  private extractBearerToken(request: Request): string | null {
    // Separa "Bearer" del token actual
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
```

**Uso en el controller:**
```typescript
@UseGuards(JwtAuthGuard)   // ← ejecuta el guard antes del método
@Post('logout')
logout(@Body('refreshToken') refreshToken: string) { ... }
```

El guard se puede aplicar a un método, a todo un controller, o globalmente. En este MVP se aplica método a método para tener control fino.

---

## 10. CurrentUser decorator

```typescript
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
```

El guard pone `request.user = payload`. Este decorator lo extrae cómodamente:

```typescript
// Sin el decorator:
@Get('perfil')
getPerfil(@Req() req: Request) {
  const userId = req['user'].sub;
}

// Con el decorator:
@Get('perfil')
getPerfil(@CurrentUser() user: JwtPayload) {
  const userId = user.sub;
}
```

`JwtPayload` define la forma del payload que viene del token:
```typescript
export interface JwtPayload {
  sub: string;    // userId
  email: string;
  iat: number;    // issued at (timestamp Unix)
  exp: number;    // expires at (timestamp Unix)
}
```

---

## 11. AuthModule — el ensamblador

```typescript
@Module({
  imports: [
    // Registra las entidades User y RefreshToken en este módulo
    // Esto habilita @InjectRepository(User) y @InjectRepository(RefreshToken)
    // en AuthService
    TypeOrmModule.forFeature([User, RefreshToken]),

    // Configura el módulo JWT con el secret y la expiración
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: 900 },  // 900 segundos = 15 minutos
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],

  // exports: lo que otros módulos pueden usar al importar AuthModule
  exports: [AuthService, JwtAuthGuard, JwtModule],
  // JwtModule se exporta para que otros módulos puedan inyectar JwtService
  // (por ejemplo, si otro módulo necesita verificar tokens)
})
export class AuthModule {}
```

**`registerAsync` vs `register`:**
- `register({})` — configuración estática, en el momento de declarar el módulo.
- `registerAsync({})` — configuración diferida, espera a que el sistema de DI arranque y puede inyectar servicios (como `ConfigService`) para leer variables de entorno.

---

## 12. AppModule — la raíz de la aplicación

```typescript
@Module({
  imports: [
    // Carga el .env y lo hace disponible globalmente
    // isGlobal: true → no hace falta importar ConfigModule en cada módulo
    ConfigModule.forRoot({ isGlobal: true }),

    // Configura la conexión TypeORM a PostgreSQL (Neon)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),  // desde .env
        ssl: { rejectUnauthorized: false },        // requerido por Neon
        entities: [User, RefreshToken],            // todas las entidades registradas
        synchronize: false,   // NO recrear tablas automáticamente
                              // las tablas ya existen por create.sql
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    AuthModule,  // importa el módulo de autenticación
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**`synchronize: false`:** TypeORM puede crear/alterar tablas automáticamente comparando las entidades con el esquema real. Está desactivado porque las tablas ya fueron creadas por `create.sql` con constraints específicos. Si se activara en producción, podría alterar o borrar datos accidentalmente.

**`ssl: { rejectUnauthorized: false }`:** Neon (la BD serverless) requiere SSL. `rejectUnauthorized: false` acepta el certificado SSL de Neon aunque no esté en el almacén de certificados del sistema. En producción estricta se configuraría el certificado correctamente.

---

## 13. Flujos completos paso a paso

### Registro (`POST /auth/register`)

```
Cliente                    Controller           Service              BD
  │                            │                   │                  │
  │── POST /auth/register ────>│                   │                  │
  │   { email, password,       │                   │                  │
  │     firstName, lastName }  │                   │                  │
  │                            │                   │                  │
  │                  ValidationPipe valida el body  │                  │
  │                  (si falla → 400 automático)    │                  │
  │                            │                   │                  │
  │                            │── register(dto) ─>│                  │
  │                            │                   │── SELECT email ─>│
  │                            │                   │<── null (no existe)│
  │                            │                   │                  │
  │                            │                   │  bcrypt.hash(password, 10)
  │                            │                   │                  │
  │                            │                   │── INSERT users ─>│
  │                            │                   │<── user { id, email, ... }
  │                            │                   │                  │
  │                            │                   │  randomBytes(32) → rawToken
  │                            │                   │  sha256(rawToken) → hash
  │                            │                   │  expiresAt = hoy + 7 días
  │                            │                   │                  │
  │                            │                   │── INSERT refresh_tokens ─>│
  │                            │                   │                  │
  │                            │                   │  jwtService.sign({ sub: id, email })
  │                            │                   │  → accessToken (JWT 15min)
  │                            │                   │                  │
  │<── 201 { ─────────────────│<── response ──────│                  │
  │     accessToken: "eyJ...", │                   │                  │
  │     refreshToken: "a3f...",│                   │                  │
  │     user: { id, email,     │                   │                  │
  │             firstName,     │                   │                  │
  │             lastName }     │                   │                  │
  │   }                        │                   │                  │
```

### Acceso a ruta protegida

```
Cliente                 Guard (JwtAuthGuard)      Controller
  │                            │                      │
  │── GET /cualquier-ruta ────>│                      │
  │   Authorization: Bearer    │                      │
  │   eyJhbGci...              │                      │
  │                            │                      │
  │                  jwtService.verify(token)         │
  │                  → valida firma + expiración      │
  │                  → extrae payload { sub, email }  │
  │                  → request.user = payload         │
  │                            │                      │
  │                            │── canActivate: true ─>│
  │                            │                      │
  │                            │        @CurrentUser() extrae request.user
  │                            │                      │
  │<── 200 { ... } ───────────│<── respuesta ────────│
```

### Renovar access token (`POST /auth/refresh`)

```
Cliente                    Controller           Service              BD
  │                            │                   │                  │
  │── POST /auth/refresh ─────>│                   │                  │
  │   { refreshToken: "a3f..." }                   │                  │
  │                            │── refresh(token) ─>│                  │
  │                            │                   │  sha256("a3f...") → hash
  │                            │                   │── SELECT WHERE token_hash = hash
  │                            │                   │   AND revoked_at IS NULL ─────>│
  │                            │                   │<── { expiresAt, user: {...} } ──│
  │                            │                   │                  │
  │                            │                   │  expiresAt > ahora ✓
  │                            │                   │  user.isActive ✓
  │                            │                   │                  │
  │                            │                   │  jwtService.sign({ sub, email })
  │                            │                   │  → nuevo accessToken
  │                            │                   │                  │
  │<── 200 { accessToken } ───│<── response ──────│                  │
```

### Logout (`POST /auth/logout`)

```
Cliente                 Guard              Controller         Service          BD
  │                       │                    │                  │             │
  │── POST /auth/logout ─>│                    │                  │             │
  │   Authorization: Bearer eyJ...             │                  │             │
  │   { refreshToken: "a3f..." }               │                  │             │
  │                       │                    │                  │             │
  │             verifica access token          │                  │             │
  │             request.user = payload         │                  │             │
  │                       │── true ───────────>│                  │             │
  │                       │                    │── logout(token) ─>│             │
  │                       │                    │                  │  sha256(token)
  │                       │                    │                  │── UPDATE refresh_tokens
  │                       │                    │                  │   SET revoked_at = NOW()
  │                       │                    │                  │   WHERE token_hash = hash
  │                       │                    │                  │   AND revoked_at IS NULL ─>│
  │<── 204 No Content ────│<───────────────────│<─────────────────│             │
```

---

## 14. Variables de entorno

Archivo `.env` en la raíz del proyecto:

```env
# Conexión a la base de datos Neon (PostgreSQL serverless)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Secret para firmar los JWT de acceso
# En producción: string aleatorio largo (mínimo 32 chars)
JWT_ACCESS_SECRET="antly-access-secret-change-in-production"

# Duración del access token en segundos (900 = 15 minutos)
# Este valor NO se lee del .env actualmente; está hardcodeado en AuthModule
JWT_ACCESS_EXPIRES_IN="15m"

# Días de duración del refresh token (leído en AuthService)
JWT_REFRESH_EXPIRES_DAYS=7

# Entorno: activa logging SQL en 'development'
NODE_ENV="development"
```

> **Importante:** el `.env` nunca debe subirse a git. Agregar `.env` al `.gitignore` si no está ya.

---

## 15. Mapa de conexiones entre archivos

```
.env
 └─ leído por ──────────────────────> ConfigModule (global)
                                            │
                                   ConfigService.get(...)
                                            │
                        ┌───────────────────┤
                        │                   │
                  AuthModule          AppModule
                        │                   │
                  JwtModule.registerAsync   TypeOrmModule.forRootAsync
                  (usa JWT_ACCESS_SECRET,   (usa DATABASE_URL, ssl)
                   expiresIn: 900)          │
                        │                   │
                        │              entities: [User, RefreshToken]
                        │              (registra en TypeORM global)
                        │
              TypeOrmModule.forFeature([User, RefreshToken])
              (habilita @InjectRepository en AuthService)
                        │
              ┌─────────┼──────────────────────┐
              │         │                      │
          AuthService  AuthController      JwtAuthGuard
              │         │                      │
              │    recibe DTOs            usa JwtService
              │    (RegisterDto,          (verify token)
              │     LoginDto)             request.user = payload
              │         │                      │
              │    delega a AuthService         │
              │                           CurrentUser decorator
              │                           (extrae request.user)
              │
         ┌────┴────────────────────┐
         │                         │
    Repository<User>    Repository<RefreshToken>
    (userRepository)    (refreshTokenRepository)
         │                         │
    tabla: users           tabla: refresh_tokens
    (PostgreSQL Neon)      (PostgreSQL Neon)
```

### Flujo de dependencias por archivo

| Archivo | Depende de | Es usado por |
|---|---|---|
| `user.entity.ts` | `refresh-token.entity.ts` | `auth.module.ts`, `app.module.ts`, `auth.service.ts` |
| `refresh-token.entity.ts` | `user.entity.ts` | `auth.module.ts`, `app.module.ts`, `auth.service.ts` |
| `register.dto.ts` | `class-validator` | `auth.controller.ts`, `auth.service.ts` |
| `login.dto.ts` | `class-validator` | `auth.controller.ts`, `auth.service.ts` |
| `auth.service.ts` | `User`, `RefreshToken`, `JwtService`, `ConfigService` | `auth.controller.ts` |
| `jwt-auth.guard.ts` | `JwtService` | `auth.controller.ts` (via `@UseGuards`), otros controllers futuros |
| `current-user.decorator.ts` | — | Controllers con rutas protegidas |
| `auth.controller.ts` | `AuthService`, `JwtAuthGuard`, DTOs | `auth.module.ts` |
| `auth.module.ts` | Todo lo anterior + `JwtModule`, `TypeOrmModule` | `app.module.ts` |
| `app.module.ts` | `AuthModule`, `ConfigModule`, `TypeOrmModule` | `main.ts` |
| `main.ts` | `AppModule` | punto de entrada de la aplicación |
