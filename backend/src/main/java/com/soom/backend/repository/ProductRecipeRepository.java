package com.soom.backend.repository;

import com.soom.backend.entity.ProductRecipesEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRecipeRepository extends JpaRepository<ProductRecipesEntity, UUID> {
    List<ProductRecipesEntity> findByProductIdAndIsDeletedFalse(UUID productId);
    Optional<ProductRecipesEntity> findByProductIdAndIsActiveTrue(UUID productId);
    int countByProductId(UUID productId);
}
