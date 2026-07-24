package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Carrier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CarrierRepository extends JpaRepository<Carrier, Long> {
    List<Carrier> findByIsActiveTrueOrderByNameAsc();
}