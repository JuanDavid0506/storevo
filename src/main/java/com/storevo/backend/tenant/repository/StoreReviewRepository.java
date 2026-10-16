package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.StoreReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreReviewRepository extends JpaRepository<StoreReview, Long> {

    List<StoreReview> findTop6ByIsVisibleTrueOrderByCreatedAtDesc();

    Optional<StoreReview> findByOrderId(Long orderId);
}