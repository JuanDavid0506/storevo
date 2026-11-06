package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhoneKey(String phoneKey);

    Optional<Customer> findFirstByPhoneOrderByIdDesc(String phone);

    Optional<Customer> findFirstByEmailIgnoreCaseOrderByHasAccountDescIdDesc(String email);

    Optional<Customer> findFirstByEmailIgnoreCaseAndHasAccountTrue(String email);

    Optional<Customer> findByResetPasswordToken(String resetPasswordToken);

    List<Customer> findAllByOrderByLastOrderDateDescIdDesc();

    @Query("SELECT c FROM Customer c WHERE " +
            "(:q IS NULL OR :q = '' " +
            "  OR LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR LOWER(c.phone) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR LOWER(COALESCE(c.city, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR LOWER(COALESCE(c.document, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR LOWER(COALESCE(c.legalName, '')) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:type IS NULL OR :type = '' " +
            "  OR (:type = 'recurrent' AND c.totalOrders >= 2) " +
            "  OR (:type = 'single' AND c.totalOrders = 1)) " +
            "AND (:channelStr IS NULL OR :channelStr = '' " +
            "  OR (c.channelsCsv IS NOT NULL AND c.channelsCsv LIKE CONCAT('%', :channelStr, '%')))")
    Page<Customer> searchCustomers(
            @Param("q") String q,
            @Param("type") String type,
            @Param("channelStr") String channelStr,
            Pageable pageable);
}