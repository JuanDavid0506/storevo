package com.storevo.backend.admin.repository;

import com.storevo.backend.admin.model.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
    Optional<StoreSettings> findByStoreId(Long storeId);
}