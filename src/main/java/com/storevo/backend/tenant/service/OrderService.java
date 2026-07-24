package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.exception.InsufficientStockException;
import com.storevo.backend.tenant.exception.InvalidOrderStatusException;
import com.storevo.backend.tenant.exception.OrderNotFoundException;
import com.storevo.backend.tenant.exception.ShipmentRequiredException;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartManager cartManager;
    private final InventoryService inventoryService;

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        orders.forEach(order -> order.getItems().size());
        return orders;
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
        order.getItems().size();
        order.getHistory().size();
        order.getInternalNotes().size();
        order.getShipments().size();
        return order;
    }

    @Transactional
    public Order createOrderFromCart(String slug, String customerName, String customerPhone, String address, String city, String notes) {
        List<CartItemDto> cartItems = cartManager.getCart(slug);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("El carrito está vacío");
        }

        Order order = Order.builder()
                .customerName(customerName)
                .customerPhone(customerPhone)
                .address(address)
                .city(city)
                .notes(notes)
                .total(cartManager.getTotal(slug))
                .status(OrderStatus.PENDING)
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

        OrderHistory historyObj = OrderHistory.builder()
                .order(order)
                .eventType(OrderHistoryType.SYSTEM_EVENT)
                .origin(EventOrigin.WEB)
                .oldStatus(null)
                .newStatus(OrderStatus.PENDING)
                .description("Pedido creado por el cliente.")
                .userId(null)
                .build();
        order.getHistory().add(historyObj);

        Order savedOrder = orderRepository.save(order);
        cartManager.clearCart(slug);
        return savedOrder;
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
        orderRepository.save(order); // Guardado explícito forzado

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

    @Transactional
    public void verifyTransactionWithWompi(Long orderId, String wompiTransactionId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING) return;

        try {
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<JsonNode> response = restTemplate.getForEntity("https://sandbox.wompi.co/v1/transactions/" + wompiTransactionId, JsonNode.class);

            if (response.getBody() != null && response.getStatusCode().is2xxSuccessful()) {
                String definitiveStatus = response.getBody().get("data").get("status").asText();

                if ("APPROVED".equals(definitiveStatus)) {
                    updateOrderStatus(orderId, OrderStatus.PAID, EventOrigin.WEBHOOK, null);
                } else if ("DECLINED".equals(definitiveStatus) || "ERROR".equals(definitiveStatus) || "VOIDED".equals(definitiveStatus)) {
                    updateOrderStatus(orderId, OrderStatus.CANCELLED, EventOrigin.WEBHOOK, null);
                }
            }
        } catch (Exception e) {
            System.out.println("Error API Wompi: " + e.getMessage());
        }
    }
}