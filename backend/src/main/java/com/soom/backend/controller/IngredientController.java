package com.soom.backend.controller;

import com.soom.backend.dto.request.IngredientRequest;
import com.soom.backend.dto.request.StockInRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.IngredientHistoryResponse;
import com.soom.backend.dto.response.IngredientResponse;
import com.soom.backend.service.IngredientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ingredients")
@RequiredArgsConstructor
public class IngredientController {
    private final IngredientService ingredientService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<IngredientResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.<List<IngredientResponse>>builder()
                .success(true)
                .message("OK")
                .data(ingredientService.getAll())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<IngredientResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<IngredientResponse>builder()
                .success(true)
                .message("OK")
                .data(ingredientService.getById(id))
                .build());
    }

    @PostMapping
    public ResponseEntity<BaseResponse<IngredientResponse>> create(
            @Valid @RequestBody IngredientRequest request) {
        return ResponseEntity.ok(BaseResponse.<IngredientResponse>builder()
                .success(true)
                .message("Bahan baku berhasil dibuat")
                .data(ingredientService.create(request))
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<IngredientResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody IngredientRequest request) {
        return ResponseEntity.ok(BaseResponse.<IngredientResponse>builder()
                .success(true)
                .message("Bahan baku berhasil diupdate")
                .data(ingredientService.update(id, request))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable UUID id) {
        ingredientService.delete(id);
        return ResponseEntity.ok(BaseResponse.<Void>builder()
                .success(true)
                .message("Bahan baku berhasil dihapus")
                .data(null)
                .build());
    }

    @PostMapping("/{id}/stock-in")
    public ResponseEntity<BaseResponse<IngredientResponse>> stockIn(
            @PathVariable UUID id,
            @Valid @RequestBody StockInRequest request) {
        return ResponseEntity.ok(BaseResponse.<IngredientResponse>builder()
                .success(true)
                .message("Stok berhasil ditambahkan")
                .data(ingredientService.stockIn(id, request))
                .build());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<BaseResponse<List<IngredientHistoryResponse>>> getHistory(
            @PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<List<IngredientHistoryResponse>>builder()
                .success(true)
                .message("OK")
                .data(ingredientService.getHistory(id))
                .build());
    }
}
