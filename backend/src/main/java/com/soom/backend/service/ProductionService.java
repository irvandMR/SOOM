package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.request.CreateProductionRequest;
import com.soom.backend.dto.response.ProductionDetailResponse;
import com.soom.backend.dto.response.ProductionResponse;
import com.soom.backend.dto.response.PageResponse;
import com.soom.backend.entity.*;
import com.soom.backend.enums.ProductionStatus;
import com.soom.backend.enums.ProductType;
import com.soom.backend.enums.StockHistoryType;
import com.soom.backend.exception.InsufficientStockException;
import com.soom.backend.exception.ResourceNotFoundException;
import com.soom.backend.repository.*;
import com.soom.backend.util.UnitConversionHelper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionService {

    private final ProductionRepository productionRepository;
    private final ProductRepository productRepository;
    private final ProductRecipeRepository recipeRepository;
    private final ProductRecipeItemRepository recipeItemRepository;
    private final IngredientRepository ingredientRepository;
    private final IngredientStockHistoryRepository stockHistoryRepository;
    private final CashFlowRepository cashFlowRepository;
    private final TenantRepository tenantRepository;

    public PageResponse<ProductionResponse> getAll(Pageable pageable, String search) {
        String searchParam = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        Page<ProductionEntity> page = productionRepository.findAllActive(TenantContext.getTenantId(), searchParam, pageable);
        return PageResponse.of(page.map(p -> {
            try {
                return toResponse(p);
            } catch (Exception e) {
                return null;
            }
        }));
    }

    public ProductionResponse getById(UUID id) {
        return toResponse(findById(id));
    }

    public List<ProductionResponse> getAvailable(UUID productId) {
        return productionRepository
                .findByTenantIdAndProduct_IdAndAvailableQtyGreaterThanAndIsDeletedFalse(TenantContext.getTenantId(),productId, BigDecimal.ZERO)
                .stream().map(this::toResponse).toList();
    }

    public ProductionDetailResponse getDetail(UUID id) {
        ProductionEntity production = findById(id);
        List<ProductRecipeItemEntity> recipeItems =
                recipeItemRepository.findByRecipesIdAndTenantIdAndIsDeletedFalse(production.getRecipes().getId(), TenantContext.getTenantId());

        BigDecimal quantityProduced = production.getQuantityProduced();
        String productUnitSymbol = production.getProduct().getUnit().getSymbol();

        BigDecimal estimatedYield = production.getRecipes().getEstimatedYield();
        BigDecimal batch = BigDecimal.ONE;
        if (estimatedYield != null && estimatedYield.compareTo(BigDecimal.ZERO) > 0) {
            batch = quantityProduced.divide(estimatedYield, 4, RoundingMode.HALF_UP);
        }

        final BigDecimal finalBatch = batch;

        List<ProductionDetailResponse.ProductionIngredientDetail> ingredientDetails = recipeItems.stream()
                .map(item -> {
                    UnitsEntity recipeUnit = item.getUnits();
                    UnitsEntity stockUnit = item.getIngredients().getUnit();
                    BigDecimal qtyPerBatch = item.getQuantity();
                    BigDecimal totalQtyInRecipeUnit = qtyPerBatch.multiply(finalBatch);

                    BigDecimal qtyInStockUnit;
                    if (recipeUnit.getId().equals(stockUnit.getId())) {
                        qtyInStockUnit = totalQtyInRecipeUnit;
                    } else if (UnitConversionHelper.isCompatible(recipeUnit, stockUnit)) {
                        qtyInStockUnit = UnitConversionHelper.convert(totalQtyInRecipeUnit, recipeUnit, stockUnit);
                    } else {
                        qtyInStockUnit = totalQtyInRecipeUnit;
                    }

                    BigDecimal avgPrice = item.getIngredients().getAvgPurchasePrice();
                    BigDecimal totalCost = qtyInStockUnit.multiply(avgPrice);

                    return ProductionDetailResponse.ProductionIngredientDetail.builder()
                            .ingredientName(item.getIngredients().getName())
                            .unitSymbol(recipeUnit.getSymbol())
                            .qtyPerUnit(qtyPerBatch)
                            .totalQtyUsed(totalQtyInRecipeUnit)
                            .avgPurchasePrice(avgPrice)
                            .totalCost(totalCost)
                            .build();
                })
                .toList();

        BigDecimal totalEstimatedCost = ingredientDetails.stream()
                .map(ProductionDetailResponse.ProductionIngredientDetail::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal actualOrEstimated = production.getActualYield() != null
                ? production.getActualYield() : quantityProduced;

        BigDecimal costPerUnit = BigDecimal.ZERO;
        if (actualOrEstimated.compareTo(BigDecimal.ZERO) > 0) {
            costPerUnit = totalEstimatedCost.divide(actualOrEstimated, 2, RoundingMode.HALF_UP);
        }

        BigDecimal recommendedPrice = costPerUnit.compareTo(BigDecimal.ZERO) > 0
                ? costPerUnit.divide(BigDecimal.valueOf(0.70), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ProductionDetailResponse.builder()
                .id(production.getId())
                .productName(production.getProduct().getName())
                .recipeVersion(production.getRecipes().getVersionNumber())
                .quantityProduced(quantityProduced)
                .unitSymbol(productUnitSymbol)
                .unitName(production.getProduct().getUnit().getName())
                .estimatedYield(quantityProduced)
                .actualYield(production.getActualYield())
                .availableQty(production.getAvailableQty())
                .productionDate(production.getProductionDate())
                .expiredDate(production.getExpiredDate())
                .status(production.getStatus().name())
                .notes(production.getNotes())
                .estimatedCostPerUnit(costPerUnit)
                .totalEstimatedCost(totalEstimatedCost)
                .recommendedPrice(recommendedPrice)
                .ingredients(ingredientDetails)
                .build();
    }

    @Transactional
    public ProductionResponse create(CreateProductionRequest request) {
        ProductEntity product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Produk tidak ditemukan"));

        ProductRecipesEntity recipes = recipeRepository.findById(request.getRecipeId())
                .orElseThrow(() -> new ResourceNotFoundException("Resep tidak ditemukan"));

        List<ProductRecipeItemEntity> recipeItems =
                recipeItemRepository.findByRecipesIdAndTenantIdAndIsDeletedFalse(recipes.getId(), TenantContext.getTenantId());

        // Hitung batch
        BigDecimal estimatedYield = recipes.getEstimatedYield();
        BigDecimal batch = BigDecimal.ONE;
        if (estimatedYield != null && estimatedYield.compareTo(BigDecimal.ZERO) > 0) {
            batch = request.getQuantityProduced().divide(estimatedYield, 4, RoundingMode.HALF_UP);
        }

        // ─── LOOP 1: Cek semua stok dulu, kumpulkan yang kurang ───
        List<String> insufficientItems = new ArrayList<>();

        for (ProductRecipeItemEntity recipeItem : recipeItems) {
            IngredientsEntity ingredient = recipeItem.getIngredients();
            UnitsEntity recipeUnit = recipeItem.getUnits();
            UnitsEntity stockUnit = ingredient.getUnit();

            BigDecimal qtyInRecipeUnit = recipeItem.getQuantity().multiply(batch);

            BigDecimal qtyInStockUnit;
            if (recipeUnit.getId().equals(stockUnit.getId())) {
                qtyInStockUnit = qtyInRecipeUnit;
            } else if (UnitConversionHelper.isCompatible(recipeUnit, stockUnit)) {
                qtyInStockUnit = UnitConversionHelper.convert(qtyInRecipeUnit, recipeUnit, stockUnit);
            } else {
                throw new RuntimeException(
                        "Unit tidak compatible: " + recipeUnit.getSymbol() +
                                " → " + stockUnit.getSymbol() +
                                " untuk bahan: " + ingredient.getName()
                );
            }

            if (ingredient.getStockQuantity().compareTo(qtyInStockUnit) < 0) {
                insufficientItems.add(
                        "• " + ingredient.getName() +
                                ": butuh " + formatQty(qtyInRecipeUnit) + " " + recipeUnit.getSymbol() +
                                ", tersedia " + formatQty(ingredient.getStockQuantity()) + " " + stockUnit.getSymbol()
                );
            }
        }

        // Throw sekali dengan semua bahan yang kurang
        if (!insufficientItems.isEmpty()) {
            throw new InsufficientStockException(
                    "Stok bahan baku tidak cukup:\n" + String.join("\n", insufficientItems)
            );
        }

        // ─── LOOP 2: Kurangi stok setelah semua cek lolos ───
        for (ProductRecipeItemEntity recipeItem : recipeItems) {
            IngredientsEntity ingredient = recipeItem.getIngredients();
            UnitsEntity recipeUnit = recipeItem.getUnits();
            UnitsEntity stockUnit = ingredient.getUnit();

            BigDecimal qtyInRecipeUnit = recipeItem.getQuantity().multiply(batch);

            BigDecimal qtyInStockUnit;
            if (recipeUnit.getId().equals(stockUnit.getId())) {
                qtyInStockUnit = qtyInRecipeUnit;
            } else if (UnitConversionHelper.isCompatible(recipeUnit, stockUnit)) {
                qtyInStockUnit = UnitConversionHelper.convert(qtyInRecipeUnit, recipeUnit, stockUnit);
            } else {
                qtyInStockUnit = qtyInRecipeUnit;
            }

            ingredient.setStockQuantity(ingredient.getStockQuantity().subtract(qtyInStockUnit));
            ingredientRepository.save(ingredient);
            ingredientRepository.flush(); // Ensure stock deduction is flushed

            IngredientStockHistoryEntity stockHistory = new IngredientStockHistoryEntity();
            stockHistory.setIngredients(ingredient);
            stockHistory.setType(StockHistoryType.OUT);
            stockHistory.setQuantity(qtyInStockUnit);
            stockHistory.setNotes("Produksi: " + product.getName() +
                    " (" + formatQty(qtyInRecipeUnit) + " " + recipeUnit.getSymbol() + ")");
            stockHistory.setReferenceType("PRODUCTION");
            stockHistoryRepository.save(stockHistory);
        }

        // Actual yield — fallback ke quantityProduced
        BigDecimal actualYield = request.getActualYield();

        // ── Snapshot HPP saat produksi (harga bahan saat ini, tidak akan berubah) ──
        BigDecimal totalActualCost = computeTotalCost(recipeItems, batch);
        BigDecimal actualOrProduced = (actualYield != null && actualYield.compareTo(BigDecimal.ZERO) > 0)
                ? actualYield : request.getQuantityProduced();
        BigDecimal actualCostPerUnit = BigDecimal.ZERO;
        if (actualOrProduced.compareTo(BigDecimal.ZERO) > 0) {
            actualCostPerUnit = totalActualCost.divide(actualOrProduced, 2, RoundingMode.HALF_UP);
        }

        UUID tenantId = TenantContext.getTenantId();

        ProductionEntity production = new ProductionEntity();
        production.setProduct(product);
        production.setRecipes(recipes);
        production.setQuantityProduced(request.getQuantityProduced());
        production.setActualYield(actualYield);
        production.setAvailableQty(actualYield != null ? actualYield : request.getQuantityProduced());
        production.setProductionDate(request.getProductionDate());
        production.setStatus(ProductionStatus.SUCCESS);
        production.setNotes(request.getNotes());
        production.setExpiredDate(request.getExpiredDate());
        production.setTenant(tenantRepository.getReferenceById(tenantId));
        // Simpan snapshot HPP
        production.setActualCostPerUnit(actualCostPerUnit);
        production.setTotalActualCost(totalActualCost);
        productionRepository.save(production);

        // Update stock product for all produced types
        BigDecimal addQty = actualYield != null ? actualYield : request.getQuantityProduced();
        product.setStockQuantity(product.getStockQuantity().add(addQty));
        productRepository.save(product);
        productRepository.flush(); // Ensure product stock increase is flushed

        // ─── PENCATATAN CASH FLOW (Biaya Produksi) ───
        if (totalActualCost.compareTo(BigDecimal.ZERO) > 0) {
            CashFlowEntity cashFlow = new CashFlowEntity();
            cashFlow.setTenant(tenantRepository.getReferenceById(tenantId));
            cashFlow.setType(com.soom.backend.enums.CashFlowType.OUT);
            cashFlow.setCategory("Biaya Produksi");
            cashFlow.setAmount(totalActualCost);
            cashFlow.setDescription("Biaya Produksi: " + product.getName() + " (" + 
                (actualYield != null ? actualYield : request.getQuantityProduced()) + " " + product.getUnit().getSymbol() + ")");
            cashFlow.setTransactionDate(request.getProductionDate());
            cashFlow.setReferenceType("PRODUCTION");
            cashFlow.setReferenceId(production.getId());
            cashFlowRepository.save(cashFlow);
        }

        return toResponse(production);
    }

    // ─── HELPER: hitung total cost dari recipe items × batch ───
    private BigDecimal computeTotalCost(List<ProductRecipeItemEntity> items, BigDecimal batch) {
        return items.stream()
                .map(item -> {
                    UnitsEntity recipeUnit = item.getUnits();
                    UnitsEntity stockUnit = item.getIngredients().getUnit();
                    BigDecimal qtyInRecipeUnit = item.getQuantity().multiply(batch);
                    BigDecimal qtyInStockUnit;
                    if (recipeUnit.getId().equals(stockUnit.getId())) {
                        qtyInStockUnit = qtyInRecipeUnit;
                    } else if (UnitConversionHelper.isCompatible(recipeUnit, stockUnit)) {
                        qtyInStockUnit = UnitConversionHelper.convert(qtyInRecipeUnit, recipeUnit, stockUnit);
                    } else {
                        qtyInStockUnit = qtyInRecipeUnit;
                    }
                    return qtyInStockUnit.multiply(item.getIngredients().getAvgPurchasePrice());
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String formatQty(BigDecimal qty) {
        return qty.stripTrailingZeros().toPlainString();
    }

    private ProductionEntity findById(UUID id) {
        ProductionEntity production = productionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produksi tidak ditemukan"));
        if (production.getIsDeleted()) {
            throw new ResourceNotFoundException("Produksi tidak ditemukan");
        }
        return production;
    }

    private ProductionResponse toResponse(ProductionEntity production) {
        // ── Pakai snapshot HPP dari DB (tidak hitung ulang) ──
        BigDecimal actualCostPerUnit = production.getActualCostPerUnit();
        BigDecimal totalActualCost   = production.getTotalActualCost();

        // Harga rekomendasi = HPP per unit / 0.70 (margin 30%)
        BigDecimal recommendedPrice = actualCostPerUnit.compareTo(BigDecimal.ZERO) > 0
                ? actualCostPerUnit.divide(BigDecimal.valueOf(0.70), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        String productUnitSymbol = production.getProduct().getUnit().getSymbol();
        String productUnitName   = production.getProduct().getUnit().getName();

        return ProductionResponse.builder()
                .id(production.getId())
                .productId(production.getProduct().getId())
                .productName(production.getProduct().getName())
                .recipeId(production.getRecipes().getId())
                .recipeVersion(production.getRecipes().getVersionNumber())
                .quantityProduced(production.getQuantityProduced())
                .unitName(productUnitName)
                .unitSymbol(productUnitSymbol)
                .estimatedYield(production.getQuantityProduced())
                .actualYield(production.getActualYield())
                .availableQty(production.getAvailableQty())
                .estimatedCostPerUnit(actualCostPerUnit)
                .totalEstimatedCost(totalActualCost)
                .recommendedPrice(recommendedPrice)
                .recommendedPricePerUnit(BigDecimal.ZERO)
                .productionDate(production.getProductionDate())
                .status(production.getStatus())
                .notes(production.getNotes())
                .expiredDate(production.getExpiredDate())
                .build();
    }
}