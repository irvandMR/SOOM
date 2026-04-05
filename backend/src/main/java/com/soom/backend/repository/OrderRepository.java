package com.soom.backend.repository;

import com.soom.backend.entity.OrderEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    @Query("SELECT o FROM OrderEntity o WHERE o.tenant.id = :tenantId AND o.isDeleted = false " +
           "AND (:search IS NULL OR LOWER(o.orderNumber) LIKE :search OR LOWER(o.customerName) LIKE :search) " +
           "AND (:status IS NULL OR o.status = :status) " +
           "AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus)")
    Page<OrderEntity> findAllActive(
            @Param("tenantId") UUID tenantId, 
            @Param("search") String search, 
            @Param("status") com.soom.backend.enums.OrderStatus status,
            @Param("paymentStatus") com.soom.backend.enums.PaymentStatus paymentStatus,
            Pageable pageable);

    List<OrderEntity> findByTenant_IdAndIsDeletedFalseOrderByOrderDateDesc(UUID tenantId);

    @Query("SELECT o FROM OrderEntity o WHERE o.tenant.id = :tenantId AND o.isDeleted = false AND o.orderDate = :date")
    List<OrderEntity> findByTenant_IdAndOrderDateAndIsDeletedFalse(
            @Param("tenantId") UUID tenantId,
            @Param("date") LocalDate date
    );

    @Query("SELECT o FROM OrderEntity o WHERE o.tenant.id = :tenantId AND o.isDeleted = false ORDER BY o.orderDate DESC")
    List<OrderEntity> findRecentByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT o FROM OrderEntity o WHERE o.tenant.id = :tenantId AND o.isDeleted = false " +
           "AND o.orderDate BETWEEN :start AND :end ORDER BY o.orderDate DESC")
    List<OrderEntity> findByTenantIdAndDateRange(
            @Param("tenantId") UUID tenantId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}

