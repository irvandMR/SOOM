package com.soom.backend.service;

import com.soom.backend.dto.request.IngredientRequest;
import com.soom.backend.dto.response.IngredientResponse;
import com.soom.backend.entity.CategoryEntity;
import com.soom.backend.entity.IngredientsEntity;
import com.soom.backend.entity.UnitsEntity;
import com.soom.backend.repository.CategoryRepository;
import com.soom.backend.repository.IngredientRepository;
import com.soom.backend.repository.UnitRepository;
import com.soom.backend.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final AuthUtil authUtil;

    public List<IngredientResponse> getAll() {
        return ingredientRepository.findByIsDeletedFalse()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public IngredientResponse getById(UUID id) {
        IngredientsEntity ingredient = findById(id);
        return toResponse(ingredient);
    }

    public IngredientResponse create(IngredientRequest request) {
        if (ingredientRepository.existsByName(request.getName())) {
            throw new RuntimeException("Nama bahan baku sudah ada");
        }

        CategoryEntity category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        UnitsEntity unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        IngredientsEntity ingredient = new IngredientsEntity();
        ingredient.setName(request.getName());
        ingredient.setCategory(category);
        ingredient.setUnit(unit);
        ingredient.setMinimumStock(request.getMinimumStock());
        ingredient.setCreatedBy(authUtil.getCurrentUserEmail());

        ingredientRepository.save(ingredient);

        return toResponse(ingredient);
    }

    public IngredientResponse update(UUID id, IngredientRequest request) {
        IngredientsEntity ingredient = findById(id);

        CategoryEntity category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        UnitsEntity unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        ingredient.setName(request.getName());
        ingredient.setCategory(category);
        ingredient.setUnit(unit);
        ingredient.setMinimumStock(request.getMinimumStock());
        ingredient.setUpdatedBy(authUtil.getCurrentUserEmail());

        ingredientRepository.save(ingredient);

        return toResponse(ingredient);
    }

    public void delete(UUID id) {
        IngredientsEntity ingredient = findById(id);
        ingredient.setIsDeleted(true);
        ingredientRepository.save(ingredient);
    }

    // ── HELPER ─────────────────────────────────────────

    private IngredientsEntity findById(UUID id) {
        IngredientsEntity ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bahan baku tidak ditemukan"));

        if (ingredient.getIsDeleted()) {
            throw new RuntimeException("Bahan baku tidak ditemukan");
        }
        return ingredient;
    }

    private IngredientResponse toResponse(IngredientsEntity ingredient) {
        return IngredientResponse.builder()
                .id(ingredient.getId())
                .name(ingredient.getName())
                .categoryName(ingredient.getCategory().getName())
                .unitName(ingredient.getUnit().getName())
                .unitSymbol(ingredient.getUnit().getSymbol())
                .stockQuantity(ingredient.getStockQuantity())
                .minimumStock(ingredient.getMinimumStock())
                .avgPurchasePrice(ingredient.getAvgPurchasePrice())
                .build();
    }
}
