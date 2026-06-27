package com.storevo.backend.admin.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "stores")
@Data // Genera getters, setters, toString, equals y hashCode automáticamente
@NoArgsConstructor // Genera un constructor vacío (requerido por Hibernate)
@AllArgsConstructor // Genera un constructor con todos los campos
@Builder // Nos permite crear objetos con el patrón Builder (muy útil más adelante)
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "schema_name", nullable = false, unique = true, length = 100)
    private String schemaName;

    @Column(name = "plan_id")
    private Long planId; // Por ahora será un ID simple, luego lo relacionaremos con una entidad Plan

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, ACTIVE, SUSPENDED

    @Column(name = "subscription_status", length = 20)
    private String subscriptionStatus;

    @Column(name = "subscription_end_date")
    private LocalDateTime subscriptionEndDate;

    @Column(name = "custom_domain", unique = true, length = 150)
    private String customDomain;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Estos métodos se ejecutan automáticamente antes de guardar o actualizar en base de datos
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