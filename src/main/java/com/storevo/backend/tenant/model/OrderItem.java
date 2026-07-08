package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Order order;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    // --- NUEVO: SOPORTE PARA VARIANTES EN LOS PEDIDOS ---
    @Column(name = "variant_id", nullable = true)
    private Long variantId;
    // ----------------------------------------------------

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Double subtotal;
}