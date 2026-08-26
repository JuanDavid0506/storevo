package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByExternalShipmentId(String externalShipmentId);
}