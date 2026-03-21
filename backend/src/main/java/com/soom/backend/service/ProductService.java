package com.soom.backend.service;

import com.soom.backend.dto.request.ProductRequest;
import com.soom.backend.dto.request.RecipeItemRequest;
import com.soom.backend.dto.request.RecipeRequest;
import com.soom.backend.dto.response.ProductResponse;
import com.soom.backend.dto.response.RecipeItemResponse;
import com.soom.backend.dto.response.RecipeResponse;
import com.soom.backend.entity.*;
import com.soom.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.soom.backend.util.UnitConversionHelper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductRecipeRepository recipeRepository;
    private final ProductRecipeItemRepository recipeItemRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final IngredientRepository ingredientRepository;

    public List<ProductResponse> getAll() {
        return productRepository.findByIsDeletedFalse()
                .stream()
                .map(product -> {
                    Integer activeRecipeVersion = recipeRepository
                            .findByProductIdAndIsActiveTrue(product.getId())
                            .map(ProductRecipesEntity::getVersionNumber)
                            .orElse(null);

                    // Unit stok = unit produk langsung, tidak perlu query produksi
                    return toResponseProduct(product, activeRecipeVersion);
                })
                .toList();
    }

    public ProductResponse getById(UUID id) {
        ProductEntity product = findProductById(id);

        Integer activeRecipeVersion = recipeRepository
                .findByProductIdAndIsActiveTrue(product.getId())
                .map(ProductRecipesEntity::getVersionNumber)
                .orElse(null);

        return toResponseProduct(product, activeRecipeVersion);
    }

    public ProductResponse create(ProductRequest request){
        if(productRepository.existsByName(request.getName())){
            throw new RuntimeException("Nama produk sudah ada");
        }

        CategoryEntity category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        UnitsEntity units = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        ProductEntity product = new ProductEntity();
        product.setName(request.getName());
        product.setType(request.getType());
        product.setCategory(category);
        product.setUnit(units);
        // targetMargin & defaultPrice tidak di-set dari request
        // estimatedCost akan diupdate otomatis saat resep disimpan

        productRepository.save(product);
        return toResponseProduct(product);
    }

    public ProductResponse update(UUID id, ProductRequest request){
        ProductEntity product = findProductById(id);

        CategoryEntity category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        UnitsEntity units = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        product.setName(request.getName());
        product.setType(request.getType());
        product.setCategory(category);
        product.setUnit(units);
        // targetMargin & defaultPrice tidak diupdate dari request

        productRepository.save(product);
        return toResponseProduct(product);
    }

    public void delete(UUID id){
        ProductEntity product = findProductById(id);
        product.setIsDeleted(true);
        productRepository.save(product);
    }

    public RecipeResponse saveRecipe(UUID productId, RecipeRequest request) {
        ProductEntity product = findProductById(productId);

        // Nonaktifkan resep aktif sebelumnya
        recipeRepository.findByProductIdAndIsActiveTrue(productId)
                .ifPresent(activeRecipe -> {
                    activeRecipe.setActive(false);
                    recipeRepository.save(activeRecipe);
                });

        int newVersion = recipeRepository.countByProductId(productId) + 1;

        // Ambil yield unit jika ada
        UnitsEntity yieldUnit = product.getUnit();

        ProductRecipesEntity recipe = new ProductRecipesEntity();
        recipe.setProduct(product);
        recipe.setVersionNumber(newVersion);
        recipe.setActive(true);
        recipe.setNotes(request.getNotes());
        recipe.setEstimatedYield(request.getEstimatedYield());
        recipe.setYieldUnit(yieldUnit);
        recipeRepository.save(recipe);

        // Simpan items & hitung estimasi cost
        BigDecimal estimatedCost = BigDecimal.ZERO;
        List<ProductRecipeItemEntity> items = new ArrayList<>();

        for (RecipeItemRequest itemRequest : request.getItems()) {
            IngredientsEntity ingredient = ingredientRepository.findById(itemRequest.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Bahan baku tidak ditemukan"));

            UnitsEntity recipeUnit = unitRepository.findById(itemRequest.getUnitId())
                    .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

            UnitsEntity stockUnit = ingredient.getUnit();

            ProductRecipeItemEntity item = new ProductRecipeItemEntity();
            item.setRecipes(recipe);
            item.setIngredients(ingredient);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnits(recipeUnit);
            items.add(item);

            // Konversi qty resep ke unit stok untuk hitung cost
            BigDecimal qtyInStockUnit;
            if (recipeUnit.getId().equals(stockUnit.getId())) {
                qtyInStockUnit = itemRequest.getQuantity();
            } else if (UnitConversionHelper.isCompatible(recipeUnit, stockUnit)) {
                qtyInStockUnit = UnitConversionHelper.convert(
                        itemRequest.getQuantity(), recipeUnit, stockUnit
                );
            } else {
                qtyInStockUnit = itemRequest.getQuantity(); // fallback
            }

            // Cost = qty dalam unit stok x avg price per unit stok
            estimatedCost = estimatedCost.add(
                    qtyInStockUnit.multiply(ingredient.getAvgPurchasePrice())
            );
        }

        recipeItemRepository.saveAll(items);

        // Update estimatedCost di produk
        product.setEstimatedCost(estimatedCost);
        productRepository.save(product);

        return toRecipeResponse(recipe, items, estimatedCost);
    }

    public List<RecipeResponse> getRecipes(UUID productId) {
        findProductById(productId);

        return recipeRepository.findByProductIdAndIsDeletedFalse(productId)
                .stream()
                .map(recipe -> {
                    List<ProductRecipeItemEntity> items =
                            recipeItemRepository.findByRecipesIdAndIsDeletedFalse(recipe.getId());
                    BigDecimal cost = calculateCost(items);
                    return toRecipeResponse(recipe, items, cost);
                })
                .toList();
    }

    public RecipeResponse activeRecipe(UUID productId, UUID recipeId) {
        findProductById(productId);

        // Nonaktifkan resep aktif sebelumnya
        recipeRepository.findByProductIdAndIsActiveTrue(productId)
                .ifPresent(activeRecipe -> {
                    activeRecipe.setActive(false);
                    recipeRepository.save(activeRecipe);
                });

        ProductRecipesEntity recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RuntimeException("Resep tidak ditemukan"));

        recipe.setActive(true);
        recipeRepository.save(recipe);

        List<ProductRecipeItemEntity> items =
                recipeItemRepository.findByRecipesIdAndIsDeletedFalse(recipeId);
        BigDecimal cost = calculateCost(items);

        ProductEntity product = findProductById(productId);
        product.setEstimatedCost(cost);
        productRepository.save(product);

        return toRecipeResponse(recipe, items, cost);
    }


    private ProductEntity findProductById(UUID id) {
        ProductEntity product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));
        if (product.getIsDeleted()) {
            throw new RuntimeException("Produk tidak ditemukan");
        }
        return product;
    }

    private BigDecimal calculateCost(List<ProductRecipeItemEntity> items) {
        return items.stream()
                .map(item -> {
                    UnitsEntity recipeUnit = item.getUnits();
                    UnitsEntity stockUnit = item.getIngredients().getUnit();
                    BigDecimal qty = item.getQuantity();

                    BigDecimal qtyInStockUnit;
                    if (recipeUnit.getId().equals(stockUnit.getId())) {
                        qtyInStockUnit = qty;
                    } else if (UnitConversionHelper.isCompatible(recipeUnit, stockUnit)) {
                        qtyInStockUnit = UnitConversionHelper.convert(qty, recipeUnit, stockUnit);
                    } else {
                        qtyInStockUnit = qty;
                    }

                    return qtyInStockUnit.multiply(item.getIngredients().getAvgPurchasePrice());
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateCostPerUnit(BigDecimal estimatedCost, BigDecimal estimatedYield) {
        if (estimatedYield == null || estimatedYield.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return estimatedCost.divide(estimatedYield, 2, RoundingMode.HALF_UP);
    }

    private ProductResponse toResponseProduct(ProductEntity product) {
        return toResponseProduct(product, null);
    }

    private ProductResponse toResponseProduct(
            ProductEntity product,
            Integer activeRecipeVersion
    ) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .type(product.getType())
                .categoryName(product.getCategory().getName())
                .unitName(product.getUnit().getName())
                .unitSymbol(product.getUnit().getSymbol())   // ← tambah
                .stockQuantity(product.getStockQuantity())
                .estimatedCost(product.getEstimatedCost())
                .versionNumber(activeRecipeVersion)
                .stockUnitName(product.getUnit().getName())   // ← sama dengan unitName
                .stockUnitSymbol(product.getUnit().getSymbol()) // ← sama dengan unitSymbol
                .build();
    }

    private RecipeResponse toRecipeResponse(
            ProductRecipesEntity recipe,
            List<ProductRecipeItemEntity> items,
            BigDecimal estimatedCost
    ) {
        BigDecimal costPerUnit = calculateCostPerUnit(estimatedCost, recipe.getEstimatedYield());

        return RecipeResponse.builder()
                .id(recipe.getId())
                .versionNumber(recipe.getVersionNumber())
                .isActive(recipe.isActive())
                .notes(recipe.getNotes())
                .estimatedCost(estimatedCost)
                .estimatedYield(recipe.getEstimatedYield())
                .yieldUnitName(recipe.getYieldUnit() != null ? recipe.getYieldUnit().getName() : null)
                .yieldUnitSymbol(recipe.getYieldUnit() != null ? recipe.getYieldUnit().getSymbol() : null)
                .costPerUnit(costPerUnit)
                .items(items.stream()
                        .map(item -> RecipeItemResponse.builder()
                                .id(item.getId())
                                .ingredientId(item.getIngredients().getId())
                                .ingredientName(item.getIngredients().getName())
                                .unitSymbol(item.getUnits().getSymbol())
                                .unitId(item.getUnits().getId())
                                .quantity(item.getQuantity())
                                .build())
                        .toList())
                .build();
    }
}
