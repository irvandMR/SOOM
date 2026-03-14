package com.soom.backend.service;

import com.soom.backend.dto.request.CreateProductionRequest;
import com.soom.backend.dto.response.ProductResponse;
import com.soom.backend.dto.response.ProductionResponse;
import com.soom.backend.entity.*;
import com.soom.backend.enums.ProductionStatus;
import com.soom.backend.enums.StockHistoryType;
import com.soom.backend.exception.InsufficientStockException;
import com.soom.backend.exception.ResourceNotFoundException;
import com.soom.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

    public List<ProductionResponse> getAll(){
        return productionRepository.findByIsDeletedFalseOrderByProductionDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductionResponse getById(UUID id){
        return toResponse(findById(id));
    }

    @Transactional
    public ProductionResponse create(CreateProductionRequest request){
        ProductEntity product = productRepository.findById(request.getProductId())
                .orElseThrow(()-> new ResourceNotFoundException("Produck tidak ditemukan"));

        ProductRecipesEntity recipes= recipeRepository.findById(request.getRecipeId())
                .orElseThrow(() -> new ResourceNotFoundException("Resep tidak ditemukan"));

        // Ambil semua resep
        List<ProductRecipeItemEntity> recipeItems = recipeItemRepository.findByRecipesIdAndIsDeletedFalse(recipes.getId());

        // Cek & kurangi stock bahan baku
        for(ProductRecipeItemEntity recipeItem : recipeItems){
            IngredientsEntity ingredient = recipeItem.getIngredients();

            // Jumlah yang dibutuhkan = quantity resep x quantity produksi
            BigDecimal needed = recipeItem.getQuantity().multiply(request.getQuantityProduced());

            if(ingredient.getStockQuantity().compareTo(needed) < 0){
                throw new InsufficientStockException("Stock " + ingredient.getName() + " tidak cukup. " + "Dibutuhkan: " + needed + ", tersedia: " + ingredient.getStockQuantity());
            }

            // Kurangi stock
            ingredient.setStockQuantity(ingredient.getStockQuantity().subtract(needed));
            ingredientRepository.save(ingredient);

            //Catat history stock keluar
            IngredientStockHistoryEntity stockHistory = new IngredientStockHistoryEntity();
            stockHistory.setIngredients(ingredient);
            stockHistory.setType(StockHistoryType.OUT);
            stockHistory.setQuantity(needed);
            stockHistory.setNotes("Produksi: " +  product.getName());
            stockHistory.setReferenceType("PRODUCTION");
            stockHistoryRepository.save(stockHistory);
        }

        //Simpan produksi
        ProductionEntity production = new ProductionEntity();
        production.setProduct(product);
        production.setRecipes(recipes);
        production.setQuantityProduced(request.getQuantityProduced());
        production.setProductionDate(request.getProductionDate());
        production.setStatus(ProductionStatus.SUCCESS);
        production.setNotes(request.getNotes());
        productionRepository.save(production);

        //Update stok product
        product.setStockQuantity(product.getStockQuantity().add(request.getQuantityProduced()));
        productRepository.save(product);

        return toResponse(production);
    }


    private ProductionEntity findById(UUID id){
        ProductionEntity production = productionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produksi tidak ditemukan"));
        if(production.getIsDeleted()){
            throw new ResourceNotFoundException("Produksi tidak ditemukan");
        }
        return production;
    }
    private ProductionResponse toResponse(ProductionEntity production){
        return ProductionResponse.builder()
                .id(production.getId())
                .productId(production.getProduct().getId())
                .productName(production.getProduct().getName())
                .recipeId(production.getRecipes().getId())
                .recipeVersion(production.getRecipes().getVersionNumber())
                .quantityProduced(production.getQuantityProduced())
                .productionDate(production.getProductionDate())
                .status(production.getStatus())
                .notes(production.getNotes())
                .build();
    }
}
