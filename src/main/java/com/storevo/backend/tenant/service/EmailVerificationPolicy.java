package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Customer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Locale;

/**
 * Reglas de la verificación de correo de los compradores: quién debe verificar, cuánto dura el enlace y cuál es el
 * plazo de gracia de las cuentas que ya existían. Es la ÚNICA fuente de verdad: el controlador solo pregunta
 * {@link #accessFor(Customer, LocalDateTime)}.
 *
 * <p>La barrera aplica exclusivamente al portal «Mi Cuenta». El checkout, el carrito y las compras como invitado o con
 * una cuenta sin verificar nunca se bloquean (decisión D3).
 *
 * <p>Cuentas existentes (decisión D2): una cuenta creada ANTES de {@code grace-start} puede entrar al portal sin verificar
 * durante {@link #GRACE_DAYS} días contados desde esa fecha (con un aviso persistente); pasado el plazo queda bloqueada.
 * Una cuenta creada desde {@code grace-start} debe verificar su correo de inmediato.
 *
 * <p>Limitación conocida y acotada: el plazo se decide por {@code customers.created_at}. Un perfil de invitado creado antes
 * de {@code grace-start} que decida registrarse DESPUÉS de esa fecha se trata como cuenta antigua y solo disfruta del
 * plazo restante (nunca más de 30 días desde {@code grace-start}). No hay columna extra para distinguirlo.
 */
@Component
public class EmailVerificationPolicy {

    /** Días de gracia de las cuentas existentes contados desde {@code grace-start}. */
    public static final int GRACE_DAYS = 30;
    /** Vigencia del enlace de verificación. */
    public static final Duration TOKEN_TTL = Duration.ofHours(24);
    /** Tiempo mínimo entre dos envíos del correo de verificación a la misma cuenta. */
    public static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);

    public enum Access {
        /** Correo verificado (o verificación desactivada): acceso normal al portal. */
        VERIFIED,
        /** Cuenta antigua sin verificar dentro del plazo de gracia: acceso con aviso persistente. */
        GRACE,
        /** Sin verificar y sin gracia: el portal solo muestra «Verifica tu correo para continuar». */
        BLOCKED
    }

    private final boolean enabled;
    private final LocalDate graceStart;

    @Autowired
    public EmailVerificationPolicy(
            @Value("${storevo.customer.email-verification.mode:required}") String mode,
            @Value("${storevo.customer.email-verification.grace-start:2026-11-06}") String graceStart) {
        String normalized = mode == null ? "required" : mode.trim().toLowerCase(Locale.ROOT);
        if (!normalized.equals("required") && !normalized.equals("off")) {
            throw new IllegalStateException(
                    "storevo.customer.email-verification.mode debe ser 'required' u 'off' (valor actual: '" + mode + "')");
        }
        this.enabled = normalized.equals("required");
        try {
            this.graceStart = LocalDate.parse(graceStart == null ? "" : graceStart.trim());
        } catch (DateTimeParseException e) {
            throw new IllegalStateException(
                    "storevo.customer.email-verification.grace-start debe tener formato AAAA-MM-DD (valor actual: '" + graceStart + "')", e);
        }
    }

    /** Constructor directo para pruebas. */
    public EmailVerificationPolicy(boolean enabled, LocalDate graceStart) {
        this.enabled = enabled;
        this.graceStart = graceStart;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public LocalDate getGraceStart() {
        return graceStart;
    }

    /** Fin del plazo de gracia de las cuentas existentes. */
    public LocalDateTime graceDeadline() {
        return graceStart.atStartOfDay().plusDays(GRACE_DAYS);
    }

    /** true si la cuenta se creó antes de {@code grace-start} (cuenta «existente» al liberar esta función). */
    public boolean isExistingAccount(Customer customer) {
        return customer != null
                && customer.getCreatedAt() != null
                && customer.getCreatedAt().isBefore(graceStart.atStartOfDay());
    }

    public Access accessFor(Customer customer, LocalDateTime now) {
        if (!enabled) {
            return Access.VERIFIED;
        }
        if (customer == null) {
            return Access.BLOCKED;
        }
        if (customer.getEmailVerifiedAt() != null) {
            return Access.VERIFIED;
        }
        if (customer.getEmail() == null || customer.getEmail().isBlank()) {
            return Access.VERIFIED; // no hay correo que verificar (no debería ocurrir: el registro lo exige)
        }
        if (isExistingAccount(customer) && now.isBefore(graceDeadline())) {
            return Access.GRACE;
        }
        return Access.BLOCKED;
    }

    /** Días que quedan de gracia (mínimo 0; redondea hacia arriba: «queda 1 día» hasta el último minuto). */
    public long graceDaysLeft(LocalDateTime now) {
        long minutes = Duration.between(now, graceDeadline()).toMinutes();
        return minutes <= 0 ? 0 : (long) Math.ceil(minutes / (24.0 * 60.0));
    }
}
