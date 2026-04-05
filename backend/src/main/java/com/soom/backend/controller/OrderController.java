package com.soom.backend.controller;

import com.soom.backend.dto.request.AddPaymentRequest;
import com.soom.backend.dto.request.CreateOrderRequest;
import com.soom.backend.dto.request.UpdateOrderStatusRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.OrderDetailResponse;
import com.soom.backend.dto.response.OrderResponse;
import com.soom.backend.dto.response.PageResponse;
import com.soom.backend.service.InvoiceService;
import com.soom.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<BaseResponse<PageResponse<OrderResponse>>> getAll(
            @PageableDefault(size = 10, sort = "orderDate", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus) {
        return ResponseEntity.ok(BaseResponse.<PageResponse<OrderResponse>>builder()
                .success(true)
                .message("OK")
                .data(orderService.getAll(pageable, search, status, paymentStatus))
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

    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> getInvoice(@PathVariable UUID id) {

        byte[] pdf = invoiceService.generateInvoicePdf(id);

        String fileName = invoiceService.generateFileName(id);

        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
