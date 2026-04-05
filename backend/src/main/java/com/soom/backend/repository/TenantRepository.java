package com.soom.backend.repository;

import com.soom.backend.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {
    Optional<TenantEntity> findByEmail(String email);
    boolean existsByBusinessName(String businessName);
}