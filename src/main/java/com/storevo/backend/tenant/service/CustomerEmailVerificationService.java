package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Verificación del correo de los compradores de una tienda.
 *
 * <p>Multi-tenant: todo vive en la tabla {@code customers} del esquema de la tienda activa (el llamador fija
 * {@code TenantContext} antes de invocar), igual que el token de recuperación de contraseña. Un token de una tienda no
 * existe en el esquema de otra, así que no puede usarse allí.
 *
 * <p>Seguridad del token: UUID aleatorio, en BD solo se guarda su SHA-256, vence a las 24 h, es de un solo uso (se borra al
 * verificar) y emitir uno nuevo invalida el anterior. El correo se envía después del commit.
 */
@Service
@RequiredArgsConstructor
public class CustomerEmailVerificationService {

    public enum SendResult {
        /** Se generó un token nuevo y se encoló el correo. */
        SENT,
        /** Se envió hace menos de {@link EmailVerificationPolicy#RESEND_COOLDOWN}: no se generó nada. */
        COOLDOWN,
        /** Verificación desactivada, cuenta inexistente/sin correo o correo ya verificado. */
        NOT_APPLICABLE
    }

    public enum VerifyResult {
        VERIFIED,
        /** El enlace existió pero venció. */
        EXPIRED,
        /** No existe (nunca existió, ya se usó o fue reemplazado por un reenvío). */
        INVALID
    }

    public record Verification(VerifyResult result, Long customerId) {
    }

    /** Estado de un enlace sin consumirlo (para decidir qué pantalla mostrar). */
    public enum TokenState {
        VALID,
        EXPIRED,
        INVALID
    }

    private final CustomerRepository customerRepository;
    private final EmailNotificationService emailNotificationService;
    private final EmailVerificationPolicy policy;

    /** Reloj sustituible en pruebas. */
    private Clock clock = Clock.systemDefaultZone();

    void setClock(Clock clock) {
        this.clock = clock;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    /** Genera un token nuevo (invalidando el anterior) y envía el enlace, respetando el tiempo mínimo entre envíos. */
    @Transactional
    public SendResult issueAndSend(Long customerId, Store store, StoreSettingsDto settings, String baseUrl) {
        if (!policy.isEnabled() || customerId == null || store == null) {
            return SendResult.NOT_APPLICABLE;
        }
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null
                || !Boolean.TRUE.equals(customer.getHasAccount())
                || customer.getEmail() == null || customer.getEmail().isBlank()
                || customer.getEmailVerifiedAt() != null) {
            return SendResult.NOT_APPLICABLE;
        }

        LocalDateTime now = now();
        if (secondsUntilResend(customer, now) > 0) {
            return SendResult.COOLDOWN;
        }

        String rawToken = UUID.randomUUID().toString();
        customer.setEmailVerificationToken(CustomerService.hashResetToken(rawToken));
        customer.setEmailVerificationExpiresAt(now.plus(EmailVerificationPolicy.TOKEN_TTL));
        customer.setEmailVerificationSentAt(now);
        customerRepository.save(customer);

        String cleanBase = (baseUrl != null && !baseUrl.isBlank())
                ? (baseUrl.trim().endsWith("/") ? baseUrl.trim().substring(0, baseUrl.trim().length() - 1) : baseUrl.trim())
                : "http://localhost:8080";
        String link = cleanBase + "/s/" + store.getSlug() + "/account/verify-email?token=" + rawToken;
        final String toEmail = customer.getEmail();
        final String toName = customer.getName();
        runAfterCommit(() -> emailNotificationService.sendCustomerEmailVerificationEmail(
                store, settings, toEmail, toName, link));
        return SendResult.SENT;
    }

    /**
     * Reenvío desde el formulario público (enlace vencido y sin sesión). El resultado NO se informa al llamador para no revelar
     * si el correo tiene cuenta: la interfaz muestra siempre el mismo mensaje.
     */
    @Transactional
    public void resendForEmail(String rawEmail, Store store, StoreSettingsDto settings, String baseUrl) {
        if (rawEmail == null || rawEmail.isBlank()) {
            return;
        }
        customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue(rawEmail.trim().toLowerCase(Locale.ROOT))
                .ifPresent(c -> issueAndSend(c.getId(), store, settings, baseUrl));
    }

    /** Consume el token: si es válido y vigente marca el correo como verificado y lo borra (un solo uso). */
    @Transactional
    public Verification verifyWithToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return new Verification(VerifyResult.INVALID, null);
        }
        Optional<Customer> found = customerRepository.findByEmailVerificationToken(CustomerService.hashResetToken(rawToken.trim()));
        if (found.isEmpty() || !Boolean.TRUE.equals(found.get().getHasAccount())) {
            return new Verification(VerifyResult.INVALID, null);
        }
        Customer customer = found.get();
        LocalDateTime now = now();
        if (customer.getEmailVerificationExpiresAt() == null || !customer.getEmailVerificationExpiresAt().isAfter(now)) {
            return new Verification(VerifyResult.EXPIRED, null);
        }
        customer.setEmailVerifiedAt(now);
        customer.setEmailVerificationToken(null);
        customer.setEmailVerificationExpiresAt(null);
        customerRepository.save(customer);
        return new Verification(VerifyResult.VERIFIED, customer.getId());
    }

    /** ¿El token (en claro) existe y sigue vigente? Solo lectura: lo usa la página de confirmación antes de mostrar el botón. */
    @Transactional(readOnly = true)
    public TokenState inspectToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return TokenState.INVALID;
        }
        Optional<Customer> found = customerRepository.findByEmailVerificationToken(CustomerService.hashResetToken(rawToken.trim()));
        if (found.isEmpty() || !Boolean.TRUE.equals(found.get().getHasAccount())) {
            return TokenState.INVALID;
        }
        LocalDateTime expires = found.get().getEmailVerificationExpiresAt();
        return (expires != null && expires.isAfter(now())) ? TokenState.VALID : TokenState.EXPIRED;
    }

    /** Segundos que faltan para poder reenviar el correo (0 = ya se puede). */
    public long secondsUntilResend(Customer customer, LocalDateTime now) {
        if (customer == null || customer.getEmailVerificationSentAt() == null) {
            return 0;
        }
        long left = Duration.between(now, customer.getEmailVerificationSentAt().plus(EmailVerificationPolicy.RESEND_COOLDOWN)).getSeconds();
        return Math.max(0, left);
    }

    public long secondsUntilResend(Customer customer) {
        return secondsUntilResend(customer, now());
    }

    /** Correo parcialmente oculto para mostrarlo en pantalla (a***@dominio.com). */
    public static String maskEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            return "";
        }
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at);
        return (local.length() <= 1 ? "*" : local.charAt(0) + "***") + domain;
    }

    private void runAfterCommit(Runnable task) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    task.run();
                }
            });
        } else {
            task.run();
        }
    }
}
