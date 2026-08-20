package com.storevo.backend.admin.model;

import com.storevo.backend.config.security.CryptoConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_integrations", uniqueConstraints = {
        // Garantiza que una tienda no tenga dos configuraciones activas de la misma integración (Ej: Dos Wompis)
        @UniqueConstraint(columnNames = {"store_id", "integration_type"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Enumerated(EnumType.STRING)
    @Column(name = "integration_type", nullable = false)
    private IntegrationType integrationType;

    @Column(nullable = false)
    private boolean isActive = false;

    @Column(nullable = false, length = 20)
    private String environment = "SANDBOX"; // SANDBOX o PRODUCTION

    // --- CAMPOS CIFRADOS ---
    // La anotación @Convert hace que JPA pase los datos por CryptoConverter automáticamente

    @Convert(converter = CryptoConverter.class)
    @Column(name = "api_key", columnDefinition = "TEXT")
    private String apiKey; // Para Wompi: Llave Pública. Para Mi Paquete: API Key.

    @Convert(converter = CryptoConverter.class)
    @Column(name = "api_secret", columnDefinition = "TEXT")
    private String apiSecret; // Para Wompi: Llave Privada.

    @Convert(converter = CryptoConverter.class)
    @Column(name = "extra_data", columnDefinition = "TEXT")
    private String extraData; // Para Wompi: Webhook Secret. Para DIAN: Certificado/Resolución.

    // -----------------------

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}