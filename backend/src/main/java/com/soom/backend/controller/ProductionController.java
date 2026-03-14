package com.soom.backend.controller;

import com.soom.backend.dto.request.CreateProductionRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.ProductionResponse;
import com.soom.backend.service.ProductionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/productions")
@RequiredArgsConstructor
public class ProductionController {

    private final ProductionService productionService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<ProductionResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.<List<ProductionResponse>>builder()
                .success(true)
                .message("OK")
                .data(productionService.getAll())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<ProductionResponse>> getById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<ProductionResponse>builder()
                .success(true)
                .message("OK")
                .data(productionService.getById(id))
                .build());
    }

    @PostMapping
    public ResponseEntity<BaseResponse<ProductionResponse>> create(
            @Valid @RequestBody CreateProductionRequest request) {
        return ResponseEntity.ok(BaseResponse.<ProductionResponse>builder()
                .success(true)
                .message("Produksi berhasil dicatat")
                .data(productionService.create(request))
                .build());
    }
}
