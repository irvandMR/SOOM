package com.soom.backend.controller;

import com.soom.backend.dto.request.CategoryRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.CategoryResponse;
import com.soom.backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<CategoryResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.<List<CategoryResponse>>builder()
                .success(true)
                .message("OK")
                .data(categoryService.getAll())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<CategoryResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<CategoryResponse>builder()
                .success(true)
                .message("OK")
                .data(categoryService.getById(id))
                .build());
    }

    @PostMapping
    public ResponseEntity<BaseResponse<CategoryResponse>> create(
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(BaseResponse.<CategoryResponse>builder()
                .success(true)
                .message("Kategori berhasil dibuat")
                .data(categoryService.create(request))
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<CategoryResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(BaseResponse.<CategoryResponse>builder()
                .success(true)
                .message("Kategori berhasil diupdate")
                .data(categoryService.update(id, request))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable UUID id) {
        categoryService.delete(id);
        return ResponseEntity.ok(BaseResponse.<Void>builder()
                .success(true)
                .message("Kategori berhasil dihapus")
                .data(null)
                .build());
    }
}
