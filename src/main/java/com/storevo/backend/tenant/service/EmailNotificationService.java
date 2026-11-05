package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderItem;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.model.Shipment;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Service
public class EmailNotificationService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${storevo.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${storevo.mail.from:no-reply@storevo.com}")
    private String mailFrom;

    @Value("${storevo.mail.base-url:http://localhost:8080}")
    private String baseUrl;

    public EmailNotificationService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    /**
     * 1. Envía al comprador la confirmación o comprobante de su pedido con enlace público seguro (publicToken).
     */
    @Async
    public void sendOrderConfirmationToCustomer(Store store, StoreSettingsDto settings, Order order) {
        try {
            if (order == null || isBlank(order.getCustomerEmail())) {
                return;
            }
            String storeName = resolveStoreName(store, settings);
            String slug = store != null ? store.getSlug() : "";
            String primaryColor = (settings != null && !isBlank(settings.getPrimaryColor()))
                    ? settings.getPrimaryColor()
                    : "#4f46e5";

            String orderPath = (order.getChannel() == OrderChannel.WHATSAPP)
                    ? "/s/" + slug + "/order/" + order.getPublicToken() + "/whatsapp?tracked=true"
                    : (order.getStatus() == OrderStatus.PENDING
                    ? "/s/" + slug + "/order/" + order.getPublicToken() + "/success"
                    : "/s/" + slug + "/order/" + order.getPublicToken() + "/wompi-result");
            String orderUrl = trimTrailingSlash(baseUrl) + orderPath;

            String statusLabel = order.getStatus() == OrderStatus.PAID
                    ? "Pago Aprobado"
                    : (order.getStatus() != null ? order.getStatus().getDisplayName() : "Registrado");

            StringBuilder itemsHtml = new StringBuilder();
            List<OrderItem> items = order.getItems();
            if (items != null) {
                for (OrderItem item : items) {
                    if (item == null) continue;
                    itemsHtml.append("<tr>")
                            .append("<td style='padding:10px 0;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;'>")
                            .append("<strong>").append(item.getQuantity()).append("x</strong> ")
                            .append(escape(item.getProductName()))
                            .append("</td>")
                            .append("<td style='padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;'>")
                            .append("$ ").append(formatCop(item.getSubtotal()))
                            .append("</td>")
                            .append("</tr>");
                }
            }

            double subtotal = (order.getSubtotal() != null && order.getSubtotal() > 0)
                    ? order.getSubtotal()
                    : (order.getTotal() != null ? order.getTotal() : 0.0);
            double shipping = (order.getShippingCost() != null && order.getShippingCost() > 0)
                    ? order.getShippingCost()
                    : 0.0;
            boolean isPickup = "PICKUP".equalsIgnoreCase(order.getDeliveryMethod());

            String ctaLabel = (order.getStatus() == OrderStatus.PENDING && order.getChannel() == OrderChannel.ONLINE)
                    ? "Completar pago o ver mi pedido"
                    : "Ver estado de mi pedido";

            String html = "<div style='font-family:Inter,Arial,sans-serif;background-color:#f8fafc;padding:32px 16px;color:#0f172a;'>"
                    + "<div style='max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;'>"
                    + "<div style='background:" + escape(primaryColor) + ";padding:24px;color:#ffffff;text-align:center;'>"
                    + "<h1 style='margin:0;font-size:20px;font-weight:800;'>" + escape(storeName) + "</h1>"
                    + "<p style='margin:6px 0 0;font-size:13px;opacity:0.9;'>Confirmación de tu Pedido #" + order.getId() + "</p>"
                    + "</div>"
                    + "<div style='padding:28px 24px;'>"
                    + "<p style='margin:0 0 12px;font-size:15px;'>Hola <strong>" + escape(order.getCustomerName()) + "</strong>,</p>"
                    + "<p style='margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;'>"
                    + "Hemos registrado tu pedido <strong>#" + order.getId() + "</strong> con estado <strong>" + escape(statusLabel) + "</strong>. Aquí tienes el resumen de tu compra:"
                    + "</p>"
                    + "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>"
                    + itemsHtml
                    + "</table>"
                    + "<div style='background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:24px;font-size:14px;'>"
                    + "<div style='display:flex;justify-content:space-between;margin-bottom:6px;color:#475569;'>"
                    + "<span>Subtotal productos: </span><strong style='color:#0f172a;'>$ " + formatCop(subtotal) + "</strong>"
                    + "</div>"
                    + "<div style='display:flex;justify-content:space-between;margin-bottom:8px;color:#475569;'>"
                    + "<span>" + (isPickup ? "Entrega (Recogida en tienda): " : "Costo de envío: ") + "</span>"
                    + "<strong style='color:#0f172a;'>" + (shipping > 0 ? "$ " + formatCop(shipping) : "Gratis ($ 0)") + "</strong>"
                    + "</div>"
                    + "<div style='border-top:1px solid #cbd5e1;padding-top:8px;display:flex;justify-content:space-between;font-size:16px;'>"
                    + "<strong>Total: </strong><strong style='color:" + escape(primaryColor) + ";'>$ " + formatCop(order.getTotal()) + "</strong>"
                    + "</div>"
                    + "</div>"
                    + "<div style='text-align:center;margin:24px 0;'>"
                    + "<a href='" + orderUrl + "' style='display:inline-block;background:" + escape(primaryColor) + ";color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;'>"
                    + ctaLabel
                    + "</a>"
                    + "</div>"
                    + "<p style='margin:0;font-size:12px;color:#64748b;text-align:center;'>"
                    + "También puedes consultar el avance en cualquier momento con tu número de pedido <strong>#" + order.getId() + "</strong> y tu teléfono."
                    + "</p>"
                    + "</div>"
                    + "</div>"
                    + "</div>";

            String subject = "Pedido #" + order.getId() + " en " + storeName + " (" + statusLabel + ")";
            sendHtmlEmail(order.getCustomerEmail().trim(), subject, html);
        } catch (Exception e) {
            log.warn("EmailNotificationService: no se pudo enviar correo de confirmación al comprador (Pedido #{}): {}",
                    order != null ? order.getId() : null, e.getMessage());
        }
    }

    /**
     * 2. Envía al comerciante el aviso de nuevo pedido o pago recibido.
     */
    @Async
    public void sendNewOrderAlertToMerchant(Store store, StoreSettingsDto settings, Order order, String fallbackOwnerEmail) {
        try {
            if (order == null) return;
            String merchantEmail = null;
            if (settings != null && !isBlank(settings.getEmailContact())) {
                merchantEmail = settings.getEmailContact().trim();
            } else if (settings != null && !isBlank(settings.getShippingContactEmail())) {
                merchantEmail = settings.getShippingContactEmail().trim();
            } else if (!isBlank(fallbackOwnerEmail)) {
                merchantEmail = fallbackOwnerEmail.trim();
            }

            if (isBlank(merchantEmail)) {
                return;
            }

            String storeName = resolveStoreName(store, settings);
            String slug = store != null ? store.getSlug() : "";
            String dashboardOrderUrl = trimTrailingSlash(baseUrl) + "/dashboard/" + slug + "/orders/" + order.getId();

            StringBuilder itemsHtml = new StringBuilder();
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item == null) continue;
                    itemsHtml.append("<li style='margin-bottom:4px;'>")
                            .append("<strong>").append(item.getQuantity()).append("x</strong> ")
                            .append(escape(item.getProductName()))
                            .append(" ($ ").append(formatCop(item.getSubtotal())).append(")")
                            .append("</li>");
                }
            }

            String statusText = order.getStatus() != null ? order.getStatus().getDisplayName() : "Pendiente";
            String channelText = order.getChannel() != null ? order.getChannel().getDisplayName() : "Web";

            String html = "<div style='font-family:Inter,Arial,sans-serif;background-color:#0f172a;padding:32px 16px;color:#e2e8f0;'>"
                    + "<div style='max-width:560px;margin:0 auto;background:#1e293b;border-radius:16px;border:1px solid #334155;padding:28px 24px;'>"
                    + "<span style='display:inline-block;background:#4f46e5;color:#ffffff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;'>Nueva Venta / Pedido</span>"
                    + "<h2 style='margin:12px 0 6px;color:#ffffff;font-size:20px;'>Pedido #" + order.getId() + " en " + escape(storeName) + "</h2>"
                    + "<p style='margin:0 0 18px;font-size:13px;color:#94a3b8;'>Canal: <strong>" + escape(channelText) + "</strong> · Estado: <strong>" + escape(statusText) + "</strong></p>"
                    + "<div style='background:#0f172a;border-radius:12px;padding:16px;margin-bottom:18px;font-size:13px;line-height:1.6;'>"
                    + "<p style='margin:0;'><strong>Cliente:</strong> " + escape(order.getCustomerName()) + "</p>"
                    + "<p style='margin:0;'><strong>Teléfono:</strong> " + escape(order.getCustomerPhone()) + "</p>"
                    + "<p style='margin:0;'><strong>Destino:</strong> " + escape(order.getCity()) + " — " + escape(order.getAddress()) + "</p>"
                    + "<p style='margin:8px 0 0;font-size:15px;color:#818cf8;'><strong>Total: $ " + formatCop(order.getTotal()) + "</strong></p>"
                    + "</div>"
                    + "<p style='margin:0 0 8px;font-size:13px;font-weight:700;color:#cbd5e1;'>Productos solicitados:</p>"
                    + "<ul style='margin:0 0 24px;padding-left:18px;font-size:13px;color:#e2e8f0;'>" + itemsHtml + "</ul>"
                    + "<div style='text-align:center;'>"
                    + "<a href='" + dashboardOrderUrl + "' style='display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;'>"
                    + "Gestionar Pedido en el Panel"
                    + "</a>"
                    + "</div>"
                    + "</div>"
                    + "</div>";

            String subject = "[Storevo] Nuevo Pedido #" + order.getId() + " ($ " + formatCop(order.getTotal()) + ") - " + storeName;
            sendHtmlEmail(merchantEmail, subject, html);
        } catch (Exception e) {
            log.warn("EmailNotificationService: no se pudo enviar alerta al comerciante (Pedido #{}): {}",
                    order != null ? order.getId() : null, e.getMessage());
        }
    }

    @Async
    public void sendNewOrderAlertToMerchant(Store store, StoreSettingsDto settings, Order order) {
        sendNewOrderAlertToMerchant(store, settings, order, null);
    }

    /**
     * 3. Envía al comprador la notificación de despacho con transportadora, número de guía y link de rastreo.
     */
    @Async
    public void sendOrderShippedToCustomer(Store store, StoreSettingsDto settings, Order order, Shipment shipment) {
        try {
            if (order == null || shipment == null || isBlank(order.getCustomerEmail())) {
                return;
            }
            String storeName = resolveStoreName(store, settings);
            String slug = store != null ? store.getSlug() : "";
            String primaryColor = (settings != null && !isBlank(settings.getPrimaryColor()))
                    ? settings.getPrimaryColor()
                    : "#4f46e5";

            String carrierName = (shipment.getCarrier() != null && !isBlank(shipment.getCarrier().getName()))
                    ? shipment.getCarrier().getName()
                    : "Transportadora aliada";
            String trackingNumber = !isBlank(shipment.getTrackingNumber())
                    ? shipment.getTrackingNumber()
                    : "En asignación";
            String trackingUrl = shipment.getDynamicTrackingUrl();

            String orderStatusUrl = trimTrailingSlash(baseUrl) + "/s/" + slug + "/order/" + order.getPublicToken()
                    + (order.getChannel() == OrderChannel.WHATSAPP ? "/whatsapp?tracked=true" : "/wompi-result");

            String trackingBtnHtml = !isBlank(trackingUrl)
                    ? "<a href='" + escape(trackingUrl) + "' style='display:inline-block;background:" + escape(primaryColor) + ";color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 26px;border-radius:10px;margin:6px;'>Rastrear mi paquete</a>"
                    : "";

            String html = "<div style='font-family:Inter,Arial,sans-serif;background-color:#f8fafc;padding:32px 16px;color:#0f172a;'>"
                    + "<div style='max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;'>"
                    + "<div style='background:" + escape(primaryColor) + ";padding:24px;color:#ffffff;text-align:center;'>"
                    + "<h1 style='margin:0;font-size:20px;font-weight:800;'>¡Tu pedido va en camino!</h1>"
                    + "<p style='margin:6px 0 0;font-size:13px;opacity:0.9;'>Pedido #" + order.getId() + " · " + escape(storeName) + "</p>"
                    + "</div>"
                    + "<div style='padding:28px 24px;'>"
                    + "<p style='margin:0 0 12px;font-size:15px;'>Hola <strong>" + escape(order.getCustomerName()) + "</strong>,</p>"
                    + "<p style='margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;'>"
                    + "Buenas noticias: tu pedido <strong>#" + order.getId() + "</strong> ya fue despachado. A continuación encontrarás los datos de tu envío:"
                    + "</p>"
                    + "<div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:24px;font-size:14px;line-height:1.7;'>"
                    + "<p style='margin:0;'><strong>Transportadora:</strong> " + escape(carrierName) + "</p>"
                    + "<p style='margin:0;'><strong>Número de guía:</strong> <span style='font-family:monospace;font-weight:700;color:#0f172a;'>" + escape(trackingNumber) + "</span></p>"
                    + "<p style='margin:0;'><strong>Destino:</strong> " + escape(order.getCity()) + " — " + escape(order.getAddress()) + "</p>"
                    + "</div>"
                    + "<div style='text-align:center;margin:20px 0;'>"
                    + trackingBtnHtml
                    + "<a href='" + orderStatusUrl + "' style='display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 26px;border-radius:10px;margin:6px;'>Ver detalle del pedido</a>"
                    + "</div>"
                    + "</div>"
                    + "</div>"
                    + "</div>";

            String subject = "¡Tu Pedido #" + order.getId() + " ha sido enviado! - " + storeName;
            sendHtmlEmail(order.getCustomerEmail().trim(), subject, html);
        } catch (Exception e) {
            log.warn("EmailNotificationService: no se pudo enviar correo de envío al comprador (Pedido #{}): {}",
                    order != null ? order.getId() : null, e.getMessage());
        }
    }

    /**
     * 4. Envía al comerciante el enlace de recuperación de contraseña con vigencia de 30 minutos.
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String resetLink) {
        try {
            if (isBlank(toEmail) || isBlank(resetLink)) {
                return;
            }
            String safeName = !isBlank(userName) ? userName.trim() : "Comerciante";
            String html = "<div style='font-family:Inter,Arial,sans-serif;background-color:#0f172a;padding:32px 16px;color:#e2e8f0;'>"
                    + "<div style='max-width:520px;margin:0 auto;background:#1e293b;border-radius:16px;border:1px solid #334155;padding:28px 24px;'>"
                    + "<h2 style='margin:0 0 12px;color:#ffffff;font-size:20px;'>Recuperación de contraseña en Storevo</h2>"
                    + "<p style='margin:0 0 14px;font-size:14px;color:#cbd5e1;'>Hola <strong>" + escape(safeName) + "</strong>,</p>"
                    + "<p style='margin:0 0 22px;font-size:14px;color:#94a3b8;line-height:1.6;'>"
                    + "Recibimos una solicitud para restablecer la contraseña de tu cuenta en Storevo. Haz clic en el siguiente botón para crear una nueva contraseña (este enlace expira en 30 minutos):"
                    + "</p>"
                    + "<div style='text-align:center;margin:24px 0;'>"
                    + "<a href='" + escape(resetLink) + "' style='display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;'>"
                    + "Restablecer mi contraseña"
                    + "</a>"
                    + "</div>"
                    + "<p style='margin:0;font-size:12px;color:#64748b;line-height:1.5;'>"
                    + "Si no solicitaste este cambio, puedes ignorar este mensaje con tranquilidad; tu contraseña actual seguirá siendo segura."
                    + "</p>"
                    + "</div>"
                    + "</div>";

            sendHtmlEmail(toEmail.trim(), "Restablece tu contraseña en Storevo", html);
        } catch (Exception e) {
            log.warn("EmailNotificationService: error enviando correo de recuperación a '{}': {}", toEmail, e.getMessage());
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.info("EmailNotificationService [MAIL_ENABLED=false]: Correo simulado hacia '{}' | Asunto: '{}'", to, subject);
            return;
        }
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("EmailNotificationService: JavaMailSender no disponible. No se envió correo a '{}'", to);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.info("EmailNotificationService: correo enviado exitosamente a '{}' ({})", to, subject);
        } catch (Exception e) {
            log.warn("EmailNotificationService: fallo SMTP enviando a '{}': {}", to, e.getMessage());
        }
    }

    private String resolveStoreName(Store store, StoreSettingsDto settings) {
        if (settings != null && !isBlank(settings.getStoreName())) {
            return settings.getStoreName().trim();
        }
        if (store != null && !isBlank(store.getName())) {
            return store.getName().trim();
        }
        return "Tienda Online";
    }

    private String formatCop(Double amount) {
        if (amount == null) return "0";
        long rounded = Math.round(amount);
        return String.format("%,d", rounded).replace(",", ".");
    }

    private String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) return "http://localhost:8080";
        String clean = url.trim();
        return clean.endsWith("/") ? clean.substring(0, clean.length() - 1) : clean;
    }

    private String escape(String input) {
        return input == null ? "" : HtmlUtils.htmlEscape(input);
    }

    private boolean isBlank(String str) {
        return str == null || str.isBlank();
    }
}