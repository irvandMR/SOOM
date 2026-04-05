package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.response.ChartDataResponse;
import com.soom.backend.dto.response.DashboardSummaryResponse;
import com.soom.backend.dto.response.OrderResponse;
import com.soom.backend.dto.response.StockAlertResponse;
import com.soom.backend.entity.CashFlowEntity;
import com.soom.backend.entity.OrderEntity;
import com.soom.backend.enums.CashFlowType;
import com.soom.backend.repository.CashFlowRepository;
import com.soom.backend.repository.IngredientRepository;
import com.soom.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final CashFlowRepository cashFlowRepository;
    private final IngredientRepository ingredientRepository;

    public DashboardSummaryResponse getSummary(){
        UUID tenantId = TenantContext.getTenantId();
        LocalDate today = LocalDate.now();

        // Total order Hari ini
        List<OrderEntity> todayOrder = orderRepository.findByTenant_IdAndOrderDateAndIsDeletedFalse(tenantId,today);

        // Pemasukan Hari ini
        BigDecimal incomeToday = cashFlowRepository.findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(tenantId,today, CashFlowType.IN)
                .stream()
                .map(CashFlowEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Pengeluaran Hari ini
        BigDecimal outcomeToday = cashFlowRepository.findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(tenantId,today, CashFlowType.OUT)
                .stream()
                .map(CashFlowEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Stock kritis
        int criticalCount = ingredientRepository.findCriticalStockByTenantId(TenantContext.getTenantId()).size();

        return DashboardSummaryResponse.builder()
                .totalOrdersToday(todayOrder.size())
                .incomeToday(incomeToday)
                .outcomeToday(outcomeToday)
                .criticalStockCount(criticalCount)
                .build();
    }

    public List<OrderResponse> getRecentOrders() {
        return orderRepository
                .findRecentByTenantId(
                        TenantContext.getTenantId(),
                        PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "orderDate"))
                )
                .stream()
                .map(order -> OrderResponse.builder()
                        .id(order.getId())
                        .orderNumber(order.getOrderNumber())
                        .customerName(order.getCustomerName())
                        .orderDate(order.getOrderDate())
                        .status(order.getStatus())
                        .totalAmount(order.getTotalAmount())
                        .paidAmount(order.getPaidAmount())
                        .paymentStatus(order.getPaymentStatus())
                        .build())
                .toList();
    }
    public List<StockAlertResponse> getStockAlerts() {
        return ingredientRepository.findCriticalStockByTenantId(TenantContext.getTenantId())
                .stream()
                .map(ingredient -> StockAlertResponse.builder()
                        .id(ingredient.getId())
                        .name(ingredient.getName())
                        .stockQuantity(ingredient.getStockQuantity())
                        .minimumStock(ingredient.getMinimumStock())
                        .unitSymbol(ingredient.getUnit().getSymbol())
                        .build())
                .toList();
    }

    public List<ChartDataResponse> getChartData() {
        UUID tenantId = TenantContext.getTenantId();
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);

        // Single query — ambil semua cashflow 7 hari terakhir sekaligus
        var allCashFlows = cashFlowRepository
                .findByTenantIdAndDateRange(tenantId, startDate, endDate);

        // Group by date & type di memory (jauh lebih efisien dari 14 query)
        Map<LocalDate, Map<CashFlowType, BigDecimal>> grouped = allCashFlows.stream()
                .collect(Collectors.groupingBy(
                        cf -> cf.getTransactionDate(),
                        Collectors.groupingBy(
                                CashFlowEntity::getType,
                                Collectors.reducing(BigDecimal.ZERO, CashFlowEntity::getAmount, BigDecimal::add)
                        )
                ));

        List<ChartDataResponse> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = endDate.minusDays(i);
            Map<CashFlowType, BigDecimal> dayData = grouped.getOrDefault(date, Map.of());
            result.add(ChartDataResponse.builder()
                    .date(date.toString())
                    .income(dayData.getOrDefault(CashFlowType.IN, BigDecimal.ZERO))
                    .outcome(dayData.getOrDefault(CashFlowType.OUT, BigDecimal.ZERO))
                    .build());
        }
        return result;
    }
}
