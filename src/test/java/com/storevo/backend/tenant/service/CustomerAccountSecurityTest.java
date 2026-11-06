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
                cartManager, wishlistManager, emailNotificationService);
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
}
