package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.security.JwtService;
import com.storevo.backend.config.security.RateLimitService;
import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.repository.StoreReviewRepository;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.SendResult;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.TokenState;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.Verification;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.VerifyResult;
import com.storevo.backend.tenant.service.CustomerService;
import com.storevo.backend.tenant.service.EmailVerificationPolicy;
import com.storevo.backend.tenant.service.StoreThemeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.web.servlet.mvc.support.RedirectAttributesModelMap;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/**
 * Puerta de verificación del portal «Mi Cuenta» (D2/D3): solo el portal se bloquea; las cuentas existentes tienen 30 días de
 * gracia con aviso persistente; el checkout nunca depende de la verificación.
 */
class StoreCustomerAuthControllerVerificationTest {

    private CustomerService customerService;
    private StoreReviewRepository storeReviewRepository;
    private StoreSettingsService storeSettingsService;
    private JwtService jwtService;
    private RateLimitService rateLimitService;
    private CustomerEmailVerificationService verificationService;
    private Store store;

    @BeforeEach
    void setUp() {
        customerService = mock(CustomerService.class);
        storeReviewRepository = mock(StoreReviewRepository.class);
        storeSettingsService = mock(StoreSettingsService.class);
        jwtService = mock(JwtService.class);
        rateLimitService = mock(RateLimitService.class);
        verificationService = mock(CustomerEmailVerificationService.class);
        lenient().when(rateLimitService.tryConsumeByIp(any(), anyString(), anyInt(), any())).thenReturn(true);
        lenient().when(customerService.getOrdersForAuthenticatedCustomer(any())).thenReturn(List.of());
        store = new Store();
        store.setSlug("mi-tienda");
        store.setSchemaName("tenant_demo");
    }

    /** Política con la gracia anclada a hoy: {@code graceStartDaysAgo} días atrás (30 días de plazo desde esa fecha). */
    private StoreCustomerAuthController controller(boolean enabled, int graceStartDaysAgo) {
        EmailVerificationPolicy policy = new EmailVerificationPolicy(enabled, LocalDate.now().minusDays(graceStartDaysAgo));
        StoreCustomerAuthController c = new StoreCustomerAuthController(
                customerService, storeReviewRepository, storeSettingsService, mock(StoreThemeService.class),
                jwtService, rateLimitService, verificationService, policy);
        ReflectionTestUtils.setField(c, "appBaseUrl", "https://storevo.co");
        return c;
    }

    private Customer existingUnverified(int graceStartDaysAgo) {
        return Customer.builder().id(1L).name("Ana").email("ana@mail.com").phone("3001234567").hasAccount(true)
                .createdAt(LocalDate.now().minusDays(graceStartDaysAgo + 10).atStartOfDay()).build();
    }

    private Customer newUnverified() {
        return Customer.builder().id(2L).name("Luis").email("luis@mail.com").phone("3109999999").hasAccount(true)
                .createdAt(LocalDateTime.now().minusHours(2)).build();
    }

    private MockHttpServletRequest request(Customer logged) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setAttribute("currentStore", store);
        r.setAttribute("loggedCustomer", logged);
        r.setAttribute("rawGuestId", "guest-1");
        return r;
    }

    // ----------------------------------------------------------------- portal

    @Test
    void blockedAccountOnlySeesTheVerifyYourEmailScreen() {
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller(true, 0).accountDashboard("mi-tienda", "orders", request(newUnverified()), model);

        assertEquals("storefront/account/verify-required", view);
        assertEquals("l***@mail.com", model.get("maskedEmail"));
        assertNull(model.get("customerOrders"), "no se cargan datos del portal");
        verify(customerService, never()).getOrdersForAuthenticatedCustomer(any());
    }

    @Test
    void existingAccountWithinGraceEntersThePortalWithAPersistentWarning() {
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller(true, 5).accountDashboard("mi-tienda", "orders", request(existingUnverified(5)), model);

        assertEquals("storefront/account/index", view);
        @SuppressWarnings("unchecked")
        Map<String, Object> banner = (Map<String, Object>) model.get("emailVerificationGrace");
        assertNotNull(banner);
        assertEquals(25L, banner.get("daysLeft")); // 30 días desde grace-start - 5 transcurridos
        assertEquals("a***@mail.com", banner.get("maskedEmail"));
        assertEquals(LocalDate.now().minusDays(5).plusDays(30).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")), banner.get("deadline"));
    }

    @Test
    void existingAccountIsBlockedOnceTheThirtyDaysHavePassed() {
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller(true, 31).accountDashboard("mi-tienda", "orders", request(existingUnverified(31)), model);

        assertEquals("storefront/account/verify-required", view);
        assertNull(model.get("emailVerificationGrace"));
    }

    @Test
    void verifiedAccountsAndDisabledVerificationGetTheNormalPortalWithoutBanner() {
        Customer verified = newUnverified();
        verified.setEmailVerifiedAt(LocalDateTime.now());
        ExtendedModelMap normal = new ExtendedModelMap();
        assertEquals("storefront/account/index", controller(true, 0).accountDashboard("mi-tienda", "orders", request(verified), normal));
        assertNull(normal.get("emailVerificationGrace"));

        ExtendedModelMap off = new ExtendedModelMap();
        assertEquals("storefront/account/index", controller(false, 0).accountDashboard("mi-tienda", "orders", request(newUnverified()), off));
        assertNull(off.get("emailVerificationGrace"));
    }

    @Test
    void blockedAccountCannotChangeProfileOrPasswordThroughTheBackDoor() {
        StoreCustomerAuthController c = controller(true, 0);
        MockHttpServletRequest req = request(newUnverified());

        String profile = c.updateProfile("mi-tienda", "Luis", "3109999999", "otro@mail.com", null, null, null, null, null, null, null,
                false, req, new RedirectAttributesModelMap());
        String password = c.updatePassword("mi-tienda", "actual123", "nueva1234", "nueva1234", req, new MockHttpServletResponse(),
                new RedirectAttributesModelMap());

        assertEquals("redirect:/s/mi-tienda/account", profile);
        assertEquals("redirect:/s/mi-tienda/account", password);
        verify(customerService, never()).updateAuthenticatedCustomerProfile(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(customerService, never()).changeCustomerPassword(any(), any(), any());
    }

    @Test
    void changingTheEmailFromTheProfileSendsALinkToTheNewAddress() {
        Customer logged = existingUnverified(5);
        logged.setEmailVerifiedAt(LocalDateTime.now());
        Customer updated = Customer.builder().id(1L).name("Ana").email("nuevo@mail.com").hasAccount(true).build();
        when(customerService.updateAuthenticatedCustomerProfile(eq(1L), any(), any(), eq("nuevo@mail.com"), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(updated);
        when(verificationService.issueAndSend(eq(1L), eq(store), any(), anyString())).thenReturn(SendResult.SENT);
        RedirectAttributesModelMap flash = new RedirectAttributesModelMap();

        controller(true, 5).updateProfile("mi-tienda", "Ana", "3001234567", "nuevo@mail.com", null, null, null, null, null, null, null,
                false, request(logged), flash);

        assertTrue(flash.getFlashAttributes().get("accountSuccess").toString().contains("verificar tu nuevo correo"));
        verify(verificationService).issueAndSend(eq(1L), eq(store), any(), eq("https://storevo.co"));
    }

    // ------------------------------------------------------------- registro

    @Test
    void registrationStartsTheSessionSendsTheLinkAndTellsTheBuyerToVerify() {
        Customer created = Customer.builder().id(9L).name("Nuevo").email("nuevo@mail.com").hasAccount(true).build();
        when(customerService.registerCustomerAccount(anyString(), anyString(), anyString(), anyString(), any())).thenReturn(created);
        when(jwtService.generateCustomerToken(eq(9L), anyString(), anyString(), anyBoolean())).thenReturn("jwt");
        when(verificationService.issueAndSend(eq(9L), eq(store), any(), anyString())).thenReturn(SendResult.SENT);
        RedirectAttributesModelMap flash = new RedirectAttributesModelMap();
        MockHttpServletResponse response = new MockHttpServletResponse();

        String view = controller(true, 0).processCustomerRegister("mi-tienda", "Nuevo", "nuevo@mail.com", "3001112233",
                "password123", "password123", true, "/s/mi-tienda/cart/checkout", request(null), response, flash);

        assertEquals("redirect:/s/mi-tienda/cart/checkout", view, "puede seguir comprando: el checkout no se bloquea");
        assertNotNull(response.getHeader("Set-Cookie"), "se inicia la sesión del comprador");
        assertTrue(flash.getFlashAttributes().get("accountSuccess").toString().contains("n***@mail.com"));
        verify(verificationService).issueAndSend(eq(9L), eq(store), any(), eq("https://storevo.co"));
    }

    @Test
    void registrationDoesNotSendALinkWhenVerificationIsOff() {
        Customer created = Customer.builder().id(9L).name("Nuevo").email("nuevo@mail.com").hasAccount(true).build();
        when(customerService.registerCustomerAccount(anyString(), anyString(), anyString(), anyString(), any())).thenReturn(created);
        when(jwtService.generateCustomerToken(any(), anyString(), anyString(), anyBoolean())).thenReturn("jwt");

        controller(false, 0).processCustomerRegister("mi-tienda", "Nuevo", "nuevo@mail.com", "3001112233",
                "password123", "password123", true, null, request(null), new MockHttpServletResponse(), new RedirectAttributesModelMap());

        verifyNoInteractions(verificationService);
    }

    // ------------------------------------------------------ enlace del correo

    @Test
    void theLinkPageNeverConsumesTheTokenAndOnlyOffersTheButtonWhenItIsValid() {
        when(verificationService.inspectToken(" tok-ok ")).thenReturn(TokenState.VALID);
        when(verificationService.inspectToken("tok-viejo")).thenReturn(TokenState.EXPIRED);
        StoreCustomerAuthController c = controller(true, 0);

        ExtendedModelMap valid = new ExtendedModelMap();
        assertEquals("storefront/account/verify-email", c.showVerifyEmail("mi-tienda", " tok-ok ", request(null), valid, new RedirectAttributesModelMap()));
        assertEquals("VALID", valid.get("verifyState"));
        assertEquals("tok-ok", valid.get("token"));

        ExtendedModelMap expired = new ExtendedModelMap();
        c.showVerifyEmail("mi-tienda", "tok-viejo", request(null), expired, new RedirectAttributesModelMap());
        assertEquals("EXPIRED", expired.get("verifyState"));
        assertNull(expired.get("token"), "un token vencido no se reenvía a la plantilla");

        verify(verificationService, never()).verifyWithToken(any());
    }

    @Test
    void confirmingTheLinkRedirectsToThePortalIfTheSessionMatchesOtherwiseToLogin() {
        Customer logged = newUnverified();
        when(verificationService.verifyWithToken("tok")).thenReturn(new Verification(VerifyResult.VERIFIED, 2L));
        StoreCustomerAuthController c = controller(true, 0);

        RedirectAttributesModelMap sameSession = new RedirectAttributesModelMap();
        assertEquals("redirect:/s/mi-tienda/account", c.processVerifyEmail("mi-tienda", "tok", request(logged), sameSession));
        assertNotNull(sameSession.getFlashAttributes().get("accountSuccess"));

        RedirectAttributesModelMap noSession = new RedirectAttributesModelMap();
        assertEquals("redirect:/s/mi-tienda/account/login", c.processVerifyEmail("mi-tienda", "tok", request(null), noSession));
        assertNotNull(noSession.getFlashAttributes().get("authSuccess"));

        Customer other = Customer.builder().id(77L).email("x@mail.com").hasAccount(true).build();
        assertEquals("redirect:/s/mi-tienda/account/login", c.processVerifyEmail("mi-tienda", "tok", request(other), new RedirectAttributesModelMap()));
    }

    @Test
    void anExpiredOrReusedLinkSendsTheBuyerBackToAnExplanationPage() {
        when(verificationService.verifyWithToken("tok viejo")).thenReturn(new Verification(VerifyResult.EXPIRED, null));

        String view = controller(true, 0).processVerifyEmail("mi-tienda", "tok viejo", request(null), new RedirectAttributesModelMap());

        assertEquals("redirect:/s/mi-tienda/account/verify-email?token=tok+viejo", view);
    }

    // --------------------------------------------------------------- reenvío

    @Test
    void publicResendAnswersTheSameWayWhetherOrNotTheAccountExists() {
        StoreCustomerAuthController c = controller(true, 0);

        RedirectAttributesModelMap known = new RedirectAttributesModelMap();
        assertEquals("redirect:/s/mi-tienda/account/login", c.resendVerification("mi-tienda", "ana@mail.com", request(null), known));

        RedirectAttributesModelMap unknown = new RedirectAttributesModelMap();
        doThrow(new IllegalStateException("boom")).when(verificationService).resendForEmail(eq("fallo@mail.com"), any(), any(), anyString());
        c.resendVerification("mi-tienda", "fallo@mail.com", request(null), unknown);

        assertEquals(known.getFlashAttributes().get("authSuccess"), unknown.getFlashAttributes().get("authSuccess"),
                "el mensaje no debe revelar si el correo existe ni si falló el envío");
        assertEquals(1, known.getFlashAttributes().size());
    }

    @Test
    void resendWithASessionReportsSentCooldownAndAlreadyVerified() {
        Customer logged = newUnverified();
        StoreCustomerAuthController c = controller(true, 0);

        when(verificationService.issueAndSend(eq(2L), eq(store), any(), anyString())).thenReturn(SendResult.SENT);
        RedirectAttributesModelMap sent = new RedirectAttributesModelMap();
        c.resendVerification("mi-tienda", null, request(logged), sent);
        assertTrue(sent.getFlashAttributes().get("accountSuccess").toString().contains("l***@mail.com"));

        when(verificationService.issueAndSend(eq(2L), eq(store), any(), anyString())).thenReturn(SendResult.COOLDOWN);
        when(verificationService.secondsUntilResend(logged)).thenReturn(42L);
        RedirectAttributesModelMap cooldown = new RedirectAttributesModelMap();
        c.resendVerification("mi-tienda", null, request(logged), cooldown);
        assertTrue(cooldown.getFlashAttributes().get("accountError").toString().contains("42"));

        when(verificationService.issueAndSend(eq(2L), eq(store), any(), anyString())).thenReturn(SendResult.NOT_APPLICABLE);
        RedirectAttributesModelMap done = new RedirectAttributesModelMap();
        c.resendVerification("mi-tienda", null, request(logged), done);
        assertEquals("Tu correo ya está verificado.", done.getFlashAttributes().get("accountSuccess"));
    }

    @Test
    void theVerificationEndpointsAreRateLimitedPerStoreAndIp() {
        when(rateLimitService.tryConsumeByIp(any(), anyString(), anyInt(), any())).thenReturn(false);
        StoreCustomerAuthController c = controller(true, 0);

        c.resendVerification("mi-tienda", "ana@mail.com", request(null), new RedirectAttributesModelMap());
        c.processVerifyEmail("mi-tienda", "tok", request(null), new RedirectAttributesModelMap());
        c.showVerifyEmail("mi-tienda", "tok", request(null), new ExtendedModelMap(), new RedirectAttributesModelMap());
        c.changeUnverifiedEmail("mi-tienda", "otro@mail.com", request(newUnverified()), new RedirectAttributesModelMap());

        verifyNoInteractions(verificationService);
        verify(customerService, never()).updateAuthenticatedCustomerProfile(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(rateLimitService).tryConsumeByIp(any(), eq("cust_verify_resend_mi-tienda"), eq(5), any());
        verify(rateLimitService).tryConsumeByIp(any(), eq("cust_verify_submit_mi-tienda"), eq(10), any());
        verify(rateLimitService).tryConsumeByIp(any(), eq("cust_verify_view_mi-tienda"), eq(20), any());
        verify(rateLimitService).tryConsumeByIp(any(), eq("cust_verify_email_change_mi-tienda"), eq(5), any());
    }

    // ------------------------------------------------- corregir correo mal escrito

    @Test
    void anUnverifiedBuyerCanFixATypoInTheEmailAndGetANewLink() {
        Customer logged = newUnverified();
        Customer updated = Customer.builder().id(2L).name("Luis").email("luis.correcto@mail.com").hasAccount(true).build();
        when(customerService.updateAuthenticatedCustomerProfile(eq(2L), isNull(), isNull(), eq("luis.correcto@mail.com"),
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull())).thenReturn(updated);
        when(verificationService.issueAndSend(eq(2L), eq(store), any(), anyString())).thenReturn(SendResult.SENT);
        RedirectAttributesModelMap flash = new RedirectAttributesModelMap();

        String view = controller(true, 0).changeUnverifiedEmail("mi-tienda", "luis.correcto@mail.com", request(logged), flash);

        assertEquals("redirect:/s/mi-tienda/account", view);
        assertTrue(flash.getFlashAttributes().get("accountSuccess").toString().contains("l***@mail.com"));
    }

    @Test
    void aVerifiedBuyerCannotUseTheUnverifiedEmailShortcutAndErrorsAreShown() {
        Customer verified = newUnverified();
        verified.setEmailVerifiedAt(LocalDateTime.now());
        controller(true, 0).changeUnverifiedEmail("mi-tienda", "otro@mail.com", request(verified), new RedirectAttributesModelMap());
        verify(customerService, never()).updateAuthenticatedCustomerProfile(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any());

        when(customerService.updateAuthenticatedCustomerProfile(any(), any(), any(), eq("ocupado@mail.com"), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("Ese correo electrónico ya está en uso por otra cuenta."));
        RedirectAttributesModelMap flash = new RedirectAttributesModelMap();
        controller(true, 0).changeUnverifiedEmail("mi-tienda", "ocupado@mail.com", request(newUnverified()), flash);
        assertEquals("Ese correo electrónico ya está en uso por otra cuenta.", flash.getFlashAttributes().get("accountError"));
    }

    // --------------------------------------------------------------- D3

    @Test
    void checkoutAndOrderCreationNeverDependOnEmailVerification() throws Exception {
        // La barrera vive SOLO en el portal: ninguna de estas clases puede referenciar la verificación
        for (String file : List.of(
                "src/main/java/com/storevo/backend/tenant/controller/CartController.java",
                "src/main/java/com/storevo/backend/tenant/controller/OrderController.java",
                "src/main/java/com/storevo/backend/tenant/controller/WishlistController.java",
                "src/main/java/com/storevo/backend/tenant/controller/StorefrontGlobalAdvice.java",
                "src/main/java/com/storevo/backend/tenant/service/OrderService.java",
                "src/main/java/com/storevo/backend/tenant/service/CartManager.java")) {
            String source = Files.readString(Path.of(file));
            assertFalse(source.contains("EmailVerification") || source.contains("emailVerif"),
                    file + " no debe condicionar nada a la verificación del correo (D3)");
        }
    }
}
