package com.soom.backend.repository;

import com.soom.backend.entity.IngredientStockHistoryEntity;
import com.soom.backend.enums.StockHistoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface IngredientStockHistoryRepository extends JpaRepository<IngredientStockHistoryEntity, UUID> {

    List<IngredientStockHistoryEntity> findByIngredientsIdAndIsDeletedFalse(UUID ingredientId);

    @Query("SELECT h FROM IngredientStockHistoryEntity h " +
           "JOIN h.ingredients i " +
           "WHERE i.tenant.id = :tenantId " +
           "AND h.type = :type " +
           "AND h.isDeleted = false " +
           "AND CAST(h.createdAt AS LocalDate) BETWEEN :start AND :end " +
           "ORDER BY h.createdAt ASC")
    List<IngredientStockHistoryEntity> findByTypeAndTenantIdAndDateRange(
            @Param("tenantId") UUID tenantId,
            @Param("type") StockHistoryType type,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}

