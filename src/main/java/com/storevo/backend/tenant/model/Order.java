package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_token", nullable = false, length = 64, unique = true, updatable = false)
    private String publicToken;

    @Column(nullable = false, length = 100)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "customer_email", length = 120)
    private String customerEmail;

    @Column(name = "document_type", length = 10)
    private String documentType;

    @Column(name = "customer_document", length = 30)
    private String customerDocument;

    @Column(name = "verification_digit", length = 5)
    private String verificationDigit;

    @Column(name = "legal_name", length = 150)
    private String legalName;

    @Column(name = "tax_regime", length = 40)
    private String taxRegime;

    @Column(name = "requires_electronic_invoice")
    @Builder.Default
    private Boolean requiresElectronicInvoice = false;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(columnDefinition = "TEXT")
    private String notes; // Nota que deja el cliente al comprar

    @Column(nullable = false)
    private Double total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderChannel channel = OrderChannel.ONLINE;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<OrderHistory> history = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<OrderNote> internalNotes = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("packageNumber ASC")
    @Builder.Default
    private List<Shipment> shipments = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.publicToken == null || this.publicToken.isBlank()) {
            this.publicToken = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    public int getTotalItemsCount() {
        return items.stream().mapToInt(OrderItem::getQuantity).sum();
    }
}