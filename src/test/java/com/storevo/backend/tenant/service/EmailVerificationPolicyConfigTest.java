package com.storevo.backend.tenant.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** Las claves de application.yml y las de @Value deben coincidir; un valor inválido debe impedir el arranque. */
class EmailVerificationPolicyConfigTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(EmailVerificationPolicy.class);

    @Test
    void defaultsRequireVerificationWithTheDocumentedGraceStart() {
        runner.run(ctx -> {
            EmailVerificationPolicy policy = ctx.getBean(EmailVerificationPolicy.class);
            assertTrue(policy.isEnabled());
            assertEquals(LocalDate.of(2026, 11, 6), policy.getGraceStart());
        });
    }

    @Test
    void theRealApplicationYmlBindsToThePolicy() {
        // Carga src/main/resources/application.yml tal cual: si alguien renombra una clave, esta prueba falla
        runner.withInitializer(new ConfigDataApplicationContextInitializer()).run(ctx -> {
            EmailVerificationPolicy policy = ctx.getBean(EmailVerificationPolicy.class);
            assertTrue(policy.isEnabled());
            assertEquals(LocalDate.of(2026, 11, 6), policy.getGraceStart());
            assertEquals("required", ctx.getEnvironment().getProperty("storevo.customer.email-verification.mode"));
        });
    }

    @Test
    void propertiesCanTurnVerificationOffAndMoveTheGraceStart() {
        runner.withPropertyValues(
                "storevo.customer.email-verification.mode=off",
                "storevo.customer.email-verification.grace-start=2027-01-15").run(ctx -> {
            EmailVerificationPolicy policy = ctx.getBean(EmailVerificationPolicy.class);
            assertFalse(policy.isEnabled());
            assertEquals(LocalDate.of(2027, 1, 15), policy.getGraceStart());
            assertEquals(LocalDate.of(2027, 2, 14).atStartOfDay(), policy.graceDeadline());
        });
    }

    @Test
    void invalidValuesFailTheStartupInsteadOfSilentlyDisablingTheProtection() {
        runner.withPropertyValues("storevo.customer.email-verification.mode=requerido").run(ctx -> {
            assertNotNull(ctx.getStartupFailure());
            assertTrue(rootMessage(ctx.getStartupFailure()).contains("'required' u 'off'"));
        });
        runner.withPropertyValues("storevo.customer.email-verification.grace-start=06-11-2026").run(ctx -> {
            assertNotNull(ctx.getStartupFailure());
            assertTrue(rootMessage(ctx.getStartupFailure()).contains("AAAA-MM-DD"));
        });
    }

    private static String rootMessage(Throwable t) {
        // Todos los mensajes de la cadena: la causa más profunda puede ser la excepción original del parseo
        StringBuilder sb = new StringBuilder();
        for (; t != null; t = t.getCause()) {
            sb.append(t.getMessage()).append(" | ");
        }
        return sb.toString();
    }
}
