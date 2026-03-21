package com.soom.backend.repository;

import com.soom.backend.entity.ProductionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionRepository extends JpaRepository<ProductionEntity, UUID> {
    List<ProductionEntity> findByIsDeletedFalseOrderByProductionDateDesc();

    // ← fix: pakai product_id bukan productId
    List<ProductionEntity> findByProduct_IdAndAvailableQtyGreaterThanAndIsDeletedFalse(
            UUID productId, BigDecimal qty
    );

    // ← fix: pakai product_id bukan productId
    Optional<ProductionEntity> findTopByProduct_IdAndIsDeletedFalseOrderByProductionDateDesc(
            UUID productId
    );
}
