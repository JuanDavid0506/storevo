package com.storevo.backend.tenant.service;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.storevo.backend.admin.model.Store;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** MAIL_ENABLED=false: el enlace de verificación se imprime en el log (pruebas locales). Con el correo activo, jamás. */
class EmailNotificationServiceVerificationTest {

    private static final String LINK = "https://storevo.co/s/mi-tienda/account/verify-email?token=abc-123";

    private JavaMailSender sender;
    private EmailNotificationService service;
    private Store store;
    private ListAppender<ILoggingEvent> logs;
    private Logger logger;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        sender = mock(JavaMailSender.class);
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        service = new EmailNotificationService(provider);
        ReflectionTestUtils.setField(service, "mailFrom", "no-reply@storevo.com");
        store = new Store();
        store.setName("Tienda Demo");
        store.setSlug("mi-tienda");

        logger = (Logger) LoggerFactory.getLogger(EmailNotificationService.class);
        logs = new ListAppender<>();
        logs.start();
        logger.addAppender(logs);
    }

    @AfterEach
    void tearDown() {
        logger.detachAppender(logs);
    }

    private String allLogs() {
        StringBuilder sb = new StringBuilder();
        for (ILoggingEvent e : logs.list) {
            sb.append(e.getFormattedMessage()).append('\n');
        }
        return sb.toString();
    }

    @Test
    void withMailDisabledTheLinkIsPrintedInTheLogAndNothingIsSent() {
        ReflectionTestUtils.setField(service, "mailEnabled", false);

        service.sendCustomerEmailVerificationEmail(store, null, "ana@mail.com", "Ana", LINK);

        assertTrue(allLogs().contains(LINK), "el enlace completo debe verse en el log para probar en local");
        assertTrue(allLogs().contains("ana@mail.com"));
        verifyNoInteractions(sender);
    }

    @Test
    void withMailEnabledTheEmailIsSentAndTheLinkIsNeverLogged() throws Exception {
        ReflectionTestUtils.setField(service, "mailEnabled", true);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));

        service.sendCustomerEmailVerificationEmail(store, null, "ana@mail.com", "Ana", LINK);

        ArgumentCaptor<MimeMessage> sent = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(sent.capture());
        assertEquals("Verifica tu correo en Tienda Demo", sent.getValue().getSubject());
        assertEquals("ana@mail.com", sent.getValue().getAllRecipients()[0].toString());
        assertFalse(allLogs().contains("abc-123"), "con el correo activo el enlace es una credencial: no se registra");
    }

    @Test
    void blankRecipientOrLinkIsIgnored() {
        ReflectionTestUtils.setField(service, "mailEnabled", false);

        service.sendCustomerEmailVerificationEmail(store, null, " ", "Ana", LINK);
        service.sendCustomerEmailVerificationEmail(store, null, "ana@mail.com", "Ana", null);

        assertFalse(allLogs().contains("verify-email"));
        verifyNoInteractions(sender);
    }

    @Test
    void aMailFailureNeverBreaksTheCaller() throws Exception {
        ReflectionTestUtils.setField(service, "mailEnabled", true);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
        doThrow(new org.springframework.mail.MailSendException("smtp caído")).when(sender).send(any(MimeMessage.class));

        assertDoesNotThrow(() -> service.sendCustomerEmailVerificationEmail(store, null, "ana@mail.com", "Ana", LINK));
    }
}
