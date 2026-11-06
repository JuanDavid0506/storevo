package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Customer;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.storevo.backend.tenant.service.EmailVerificationPolicy.Access.BLOCKED;
import static com.storevo.backend.tenant.service.EmailVerificationPolicy.Access.GRACE;
import static com.storevo.backend.tenant.service.EmailVerificationPolicy.Access.VERIFIED;
import static org.junit.jupiter.api.Assertions.*;

/** Decisión D2: cuentas existentes con 30 días de gracia; cuentas nuevas deben verificar de inmediato. */
class EmailVerificationPolicyTest {

    private static final LocalDate GRACE_START = LocalDate.of(2026, 11, 6);
    private final EmailVerificationPolicy policy = new EmailVerificationPolicy(true, GRACE_START);

    private static Customer account(LocalDateTime createdAt, LocalDateTime verifiedAt) {
        return Customer.builder().id(1L).email("ana@mail.com").hasAccount(true)
                .createdAt(createdAt).emailVerifiedAt(verifiedAt).build();
    }

    private static final LocalDateTime BEFORE_RELEASE = LocalDateTime.of(2026, 11, 5, 23, 59);
    private static final LocalDateTime AFTER_RELEASE = LocalDateTime.of(2026, 11, 6, 0, 0);

    @Test
    void graceDeadlineIsThirtyDaysAfterGraceStart() {
        assertEquals(LocalDateTime.of(2026, 12, 6, 0, 0), policy.graceDeadline());
        assertEquals(30, EmailVerificationPolicy.GRACE_DAYS);
    }

    @Test
    void verifiedAccountsAlwaysHaveAccess() {
        LocalDateTime farFuture = LocalDateTime.of(2030, 1, 1, 0, 0);
        assertEquals(VERIFIED, policy.accessFor(account(BEFORE_RELEASE, LocalDateTime.of(2026, 11, 7, 10, 0)), farFuture));
        assertEquals(VERIFIED, policy.accessFor(account(AFTER_RELEASE, LocalDateTime.of(2026, 11, 7, 10, 0)), farFuture));
    }

    @Test
    void existingUnverifiedAccountHasGraceUntilTheDeadlineThenIsBlocked() {
        Customer existing = account(BEFORE_RELEASE, null);
        assertTrue(policy.isExistingAccount(existing));
        assertEquals(GRACE, policy.accessFor(existing, LocalDateTime.of(2026, 11, 6, 0, 0)));
        assertEquals(GRACE, policy.accessFor(existing, LocalDateTime.of(2026, 12, 5, 23, 59)));
        // Justo en el límite (la gracia ya terminó) y después: solo la pantalla "Verifica tu correo para continuar"
        assertEquals(BLOCKED, policy.accessFor(existing, LocalDateTime.of(2026, 12, 6, 0, 0)));
        assertEquals(BLOCKED, policy.accessFor(existing, LocalDateTime.of(2027, 3, 1, 12, 0)));
    }

    @Test
    void newUnverifiedAccountIsBlockedImmediately() {
        Customer fresh = account(AFTER_RELEASE, null);
        assertFalse(policy.isExistingAccount(fresh));
        assertEquals(BLOCKED, policy.accessFor(fresh, LocalDateTime.of(2026, 11, 6, 0, 1)));
        assertEquals(BLOCKED, policy.accessFor(fresh, LocalDateTime.of(2026, 11, 7, 9, 0)));
    }

    @Test
    void graceDaysLeftCountsDownAndNeverGoesNegative() {
        assertEquals(30, policy.graceDaysLeft(LocalDateTime.of(2026, 11, 6, 0, 0)));
        assertEquals(30, policy.graceDaysLeft(LocalDateTime.of(2026, 11, 6, 0, 1)));   // redondea hacia arriba
        assertEquals(29, policy.graceDaysLeft(LocalDateTime.of(2026, 11, 7, 0, 0)));
        assertEquals(1, policy.graceDaysLeft(LocalDateTime.of(2026, 12, 5, 6, 0)));
        assertEquals(1, policy.graceDaysLeft(LocalDateTime.of(2026, 12, 5, 23, 59)));
        assertEquals(0, policy.graceDaysLeft(LocalDateTime.of(2026, 12, 6, 0, 0)));
        assertEquals(0, policy.graceDaysLeft(LocalDateTime.of(2027, 1, 1, 0, 0)));
    }

    @Test
    void whenVerificationIsOffEveryoneHasAccess() {
        EmailVerificationPolicy off = new EmailVerificationPolicy(false, GRACE_START);
        assertFalse(off.isEnabled());
        assertEquals(VERIFIED, off.accessFor(account(AFTER_RELEASE, null), LocalDateTime.of(2030, 1, 1, 0, 0)));
    }

    @Test
    void accountWithoutEmailHasNothingToVerify() {
        Customer noEmail = Customer.builder().id(2L).hasAccount(true).createdAt(AFTER_RELEASE).build();
        assertEquals(VERIFIED, policy.accessFor(noEmail, LocalDateTime.of(2027, 1, 1, 0, 0)));
    }

    @Test
    void propertiesAreValidatedAtStartup() {
        assertTrue(new EmailVerificationPolicy("required", "2026-11-06").isEnabled());
        assertTrue(new EmailVerificationPolicy(" REQUIRED ", "2026-11-06").isEnabled());
        assertFalse(new EmailVerificationPolicy("off", "2026-11-06").isEnabled());
        assertEquals(GRACE_START, new EmailVerificationPolicy("required", "2026-11-06").getGraceStart());
        assertThrows(IllegalStateException.class, () -> new EmailVerificationPolicy("maybe", "2026-11-06"));
        assertThrows(IllegalStateException.class, () -> new EmailVerificationPolicy("required", "06/11/2026"));
        assertThrows(IllegalStateException.class, () -> new EmailVerificationPolicy("required", ""));
    }
}
