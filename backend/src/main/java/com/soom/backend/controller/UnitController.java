package com.soom.backend.controller;

import com.soom.backend.dto.request.UnitRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.UnitResponse;
import com.soom.backend.service.UnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/units")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<UnitResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.<List<UnitResponse>>builder()
                .success(true)
                .message("OK")
                .data(unitService.getAll())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<UnitResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<UnitResponse>builder()
                .success(true)
                .message("OK")
                .data(unitService.getById(id))
                .build());
    }

    @PostMapping
    public ResponseEntity<BaseResponse<UnitResponse>> create(
            @Valid @RequestBody UnitRequest request) {
        return ResponseEntity.ok(BaseResponse.<UnitResponse>builder()
                .success(true)
                .message("Unit berhasil dibuat")
                .data(unitService.create(request))
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<UnitResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UnitRequest request) {
        return ResponseEntity.ok(BaseResponse.<UnitResponse>builder()
                .success(true)
                .message("Unit berhasil diupdate")
                .data(unitService.update(id, request))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable UUID id) {
        unitService.delete(id);
        return ResponseEntity.ok(BaseResponse.<Void>builder()
                .success(true)
                .message("Unit berhasil dihapus")
                .data(null)
                .build());
    }
}
