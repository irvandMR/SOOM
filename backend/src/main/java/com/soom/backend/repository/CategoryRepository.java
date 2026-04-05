package com.soom.backend.repository;

import com.soom.backend.entity.CategoryEntity;
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
public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {

    @Query("SELECT c FROM CategoryEntity c WHERE c.tenant.id = :tenantId AND c.isDeleted = false " +
           "AND (:search IS NULL OR LOWER(c.name) LIKE :search)")
    Page<CategoryEntity> findAllActive(@Param("tenantId") UUID tenantId, @Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM CategoryEntity c WHERE c.tenant.id = :tenantId AND c.isDeleted = false AND c.tenant.isActive = true")
    List<CategoryEntity> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    Optional<CategoryEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByNameAndTenantId(String name, UUID tenantId);
}
