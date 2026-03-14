package com.soom.backend.repository;

import com.soom.backend.entity.ProductRecipeItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRecipeItemRepository extends JpaRepository<ProductRecipeItemEntity, UUID> {
    List<ProductRecipeItemEntity> findByRecipeIdAndIsDeletedFalse(UUID recipeId);
}
