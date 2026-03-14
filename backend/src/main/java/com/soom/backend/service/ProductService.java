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

import java.math.BigDecimal;
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

    public List<ProductResponse> getAll(){
        return productRepository.findByIsDeletedFalse()
                .stream()
                .map(this::toResponseProduct)
                .toList();
    }

    public ProductResponse getById(UUID id){
        return toResponseProduct(findProductById(id));
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
        product.setDefaultPrice(request.getDefaultPrice());
        product.setTargetMargin(request.getTargetMargin());

        productRepository.save(product);
        return toResponseProduct(product);
    }

    public ProductResponse update(UUID id, ProductRequest request){
        ProductEntity product = findProductById(id);

        CategoryEntity category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategory tidak ditemukan"));

        UnitsEntity units = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        product.setName(request.getName());
        product.setType(request.getType());
        product.setCategory(category);
        product.setUnit(units);
        product.setDefaultPrice(request.getDefaultPrice());
        product.setTargetMargin(request.getTargetMargin());

        productRepository.save(product);
        return toResponseProduct(product);
    }

    public void delete(UUID id){
        ProductEntity product = findProductById(id);
        product.setIsDeleted(true);
        productRepository.save(product);
    }

    public RecipeResponse saveRecipe(UUID productId, RecipeRequest request){
        ProductEntity product = findProductById(productId);

        // Nonaktifkan resep aktif sebelumnya
        recipeRepository.findByProductIdAndIsActiveTrue(productId)
                .ifPresent(activeRecipe -> {
                    activeRecipe.setActive(false);
                    recipeRepository.save(activeRecipe);
                });

        // Hitung versi baru
        int newVersion = recipeRepository.countByProductId(productId) + 1;

        // Buat resep baru
        ProductRecipesEntity recipe = new ProductRecipesEntity();
        recipe.setProduct(product);
        recipe.setVersionNumber(newVersion);
        recipe.setActive(true);
        recipe.setNotes(request.getNotes());
        recipeRepository.save(recipe);

        // Simpan items & hitung estimasi cost
        BigDecimal estimatedCost = BigDecimal.ZERO;
        List<ProductRecipeItemEntity> items = new ArrayList<>();

        for(RecipeItemRequest itemRequest : request.getItems()){
            IngredientsEntity ingredients = ingredientRepository.findById(itemRequest.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Bahan baku tidak ditemukan"));

            ProductRecipeItemEntity item = new ProductRecipeItemEntity();
            item.setRecipes(recipe);
            item.setIngredients(ingredients);
            item.setQuantity(item.getQuantity());
            items.add(item);

            // Hitung cost: quantity x avg_purchase_price
            estimatedCost = estimatedCost.add(itemRequest.getQuantity().multiply(ingredients.getAvgPurchasePrice()));
        }

        recipeItemRepository.saveAll(items);

        product.setEstimatedCost(estimatedCost);
        productRepository.save(product);

        return toRecipeResponse(recipe, items, estimatedCost);
    }

    public List<RecipeResponse> getRecipes(UUID productId){
        findProductById(productId);

        return recipeRepository.findByProductIdAndIsDeletedFalse(productId)
                .stream()
                .map(recipe -> {

                    List<ProductRecipeItemEntity> items = recipeItemRepository.findByRecipeIdAndIsDeletedFalse(recipe.getId());

                    BigDecimal cost = calculateCost(items);
                    return toRecipeResponse(recipe, items, cost);
                }).toList();
    }

    public RecipeResponse activeRecipe(UUID productId, UUID recipeId){
        findProductById(productId); // validasi produk ada

        // Nonaktifkan resep aktif sebelumnya
        recipeRepository.findByProductIdAndIsActiveTrue(productId)
                .ifPresent(activeRecipe -> {
                    activeRecipe.setActive(false);
                    recipeRepository.save(activeRecipe);
                });

        // Aktifkan resep yang dipilih
        ProductRecipesEntity recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RuntimeException("Resep tidak ditemukan"));

        recipe.setActive(true);
        recipeRepository.save(recipe);

        List<ProductRecipeItemEntity> items = recipeItemRepository.findByRecipeIdAndIsDeletedFalse(recipeId);
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
                .map(item -> item.getQuantity()
                        .multiply(item.getIngredients().getAvgPurchasePrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private ProductResponse toResponseProduct(ProductEntity product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .type(product.getType())
                .categoryName(product.getCategory().getName())
                .unitName(product.getUnit().getName())
                .defaultPrice(product.getDefaultPrice())
                .stockQuantity(product.getStockQuantity())
                .estimatedCost(product.getEstimatedCost())
                .targetMargin(product.getTargetMargin())
                .build();
    }

    private RecipeResponse toRecipeResponse(ProductRecipesEntity recipe,List<ProductRecipeItemEntity> items,BigDecimal estimatedCost) {
        return RecipeResponse.builder()
                .id(recipe.getId())
                .versionNumber(recipe.getVersionNumber())
                .isActive(recipe.isActive())
                .notes(recipe.getNotes())
                .estimatedCost(estimatedCost)
                .items(items.stream()
                        .map(item -> RecipeItemResponse.builder()
                                .id(item.getId())
                                .ingredientId(item.getIngredients().getId())
                                .ingredientName(item.getIngredients().getName())
                                .unitSymbol(item.getIngredients().getUnit().getSymbol())
                                .quantity(item.getQuantity())
                                .build())
                        .toList())
                .build();
    }
}
