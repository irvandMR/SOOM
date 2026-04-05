package com.soom.backend.controller;

import com.soom.backend.dto.response.*;
import com.soom.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<BaseResponse<DashboardSummaryResponse>> getSummary() {
        return ResponseEntity.ok(BaseResponse.<DashboardSummaryResponse>builder()
                .success(true)
                .message("OK")
                .data(dashboardService.getSummary())
                .build());
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<BaseResponse<List<OrderResponse>>> getRecentOrders() {
        return ResponseEntity.ok(BaseResponse.<List<OrderResponse>>builder()
                .success(true)
                .message("OK")
                .data(dashboardService.getRecentOrders())
                .build());
    }

    @GetMapping("/stock-alerts")
    public ResponseEntity<BaseResponse<List<StockAlertResponse>>> getStockAlerts() {
        return ResponseEntity.ok(BaseResponse.<List<StockAlertResponse>>builder()
                .success(true)
                .message("OK")
                .data(dashboardService.getStockAlerts())
                .build());
    }

    @GetMapping("/chart")
    public ResponseEntity<BaseResponse<List<ChartDataResponse>>> getChartData() {
        return ResponseEntity.ok(BaseResponse.<List<ChartDataResponse>>builder()
                .success(true)
                .message("OK")
                .data(dashboardService.getChartData())
                .build());
    }
}
