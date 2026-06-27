package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderItem;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CartManager cartManager;

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
                .status(OrderStatus.PENDING) // 1. Nace como PENDIENTE. ¡No tocamos el inventario aquí!
                .build();

        List<OrderItem> items = cartItems.stream().map(dto -> {

            // Hacemos una validación rápida para advertir al usuario si el producto se agotó antes de llegar aquí
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + dto.getName()));

            if (product.getStock() < dto.getQuantity()) {
                throw new RuntimeException("Lo sentimos, no hay stock suficiente en este instante para: " + product.getName());
            }

            // Retornamos el item para la orden, pero NO hacemos product.setStock(...)
            return OrderItem.builder()
                    .order(order)
                    .productId(dto.getProductId())
                    .productName(dto.getName())
                    .price(dto.getPrice())
                    .quantity(dto.getQuantity())
                    .subtotal(dto.getSubtotal())
                    .build();
        }).collect(Collectors.toList());

        order.setItems(items);
        Order savedOrder = orderRepository.save(order);

        // Vaciamos el carrito de este usuario
        cartManager.clearCart(slug);

        return savedOrder;
    }

    @Transactional
    public void updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        OrderStatus oldStatus = order.getStatus();

        // 2. EL MOMENTO DE LA VERDAD: Si Wompi aprueba el pago, descontamos la bolsa.
        if (oldStatus == OrderStatus.PENDING && newStatus == OrderStatus.PAID) {
            deductOrderStock(order);
        }

        // 3. REEMBOLSOS: Si la orden ya estaba pagada (bolsa descontada) y tú decides cancelarla después, devuelves la bolsa.
        if (oldStatus == OrderStatus.PAID && newStatus == OrderStatus.CANCELLED) {
            restoreOrderStock(order);
        }

        // Nota: Si una orden PENDING pasa a CANCELLED (Wompi la rechazó), el sistema no hace nada con el inventario
        // porque sabe perfectamente que nunca lo descontó.

        order.setStatus(newStatus);
        orderRepository.save(order);
    }

    // Método que ejecuta el descuento real cuando Wompi aprueba (PAID)
    private void deductOrderStock(Order order) {
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                // Tu regla: Nunca bajar de 0.
                // Math.max elegirá el número mayor entre 0 y el resultado de la resta.
                int nuevoStock = Math.max(0, product.getStock() - item.getQuantity());

                product.setStock(nuevoStock);
                productRepository.save(product);
            });
        }
    }

    // Método que devuelve la bolsa al estante digital
    private void restoreOrderStock(Order order) {
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                product.setStock(product.getStock() + item.getQuantity());
                productRepository.save(product);
            });
        }
    }
}