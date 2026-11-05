package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.StoreReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreReviewRepository extends JpaRepository<StoreReview, Long> {
    List<StoreReview> findTop6ByIsVisibleTrueOrderByCreatedAtDesc();
    List<StoreReview> findAllByOrderByCreatedAtDesc();
    Optional<StoreReview> findByOrderId(Long orderId);

    long countByIsVisible(Boolean isVisible);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM StoreReview r")
    Double findAverageRating();
}