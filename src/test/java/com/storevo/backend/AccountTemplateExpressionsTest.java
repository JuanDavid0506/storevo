package com.storevo.backend;

import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.model.Carrier;
import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderItem;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.model.Shipment;
import com.storevo.backend.tenant.model.StoreReview;
import nz.net.ultraq.thymeleaf.layoutdialect.LayoutDialect;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockServletContext;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.context.WebContext;
import org.thymeleaf.web.servlet.JakartaServletWebApplication;

import com.storevo.backend.tenant.service.PasswordPolicy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Renderiza las plantillas REALES de "Mi Cuenta" (index, login, forgot-password, reset-password) con Thymeleaf,
 * usando un layout mínimo de prueba (src/test/resources/test-templates). Detecta errores de SpEL con nulos,
 * fragmentos mal referenciados y atributos no soportados que solo explotarían en producción como un 500.
 */
class AccountTemplateExpressionsTest {

    private SpringTemplateEngine engine;

    @BeforeEach
    void setUp() {
        // El layout de prueba tiene prioridad (orden 1); todo lo demás sale de templates/ (orden 2)
        ClassLoaderTemplateResolver stubLayout = new ClassLoaderTemplateResolver();
        stubLayout.setPrefix("test-templates/");
        stubLayout.setSuffix(".html");
        stubLayout.setTemplateMode(TemplateMode.HTML);
        stubLayout.setCharacterEncoding("UTF-8");
        stubLayout.setCheckExistence(true);
        stubLayout.setOrder(1);

        ClassLoaderTemplateResolver real = new ClassLoaderTemplateResolver();
        real.setPrefix("templates/");
        real.setSuffix(".html");
        real.setTemplateMode(TemplateMode.HTML);
        real.setCharacterEncoding("UTF-8");
        real.setOrder(2);

        engine = new SpringTemplateEngine();
        engine.addTemplateResolver(stubLayout);
        engine.addTemplateResolver(real);
        engine.addDialect(new LayoutDialect());
    }

    private String render(String template, Map<String, Object> model) {
        MockServletContext servletContext = new MockServletContext();
        MockHttpServletRequest request = new MockHttpServletRequest(servletContext);
        MockHttpServletResponse response = new MockHttpServletResponse();
        WebContext ctx = new WebContext(
                JakartaServletWebApplication.buildApplication(servletContext).buildExchange(request, response),
                new Locale("es", "CO"), model);
        return engine.process(template, ctx);
    }

    private Map<String, Object> baseModel() {
        Map<String, Object> model = new HashMap<>();
        model.put("slug", "mi-tienda");
        model.put("settings", StoreSettingsDto.builder().storeName("Tienda Demo").build());
        // Lo mismo que publica StoreCustomerAuthController.addPasswordPolicy(model)
        model.put("passwordRules", PasswordPolicy.rules());
        model.put("passwordRulesJson", PasswordPolicy.rulesJson());
        return model;
    }

    private static String escapeAttr(String s) {
        return s.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private Customer customer() {
        return Customer.builder()
                .id(1L).name("Ana Pérez").phone("3001234567").email("ana@mail.com")
                .city("Bogotá").address("Calle 1 # 2-3")
                .documentType("NIT").document("900123456").verificationDigit("7")
                .legalName("Ana SAS").taxRegime("IVA").requiresElectronicInvoice(true)
                .hasAccount(true).createdAt(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();
    }

    private Order order(long id, OrderStatus status, OrderChannel channel) {
        Order order = Order.builder()
                .id(id).publicToken("tok-" + id).status(status).channel(channel)
                .total(125000.0).city("Bogotá").address("Calle 1 # 2-3")
                .createdAt(LocalDateTime.of(2026, 11, 5, 9, 30))
                .items(new ArrayList<>(List.of(
                        OrderItem.builder().productName("Camiseta - Rojo / M").quantity(2).subtotal(90000.0).build(),
                        OrderItem.builder().productName("Gorra").quantity(1).subtotal(35000.0).build())))
                .build();
        return order;
    }

    private Map<String, Object> portalModel(String activeTab, List<Order> orders) {
        Map<String, Object> model = baseModel();
        model.put("customer", customer());
        model.put("customerOrders", orders);
        List<Order> pending = new ArrayList<>();
        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.PENDING && o.getChannel() == OrderChannel.ONLINE) {
                pending.add(o);
            }
        }
        model.put("pendingOnlineOrders", pending);
        model.put("reviewsByOrderId", new HashMap<Long, StoreReview>());
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", (long) orders.size());
        stats.put("inProgress", 2L);
        stats.put("delivered", 1L);
        model.put("orderStats", stats);
        model.put("activeTab", activeTab);
        return model;
    }

    private List<Order> mixedOrders() {
        Order shipped = order(3, OrderStatus.SHIPPED, OrderChannel.ONLINE);
        shipped.setShipments(new ArrayList<>(List.of(Shipment.builder()
                .carrier(Carrier.builder().name("Servientrega").trackingUrlTemplate("https://track.test/{trackingNumber}").build())
                .trackingNumber("ABC123").build())));
        return List.of(
                order(1, OrderStatus.PENDING, OrderChannel.ONLINE),
                order(2, OrderStatus.PAID, OrderChannel.ONLINE),
                shipped,
                order(4, OrderStatus.DELIVERED, OrderChannel.WHATSAPP),
                order(5, OrderStatus.CANCELLED, OrderChannel.ONLINE));
    }

    private static boolean panelIsHidden(String html, String panelId) {
        return Pattern.compile("id=\"" + panelId + "\"[^>]*\\bhidden\\b").matcher(html).find();
    }

    @Test
    void portal_rendersAllSectionsForEveryTabAndShowsOnlyTheActiveOne() {
        for (String tab : List.of("orders", "shipping", "billing", "security")) {
            String html = render("storefront/account/index", portalModel(tab, mixedOrders()));

            for (String other : List.of("orders", "shipping", "billing", "security")) {
                boolean hidden = panelIsHidden(html, "acc-panel-" + other);
                assertEquals(!other.equals(tab), hidden, "Panel " + other + " con pestaña activa " + tab);
                assertTrue(html.contains("id=\"acc-tab-" + other + "\""));
            }
            assertTrue(html.contains("aria-selected=\"true\""));
        }
    }

    @Test
    void portal_showsOrdersWithSemanticStatusProgressAndTracking() {
        String html = render("storefront/account/index", portalModel("orders", mixedOrders()));

        assertTrue(html.contains("sv-acct-pill--pending"));
        assertTrue(html.contains("sv-acct-pill--progress"));
        assertTrue(html.contains("sv-acct-pill--shipped"));
        assertTrue(html.contains("sv-acct-pill--done"));
        assertTrue(html.contains("sv-acct-pill--cancelled"));
        assertTrue(html.contains("sv-acct-steps"), "Debe mostrar la línea de progreso");
        assertTrue(html.contains("Servientrega") && html.contains("ABC123"));
        assertTrue(html.contains("https://track.test/ABC123"));
        assertTrue(html.contains("Tienes pedidos pendientes de pago"));
        assertTrue(html.contains("Ana Pérez"));
        assertTrue(html.contains("Cliente desde 03/2026"));
        assertTrue(html.contains("Tienda Demo"), "La microcopia de privacidad usa el nombre de la tienda");
    }

    @Test
    void portal_formsKeepTheFieldNamesTheBackendExpects() {
        String html = render("storefront/account/index", portalModel("shipping", mixedOrders()));

        for (String name : List.of("name", "phone", "email", "city", "address", "documentType", "document",
                "verificationDigit", "legalName", "taxRegime", "requiresElectronicInvoice",
                "currentPassword", "newPassword", "confirmPassword")) {
            assertTrue(html.contains("name=\"" + name + "\""), "Falta el campo " + name);
        }
        assertTrue(html.contains("/s/mi-tienda/account/profile"));
        assertTrue(html.contains("/s/mi-tienda/account/password"));
        assertTrue(html.contains("/s/mi-tienda/account/logout"));
        assertTrue(html.contains("/cancel-and-restore"));
        assertTrue(html.contains("autocomplete=\"current-password\""));
        assertTrue(html.contains("autocomplete=\"new-password\""));
    }

    @Test
    void portal_rendersWithEmptyOrdersNullStatsAndNullOptionalFields() {
        Customer sparse = Customer.builder().id(2L).name("Luis").phone("3109999999").hasAccount(true).build();
        Map<String, Object> model = portalModel("orders", List.of());
        model.put("customer", sparse);
        model.put("orderStats", null);
        model.put("settings", null);

        String html = assertDoesNotThrow(() -> render("storefront/account/index", model));

        assertTrue(html.contains("Aún no tienes pedidos en tu cuenta"));
        assertFalse(html.contains("Tienes pedidos pendientes de pago"));
    }

    @Test
    void portal_rendersOrdersWithMissingStatusCityAndTotal() {
        Order odd = Order.builder().id(9L).publicToken("tok-9").build();
        Map<String, Object> model = portalModel("orders", List.of(odd));

        String html = assertDoesNotThrow(() -> render("storefront/account/index", model));

        assertTrue(html.contains("Pedido #9"));
        assertTrue(html.contains("Registrado"));
    }

    @Test
    void portal_flashMessagesAppearAsAlertsOnlyWhenPresent() {
        Map<String, Object> clean = portalModel("orders", mixedOrders());
        assertFalse(render("storefront/account/index", clean).contains("role=\"alert\""));

        Map<String, Object> withFlash = portalModel("shipping", mixedOrders());
        withFlash.put("accountSuccess", "Tus datos se actualizaron");
        withFlash.put("accountError", "No se pudo guardar");
        String html = render("storefront/account/index", withFlash);
        assertTrue(html.contains("Tus datos se actualizaron"));
        assertTrue(html.contains("No se pudo guardar"));
        assertTrue(html.contains("sv-acct-alert--success") && html.contains("sv-acct-alert--error"));

        Map<String, Object> review = portalModel("orders", mixedOrders());
        review.put("reviewSuccess", "Gracias por tu reseña");
        assertTrue(render("storefront/account/index", review).contains("Gracias por tu reseña"));
    }

    @Test
    void login_rendersBothTabsAndSwitchesVisibleForm() {
        Map<String, Object> model = baseModel();
        model.put("activeTab", "login");
        String login = render("storefront/account/login", model);
        assertFalse(panelIsHidden(login, "panel-auth-login"));
        assertTrue(panelIsHidden(login, "panel-auth-register"));
        assertTrue(login.contains("/s/mi-tienda/account/login") && login.contains("/s/mi-tienda/account/register"));
        assertTrue(login.contains("name=\"identifier\"") && login.contains("name=\"rememberMe\""));
        assertTrue(login.contains("autocomplete=\"username\"") && login.contains("autocomplete=\"new-password\""));

        model.put("activeTab", "register");
        model.put("redirectUrl", "/s/mi-tienda/cart/checkout");
        model.put("regName", "Ana");
        model.put("authError", "Las contraseñas no coinciden.");
        String register = render("storefront/account/login", model);
        assertTrue(panelIsHidden(register, "panel-auth-login"));
        assertFalse(panelIsHidden(register, "panel-auth-register"));
        assertTrue(register.contains("Las contraseñas no coinciden."));
        assertTrue(register.contains("value=\"/s/mi-tienda/cart/checkout\""));
        assertTrue(register.contains("value=\"Ana\""));
    }

    @Test
    void passwordRequirements_areGeneratedFromThePolicyInEveryFormThatCreatesAPassword() {
        Map<String, Object> login = baseModel();
        login.put("activeTab", "register");
        Map<String, Object> reset = baseModel();
        reset.put("token", "abc-token");

        Map<String, String> pages = new LinkedHashMap<>();
        pages.put("registro", render("storefront/account/login", login));
        pages.put("restablecer", render("storefront/account/reset-password", reset));
        pages.put("cambiar (Mi Cuenta)", render("storefront/account/index", portalModel("security", mixedOrders())));

        for (Map.Entry<String, String> page : pages.entrySet()) {
            String html = page.getValue();
            String where = page.getKey();
            assertTrue(html.contains("data-sv-pw"), where + ": falta el contenedor de requisitos");
            assertTrue(html.contains("data-rules=\"" + escapeAttr(PasswordPolicy.rulesJson()) + "\""),
                    where + ": las reglas que recibe el JS no son las de PasswordPolicy");
            assertTrue(html.contains("data-pw-new") && html.contains("data-pw-confirm"), where + ": faltan los campos enlazados");
            for (PasswordPolicy.Rule rule : PasswordPolicy.rules()) {
                assertTrue(html.contains("data-rule=\"" + rule.id() + "\""), where + ": falta la regla " + rule.id());
                assertTrue(html.contains(rule.label()), where + ": falta el texto de " + rule.id());
            }
            assertTrue(Pattern.compile("data-rule=\"maxBytes\"[^>]*\\bhidden\\b").matcher(html).find(),
                    where + ": la regla del límite debe nacer oculta");
            assertTrue(html.contains("data-pw-match"), where + ": falta el indicador de coincidencia");
        }
    }

    @Test
    void templatesDoNotHardcodePasswordRules() throws Exception {
        for (String file : List.of("index.html", "login.html", "forgot-password.html", "reset-password.html", "fragments.html", "verify-required.html", "verify-email.html")) {
            String content = Files.readString(Path.of("src/main/resources/templates/storefront/account/" + file));
            assertFalse(content.contains("minlength=\"8\""), file + ": minlength=\"8\" duplica una regla del servidor");
            assertFalse(content.contains("8 caracteres"), file + ": texto de regla escrito a mano");
        }
    }

    // ===================== Fase 2: verificación de correo =====================

    private Map<String, Object> graceBanner(long daysLeft, long resendWait) {
        Map<String, Object> banner = new LinkedHashMap<>();
        banner.put("daysLeft", daysLeft);
        banner.put("deadline", "06/12/2026");
        banner.put("maskedEmail", "a***@mail.com");
        banner.put("resendWaitSeconds", resendWait);
        return banner;
    }

    @Test
    void verifyRequiredScreen_showsOnlyTheVerificationActions() {
        Map<String, Object> model = baseModel();
        model.put("customer", customer());
        model.put("maskedEmail", "a***@mail.com");
        model.put("resendWaitSeconds", 0L);
        model.put("accountSuccess", "Te enviamos un enlace");

        String html = render("storefront/account/verify-required", model);

        assertTrue(html.contains("Verifica tu correo para continuar"));
        assertTrue(html.contains("a***@mail.com") && html.contains("Tienda Demo"));
        assertTrue(html.contains("/s/mi-tienda/account/resend-verification"), "reenviar el enlace");
        assertTrue(html.contains("/s/mi-tienda/account/change-unverified-email") && html.contains("name=\"email\""), "corregir un correo mal escrito");
        assertTrue(html.contains("/s/mi-tienda/catalog"), "puede seguir comprando");
        assertTrue(html.contains("/s/mi-tienda/account/logout"));
        assertTrue(html.contains("Te enviamos un enlace"), "muestra los avisos flash");
        // Solo esa pantalla: nada de los datos del portal
        assertFalse(html.contains("acc-panel-orders") || html.contains("currentPassword") || html.contains("Mis pedidos"));
        assertFalse(html.contains("podrás pedir otro"));

        model.put("resendWaitSeconds", 42L);
        assertTrue(render("storefront/account/verify-required", model).contains("podrás pedir otro en 42 segundos"));
    }

    @Test
    void verifyEmailPage_rendersEveryStateOfTheLink() {
        Map<String, Object> valid = baseModel();
        valid.put("verifyState", "VALID");
        valid.put("token", "tok-123");
        String ok = render("storefront/account/verify-email", valid);
        assertTrue(ok.contains("Confirma tu correo") && ok.contains("value=\"tok-123\"") && ok.contains("Verificar mi correo"));
        assertTrue(ok.contains("/s/mi-tienda/account/verify-email") && ok.contains("method=\"POST\""), "confirma con POST, no con GET");
        assertFalse(ok.contains("name=\"email\""));

        Map<String, Object> expired = baseModel();
        expired.put("verifyState", "EXPIRED");
        String late = render("storefront/account/verify-email", expired);
        assertTrue(late.contains("Este enlace venció") && late.contains("24 horas"));
        assertTrue(late.contains("name=\"email\"") && late.contains("/s/mi-tienda/account/resend-verification"), "sin sesión pide el correo");
        assertFalse(late.contains("value=\"tok"), "un enlace vencido no lleva token");

        Map<String, Object> invalid = baseModel();
        invalid.put("verifyState", "INVALID");
        invalid.put("authError", "Demasiados intentos");
        String bad = render("storefront/account/verify-email", invalid);
        assertTrue(bad.contains("Este enlace no es válido") && bad.contains("ya lo hayas usado") && bad.contains("Demasiados intentos"));

        // Con sesión no se pide el correo: se reenvía a la cuenta de la sesión
        Map<String, Object> logged = baseModel();
        logged.put("verifyState", "EXPIRED");
        logged.put("loggedCustomer", customer());
        assertFalse(render("storefront/account/verify-email", logged).contains("name=\"email\""));
    }

    @Test
    void graceBanner_isPersistentWithTheSendLinkButtonOnEveryTab() {
        for (String tab : List.of("orders", "shipping", "billing", "security")) {
            Map<String, Object> model = portalModel(tab, mixedOrders());
            model.put("emailVerificationGrace", graceBanner(12, 0));
            String html = render("storefront/account/index", model);

            assertTrue(html.contains("Tienes hasta el 06/12/2026 (quedan 12 días) para confirmar a***@mail.com"), tab);
            assertTrue(html.contains("Pasado ese plazo no podrás entrar a Mi Cuenta"), tab);
            int start = html.indexOf("sv-acct-alert--stack");
            String banner = html.substring(start, html.indexOf("</form>", start));
            assertTrue(banner.contains("/s/mi-tienda/account/resend-verification") && banner.contains("Enviar enlace de verificación"), tab);
            assertFalse(banner.contains("sv-acct-alert__close"), "el aviso persistente no se puede cerrar");
        }
    }

    @Test
    void graceBanner_countdownTextAndCooldownHint() {
        Map<String, Object> model = portalModel("orders", mixedOrders());
        model.put("emailVerificationGrace", graceBanner(1, 33));
        String html = render("storefront/account/index", model);
        assertTrue(html.contains("(queda 1 día)"));
        assertTrue(html.contains("Podrás pedir otro enlace en 33 segundos."));

        assertFalse(render("storefront/account/index", portalModel("orders", mixedOrders())).contains("Pasado ese plazo"),
                "sin plazo de gracia (cuenta verificada) no hay aviso");
    }

    @Test
    void forgotAndResetPasswordRenderWithAndWithoutMessages() {
        Map<String, Object> model = baseModel();
        String forgot = render("storefront/account/forgot-password", model);
        assertTrue(forgot.contains("name=\"emailOrPhone\"") && forgot.contains("/s/mi-tienda/account/forgot-password"));
        assertFalse(forgot.contains("role=\"alert\""));

        model.put("authSuccess", "Te enviamos un enlace");
        assertTrue(render("storefront/account/forgot-password", model).contains("Te enviamos un enlace"));

        Map<String, Object> reset = baseModel();
        reset.put("token", "abc-token");
        String html = render("storefront/account/reset-password", reset);
        assertTrue(html.contains("value=\"abc-token\"") && html.contains("name=\"confirmPassword\""));
        reset.put("authError", "El enlace expiró");
        assertTrue(render("storefront/account/reset-password", reset).contains("El enlace expiró"));
    }
}
