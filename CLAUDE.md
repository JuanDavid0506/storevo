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

## Estilos de la cuenta del comprador (`/s/{slug}/account/**`)
- Las 4 plantillas de `storefront/account/` usan solo clases `sv-acct-*`, definidas en la sección delimitada «Cuenta del comprador» de `static/css/store-components.css`. **No** uses utilidades `brand` de Tailwind (`bg-brand/10`, `focus:ring-brand`…): `app.css` es Tailwind 3 precompilado y `brand` no es un color de Tailwind (solo existen a mano `.bg-brand`, `.text-brand`, `.border-brand` en `store-layout.html`). Una clase que no está en `app.css` simplemente no se pinta.
- La identidad sale únicamente de las variables que `store-layout.html` ya publica (`--brand-color`, `--store-radius`, `--sv-card-radius`, `--font-heading`) y de `data-button-radius` / `data-sv-card-shadow` de `<body>`. No crees variables de tema nuevas ni colores de marca fijos. Los botones deben llevar `font-bold rounded-xl` para heredar la forma de botón del comerciante.
- El texto sobre la marca (`--sv-acct-on-brand`) y el de acento (`--sv-acct-brand-ink`) se calculan con color relativo (`oklch(from …)`) para leerse con cualquier color primario, claro u oscuro.
- Superficies blancas (`sv-acct-surface`), igual que carrito y checkout. Mensajes y JS compartidos: `storefront/account/fragments.html` (`alert`, `account-js`); el JS es compatible con el router SPA (sin listeners globales acumulables).
- Los indicadores del portal (pedidos / en curso / entregados) se calculan solo desde los pedidos mostrados (`StoreCustomerAuthController.buildOrderStats`), nunca desde `Customer.totalOrders/totalSpent`.
- Contraseñas de compradores: la ÚNICA fuente de verdad es `tenant/service/PasswordPolicy` (≥8 caracteres, una letra, un número, ≤72 bytes; sin `trim()`). `CustomerService` la usa en registro, cambio y reseteo; `StoreCustomerAuthController.addPasswordPolicy` publica `passwordRules`/`passwordRulesJson` y el fragmento `pw-rules`/`pw-match` + el JS de `fragments.html` pintan los requisitos en tiempo real. No escribas reglas a mano ni `minlength="8"` en las plantillas. Para cambiar una regla edita solo `PasswordPolicy`; `PasswordPolicyJsParityTest` ejecuta con Node la misma función JS y la compara con Java (se omite si no hay Node).
- Verificación de correo del comprador (`customers.email_verified_at/_verification_token/_expires_at/_sent_at`, por esquema de tienda): `EmailVerificationPolicy` decide quién entra al portal (`VERIFIED` / `GRACE` / `BLOCKED`) y `CustomerEmailVerificationService` emite/consume tokens (SHA-256, 24 h, un solo uso, reenvío cada 60 s). La barrera aplica SOLO al portal `/s/{slug}/account` (controlador `StoreCustomerAuthController`); carrito, checkout y pedidos NUNCA dependen de ella (hay un test que lo vigila). Cuentas creadas antes de `storevo.customer.email-verification.grace-start` (por defecto 2026-11-06; **ajústala a la fecha real del despliegue** con `CUSTOMER_EMAIL_VERIFICATION_GRACE_START`) tienen 30 días con aviso persistente; después solo ven `verify-required.html`. `CUSTOMER_EMAIL_VERIFICATION=off` desactiva todo. Con `MAIL_ENABLED=false` el enlace se imprime en el log (solo en ese caso). Reusar el enlace de recuperación de contraseña también verifica el correo; cambiar el correo lo deja sin verificar. Toda columna nueva va en entidad + `tenant-baseline.sql` + `TenantSchemaMigrationRunner` (`TenantSchemaContractTest` lo exige).
- Estabilidad de página en Account: el footer se pega al fondo por flex del layout (no añadas `min-height` en vh a `.sv-acct`); la barra de scroll se reserva con `scrollbar-gutter` solo en cuentas y `svAcctSwitch` vuelve al inicio del portal al cambiar de pestaña.
- Pestañas válidas de `?tab=`: `orders`, `shipping`, `billing`, `security` (`profile` es alias de `shipping`).
- Guardas: `AccountStyleContractTest` (clases y variables CSS definidas, sin colores fijos) y `AccountTemplateExpressionsTest` (renderiza las plantillas reales con un layout mínimo en `src/test/resources/test-templates/`).
