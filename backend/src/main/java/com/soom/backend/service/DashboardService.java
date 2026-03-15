package com.soom.backend.service;

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
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final CashFlowRepository cashFlowRepository;
    private final IngredientRepository ingredientRepository;

    public DashboardSummaryResponse getSummary(){
        LocalDate today = LocalDate.now();

        // Total order Hari ini
        List<OrderEntity> todayOrder = orderRepository.findByOrderDateAndIsDeletedFalse(today);

        // Pemasukan Hari ini
        BigDecimal incomeToday = cashFlowRepository.findByTransactionDateAndType(today, CashFlowType.IN)
                .stream()
                .map(CashFlowEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Pengeluaran Hari ini
        BigDecimal outcomeToday = cashFlowRepository.findByTransactionDateAndType(today, CashFlowType.OUT)
                .stream()
                .map(CashFlowEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Stock kritis
        int criticalCount = ingredientRepository.findCriticalStock().size();

        return DashboardSummaryResponse.builder()
                .totalOrdersToday(todayOrder.size())
                .incomeToday(incomeToday)
                .outcomeToday(outcomeToday)
                .criticalStockCount(criticalCount)
                .build();
    }

    public List<OrderResponse> getRecentOrders() {
        return orderRepository
                .findByIsDeletedFalseOrderByOrderDateDesc()
                .stream()
                .limit(10)
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
        return ingredientRepository.findCriticalStock()
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
        List<ChartDataResponse> result = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);

            BigDecimal income = cashFlowRepository
                    .findByTransactionDateAndType(date, CashFlowType.IN)
                    .stream()
                    .map(CashFlowEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal outcome = cashFlowRepository
                    .findByTransactionDateAndType(date, CashFlowType.OUT)
                    .stream()
                    .map(CashFlowEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(ChartDataResponse.builder()
                    .date(date.toString())
                    .income(income)
                    .outcome(outcome)
                    .build());
        }
        return result;
    }
}
