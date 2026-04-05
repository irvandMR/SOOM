package com.soom.backend.repository;

import com.soom.backend.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    
    @Query("SELECT u FROM UserEntity u WHERE u.tenant.id = :tenantId " +
            "AND (:search IS NULL OR LOWER(u.name) LIKE :search OR LOWER(u.email) LIKE :search)")
    Page<UserEntity> findAllActive(@Param("tenantId") UUID tenantId, @Param("search") String search, Pageable pageable);

    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByName(String name);
}
