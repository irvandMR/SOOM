package com.soom.backend.repository;

import com.soom.backend.entity.IngredientsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IngredientRepository extends JpaRepository<IngredientsEntity, UUID> {

    boolean existsByName(String name);

    List<IngredientsEntity> findByIsDeletedFalse();
}
