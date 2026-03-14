package com.soom.backend.repository;

import com.soom.backend.entity.IngredientStockHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IngredientStockHistoryRepository extends JpaRepository<IngredientStockHistoryEntity, UUID> {
    List<IngredientStockHistoryEntity> findByIngredientsIdAndIsDeletedFalse(UUID ingredientId);
}
