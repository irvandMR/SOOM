package com.soom.backend.repository;

import com.soom.backend.entity.ProductionEntity;
import com.soom.backend.enums.ProductionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProductionRepository extends JpaRepository<ProductionEntity, UUID> {

    @Query("SELECT p FROM ProductionEntity p WHERE p.tenant.id = :tenantId AND p.isDeleted = false " +
           "AND (:search IS NULL OR LOWER(p.product.name) LIKE :search)")
    Page<ProductionEntity> findAllActive(@Param("tenantId") UUID tenantId, @Param("search") String search, Pageable pageable);

    List<ProductionEntity> findByTenantIdAndIsDeletedFalseOrderByProductionDateDesc(UUID tenantId);

    List<ProductionEntity> findByTenantIdAndProduct_IdAndAvailableQtyGreaterThanAndIsDeletedFalse(
            UUID tenantId,
            UUID productId,
            BigDecimal qty
    );

    @Query("SELECT p FROM ProductionEntity p WHERE p.tenant.id = :tenantId AND p.isDeleted = false " +
           "AND p.status = :status AND p.productionDate BETWEEN :start AND :end ORDER BY p.productionDate DESC")
    List<ProductionEntity> findByTenantIdAndStatusAndDateRange(
            @Param("tenantId") UUID tenantId,
            @Param("status") ProductionStatus status,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}

