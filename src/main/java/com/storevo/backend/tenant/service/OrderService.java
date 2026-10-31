package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.exception.InsufficientStockException;
import com.storevo.backend.tenant.exception.InvalidOrderStatusException;
import com.storevo.backend.tenant.exception.OrderNotFoundException;
import com.storevo.backend.tenant.exception.ShipmentRequiredException;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CartManager cartManager;
    private final InventoryService inventoryService;
    private final StoreIntegrationRepository integrationRepository;

    @Autowired
    @Lazy
    private OrderService self;

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        orders.forEach(order -> order.getItems().size());
        return orders;
    }

    @Transactional(readOnly = true)
    public Page<Order> searchOrders(String q, OrderStatus status, OrderChannel channel, String sortStr, Pageable pageable) {
        return searchOrders(q, status, channel, null, null, null, sortStr, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Order> searchOrders(
            String q,
            OrderStatus status,
            OrderChannel channel,
            String datePreset,
            LocalDate customFrom,
            LocalDate customTo,
            String sortStr,
            Pageable pageable) {

        String term = (q == null) ? "" : q.trim();
        if (term.startsWith("#")) term = term.substring(1).trim();
        Long orderId = null;
        if (term.matches("\\d{1,18}")) orderId = Long.valueOf(term);
        String normalizedQ = term.isEmpty() ? null : term;

        LocalDateTime fromDateTime = null;
        LocalDateTime toDateTime = null;
        LocalDate today = LocalDate.now();

        if (datePreset != null && !datePreset.isBlank()) {
            switch (datePreset.trim().toLowerCase()) {
                case "today":
                    fromDateTime = today.atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "yesterday":
                    LocalDate yesterday = today.minusDays(1);
                    fromDateTime = yesterday.atStartOfDay();
                    toDateTime = yesterday.atTime(LocalTime.MAX);
                    break;
                case "last_7_days":
                    fromDateTime = today.minusDays(6).atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "last_30_days":
                    fromDateTime = today.minusDays(29).atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "this_month":
                    fromDateTime = today.withDayOfMonth(1).atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "custom":
                    if (customFrom != null && customTo != null && customFrom.isAfter(customTo)) {
                        fromDateTime = customTo.atStartOfDay();
                        toDateTime = customFrom.atTime(LocalTime.MAX);
                    } else {
                        if (customFrom != null) fromDateTime = customFrom.atStartOfDay();
                        if (customTo != null) toDateTime = customTo.atTime(LocalTime.MAX);
                    }
                    break;
                default:
                    break;
            }
        }

        Sort sort;
        switch (sortStr == null ? "" : sortStr) {
            case "oldest":     sort = Sort.by("createdAt").ascending().and(Sort.by("id").ascending()); break;
            case "total_desc": sort = Sort.by("total").descending().and(Sort.by("id").descending()); break;
            case "total_asc":  sort = Sort.by("total").ascending().and(Sort.by("id").ascending()); break;
            case "newest":
            default:           sort = Sort.by("createdAt").descending().and(Sort.by("id").descending()); break;
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<Order> page = orderRepository.searchOrders(
                normalizedQ, orderId, status, channel, fromDateTime, toDateTime, sortedPageable);

        page.getContent().forEach(order -> order.getItems().size());
        return page;
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
        order.getItems().size();
        order.getHistory().size();
        order.getInternalNotes().size();
        order.getShipments().size();
        order.getShipments().forEach(shipment -> {
            if (shipment.getCarrier() != null) {
                shipment.getCarrier().getName();
            }
        });
        return order;
    }

    @Transactional(readOnly = true)
    public Order getOrderByIdAndToken(Long id, String publicToken) {
        if (publicToken == null || publicToken.isBlank()) {
            throw new OrderNotFoundException(id);
        }
        Order order = orderRepository.findByIdAndPublicToken(id, publicToken.trim())
                .orElseThrow(() -> new OrderNotFoundException(id));
        order.getItems().size();
        order.getHistory().size();
        order.getInternalNotes().size();
        order.getShipments().size();
        order.getShipments().forEach(shipment -> {
            if (shipment.getCarrier() != null) {
                shipment.getCarrier().getName();
            }
        });
        return order;
    }

    /**
     * Firma original conservada por retrocompatibilidad.
     */
    @Transactional
    public Order createOrderFromCart(
            String slug,
            String customerName,
            String customerPhone,
            String customerDocument,
            String address,
            String city,
            String notes,
            OrderChannel channel) {

        return createOrderFromCart(
                slug, customerName, customerPhone, null,
                null, customerDocument, null, null, null, false,
                address, city, notes, channel
        );
    }

    /**
     * Crea el pedido persistiendo también correo y datos fiscales DIAN sin imponer bloqueos por plan.
     */
    @Transactional
    public Order createOrderFromCart(
            String slug,
            String customerName,
            String customerPhone,
            String customerEmail,
            String documentType,
            String customerDocument,
            String verificationDigit,
            String legalName,
            String taxRegime,
            Boolean requiresElectronicInvoice,
            String address,
            String city,
            String notes,
            OrderChannel channel) {

        List<CartItemDto> cartItems = cartManager.getCart(slug);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("El carrito está vacío");
        }

        String initialPaymentMethod = channel == OrderChannel.WHATSAPP ? "Pendiente por WhatsApp" : "Wompi / Tarjeta";

        Order order = Order.builder()
                .customerName(customerName != null ? customerName.trim() : "")
                .customerPhone(customerPhone != null ? customerPhone.trim() : "")
                .customerEmail(cleanNullable(customerEmail))
                .documentType(cleanNullable(documentType))
                .customerDocument(cleanNullable(customerDocument))
                .verificationDigit(cleanNullable(verificationDigit))
                .legalName(cleanNullable(legalName))
                .taxRegime(cleanNullable(taxRegime))
                .requiresElectronicInvoice(Boolean.TRUE.equals(requiresElectronicInvoice))
                .address(address != null ? address.trim() : "")
                .city(city != null ? city.trim() : "")
                .notes(cleanNullable(notes))
                .total(0.0)
                .status(OrderStatus.PENDING)
                .channel(channel)
                .paymentMethod(initialPaymentMethod)
                .build();

        List<OrderItem> items = cartItems.stream().map(dto -> {
            if (dto.getProductId() == null || dto.getQuantity() == null || dto.getQuantity() <= 0) {
                throw new IllegalArgumentException("Datos de producto o cantidad inválidos en el carrito.");
            }

            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Uno de los productos de tu bolsa ya no existe."));

            if (Boolean.TRUE.equals(product.getIsDeleted())
                    || !Boolean.TRUE.equals(product.getIsActive())
                    || Boolean.TRUE.equals(product.getIsDraft())) {
                throw new IllegalArgumentException("El producto '" + product.getName() + "' ya no está disponible.");
            }

            ProductVariant variant = null;
            Long verifiedVariantId = null;

            if (Boolean.TRUE.equals(product.getHasVariants())) {
                if (dto.getVariantId() == null) {
                    throw new IllegalArgumentException("Debes seleccionar una variante válida para el producto: " + product.getName());
                }
                variant = variantRepository.findByIdAndProductId(dto.getVariantId(), product.getId())
                        .orElseThrow(() -> new IllegalArgumentException("La variante seleccionada no pertenece al producto: " + product.getName()));

                if (!Boolean.TRUE.equals(variant.getIsActive())) {
                    throw new IllegalArgumentException("La variante seleccionada para '" + product.getName() + "' no está disponible.");
                }
                verifiedVariantId = variant.getId();
            } else if (dto.getVariantId() != null) {
                throw new IllegalArgumentException("La variante seleccionada no pertenece al producto: " + product.getName());
            }

            Double verifiedPrice = cartManager.resolveEffectivePrice(product, variant);
            if (verifiedPrice == null || verifiedPrice <= 0.0) {
                throw new IllegalArgumentException("El producto '" + product.getName() + "' no tiene un precio válido.");
            }

            String verifiedVariantText = variant != null ? cartManager.buildVariantText(variant) : null;
            if ((verifiedVariantText == null || verifiedVariantText.isBlank())
                    && dto.getVariantText() != null && !dto.getVariantText().isBlank()) {
                verifiedVariantText = dto.getVariantText().trim();
            }

            if (!inventoryService.isAvailable(product.getId(), verifiedVariantId, dto.getQuantity())) {
                String finalName = product.getName() + (verifiedVariantText != null ? " (" + verifiedVariantText + ")" : "");
                throw new InsufficientStockException(finalName);
            }

            inventoryService.deductStock(product.getId(), verifiedVariantId, dto.getQuantity());

            String receiptName = product.getName() + (verifiedVariantText != null ? " - " + verifiedVariantText : "");
            double verifiedSubtotal = verifiedPrice * dto.getQuantity();

            return OrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .variantId(verifiedVariantId)
                    .productName(receiptName)
                    .price(verifiedPrice)
                    .quantity(dto.getQuantity())
                    .subtotal(verifiedSubtotal)
                    .build();
        }).collect(Collectors.toList());

        double verifiedOrderTotal = items.stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        if (Double.isNaN(verifiedOrderTotal) || Double.isInfinite(verifiedOrderTotal) || verifiedOrderTotal <= 0.0) {
            throw new IllegalArgumentException("El importe total del pedido no es válido.");
        }

        order.setTotal(verifiedOrderTotal);
        order.setItems(items);

        String historyDescription = channel == OrderChannel.WHATSAPP
                ? "Pedido creado por el cliente y enviado por WhatsApp para confirmación."
                : "Pedido creado por el cliente.";

        OrderHistory historyObj = OrderHistory.builder()
                .order(order)
                .eventType(OrderHistoryType.SYSTEM_EVENT)
                .origin(EventOrigin.WEB)
                .oldStatus(null)
                .newStatus(OrderStatus.PENDING)
                .description(historyDescription)
                .userId(null)
                .build();

        order.getHistory().add(historyObj);

        Order savedOrder = orderRepository.save(order);
        cartManager.clearCart(slug);

        return savedOrder;
    }

    private String cleanNullable(String value) {
        return (value != null && !value.isBlank()) ? value.trim() : null;
    }

    public String buildWhatsappMessage(Order order) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hola, quiero realizar el *Pedido #").append(order.getId()).append("*:").append("\n\n");

        for (OrderItem item : order.getItems()) {
            sb.append("• ").append(item.getQuantity()).append("x ").append(item.getProductName());
            if (item.getSubtotal() != null) {
                sb.append(" ($").append(formatCurrency(item.getSubtotal())).append(")");
            }
            sb.append("\n");
        }

        sb.append("\n*Total a pagar:* $").append(formatCurrency(order.getTotal())).append("\n");
        sb.append("\n*Datos de entrega:*");
        sb.append("\n• Cliente: ").append(order.getCustomerName());
        if (order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank()) {
            sb.append("\n• Teléfono: ").append(order.getCustomerPhone());
        }
        if (order.getCustomerDocument() != null && !order.getCustomerDocument().isBlank()) {
            String docPrefix = (order.getDocumentType() != null && !order.getDocumentType().isBlank())
                    ? order.getDocumentType() + " " : "";
            sb.append("\n• Documento: ").append(docPrefix).append(order.getCustomerDocument());
        }
        if (Boolean.TRUE.equals(order.getRequiresElectronicInvoice()) && order.getLegalName() != null) {
            sb.append("\n• Factura Electrónica a: ").append(order.getLegalName());
        }
        if (order.getCity() != null && !order.getCity().isBlank()) {
            sb.append("\n• Ciudad: ").append(order.getCity());
        }
        if (order.getAddress() != null && !order.getAddress().isBlank()) {
            sb.append("\n• Dirección: ").append(order.getAddress());
        }
        if (order.getNotes() != null && !order.getNotes().isBlank()) {
            sb.append("\n• Notas: ").append(order.getNotes());
        }

        sb.append("\n\n¿Me confirman disponibilidad y datos para finalizar?");
        return sb.toString();
    }

    private String formatCurrency(Double amount) {
        if (amount == null) return "0";
        long rounded = Math.round(amount);
        return String.format("%,d", rounded).replace(",", ".");
    }

    @Transactional
    public OrderHistory updateOrderStatus(Long orderId, OrderStatus newStatus, EventOrigin origin, Long userId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException(orderId));
        OrderStatus oldStatus = order.getStatus();

        // Idempotencia ante llegada simultánea de Webhook y retorno web
        if (oldStatus == newStatus) {
            return order.getHistory().isEmpty() ? null : order.getHistory().get(0);
        }

        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new InvalidOrderStatusException(oldStatus, newStatus);
        }

        if (newStatus == OrderStatus.SHIPPED && order.getShipments().isEmpty()) {
            throw new ShipmentRequiredException(orderId);
        }

        if ((oldStatus == OrderStatus.PENDING || oldStatus == OrderStatus.PAID || oldStatus == OrderStatus.CONFIRMED || oldStatus == OrderStatus.PREPARING || oldStatus == OrderStatus.PACKED)
                && (newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED)) {
            restoreOrderStock(order);
        }

        order.setStatus(newStatus);

        OrderHistory historyObj = OrderHistory.builder()
                .order(order)
                .eventType(OrderHistoryType.STATE_CHANGE)
                .origin(origin)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .description("El estado cambió a " + newStatus.getDisplayName())
                .userId(userId)
                .build();

        order.getHistory().add(historyObj);
        orderRepository.save(order);
        return historyObj;
    }

    @Transactional
    public void recordPaymentAttemptFailure(Long orderId, String wompiTransactionId, String wompiStatus) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING) return;

        String txDesc = "Intento de pago en Wompi no completado (" + wompiStatus + "). ID Transacción: " + wompiTransactionId;
        boolean alreadyRecorded = order.getHistory().stream()
                .anyMatch(h -> txDesc.equals(h.getDescription()));

        if (!alreadyRecorded) {
            OrderHistory historyObj = OrderHistory.builder()
                    .order(order)
                    .eventType(OrderHistoryType.SYSTEM_EVENT)
                    .origin(EventOrigin.WEBHOOK)
                    .oldStatus(order.getStatus())
                    .newStatus(order.getStatus())
                    .description(txDesc)
                    .userId(null)
                    .build();

            order.getHistory().add(historyObj);
            orderRepository.save(order);
        }
    }

    @Transactional
    public OrderNote addInternalNote(Long orderId, String note, Long userId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException(orderId));

        OrderNote internalNote = OrderNote.builder()
                .order(order)
                .note(note)
                .userId(userId)
                .build();

        order.getInternalNotes().add(internalNote);
        orderRepository.save(order);

        return internalNote;
    }

    private void deductOrderStock(Order order) {
        for (OrderItem item : order.getItems()) {
            inventoryService.deductStock(item.getProductId(), item.getVariantId(), item.getQuantity());
        }
    }

    private void restoreOrderStock(Order order) {
        for (OrderItem item : order.getItems()) {
            inventoryService.restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
        }
    }

    public String verifyTransactionWithWompi(Store store, Long orderId, String wompiTransactionId) {
        try {
            TenantContext.setCurrentTenant(store.getSchemaName());
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return "INVALID";
            }
            if (order.getStatus() == OrderStatus.PAID) {
                return "APPROVED";
            }
            if (wompiTransactionId == null || wompiTransactionId.isBlank()) {
                return "PENDING";
            }
            if (order.getStatus() != OrderStatus.PENDING) {
                return order.getStatus().name();
            }

            TenantContext.clear();

            StoreIntegration wompiConfig = integrationRepository
                    .findByStoreAndIntegrationTypeAndIsActiveTrue(
                            store,
                            IntegrationType.WOMPI
                    )
                    .orElse(null);

            if (wompiConfig == null) {
                return "PENDING";
            }

            TenantContext.setCurrentTenant(store.getSchemaName());

            String baseUrl = "PRODUCTION".equals(wompiConfig.getEnvironment())
                    ? "https://production.wompi.co/v1/transactions/"
                    : "https://sandbox.wompi.co/v1/transactions/";

            RestTemplate restTemplate = new RestTemplate();

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(
                    baseUrl + wompiTransactionId,
                    JsonNode.class
            );

            if (response.getBody() != null && response.getStatusCode().is2xxSuccessful()) {
                JsonNode data = response.getBody().get("data");
                if (data == null || !data.has("status")) {
                    return "INVALID";
                }

                if (data.has("reference") && !data.get("reference").isNull()) {
                    String ref = data.get("reference").asText("");
                    String idStr = String.valueOf(orderId);
                    boolean matchesOrder = ref.equals(idStr)
                            || ref.matches(".*(?<!\\d)" + idStr + "(?!\\d).*");
                    if (!matchesOrder) {
                        System.out.println("Alerta de seguridad Wompi: La referencia " + ref + " no corresponde al pedido #" + orderId);
                        return "INVALID";
                    }
                }

                long expectedCents = Math.round((order.getTotal() != null ? order.getTotal() : 0.0) * 100);
                if (data.has("amount_in_cents") && !data.get("amount_in_cents").isNull()) {
                    long paidCents = data.get("amount_in_cents").asLong(-1L);
                    if (paidCents != expectedCents) {
                        System.out.println("Alerta de seguridad Wompi: Monto pagado (" + paidCents + ") difiere del pedido #" + orderId + " (" + expectedCents + ")");
                        return "INVALID";
                    }
                }

                String definitiveStatus = data.get("status").asText();

                if ("APPROVED".equals(definitiveStatus)) {
                    self.updateOrderStatus(
                            orderId,
                            OrderStatus.PAID,
                            EventOrigin.WEBHOOK,
                            null
                    );
                    return "APPROVED";
                } else if ("DECLINED".equals(definitiveStatus)
                        || "ERROR".equals(definitiveStatus)
                        || "VOIDED".equals(definitiveStatus)) {
                    self.recordPaymentAttemptFailure(orderId, wompiTransactionId, definitiveStatus);
                    return definitiveStatus;
                }

                return definitiveStatus;
            }

            return "PENDING";

        } catch (Exception e) {
            System.out.println("Error verificando transacción Wompi: " + e.getMessage());
            return "ERROR";
        } finally {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }
    }
}