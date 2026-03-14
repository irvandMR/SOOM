package com.soom.backend.controller;

import com.soom.backend.dto.request.AddPaymentRequest;
import com.soom.backend.dto.request.CreateOrderRequest;
import com.soom.backend.dto.request.UpdateOrderStatusRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.OrderDetailResponse;
import com.soom.backend.dto.response.OrderResponse;
import com.soom.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<OrderResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.<List<OrderResponse>>builder()
                .success(true)
                .message("OK")
                .data(orderService.getAll())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<OrderDetailResponse>> getById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<OrderDetailResponse>builder()
                .success(true)
                .message("OK")
                .data(orderService.getById(id))
                .build());
    }

    @PostMapping
    public ResponseEntity<BaseResponse<OrderDetailResponse>> create(
            @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(BaseResponse.<OrderDetailResponse>builder()
                .success(true)
                .message("Order berhasil dibuat")
                .data(orderService.create(request))
                .build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BaseResponse<OrderResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(BaseResponse.<OrderResponse>builder()
                .success(true)
                .message("Status order berhasil diupdate")
                .data(orderService.updateStatus(id, request))
                .build());
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<BaseResponse<OrderDetailResponse>> addPayment(
            @PathVariable UUID id,
            @Valid @RequestBody AddPaymentRequest request) {
        return ResponseEntity.ok(BaseResponse.<OrderDetailResponse>builder()
                .success(true)
                .message("Pembayaran berhasil ditambahkan")
                .data(orderService.addPayment(id, request))
                .build());
    }
}
