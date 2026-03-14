package com.soom.backend.controller;

import com.soom.backend.dto.request.ProductRequest;
import com.soom.backend.dto.request.RecipeRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.ProductResponse;
import com.soom.backend.dto.response.RecipeResponse;
import com.soom.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<ProductResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.<List<ProductResponse>>builder()
                .success(true)
                .message("OK")
                .data(productService.getAll())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<ProductResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<ProductResponse>builder()
                .success(true)
                .message("OK")
                .data(productService.getById(id))
                .build());
    }

    @PostMapping
    public ResponseEntity<BaseResponse<ProductResponse>> create(
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(BaseResponse.<ProductResponse>builder()
                .success(true)
                .message("Produk berhasil dibuat")
                .data(productService.create(request))
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<ProductResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(BaseResponse.<ProductResponse>builder()
                .success(true)
                .message("Produk berhasil diupdate")
                .data(productService.update(id, request))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.ok(BaseResponse.<Void>builder()
                .success(true)
                .message("Produk berhasil dihapus")
                .data(null)
                .build());
    }

    @PostMapping("/{id}/recipes")
    public ResponseEntity<BaseResponse<RecipeResponse>> saveRecipe(
            @PathVariable UUID id,
            @Valid @RequestBody RecipeRequest request) {
        return ResponseEntity.ok(BaseResponse.<RecipeResponse>builder()
                .success(true)
                .message("Resep berhasil disimpan")
                .data(productService.saveRecipe(id, request))
                .build());
    }

    @GetMapping("/{id}/recipes")
    public ResponseEntity<BaseResponse<List<RecipeResponse>>> getRecipes(
            @PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<List<RecipeResponse>>builder()
                .success(true)
                .message("OK")
                .data(productService.getRecipes(id))
                .build());
    }

    @PutMapping("/{id}/recipes/{recipeId}/activate")
    public ResponseEntity<BaseResponse<RecipeResponse>> activateRecipe(
            @PathVariable UUID id,
            @PathVariable UUID recipeId) {
        return ResponseEntity.ok(BaseResponse.<RecipeResponse>builder()
                .success(true)
                .message("Resep berhasil diaktifkan")
                .data(productService.activeRecipe(id, recipeId))
                .build());
    }
}
