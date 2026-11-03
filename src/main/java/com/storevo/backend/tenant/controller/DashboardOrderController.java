package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Feature;
import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.admin.service.TenantPlanService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CustomerDto;
import com.storevo.backend.tenant.dto.ManualOrderRequestDto;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.exception.InsufficientStockException;
import com.storevo.backend.tenant.exception.InvalidOrderStatusException;
import com.storevo.backend.tenant.exception.ShipmentRequiredException;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.CarrierRepository;
import com.storevo.backend.tenant.service.CustomerService;
import com.storevo.backend.tenant.service.OrderService;
import com.storevo.backend.tenant.service.ProductService;
import com.storevo.backend.tenant.service.ShipmentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/dashboard/{slug}/orders")
@RequiredArgsConstructor
public class DashboardOrderController {

    private final OrderService orderService;
    private final ProductService productService;
    private final CustomerService customerService;
    private final CarrierRepository carrierRepository;
    private final ShipmentService shipmentService;
    private final TenantPlanService tenantPlanService;
    private final StoreIntegrationRepository integrationRepository;
    private final StoreSettingsService storeSettingsService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }
        model.addAttribute("store", store);
        model.addAttribute("slug", slug);
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    private Long resolveCurrentUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("currentUserId");
        return (attr instanceof Long) ? (Long) attr : 1L;
    }

    private StoreSettingsDto loadStoreSettingsSafely(Store store) {
        if (store == null) return null;
        String prevTenant = TenantContext.getCurrentTenant();
        try {
            TenantContext.clear();
            return storeSettingsService.getSettingsByStore(store);
        } catch (Exception e) {
            return null;
        } finally {
            if (prevTenant != null) {
                TenantContext.setCurrentTenant(prevTenant);
            }
        }
    }

    private boolean isMiPaqueteActiveForStore(Store store) {
        if (store == null) {
            return false;
        }
        String prevTenant = TenantContext.getCurrentTenant();
        try {
            TenantContext.clear();
            return tenantPlanService.hasFeature(store, Feature.SHIPPING_INTEGRATION)
                    && integrationRepository.findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.MI_PAQUETE).isPresent();
        } catch (Exception e) {
            return false;
        } finally {
            if (prevTenant != null) {
                TenantContext.setCurrentTenant(prevTenant);
            }
        }
    }

    private String buildBaseUrl(HttpServletRequest request) {
        String scheme = request.getHeader("X-Forwarded-Proto") != null
                ? request.getHeader("X-Forwarded-Proto")
                : request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String portSuffix = (serverPort == 80 || serverPort == 443) ? "" : ":" + serverPort;
        return scheme + "://" + serverName + portSuffix;
    }

    private String normalizeCustomerWhatsappPhone(String rawPhone) {
        if (rawPhone == null) return "";
        String digits = rawPhone.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "57" + digits;
        }
        return digits;
    }

    private static final List<Integer> ALLOWED_PAGE_SIZES = List.of(10, 12, 15, 20, 24, 25, 48, 50, 100);

    @GetMapping
    public String listOrders(
            @PathVariable String slug,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String datePreset,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request,
            Model model) {

        Store store = (Store) request.getAttribute("currentStore");
        StoreSettingsDto storeSettings = loadStoreSettingsSafely(store);

        int safePage = Math.max(page, 0);
        int safeSize = ALLOWED_PAGE_SIZES.contains(size) ? size : 10;

        OrderStatus statusFilter = parseEnum(OrderStatus.class, status);
        OrderChannel channelFilter = parseEnum(OrderChannel.class, channel);
        LocalDate parsedFromDate = parseLocalDate(fromDate);
        LocalDate parsedToDate = parseLocalDate(toDate);

        String effectivePreset = datePreset;
        if ((effectivePreset == null || effectivePreset.isBlank())
                && (parsedFromDate != null || parsedToDate != null)) {
            effectivePreset = "custom";
        }

        Page<Order> ordersPage = orderService.searchOrders(
                q, statusFilter, channelFilter, effectivePreset, parsedFromDate, parsedToDate,
                sort, PageRequest.of(safePage, safeSize));

        model.addAttribute("page", ordersPage);
        model.addAttribute("orders", ordersPage.getContent());
        model.addAttribute("storeSettings", storeSettings);
        model.addAttribute("currentSearch", q);
        model.addAttribute("currentStatus", statusFilter);
        model.addAttribute("currentChannel", channelFilter);
        model.addAttribute("currentDatePreset", effectivePreset);
        model.addAttribute("currentFromDate", fromDate);
        model.addAttribute("currentToDate", toDate);
        model.addAttribute("currentSort", sort);
        model.addAttribute("currentSize", safeSize);

        Map<String, String> statusOptions = new LinkedHashMap<>();
        Arrays.stream(OrderStatus.values()).forEach(s -> statusOptions.put(s.name(), s.getDisplayName()));

        Map<String, String> channelOptions = new LinkedHashMap<>();
        Arrays.stream(OrderChannel.values()).forEach(c -> channelOptions.put(c.name(), c.getDisplayName()));

        Map<String, String> datePresetOptions = new LinkedHashMap<>();
        datePresetOptions.put("today", "Hoy");
        datePresetOptions.put("yesterday", "Ayer");
        datePresetOptions.put("last_7_days", "Últimos 7 días");
        datePresetOptions.put("last_30_days", "Últimos 30 días");
        datePresetOptions.put("this_month", "Este mes");
        datePresetOptions.put("custom", "Rango personalizado...");

        model.addAttribute("statusOptions", statusOptions);
        model.addAttribute("channelOptions", channelOptions);
        model.addAttribute("datePresetOptions", datePresetOptions);
        model.addAttribute("pageTitle", "Gestión de Pedidos");
        return "dashboard/orders/index";
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    @GetMapping("/{id}")
    public String orderDetail(@PathVariable String slug, @PathVariable Long id, HttpServletRequest request, Model model) {
        Store store = (Store) request.getAttribute("currentStore");
        boolean miPaqueteEnabled = isMiPaqueteActiveForStore(store);

        Order order = orderService.getOrderById(id);

        String paymentLink = buildBaseUrl(request) + "/s/" + slug + "/order/" + order.getPublicToken() + "/success";
        String normalizedPhone = normalizeCustomerWhatsappPhone(order.getCustomerPhone());
        String waMsg = orderService.buildPaymentLinkWhatsappMessage(
                order, store != null ? store.getName() : slug, paymentLink);
        String customerWhatsappShareLink = !normalizedPhone.isEmpty()
                ? "https://wa.me/" + normalizedPhone + "?text=" + URLEncoder.encode(waMsg, StandardCharsets.UTF_8)
                : "https://wa.me/?text=" + URLEncoder.encode(waMsg, StandardCharsets.UTF_8);

        model.addAttribute("order", order);
        model.addAttribute("paymentLink", paymentLink);
        model.addAttribute("customerWhatsappShareLink", customerWhatsappShareLink);
        model.addAttribute("orderStatuses", OrderStatus.values());
        model.addAttribute("carriers", carrierRepository.findByIsActiveTrueOrderByNameAsc());
        model.addAttribute("miPaqueteEnabled", miPaqueteEnabled);
        model.addAttribute("pageTitle", "Pedido #" + order.getId());
        return "dashboard/orders/detail";
    }

    // =========================================================================
    // ENDPOINTS PARA CREACIÓN MANUAL DE PEDIDOS Y VENTA ASISTIDA (OBJETIVO M2)
    // =========================================================================

    @GetMapping("/api/products")
    @ResponseBody
    public ResponseEntity< List< Map<String, Object> > > searchProductsForManualOrder(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        return ResponseEntity.ok(productService.searchProductsForManualOrder(q, limit));
    }

    @GetMapping("/api/customer")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > lookupCustomerByPhone(@RequestParam String phone) {
        Map<String, Object> res = new HashMap<>();
        CustomerDto customer = customerService.getCustomerByPhone(phone);
        if (customer == null) {
            res.put("found", false);
            return ResponseEntity.ok(res);
        }
        res.put("found", true);
        res.put("customer", customer);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/manual-ajax")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > createManualOrderAjax(
            @PathVariable String slug,
            @RequestBody ManualOrderRequestDto requestDto,
            HttpServletRequest request) {

        Long currentUserId = resolveCurrentUserId(request);
        Store store = (Store) request.getAttribute("currentStore");
        Map<String, Object> response = new HashMap<>();

        try {
            Order createdOrder = orderService.createManualOrder(requestDto, currentUserId);

            String baseUrl = buildBaseUrl(request);
            String paymentUrl = baseUrl + "/s/" + slug + "/order/" + createdOrder.getPublicToken() + "/success";
            String detailUrl = "/dashboard/" + slug + "/orders/" + createdOrder.getId();

            String storeName = store != null ? store.getName() : slug;
            String waMessage = orderService.buildPaymentLinkWhatsappMessage(createdOrder, storeName, paymentUrl);
            String encodedMsg = URLEncoder.encode(waMessage, StandardCharsets.UTF_8);
            String normalizedPhone = normalizeCustomerWhatsappPhone(createdOrder.getCustomerPhone());
            String whatsappShareUrl = !normalizedPhone.isEmpty()
                    ? "https://wa.me/" + normalizedPhone + "?text=" + encodedMsg
                    : "https://wa.me/?text=" + encodedMsg;

            response.put("success", true);
            response.put("orderId", createdOrder.getId());
            response.put("publicToken", createdOrder.getPublicToken());
            response.put("status", createdOrder.getStatus().name());
            response.put("statusDisplay", createdOrder.getStatus().getDisplayName());
            response.put("subtotal", createdOrder.getSubtotal());
            response.put("shippingCost", createdOrder.getShippingCost());
            response.put("total", createdOrder.getTotal());
            response.put("paymentUrl", paymentUrl);
            response.put("whatsappShareUrl", whatsappShareUrl);
            response.put("detailUrl", detailUrl);
            response.put("message", "Pedido #" + createdOrder.getId() + " creado exitosamente.");
            return ResponseEntity.ok(response);
        } catch (InsufficientStockException | IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "No se pudo crear el pedido: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/{id}/status-ajax")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > updateStatusAjax(
            @PathVariable Long id,
            @RequestParam OrderStatus status,
            HttpServletRequest request) {
        Long currentUserId = resolveCurrentUserId(request);
        Map<String, Object> response = new HashMap<>();

        OrderHistory history;
        try {
            history = orderService.updateOrderStatus(id, status, EventOrigin.ADMIN, currentUserId);
        } catch (InsufficientStockException | ShipmentRequiredException e) {
            response.put("success", false);
            response.put("message", "Operación rechazada: " + e.getMessage());
            return ResponseEntity.ok(response);
        } catch (InvalidOrderStatusException e) {
            response.put("success", false);
            response.put("message", "Operación rechazada: Transición de estado no permitida.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Ocurrió un error al actualizar el estado.");
            return ResponseEntity.ok(response);
        }

        response.put("success", true);
        try {
            response.put("message", "Estado actualizado correctamente a " + status.getDisplayName());
            response.put("history", mapHistoryToDto(history));
            response.put("newBadge", status.getBadgeClasses());
            response.put("newName", status.getDisplayName());
        } catch (Exception e) {
            response.put("message", "Estado actualizado correctamente a " + status.getDisplayName());
            response.put("newBadge", status.getBadgeClasses());
            response.put("newName", status.getDisplayName());
            response.put("needsRefresh", true);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/notes-ajax")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > addInternalNoteAjax(
            @PathVariable Long id,
            @RequestParam String note,
            HttpServletRequest request) {
        Long currentUserId = resolveCurrentUserId(request);
        Map<String, Object> response = new HashMap<>();

        OrderNote internalNote;
        try {
            internalNote = orderService.addInternalNote(id, note, currentUserId);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al guardar la nota interna.");
            return ResponseEntity.ok(response);
        }

        response.put("success", true);
        try {
            response.put("message", "Nota interna agregada");
            response.put("note", mapNoteToDto(internalNote));
        } catch (Exception e) {
            response.put("message", "Nota interna agregada");
            response.put("needsRefresh", true);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/shipments-ajax")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > createShipmentAjax(
            @PathVariable Long id,
            @RequestParam Long carrierId,
            @RequestParam(required = false) String trackingNumber,
            @RequestParam(required = false) Double weight,
            @RequestParam(required = false) String dimensions,
            @RequestParam(required = false, defaultValue = "MANUAL") String shippingMode,
            HttpServletRequest request) {

        Long currentUserId = resolveCurrentUserId(request);
        Store store = (Store) request.getAttribute("currentStore");
        Map<String, Object> response = new HashMap<>();

        try {
            boolean useMiPaquete = "MI_PAQUETE".equalsIgnoreCase(shippingMode)
                    || ((trackingNumber == null || trackingNumber.isBlank()) && isMiPaqueteActiveForStore(store));

            if (useMiPaquete) {
                double safeWeight = (weight != null && weight > 0) ? weight : 1.0;
                String safeDims = (dimensions != null && !dimensions.isBlank()) ? dimensions : "10x10x10";
                shipmentService.createIntegratedShipment(store, id, carrierId, "MI_PAQUETE", safeWeight, safeDims, currentUserId);
                response.put("success", true);
                response.put("message", "¡Guía solicitada automáticamente en Mi Paquete! El pedido ha avanzado a estado ENVIADO.");
            } else {
                shipmentService.createManualShipment(id, carrierId, trackingNumber, weight, dimensions, currentUserId);
                response.put("success", true);
                response.put("message", "¡Envío manual generado exitosamente! El pedido ha avanzado a estado ENVIADO.");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al generar el envío: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> mapHistoryToDto(OrderHistory history) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", history.getId());
        dto.put("eventType", history.getEventType() != null ? history.getEventType().name() : "SYSTEM_EVENT");
        dto.put("origin", history.getOrigin() != null ? history.getOrigin().name() : "ADMIN");
        dto.put("description", history.getDescription());
        dto.put("createdAt", history.getCreatedAt() != null
                ? history.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        dto.put("createdBy", "Admin (ID: " + history.getUserId() + ")");
        return dto;
    }

    private Map<String, Object> mapNoteToDto(OrderNote note) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", note.getId());
        dto.put("note", note.getNote());
        dto.put("createdAt", note.getCreatedAt() != null
                ? note.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        dto.put("createdBy", "Admin (ID: " + note.getUserId() + ")");
        return dto;
    }
}