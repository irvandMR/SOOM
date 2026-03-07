package com.soom.backend.repository;

import com.soom.backend.entity.UnitsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<UnitsEntity, UUID> {

    boolean existsByName(String name);
}
