package com.soom.backend.controller;

import com.soom.backend.dto.request.ManualCashFlowRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.CashFlowResponse;
import com.soom.backend.dto.response.CashFlowSummaryResponse;
import com.soom.backend.dto.response.MonthlyReportResponse;
import com.soom.backend.service.CashFlowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cash-flows")
@RequiredArgsConstructor
public class CashFlowController {

    private final CashFlowService cashFlowService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<CashFlowResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.<List<CashFlowResponse>>builder()
                .success(true)
                .message("OK")
                .data(cashFlowService.getAll())
                .build());
    }

    @PostMapping
    public ResponseEntity<BaseResponse<CashFlowResponse>> create(
            @Valid @RequestBody ManualCashFlowRequest request) {
        return ResponseEntity.ok(BaseResponse.<CashFlowResponse>builder()
                .success(true)
                .message("Transaksi berhasil dicatat")
                .data(cashFlowService.create(request))
                .build());
    }

    @GetMapping("/summary")
    public ResponseEntity<BaseResponse<CashFlowSummaryResponse>> getSummary() {
        return ResponseEntity.ok(BaseResponse.<CashFlowSummaryResponse>builder()
                .success(true)
                .message("OK")
                .data(cashFlowService.getSummary())
                .build());
    }

    @GetMapping("/monthly")
    public ResponseEntity<BaseResponse<List<MonthlyReportResponse>>> getMonthly(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}")
            Integer year) {
        return ResponseEntity.ok(BaseResponse.<List<MonthlyReportResponse>>builder()
                .success(true)
                .message("OK")
                .data(cashFlowService.getMonthly(year))
                .build());
    }

    @GetMapping("/yearly")
    public ResponseEntity<BaseResponse<List<MonthlyReportResponse>>> getYearly() {
        return ResponseEntity.ok(BaseResponse.<List<MonthlyReportResponse>>builder()
                .success(true)
                .message("OK")
                .data(cashFlowService.getYearly())
                .build());
    }
}
