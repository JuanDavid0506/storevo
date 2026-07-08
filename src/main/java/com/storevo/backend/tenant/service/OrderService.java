package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderItem;
import com.storevo.backend.tenant.model.OrderStatus;
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

    // --- SOLUCIÓN LAZY INITIALIZATION PARA EL DASHBOARD ---
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        // Magia Anti-Lazy: Forzamos a Hibernate a traer los items de cada pedido
        // mientras la sesión de BD sigue abierta.
        orders.forEach(order -> order.getItems().size());
        return orders;
    }
    // ------------------------------------------------------

    @Transactional
    public Order createOrderFromCart(String slug, String customerName, String customerPhone, String address, String city, String notes) {
        List<CartItemDto> cartItems = cartManager.getCart(slug);

        if (cartItems.isEmpty()) {
            throw new RuntimeException("El carrito está vacío");
        }

        Double total = cartManager.getTotal(slug);

        Order order = Order.builder()
                .customerName(customerName)
                .customerPhone(customerPhone)
                .address(address)
                .city(city)
                .notes(notes)
                .total(total)
                .status(OrderStatus.PENDING)
                .build();

        List<OrderItem> items = cartItems.stream().map(dto -> {

            if (!inventoryService.isAvailable(dto.getProductId(), dto.getVariantId(), dto.getQuantity())) {
                throw new RuntimeException("Lo sentimos, no hay stock suficiente en este instante para: " + dto.getName() +
                        (dto.getVariantText() != null ? " (" + dto.getVariantText() + ")" : ""));
            }

            String finalName = dto.getName() + (dto.getVariantText() != null ? " - " + dto.getVariantText() : "");

            return OrderItem.builder()
                    .order(order)
                    .productId(dto.getProductId())
                    .variantId(dto.getVariantId())
                    .productName(finalName)
                    .price(dto.getPrice())
                    .quantity(dto.getQuantity())
                    .subtotal(dto.getSubtotal())
                    .build();
        }).collect(Collectors.toList());

        order.setItems(items);
        Order savedOrder = orderRepository.save(order);

        cartManager.clearCart(slug);
        return savedOrder;
    }

    @Transactional
    public void updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        OrderStatus oldStatus = order.getStatus();

        if (oldStatus == OrderStatus.PENDING && newStatus == OrderStatus.PAID) {
            deductOrderStock(order);
        }

        if (oldStatus == OrderStatus.PAID && newStatus == OrderStatus.CANCELLED) {
            restoreOrderStock(order);
        }

        order.setStatus(newStatus);
        orderRepository.save(order);
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
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (order.getStatus() != OrderStatus.PENDING) {
            System.out.println("Idempotencia: Pedido " + orderId + " ya procesado. Estado actual: " + order.getStatus());
            return;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String wompiUrl = "https://sandbox.wompi.co/v1/transactions/" + wompiTransactionId;
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(wompiUrl, JsonNode.class);

            if (response.getBody() != null && response.getStatusCode().is2xxSuccessful()) {
                String definitiveStatus = response.getBody().get("data").get("status").asText();

                if ("APPROVED".equals(definitiveStatus)) {
                    updateOrderStatus(orderId, OrderStatus.PAID);
                } else if ("DECLINED".equals(definitiveStatus) || "ERROR".equals(definitiveStatus) || "VOIDED".equals(definitiveStatus)) {
                    updateOrderStatus(orderId, OrderStatus.CANCELLED);
                }
            }
        } catch (Exception e) {
            System.out.println("Error crítico comunicándose con la API de Wompi: " + e.getMessage());
        }
    }
}