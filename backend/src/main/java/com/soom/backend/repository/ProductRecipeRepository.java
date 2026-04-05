package com.soom.backend.repository;

import com.soom.backend.entity.ProductRecipesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRecipeRepository extends JpaRepository<ProductRecipesEntity, UUID> {
    List<ProductRecipesEntity> findByProductIdAndTenantIdAndIsDeletedFalse(UUID productId, UUID tenantId);

    Optional<ProductRecipesEntity> findByProductIdAndTenantIdAndIsActiveTrue(UUID productId, UUID tenantId);

    int countByProductIdAndTenantId(UUID productId, UUID tenantId);
}
