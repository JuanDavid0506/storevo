# Storevo — guía para Claude

Plataforma SaaS multi-tenant de tiendas online (Spring Boot 3, Java 17+, JPA/Hibernate, MySQL, Thymeleaf + Vanilla JS, Tailwind).

## Arquitectura multi-tenant
- **`storevo_admin`** (esquema por defecto, `DB_URL`): datos de la plataforma — `stores`, `users`, `store_settings`, integraciones (Wompi, etc.). Entidades en `com.storevo.backend.admin`.
- **Esquema por tienda** (`Store.schemaName`, `[a-z0-9_]{1,64}`): productos, pedidos, clientes, carritos, cupones, reseñas… Entidades en `com.storevo.backend.tenant`. Se crea con `TenantSchemaService` ejecutando `src/main/resources/db/tenant-baseline.sql`.
- El esquema activo se fija con `TenantContext.setCurrentTenant(schema)` (resuelto por `TenantFilter` / `TenantIdentifierResolver` / `TenantConnectionProvider`). `TenantContext.clear()` vuelve a `storevo_admin`.
- **Regla clave:** para leer tablas de admin (settings, integraciones, stores) hay que hacer `TenantContext.clear()`, consultar, y volver a `setCurrentTenant(...)`. Dentro de una transacción de tenant se usa una `TransactionTemplate` con `REQUIRES_NEW` (ver `OrderService.loadStoreSettingsForCurrentTenant`).
- `open-in-view: false` → inicializa las colecciones LAZY dentro del servicio (ver `CustomerService.getOrdersForAuthenticatedCustomer`).
- **Cambios de esquema:** toda columna/índice nuevo va en DOS sitios: `tenant-baseline.sql` (tiendas nuevas) y `TenantSchemaMigrationRunner` (tiendas existentes, al arrancar). Deben coincidir con la entidad JPA (`ddl-auto: update` NO es la fuente de verdad).
- Tienda pública: `/s/{slug}/...` (`StoreFrontController`, `CartController`, `OrderController`, `WishlistController`, `StoreCustomerAuthController`). Todos comparten `StorefrontGlobalAdvice`, que inyecta tema, settings, contadores y la sesión del comprador.
- Dashboard del comerciante: `/dashboard/**`, protegido por `SecurityConfig`; `/s/**` es público (CSRF desactivado: los POST sensibles usan rate limit).

## Sesiones
- **Comerciante (Dashboard):** cookie `jwt` → `JwtAuthenticationFilter` → `JwtService.extractUsername`. Los tokens de comprador (`typ=STORE_CUSTOMER`) se rechazan ahí.
- **Comprador por tienda:** cookie `storevo_cust_{slug}` (HttpOnly, `Path=/s/{slug}`, 24 h o 30 d con "recordarme"). JWT con claims `typ`, `tenant`, `slug`, `cid`; se valida en `StorefrontGlobalAdvice` con `JwtService.extractValidatedCustomerId`. Un cambio de contraseña (`customers.password_changed_at`) invalida los tokens emitidos antes.
- **Invitado:** cookie `storevo_guest_id` (UUID, `Path=/`).
- El advice deja en el request `guestId` (la llave activa), `rawGuestId` y `loggedCustomer`. **Todo el código de carrito/favoritos debe leer `request.getAttribute("guestId")`, nunca la cookie.**

### Llaves de carrito y favoritos (`cart_items.session_id`, `wishlist_items.session_id`)
| Llave | Significado |
|---|---|
| `<uuid>` | bolsa/favoritos del invitado |
| `<uuid>:direct` | compra directa ("Comprar ahora", `?mode=direct`) del invitado |
| `cust:N` | bolsa/favoritos del comprador autenticado (Customer id N) |
| `cust:N:direct` | compra directa del comprador autenticado |

- Al iniciar sesión o registrarse, `CartManager.mergeGuestCartIntoCustomerCart` y `WishlistManager.mergeGuestWishlistIntoCustomerWishlist` pasan `<uuid>` → `cust:N` (con tope de stock, con bloqueo `FOR UPDATE`) y `<uuid>:direct` → `cust:N:direct`.
- `TenantCleanupScheduler` borra `%:direct` vencidos y los carritos de invitado; nunca los `cust:%` normales.

### Reglas de cuentas de compradores
- Una cuenta (`customers.has_account = true`) **no se modifica** desde un pedido: `syncCustomerOnOrderCreated` solo actualiza métricas. Los datos de la cuenta cambian únicamente en "Mi Cuenta" o con "Guardar estos datos" en el checkout.
- "Mi Cuenta" y el badge del navbar solo muestran pedidos con `orders.placed_with_account = true` (creados con la sesión iniciada). No hay reclamo masivo de pedidos de invitado por teléfono/email.
- Al registrarse sobre un perfil de invitado se borran sus datos sensibles (dirección, documento, razón social…).
- El token de reseteo se guarda hasheado (SHA-256); el enlace usa `storevo.mail.base-url` (nunca el header Host).
- Rutas públicas sensibles pasan por `RateLimitService.tryConsumeByIp` (login, register, forgot/reset-password, password, profile, checkout, reseñas).

## Tests
- Pruebas unitarias (sin base de datos):
  `./mvnw test -Dtest=!BackendApplicationTests`
- Una sola clase: `./mvnw test -Dtest=CustomerAccountSecurityTest`
- Solo compilar: `./mvnw test-compile`
- `BackendApplicationTests` es un `@SpringBootTest` que necesita MySQL real y las variables de entorno (`DB_URL`, usuario/clave, `JWT_SECRET` ≥ 32 bytes, `STOREVO_CRYPTO_SECRET_KEY`); sin ellas falla con "Access denied". Los demás tests usan Mockito y no necesitan base de datos.
- Tests clave: `C2CartAndOrderIntegrityTest` (carrito/pedido), `tenant/service/CustomerAccountSecurityTest` (seguridad de cuentas), `AccountTemplateExpressionsTest` (SpEL de la plantilla "Mi Cuenta").

## Convenciones
- Comentarios y mensajes de usuario en español.
- SpEL en Thymeleaf: nunca uses `${a or b}` con Strings/nulos; compara con `!= null`.
- Correos: `@Async` y siempre después del commit (`afterCommit`).
