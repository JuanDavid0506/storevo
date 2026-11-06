package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.repository.CustomerRepository;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.SendResult;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.TokenState;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.Verification;
import com.storevo.backend.tenant.service.CustomerEmailVerificationService.VerifyResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/** Verificación de correo: token hasheado, de un solo uso, con vencimiento, reenvío limitado y correo post-commit. */
@ExtendWith(MockitoExtension.class)
class CustomerEmailVerificationServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Bogota");
    private static final String BASE = "https://storevo.co";

    @Mock private CustomerRepository customerRepository;
    @Mock private EmailNotificationService emailNotificationService;

    private EmailVerificationPolicy policy;
    private CustomerEmailVerificationService service;
    private MutableClock clock;
    private Store store;
    private Customer customer;

    /** Reloj que se puede adelantar para probar vencimientos y tiempos de espera. */
    static class MutableClock extends Clock {
        private Instant instant;

        MutableClock(LocalDateTime start) {
            this.instant = start.atZone(ZONE).toInstant();
        }

        void advance(java.time.Duration d) {
            instant = instant.plus(d);
        }

        @Override public ZoneId getZone() { return ZONE; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }

    @BeforeEach
    void setUp() {
        policy = new EmailVerificationPolicy(true, LocalDate.of(2026, 11, 6));
        service = new CustomerEmailVerificationService(customerRepository, emailNotificationService, policy);
        clock = new MutableClock(LocalDateTime.of(2026, 11, 10, 9, 0));
        service.setClock(clock);

        store = new Store();
        store.setSlug("mi-tienda");
        store.setSchemaName("tenant_demo");

        customer = Customer.builder().id(7L).name("Ana").email("ana@mail.com").hasAccount(true)
                .createdAt(LocalDateTime.of(2026, 11, 9, 8, 0)).build();
        lenient().when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
        lenient().when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));
        // Búsqueda por hash coherente con el estado actual de la entidad (simula la BD)
        lenient().when(customerRepository.findByEmailVerificationToken(anyString())).thenAnswer(inv ->
                inv.getArgument(0).equals(customer.getEmailVerificationToken()) ? Optional.of(customer) : Optional.empty());
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    /** Extrae el token en claro del enlace enviado por correo. */
    private String sendAndCaptureToken() {
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(emailNotificationService, atLeastOnce()).sendCustomerEmailVerificationEmail(
                eq(store), any(), eq("ana@mail.com"), eq("Ana"), link.capture());
        String last = link.getValue();
        assertTrue(last.startsWith(BASE + "/s/mi-tienda/account/verify-email?token="), last);
        return last.substring(last.indexOf("token=") + "token=".length());
    }

    @Test
    void issuingStoresOnlyTheHashAndEmailsTheLinkWithTheConfiguredBaseUrl() {
        assertEquals(SendResult.SENT, service.issueAndSend(7L, store, null, BASE + "/"));

        String raw = sendAndCaptureToken();
        assertNotEquals(raw, customer.getEmailVerificationToken(), "en BD no puede quedar el token en claro");
        assertEquals(CustomerService.hashResetToken(raw), customer.getEmailVerificationToken());
        assertEquals(clock.instant().atZone(ZONE).toLocalDateTime().plusHours(24), customer.getEmailVerificationExpiresAt());
        assertEquals(clock.instant().atZone(ZONE).toLocalDateTime(), customer.getEmailVerificationSentAt());
        assertNull(customer.getEmailVerifiedAt());
    }

    @Test
    void verifyingMarksTheEmailAndTheTokenCannotBeReused() {
        service.issueAndSend(7L, store, null, BASE);
        String raw = sendAndCaptureToken();
        assertEquals(TokenState.VALID, service.inspectToken(raw));

        Verification first = service.verifyWithToken(raw);

        assertEquals(VerifyResult.VERIFIED, first.result());
        assertEquals(7L, first.customerId());
        assertEquals(clock.instant().atZone(ZONE).toLocalDateTime(), customer.getEmailVerifiedAt());
        assertNull(customer.getEmailVerificationToken(), "el token se borra al usarse");
        assertNull(customer.getEmailVerificationExpiresAt());

        // Segundo intento con el mismo enlace: ya no existe
        assertEquals(VerifyResult.INVALID, service.verifyWithToken(raw).result());
        assertEquals(TokenState.INVALID, service.inspectToken(raw));
    }

    @Test
    void anExpiredLinkIsRejectedWithAClearStateAndDoesNotVerify() {
        service.issueAndSend(7L, store, null, BASE);
        String raw = sendAndCaptureToken();

        clock.advance(java.time.Duration.ofHours(24).plusSeconds(1));

        assertEquals(TokenState.EXPIRED, service.inspectToken(raw));
        assertEquals(VerifyResult.EXPIRED, service.verifyWithToken(raw).result());
        assertNull(customer.getEmailVerifiedAt());
    }

    @Test
    void theLinkIsStillValidJustBeforeItExpires() {
        service.issueAndSend(7L, store, null, BASE);
        String raw = sendAndCaptureToken();
        clock.advance(java.time.Duration.ofHours(23).plusMinutes(59));
        assertEquals(VerifyResult.VERIFIED, service.verifyWithToken(raw).result());
    }

    @Test
    void unknownBlankAndGarbageTokensAreInvalid() {
        assertEquals(VerifyResult.INVALID, service.verifyWithToken(null).result());
        assertEquals(VerifyResult.INVALID, service.verifyWithToken("   ").result());
        assertEquals(VerifyResult.INVALID, service.verifyWithToken("no-existe").result());
        assertEquals(TokenState.INVALID, service.inspectToken(null));
        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    void resendIsThrottledPerAccountAndAReissueInvalidatesThePreviousLink() {
        service.issueAndSend(7L, store, null, BASE);
        String first = sendAndCaptureToken();

        clock.advance(java.time.Duration.ofSeconds(30));
        assertEquals(SendResult.COOLDOWN, service.issueAndSend(7L, store, null, BASE));
        assertEquals(30, service.secondsUntilResend(customer, clock.instant().atZone(ZONE).toLocalDateTime()));
        verify(emailNotificationService, times(1)).sendCustomerEmailVerificationEmail(any(), any(), anyString(), anyString(), anyString());
        assertEquals(CustomerService.hashResetToken(first), customer.getEmailVerificationToken(), "durante la espera no cambia el token");

        clock.advance(java.time.Duration.ofSeconds(31));
        assertEquals(SendResult.SENT, service.issueAndSend(7L, store, null, BASE));
        verify(emailNotificationService, times(2)).sendCustomerEmailVerificationEmail(any(), any(), anyString(), anyString(), anyString());
        String second = sendAndCaptureToken();

        assertNotEquals(first, second);
        assertEquals(VerifyResult.INVALID, service.verifyWithToken(first).result(), "el enlace anterior queda invalidado");
        assertEquals(VerifyResult.VERIFIED, service.verifyWithToken(second).result());
    }

    @Test
    void nothingIsSentWhenItDoesNotApply() {
        // verificación desactivada
        CustomerEmailVerificationService off = new CustomerEmailVerificationService(
                customerRepository, emailNotificationService, new EmailVerificationPolicy(false, LocalDate.of(2026, 11, 6)));
        assertEquals(SendResult.NOT_APPLICABLE, off.issueAndSend(7L, store, null, BASE));

        // ya verificado
        customer.setEmailVerifiedAt(LocalDateTime.of(2026, 11, 9, 9, 0));
        assertEquals(SendResult.NOT_APPLICABLE, service.issueAndSend(7L, store, null, BASE));

        // perfil de invitado (sin cuenta) y cuenta sin correo
        customer.setEmailVerifiedAt(null);
        customer.setHasAccount(false);
        assertEquals(SendResult.NOT_APPLICABLE, service.issueAndSend(7L, store, null, BASE));
        customer.setHasAccount(true);
        customer.setEmail(" ");
        assertEquals(SendResult.NOT_APPLICABLE, service.issueAndSend(7L, store, null, BASE));

        // cliente inexistente o sin tienda
        assertEquals(SendResult.NOT_APPLICABLE, service.issueAndSend(99L, store, null, BASE));
        assertEquals(SendResult.NOT_APPLICABLE, service.issueAndSend(7L, null, null, BASE));

        verifyNoInteractions(emailNotificationService);
    }

    @Test
    void publicResendNeverRevealsWhetherTheEmailHasAnAccount() {
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("nadie@mail.com")).thenReturn(Optional.empty());
        when(customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue("ana@mail.com")).thenReturn(Optional.of(customer));

        assertDoesNotThrow(() -> service.resendForEmail("nadie@mail.com", store, null, BASE));
        assertDoesNotThrow(() -> service.resendForEmail(null, store, null, BASE));
        assertDoesNotThrow(() -> service.resendForEmail("  ", store, null, BASE));
        verifyNoInteractions(emailNotificationService);

        service.resendForEmail(" ANA@mail.com ", store, null, BASE);
        verify(emailNotificationService).sendCustomerEmailVerificationEmail(eq(store), isNull(), eq("ana@mail.com"), eq("Ana"), anyString());
    }

    @Test
    void theEmailIsSentOnlyAfterTheTransactionCommits() {
        TransactionSynchronizationManager.initSynchronization();

        service.issueAndSend(7L, store, null, BASE);
        verifyNoInteractions(emailNotificationService); // todavía no hubo commit

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCommit();
        }
        verify(emailNotificationService, times(1)).sendCustomerEmailVerificationEmail(any(), any(), anyString(), anyString(), anyString());
    }

    @Test
    void maskEmailHidesTheLocalPart() {
        assertEquals("a***@mail.com", CustomerEmailVerificationService.maskEmail("ana@mail.com"));
        assertEquals("*@mail.com", CustomerEmailVerificationService.maskEmail("a@mail.com"));
        assertEquals("", CustomerEmailVerificationService.maskEmail(null));
        assertEquals("", CustomerEmailVerificationService.maskEmail("sin-arroba"));
    }
}
