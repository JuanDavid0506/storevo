package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.CustomerRepository;
import com.storevo.backend.tenant.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Regresiones de seguridad de cuentas de compradores (auditoría C1, C2, C3, R6, R8).
 */
@ExtendWith(MockitoExtension.class)
class CustomerAccountSecurityTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private CartManager cartManager;
    @Mock private WishlistManager wishlistManager;
    @Mock private EmailNotificationService emailNotificationService;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(
                customerRepository, orderRepository, passwordEncoder,
                cartManager, wishlistManager, emailNotificationService,
                new EmailVerificationPolicy(true, java.time.LocalDate.of(2026, 11, 6)));
        lenient().when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Customer registeredAccount() {
        return Customer.builder()
                .id(1L).phoneKey("3001234567").phone("3001234567")
                .name("Víctima").email("victima@mail.com")
                .address("Calle Real 1").city("Bogotá")
                .hasAccount(true).passwordHash("hash")
                .totalOrders(2L).totalSpent(100.0)
                .build();
    }

    private Order guestOrder(String phone, String email) {
        return Order.builder()
                .customerName("Atacante").customerPhone(phone).customerEmail(email)
                .address("Otra dirección").city("Cali")
                .status(OrderStatus.PENDING).channel(OrderChannel.ONLINE).total(50.0)
                .build();
    }

    @Test
    void c1_guestCheckoutWithRegisteredPhone_doesNotOverwriteAccountEmail() {
        Customer account = registeredAccount();
        when(customerRepository.findByPhoneKey("3001234567")).thenReturn(Optional.of(account));

        Customer result = customerService.syncCustomerOnOrderCreated(guestOrder("3001234567", "atacante@mail.com"));

        assertSame(account, result);
        assertEquals("victima@mail.com", result.getEmail());
        assertEquals("Víctima", result.getName());
        assertEquals("Calle Real 1", result.getAddress());
        assertEquals(3L, result.getTotalOrders());
    }

    @Test
    void c1_guestCheckoutWithRegisteredEmail_doesNotOverwriteAccountPhone() {
        Customer account = registeredAccount();
        when(customerRepository.findByPhoneKey("3109999999")).thenReturn(Optional.empty());
        when(customerRepository.findFirstByEmailIgnoreCaseOrderByHasAccountDescIdDesc("victima@mail.com"))
                .thenReturn(Optional.of(account));

        Customer result = customerService.syncCustomerOnOrderCreated(guestOrder("3109999999", "victima@mail.com"));

        assertEquals("3001234567", result.getPhone());
        assertEquals("3001234567", result.getPhoneKey());
    }

    @Test
    void c3_authenticatedCheckout_doesNotMutateAccountIdentity() {
        Customer account = registeredAccount();
        when(customerRepository.findById(1L)).thenReturn(Optional.of(account));
        Order order = guestOrder("3205555555", "otro@mail.com");
        order.setCustomer(account);

        Customer result = customerService.syncCustomerOnOrderCreated(order);

        assertEquals("3001234567", result.getPhone());
        assertEquals("victima@mail.com", result.getEmail());
        assertEquals("Víctima", result.getName());
    }

    @Test
    void guestProfile_isStillUpdatedFromOrders_andDocumentStoredWithoutDv() {
        Customer guest = Customer.builder()
                .id(5L).phoneKey("3001112233").phone("3001112233").name("Invitado")
                .hasAccount(false).totalOrders(0L).totalSpent(0.0).build();
        when(customerRepository.findByPhoneKey("3001112233")).thenReturn(Optional.of(guest));
        Order order = guestOrder("3001112233", "invitado@mail.com");
        order.setCustomerDocument("900123456-7");
        order.setVerificationDigit("7");

        Customer result = customerService.syncCustomerOnOrderCreated(order);

        assertEquals("invitado@mail.com", result.getEmail());
        assertEquals("900123456", result.getDocument());
        assertEquals("7", result.getVerificationDigit());
    }

    @Test
    void c2_registerOverGuestProfile_clearsSensitiveDataAndDoesNotClaimOrders() {
        Customer guest = Customer.builder()
                .id(7L).phoneKey("3001234567").phone("3001234567").name("Dueño real")
                .email(null).address("Dirección privada").city("Medellín")
                .documentType("CC").document("123456").legalName("Empresa SAS").taxRegime("IVA")
                .requiresElectronicInvoice(true).hasAccount(false)
                .totalOrders(4L).totalSpent(400.0)
                .build();
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("nuevo@mail.com")).thenReturn(Optional.empty());
        when(customerRepository.findByPhoneKey("3001234567")).thenReturn(Optional.of(guest));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        Customer result = customerService.registerCustomerAccount(
                "Nuevo Usuario", "nuevo@mail.com", "3001234567", "password123", "guest-1");

        assertTrue(result.getHasAccount());
        assertNull(result.getAddress());
        assertNull(result.getCity());
        assertNull(result.getDocumentType());
        assertNull(result.getDocument());
        assertNull(result.getLegalName());
        assertNull(result.getTaxRegime());
        assertFalse(result.getRequiresElectronicInvoice());
        assertNotNull(result.getPasswordChangedAt());
        verifyNoInteractions(orderRepository);
        verify(cartManager).mergeGuestCartIntoCustomerCart("guest-1", 7L);
    }

    @Test
    void c2_login_doesNotClaimOrders() {
        Customer account = registeredAccount();
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("victima@mail.com")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("secret123", "hash")).thenReturn(true);

        customerService.authenticateCustomer("victima@mail.com", "secret123", "guest-2");

        verifyNoInteractions(orderRepository);
    }

    @Test
    void r6_loginErrors_useSameMessageForUnknownAccountAndWrongPassword() {
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("nadie@mail.com")).thenReturn(Optional.empty());
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("victima@mail.com"))
                .thenReturn(Optional.of(registeredAccount()));
        when(passwordEncoder.matches("mala", "hash")).thenReturn(false);

        IllegalArgumentException unknown = assertThrows(IllegalArgumentException.class,
                () -> customerService.authenticateCustomer("nadie@mail.com", "mala", null));
        IllegalArgumentException wrongPwd = assertThrows(IllegalArgumentException.class,
                () -> customerService.authenticateCustomer("victima@mail.com", "mala", null));

        assertEquals(unknown.getMessage(), wrongPwd.getMessage());
    }

    @Test
    void r8_resetToken_isStoredHashedAndValidatedByHash() {
        Customer account = registeredAccount();
        when(customerRepository.findFirstByEmailIgnoreCaseOrderByHasAccountDescIdDesc("victima@mail.com"))
                .thenReturn(Optional.of(account));
        com.storevo.backend.admin.model.Store store = new com.storevo.backend.admin.model.Store();
        store.setSlug("mi-tienda");

        customerService.requestCustomerPasswordReset("victima@mail.com", store, null, "https://storevo.co");

        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailNotificationService).sendStoreCustomerPasswordResetEmail(
                eq(store), isNull(), eq("victima@mail.com"), anyString(), linkCaptor.capture());
        String link = linkCaptor.getValue();
        assertTrue(link.startsWith("https://storevo.co/s/mi-tienda/account/reset-password?token="));
        String rawToken = link.substring(link.indexOf("token=") + "token=".length());

        assertNotEquals(rawToken, account.getResetPasswordToken());
        assertEquals(CustomerService.hashResetToken(rawToken), account.getResetPasswordToken());

        when(customerRepository.findByResetPasswordToken(CustomerService.hashResetToken(rawToken)))
                .thenReturn(Optional.of(account));
        assertTrue(customerService.isCustomerResetTokenValid(rawToken));
    }

    @Test
    void passwordPolicy_isEnforcedOnRegistration() {
        IllegalArgumentException noNumber = assertThrows(IllegalArgumentException.class, () ->
                customerService.registerCustomerAccount("Ana Pérez", "ana@mail.com", "3001234567", "abcdefgh", null));
        assertTrue(noNumber.getMessage().contains("Al menos un número"), noNumber.getMessage());

        IllegalArgumentException tooLong = assertThrows(IllegalArgumentException.class, () ->
                customerService.registerCustomerAccount("Ana Pérez", "ana@mail.com", "3001234567", "a".repeat(72) + "1", null));
        assertTrue(tooLong.getMessage().contains("72 bytes"), tooLong.getMessage());

        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    void passwordPolicy_isEnforcedWhenChangingThePassword() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                customerService.changeCustomerPassword(1L, "actual123", "12345678"));
        assertTrue(ex.getMessage().contains("Al menos una letra"), ex.getMessage());
        verify(customerRepository, never()).save(any(Customer.class));
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void passwordPolicy_isEnforcedWhenResettingWithAToken() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                customerService.resetCustomerPasswordWithToken("some-token", "corta1"));
        assertTrue(ex.getMessage().contains("Mínimo 8 caracteres"), ex.getMessage());
        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    void passwordPolicy_doesNotTrimSoTheStoredPasswordIsWhatTheUserTyped() {
        Customer account = registeredAccount();
        when(customerRepository.findById(1L)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("actual123", "hash")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        customerService.changeCustomerPassword(1L, "actual123", "  clave1  ");

        verify(passwordEncoder).encode("  clave1  ");
    }

    // ===================== Fase 2: verificación de correo =====================

    private Customer squatter(java.time.LocalDateTime createdAt, java.time.LocalDateTime linkExpiresAt) {
        return Customer.builder()
                .id(50L).phoneKey("3150000000").phone("3150000000").name("Impostor").email("victima@mail.com")
                .hasAccount(true).passwordHash("hash-impostor").createdAt(createdAt)
                .emailVerificationToken("hash-token").emailVerificationExpiresAt(linkExpiresAt)
                .build();
    }

    private static final java.time.LocalDateTime AFTER_RELEASE = java.time.LocalDateTime.of(2026, 11, 7, 10, 0);
    private static final java.time.LocalDateTime BEFORE_RELEASE = java.time.LocalDateTime.of(2026, 11, 5, 10, 0);

    @Test
    void registration_createsTheAccountWithTheEmailUnverified() {
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("nuevo@mail.com")).thenReturn(Optional.empty());
        when(customerRepository.findByPhoneKey("3001234567")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        Customer created = customerService.registerCustomerAccount("Nuevo Usuario", "nuevo@mail.com", "3001234567", "password123", null);

        assertTrue(created.getHasAccount());
        assertNull(created.getEmailVerifiedAt());
        assertNull(created.getEmailVerificationToken());
    }

    @Test
    void registration_releasesAnEmailClaimedByAStaleUnverifiedAccount() {
        Customer holder = squatter(AFTER_RELEASE, java.time.LocalDateTime.now().minusHours(1)); // enlace vencido
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("victima@mail.com")).thenReturn(Optional.of(holder));
        when(customerRepository.findByPhoneKey("3001234567")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        Customer real = customerService.registerCustomerAccount("Dueño Real", "victima@mail.com", "3001234567", "password123", null);

        assertTrue(real.getHasAccount());
        assertEquals("victima@mail.com", real.getEmail());
        // el impostor pierde el acceso y el correo, pero se conserva su perfil (teléfono, pedidos, métricas)
        assertFalse(holder.getHasAccount());
        assertNull(holder.getPasswordHash());
        assertNull(holder.getEmail());
        assertNull(holder.getEmailVerificationToken());
        assertEquals("3150000000", holder.getPhone());
    }

    @Test
    void registration_doesNotStealAnEmailWhoseVerificationLinkIsStillValid() {
        Customer holder = squatter(AFTER_RELEASE, java.time.LocalDateTime.now().plusHours(2)); // todavía puede verificar
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("victima@mail.com")).thenReturn(Optional.of(holder));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                customerService.registerCustomerAccount("Otra Persona", "victima@mail.com", "3001234567", "password123", null));

        assertTrue(ex.getMessage().contains("Ya existe una cuenta registrada con este correo"));
        assertTrue(holder.getHasAccount());
        assertEquals("victima@mail.com", holder.getEmail());
    }

    @Test
    void registration_neverReleasesExistingOrVerifiedAccountsNorWhenVerificationIsOff() {
        Customer existing = squatter(BEFORE_RELEASE, java.time.LocalDateTime.now().minusHours(1)); // cuenta existente con plazo de gracia
        Customer verified = squatter(AFTER_RELEASE, java.time.LocalDateTime.now().minusHours(1));
        verified.setEmailVerifiedAt(AFTER_RELEASE.plusHours(1));
        Customer recentButPolicyOff = squatter(AFTER_RELEASE, java.time.LocalDateTime.now().minusHours(1));

        for (Customer holder : java.util.List.of(existing, verified)) {
            when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("victima@mail.com")).thenReturn(Optional.of(holder));
            assertThrows(IllegalArgumentException.class, () ->
                    customerService.registerCustomerAccount("Otra Persona", "victima@mail.com", "3001234567", "password123", null));
            assertTrue(holder.getHasAccount(), "no se debe tocar la cuenta de " + holder.getId());
        }

        CustomerService off = new CustomerService(customerRepository, orderRepository, passwordEncoder, cartManager,
                wishlistManager, emailNotificationService, new EmailVerificationPolicy(false, java.time.LocalDate.of(2026, 11, 6)));
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("victima@mail.com")).thenReturn(Optional.of(recentButPolicyOff));
        assertThrows(IllegalArgumentException.class, () ->
                off.registerCustomerAccount("Otra Persona", "victima@mail.com", "3001234567", "password123", null));
        assertTrue(recentButPolicyOff.getHasAccount());
    }

    @Test
    void changingTheEmailDropsTheVerificationAndPendingLinksButKeepsTheResendCooldown() {
        Customer account = registeredAccount();
        java.time.LocalDateTime sent = java.time.LocalDateTime.of(2026, 11, 8, 9, 0);
        account.setEmailVerifiedAt(java.time.LocalDateTime.of(2026, 11, 8, 9, 5));
        account.setEmailVerificationToken("hash");
        account.setEmailVerificationExpiresAt(sent.plusHours(24));
        account.setEmailVerificationSentAt(sent);
        account.setResetPasswordToken("reset-hash");
        account.setResetPasswordExpiresAt(sent.plusMinutes(30));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(account));
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("nuevo@mail.com")).thenReturn(Optional.empty());

        Customer updated = customerService.updateAuthenticatedCustomerProfile(
                1L, null, null, "Nuevo@Mail.com", null, null, null, null, null, null, null, null);

        assertEquals("nuevo@mail.com", updated.getEmail());
        assertNull(updated.getEmailVerifiedAt());
        assertNull(updated.getEmailVerificationToken());
        assertNull(updated.getEmailVerificationExpiresAt());
        assertNull(updated.getResetPasswordToken());
        assertNull(updated.getResetPasswordExpiresAt());
        assertEquals(sent, updated.getEmailVerificationSentAt());
    }

    @Test
    void savingTheSameEmailWithDifferentCaseKeepsTheVerification() {
        Customer account = registeredAccount();
        java.time.LocalDateTime verifiedAt = java.time.LocalDateTime.of(2026, 11, 8, 9, 5);
        account.setEmailVerifiedAt(verifiedAt);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(account));
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("victima@mail.com")).thenReturn(Optional.of(account));

        Customer updated = customerService.updateAuthenticatedCustomerProfile(
                1L, null, null, "VICTIMA@mail.com", null, null, null, null, null, null, null, null);

        assertEquals(verifiedAt, updated.getEmailVerifiedAt());
    }

    @Test
    void profileEmailMustLookLikeAnEmail() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(registeredAccount()));

        assertThrows(IllegalArgumentException.class, () -> customerService.updateAuthenticatedCustomerProfile(
                1L, null, null, "sin-arroba", null, null, null, null, null, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> customerService.updateAuthenticatedCustomerProfile(
                1L, null, null, "a".repeat(120) + "@mail.com", null, null, null, null, null, null, null, null));
    }

    @Test
    void resettingThePasswordThroughTheEmailLinkVerifiesTheEmail() {
        Customer account = registeredAccount();
        account.setEmailVerificationToken("pendiente");
        account.setEmailVerificationExpiresAt(java.time.LocalDateTime.now().plusHours(3));
        account.setResetPasswordToken(CustomerService.hashResetToken("tok-reset"));
        account.setResetPasswordExpiresAt(java.time.LocalDateTime.now().plusMinutes(20));
        when(customerRepository.findByResetPasswordToken(CustomerService.hashResetToken("tok-reset"))).thenReturn(Optional.of(account));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        customerService.resetCustomerPasswordWithToken("tok-reset", "nuevaClave1");

        assertNotNull(account.getEmailVerifiedAt(), "usar el enlace enviado al correo demuestra que es del comprador");
        assertNull(account.getEmailVerificationToken());
        assertNull(account.getEmailVerificationExpiresAt());
        assertNull(account.getResetPasswordToken());
    }
}
