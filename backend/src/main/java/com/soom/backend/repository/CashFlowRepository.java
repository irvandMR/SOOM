package com.soom.backend.repository;

import com.soom.backend.entity.CashFlowEntity;
import com.soom.backend.enums.CashFlowType;
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
public interface CashFlowRepository extends JpaRepository<CashFlowEntity, UUID> {

    @Query("SELECT cf FROM CashFlowEntity cf WHERE cf.tenant.id = :tenantId AND cf.isDeleted = false " +
           "AND (:search IS NULL OR LOWER(cf.description) LIKE :search OR LOWER(cf.category) LIKE :search)")
    Page<CashFlowEntity> findAllActive(@Param("tenantId") UUID tenantId, @Param("search") String search, Pageable pageable);

    List<CashFlowEntity> findByTenant_IdAndIsDeletedFalseOrderByTransactionDateDesc(UUID tenantId);

    List<CashFlowEntity> findByReferenceIdAndIsDeletedFalse(UUID referenceId);

    List<CashFlowEntity> findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(
            UUID tenantId,
            LocalDate date,
            CashFlowType type
    );

    @Query("SELECT cf FROM CashFlowEntity cf WHERE cf.tenant.id = :tenantId AND cf.isDeleted = false " +
           "AND cf.transactionDate BETWEEN :start AND :end ORDER BY cf.transactionDate ASC")
    List<CashFlowEntity> findByTenantIdAndDateRange(
            @Param("tenantId") UUID tenantId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}

