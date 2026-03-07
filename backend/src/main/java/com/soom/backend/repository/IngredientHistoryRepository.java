package com.soom.backend.repository;

import com.soom.backend.entity.IngredientHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IngredientHistoryRepository extends JpaRepository<IngredientHistoryEntity, UUID> {
    List<IngredientHistoryEntity> findByIngredientIdAndIsDeletedFalse(UUID ingredientId);
}
