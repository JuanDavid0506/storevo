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
    private final CartManager cartManager;
    private final InventoryService inventoryService;
    private final StoreIntegrationRepository integrationRepository;

    @Autowired
    @Lazy
    private OrderService self; // Auto-referencia para aislar transacciones internas

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

    /**
     * Listado paginado del dashboard. Búsqueda, estado, canal, fechas y orden se resuelven en base de datos.
     * - "last_7_days": hoy + 6 días anteriores.
     * - "last_30_days": hoy + 29 días anteriores.
     */
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
        if (term.startsWith("#")) term = term.substring(1).trim(); // "#123" -> "123"
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

    @Transactional
    public Order createOrderFromCart(String slug, String customerName, String customerPhone, String customerDocument, String address, String city, String notes, OrderChannel channel) {
        List<CartItemDto> cartItems = cartManager.getCart(slug);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("El carrito está vacío");
        }

        String initialPaymentMethod = channel == OrderChannel.WHATSAPP ? "Pendiente por WhatsApp" : "Wompi / Tarjeta";

        Order order = Order.builder()
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerDocument(customerDocument)
                .address(address)
                .city(city)
                .notes(notes)
                .total(cartManager.getTotal(slug))
                .status(OrderStatus.PENDING)
                .channel(channel)
                .paymentMethod(initialPaymentMethod)
                .build();

        List<OrderItem> items = cartItems.stream().map(dto -> {
            if (!inventoryService.isAvailable(dto.getProductId(), dto.getVariantId(), dto.getQuantity())) {
                String finalName = dto.getName() + (dto.getVariantText() != null ? " (" + dto.getVariantText() + ")" : "");
                throw new InsufficientStockException(finalName);
            }
            String receiptName = dto.getName() + (dto.getVariantText() != null ? " - " + dto.getVariantText() : "");
            return OrderItem.builder()
                    .order(order)
                    .productId(dto.getProductId())
                    .variantId(dto.getVariantId())
                    .productName(receiptName)
                    .price(dto.getPrice())
                    .quantity(dto.getQuantity())
                    .subtotal(dto.getSubtotal())
                    .build();
        }).collect(Collectors.toList());

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

    public String buildWhatsappMessage(Order order) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hola, quiero realizar este pedido en Storevo:\n\n");

        for (OrderItem item : order.getItems()) {
            sb.append("• ").append(item.getProductName())
                    .append(" × ").append(item.getQuantity())
                    .append("\n");
        }

        sb.append("\nTotal: $").append(formatCurrency(order.getTotal()));
        sb.append("\nNombre: ").append(order.getCustomerName());
        sb.append("\n\n¿Me confirman disponibilidad?");

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

        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new InvalidOrderStatusException(oldStatus, newStatus);
        }

        if (newStatus == OrderStatus.SHIPPED && order.getShipments().isEmpty()) {
            throw new ShipmentRequiredException(orderId);
        }

        if (oldStatus == OrderStatus.PENDING && newStatus == OrderStatus.PAID) {
            deductOrderStock(order);
        }

        if ((oldStatus == OrderStatus.PAID || oldStatus == OrderStatus.CONFIRMED || oldStatus == OrderStatus.PREPARING || oldStatus == OrderStatus.PACKED)
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

    public void verifyTransactionWithWompi(Store store, Long orderId, String wompiTransactionId) {
        try {
            TenantContext.setCurrentTenant(store.getSchemaName());

            Order order = orderRepository.findById(orderId).orElse(null);

            if (order == null || order.getStatus() != OrderStatus.PENDING) {
                return;
            }

            TenantContext.clear();

            StoreIntegration wompiConfig = integrationRepository
                    .findByStoreAndIntegrationTypeAndIsActiveTrue(
                            store,
                            IntegrationType.WOMPI
                    )
                    .orElse(null);

            if (wompiConfig == null) {
                return;
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

            if (response.getBody() != null
                    && response.getStatusCode().is2xxSuccessful()) {

                JsonNode data = response.getBody().get("data");

                if (data == null || !data.has("status")) {
                    return;
                }

                String definitiveStatus = data.get("status").asText();

                if ("APPROVED".equals(definitiveStatus)) {
                    self.updateOrderStatus(
                            orderId,
                            OrderStatus.PAID,
                            EventOrigin.WEBHOOK,
                            null
                    );
                } else if ("DECLINED".equals(definitiveStatus)
                        || "ERROR".equals(definitiveStatus)
                        || "VOIDED".equals(definitiveStatus)) {
                    self.updateOrderStatus(
                            orderId,
                            OrderStatus.CANCELLED,
                            EventOrigin.WEBHOOK,
                            null
                    );
                }
            }

        } catch (Exception e) {
            System.out.println("Error verificando transacción Wompi: " + e.getMessage());
        } finally {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }
    }
}