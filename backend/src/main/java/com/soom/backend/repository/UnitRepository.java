package com.soom.backend.repository;

import com.soom.backend.entity.UnitsEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<UnitsEntity, UUID> {

    @Query("SELECT u FROM UnitsEntity u WHERE (:search IS NULL OR LOWER(u.name) LIKE :search OR LOWER(u.symbol) LIKE :search)")
    Page<UnitsEntity> findAllActive(@Param("search") String search, Pageable pageable);

    boolean existsByName(String name);
}
