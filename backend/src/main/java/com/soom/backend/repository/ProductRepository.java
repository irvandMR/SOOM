package com.soom.backend.repository;

import com.soom.backend.entity.ProductEntity;
import com.soom.backend.entity.ProductionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {
    boolean existsByName(String name);
    List<ProductEntity> findByIsDeletedFalse();
}
