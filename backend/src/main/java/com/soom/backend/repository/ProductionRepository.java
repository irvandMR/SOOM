package com.soom.backend.repository;

import com.soom.backend.entity.ProductionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductionRepository extends JpaRepository<ProductionEntity, UUID> {
    List<ProductionEntity> findByIsDeletedFalseOrderByProductionDateDesc();
}
