package com.soom.backend.repository;

import com.soom.backend.entity.ProductEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {
    boolean existsByNameAndTenantId(String name, UUID tenantId);

    @Query("SELECT p FROM ProductEntity p WHERE p.isDeleted = false AND p.tenant.id = :tenantId " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE :search)")
    Page<ProductEntity> findAllActive(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );
}
