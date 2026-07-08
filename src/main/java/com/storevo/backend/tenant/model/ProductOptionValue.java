package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_option_values")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductOptionValue {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private ProductOption option;

    @Column(name = "value_name", nullable = false, length = 100)
    private String valueName; // Ej: Rojo, M

    @Column(nullable = false)
    @Builder.Default
    private Integer sortPosition = 0;
}