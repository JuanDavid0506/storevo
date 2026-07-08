package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_options")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Product product;

    @Column(nullable = false, length = 100)
    private String name; // Ej: Color, Talla

    @Column(nullable = false)
    @Builder.Default
    private Integer sortPosition = 0;

    @OneToMany(mappedBy = "option", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortPosition ASC")
    @Builder.Default
    private List<ProductOptionValue> values = new ArrayList<>();
}