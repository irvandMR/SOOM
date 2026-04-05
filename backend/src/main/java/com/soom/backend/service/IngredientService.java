package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.request.IngredientRequest;
import com.soom.backend.dto.request.StockInRequest;
import com.soom.backend.dto.request.UpdateIngredientRequest;
import com.soom.backend.dto.response.IngredientResponse;
import com.soom.backend.dto.response.IngredientHistoryResponse;
import com.soom.backend.dto.response.PageResponse;
import com.soom.backend.entity.*;
import com.soom.backend.enums.CashFlowType;
import com.soom.backend.enums.StockHistoryType;
import com.soom.backend.repository.*;
import com.soom.backend.utils.AuthUtil;
import com.soom.backend.utils.UnitConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final TenantRepository tenantRepository;
    private final AuthUtil authUtil;
    private final IngredientStockHistoryRepository ingredientHistoryRepository;
    private final CashFlowRepository cashFlowRepository;

    // ================= GET =================

    public PageResponse<IngredientResponse> getAll(Pageable pageable, String search) {
        UUID tenantId = TenantContext.getTenantId();
        String searchParam = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        Page<IngredientsEntity> page = ingredientRepository.findAllActive(tenantId, searchParam, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    public IngredientResponse getById(UUID id) {
        return toResponse(findById(id));
    }

    // ================= CREATE =================

    public IngredientResponse create(IngredientRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        IngredientsEntity existing = ingredientRepository
                .findFirstByNameAndTenantIdOrderByIdDesc(request.getName(), tenantId);

        if (existing != null && !existing.getIsDeleted()) {
            throw new RuntimeException("Nama bahan baku sudah ada");
        }

        CategoryEntity category = categoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        UnitsEntity unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        IngredientsEntity ingredient = new IngredientsEntity();
        ingredient.setName(request.getName());
        ingredient.setCategory(category);
        ingredient.setUnit(unit);
        ingredient.setMinimumStock(request.getMinimumStock());
        ingredient.setStockQuantity(BigDecimal.ZERO);
        ingredient.setPurchasePrice(BigDecimal.ZERO);
        ingredient.setAvgPurchasePrice(BigDecimal.ZERO);
        ingredient.setTenant(tenantRepository.getReferenceById(tenantId));
        ingredient.setCreatedBy(authUtil.getCurrentUserEmail());

        ingredientRepository.save(ingredient);

        return toResponse(ingredient);
    }

    // ================= UPDATE =================

    public IngredientResponse update(UUID id, UpdateIngredientRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        IngredientsEntity ingredient = findById(id);

        CategoryEntity category = categoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        UnitsEntity newUnit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        UnitsEntity oldUnit = ingredient.getUnit();

        if (!oldUnit.getId().equals(newUnit.getId())) {
            if (!UnitConverter.canConvert(oldUnit.getSymbol(), newUnit.getSymbol())) {
                throw new RuntimeException("Unit tidak bisa dikonversi");
            }

            BigDecimal ratio = UnitConverter.getRatio(oldUnit.getSymbol(), newUnit.getSymbol());
            ingredient.setStockQuantity(ingredient.getStockQuantity().multiply(ratio));
            ingredient.setMinimumStock(ingredient.getMinimumStock().multiply(ratio));
        }

        ingredient.setName(request.getName());
        ingredient.setCategory(category);
        ingredient.setUnit(newUnit);
        ingredient.setMinimumStock(request.getMinimumStock());

        if (request.getPurchasePrice() != null) {
            ingredient.setPurchasePrice(request.getPurchasePrice());
        }

        ingredient.setUpdatedBy(authUtil.getCurrentUserEmail());
        ingredient.setUpdatedAt(LocalDateTime.now());

        ingredientRepository.save(ingredient);

        return toResponse(ingredient);
    }

    // ================= DELETE =================

    public void delete(UUID id) {
        IngredientsEntity ingredient = findById(id);
        ingredient.setIsDeleted(true);
        ingredient.setUpdatedBy(authUtil.getCurrentUserEmail());
        ingredientRepository.save(ingredient);
    }

    // ================= STOCK IN =================

    public IngredientResponse stockIn(UUID id, StockInRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        IngredientsEntity ingredient = findById(id);

        // 🔹 HISTORY
        IngredientStockHistoryEntity history = new IngredientStockHistoryEntity();
        history.setIngredients(ingredient);
        history.setType(StockHistoryType.IN);
        history.setQuantity(request.getQuantity());
        history.setPurchasePrice(request.getPurchasePrice());
        history.setNotes(request.getNotes());

        ingredientHistoryRepository.save(history);

        // 🔹 CASHFLOW
        CashFlowEntity cashFlow = new CashFlowEntity();
        cashFlow.setType(CashFlowType.OUT);
        cashFlow.setCategory("Pembelian Bahan");
        cashFlow.setAmount(request.getPurchasePrice().multiply(request.getQuantity()));
        cashFlow.setDescription("Pembelian " + ingredient.getName());
        cashFlow.setTransactionDate(LocalDate.now());
        cashFlow.setReferenceType("INGREDIENT");
        cashFlow.setReferenceId(ingredient.getId());
        cashFlow.setTenant(tenantRepository.getReferenceById(tenantId));

        cashFlowRepository.save(cashFlow);

        // 🔹 STOCK UPDATE
        BigDecimal oldStock = ingredient.getStockQuantity();
        BigDecimal newStock = oldStock.add(request.getQuantity());

        // 🔹 AVG PRICE
        BigDecimal newAvgPrice;
        if (oldStock.compareTo(BigDecimal.ZERO) == 0) {
            newAvgPrice = request.getPurchasePrice();
        } else {
            BigDecimal oldTotal = oldStock.multiply(ingredient.getAvgPurchasePrice());
            BigDecimal newTotal = request.getQuantity().multiply(request.getPurchasePrice());
            newAvgPrice = oldTotal.add(newTotal).divide(newStock, 6, RoundingMode.HALF_UP);
        }

        ingredient.setStockQuantity(newStock);
        ingredient.setAvgPurchasePrice(newAvgPrice);
        ingredient.setPurchasePrice(request.getPurchasePrice());

        ingredientRepository.save(ingredient);

        return toResponse(ingredient);
    }

    // ================= HISTORY =================

    public List<IngredientHistoryResponse> getHistory(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        findById(id);

        return ingredientHistoryRepository
                .findByIngredientsIdAndIsDeletedFalse(id)
                .stream()
                .map(h -> IngredientHistoryResponse.builder()
                        .id(h.getId())
                        .type(h.getType().name())
                        .quantity(h.getQuantity())
                        .purchasePrice(h.getPurchasePrice())
                        .notes(h.getNotes())
                        .referenceType(h.getReferenceType())
                        .referenceId(h.getReferenceId())
                        .createdAt(h.getCreatedAt())
                        .build())
                .toList();
    }

    // ================= HELPER =================

    private IngredientsEntity findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        IngredientsEntity ingredient = ingredientRepository.findByIdAndTenantId(id, tenantId)
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
                .purchasePrice(ingredient.getPurchasePrice())
                .categoryId(ingredient.getCategory().getId())
                .unitId(ingredient.getUnit().getId())
                .build();
    }
}