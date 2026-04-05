package com.soom.backend.repository;

import com.soom.backend.entity.IngredientsEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IngredientRepository extends JpaRepository<IngredientsEntity, UUID> {

    boolean existsByNameAndTenantId(String name, UUID tenantId);

    @Query("SELECT i FROM IngredientsEntity i WHERE i.isDeleted = false AND i.tenant.id = :tenantId " +
           "AND (:search IS NULL OR LOWER(i.name) LIKE :search)")
    Page<IngredientsEntity> findAllActive(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT i FROM IngredientsEntity i WHERE i.isDeleted = false AND i.tenant.id = :tenantId AND i.stockQuantity <= i.minimumStock")
    List<IngredientsEntity> findCriticalStockByTenantId(@Param("tenantId") UUID tenantId);

    IngredientsEntity findFirstByNameAndTenantIdOrderByIdDesc(String name, UUID tenantId);

    @Query("SELECT i FROM IngredientsEntity i WHERE i.isDeleted = false AND i.tenant.id = :tenantId")
    List<IngredientsEntity> findByTenantIdAndIsDeletedFalse(@Param("tenantId") UUID tenantId);

    Optional<IngredientsEntity> findByIdAndTenantId(UUID id, UUID tenantId);
}