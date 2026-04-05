package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.response.ChartDataResponse;
import com.soom.backend.dto.response.DashboardSummaryResponse;
import com.soom.backend.dto.response.OrderResponse;
import com.soom.backend.dto.response.StockAlertResponse;
import com.soom.backend.entity.CashFlowEntity;
import com.soom.backend.entity.IngredientsEntity;
import com.soom.backend.entity.OrderEntity;
import com.soom.backend.entity.UnitsEntity;
import com.soom.backend.enums.CashFlowType;
import com.soom.backend.enums.OrderStatus;
import com.soom.backend.enums.PaymentStatus;
import com.soom.backend.repository.CashFlowRepository;
import com.soom.backend.repository.IngredientRepository;
import com.soom.backend.repository.OrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CashFlowRepository cashFlowRepository;
    @Mock private IngredientRepository ingredientRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private MockedStatic<TenantContext> tenantContextMock;
    private static final UUID TENANT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        tenantContextMock = mockStatic(TenantContext.class);
        tenantContextMock.when(TenantContext::getTenantId).thenReturn(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        tenantContextMock.close();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private OrderEntity buildOrder(String number, BigDecimal total) {
        OrderEntity o = new OrderEntity();
        o.setOrderNumber(number);
        o.setCustomerName("Customer");
        o.setOrderDate(LocalDate.now());
        o.setStatus(OrderStatus.PENDING);
        o.setTotalAmount(total);
        o.setPaidAmount(BigDecimal.ZERO);
        o.setPaymentStatus(PaymentStatus.UNPAID);
        return o;
    }

    private CashFlowEntity buildCashFlow(CashFlowType type, BigDecimal amount) {
        CashFlowEntity e = new CashFlowEntity();
        e.setType(type);
        e.setAmount(amount);
        e.setTransactionDate(LocalDate.now());
        e.setCategory("Test");
        e.setDescription("Desc");
        return e;
    }

    private IngredientsEntity buildIngredient(String name, BigDecimal stock, BigDecimal minStock) {
        IngredientsEntity ing = new IngredientsEntity();
        ing.setName(name);
        ing.setStockQuantity(stock);
        ing.setMinimumStock(minStock);
        UnitsEntity unit = new UnitsEntity();
        unit.setSymbol("kg");
        ing.setUnit(unit);
        return ing;
    }

    // ── getSummary ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getSummary: menghitung jumlah order hari ini dengan benar")
    void getSummary_correctTotalOrdersToday() {
        List<OrderEntity> todayOrders = List.of(buildOrder("ORD-001", new BigDecimal("100000")),
                buildOrder("ORD-002", new BigDecimal("200000")));
        when(orderRepository.findByTenant_IdAndOrderDateAndIsDeletedFalse(eq(TENANT_ID), any(LocalDate.class)))
                .thenReturn(todayOrders);
        when(cashFlowRepository.findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(eq(TENANT_ID), any(), eq(CashFlowType.IN)))
                .thenReturn(List.of());
        when(cashFlowRepository.findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(eq(TENANT_ID), any(), eq(CashFlowType.OUT)))
                .thenReturn(List.of());
        when(ingredientRepository.findCriticalStockByTenantId(TENANT_ID)).thenReturn(List.of());

        DashboardSummaryResponse result = dashboardService.getSummary();

        assertThat(result.getTotalOrdersToday()).isEqualTo(2);
    }

    @Test
    @DisplayName("getSummary: menghitung income dan outcome hari ini dengan benar")
    void getSummary_correctIncomeAndOutcomeToday() {
        when(orderRepository.findByTenant_IdAndOrderDateAndIsDeletedFalse(eq(TENANT_ID), any()))
                .thenReturn(List.of());
        when(cashFlowRepository.findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(eq(TENANT_ID), any(), eq(CashFlowType.IN)))
                .thenReturn(List.of(
                        buildCashFlow(CashFlowType.IN, new BigDecimal("300000")),
                        buildCashFlow(CashFlowType.IN, new BigDecimal("150000"))
                ));
        when(cashFlowRepository.findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(eq(TENANT_ID), any(), eq(CashFlowType.OUT)))
                .thenReturn(List.of(buildCashFlow(CashFlowType.OUT, new BigDecimal("80000"))));
        when(ingredientRepository.findCriticalStockByTenantId(TENANT_ID)).thenReturn(List.of());

        DashboardSummaryResponse result = dashboardService.getSummary();

        assertThat(result.getIncomeToday()).isEqualByComparingTo("450000");
        assertThat(result.getOutcomeToday()).isEqualByComparingTo("80000");
    }

    @Test
    @DisplayName("getSummary: menghitung critical stock count dengan benar")
    void getSummary_correctCriticalStockCount() {
        when(orderRepository.findByTenant_IdAndOrderDateAndIsDeletedFalse(eq(TENANT_ID), any()))
                .thenReturn(List.of());
        when(cashFlowRepository.findByTenant_IdAndTransactionDateAndTypeAndIsDeletedFalse(any(), any(), any()))
                .thenReturn(List.of());
        when(ingredientRepository.findCriticalStockByTenantId(TENANT_ID))
                .thenReturn(List.of(
                        buildIngredient("Gula", new BigDecimal("1"), new BigDecimal("5")),
                        buildIngredient("Tepung", new BigDecimal("0"), new BigDecimal("10"))
                ));

        DashboardSummaryResponse result = dashboardService.getSummary();

        assertThat(result.getCriticalStockCount()).isEqualTo(2);
    }

    // ── getRecentOrders ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getRecentOrders: menggunakan Pageable size 10 dan mengembalikan list order")
    void getRecentOrders_usesPageableAndReturnsOrders() {
        List<OrderEntity> orders = List.of(
                buildOrder("ORD-001", new BigDecimal("500000")),
                buildOrder("ORD-002", new BigDecimal("750000"))
        );
        when(orderRepository.findRecentByTenantId(eq(TENANT_ID), any(Pageable.class)))
                .thenReturn(orders);

        List<OrderResponse> result = dashboardService.getRecentOrders();

        // Verifikasi Pageable dipanggil (bukan load semua)
        verify(orderRepository).findRecentByTenantId(eq(TENANT_ID), any(Pageable.class));
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getOrderNumber()).isEqualTo("ORD-001");
        assertThat(result.get(1).getTotalAmount()).isEqualByComparingTo("750000");
    }

    @Test
    @DisplayName("getRecentOrders: list kosong saat tidak ada order")
    void getRecentOrders_emptyWhenNoOrders() {
        when(orderRepository.findRecentByTenantId(eq(TENANT_ID), any(Pageable.class)))
                .thenReturn(List.of());

        List<OrderResponse> result = dashboardService.getRecentOrders();

        assertThat(result).isEmpty();
    }

    // ── getChartData ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getChartData: selalu mengembalikan tepat 7 hari")
    void getChartData_alwaysReturns7Days() {
        when(cashFlowRepository.findByTenantIdAndDateRange(eq(TENANT_ID), any(), any()))
                .thenReturn(List.of());

        List<ChartDataResponse> result = dashboardService.getChartData();

        assertThat(result).hasSize(7);
    }

    @Test
    @DisplayName("getChartData: menggunakan single query bukan multiple query")
    void getChartData_usesSingleQueryNotMultiple() {
        when(cashFlowRepository.findByTenantIdAndDateRange(eq(TENANT_ID), any(), any()))
                .thenReturn(List.of());

        dashboardService.getChartData();

        // Hanya boleh 1 kali panggil findByTenantIdAndDateRange, bukan 14x
        verify(cashFlowRepository, times(1)).findByTenantIdAndDateRange(any(), any(), any());
    }

    @Test
    @DisplayName("getChartData: income & outcome di-group per hari dengan benar")
    void getChartData_groupsByDateCorrectly() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<CashFlowEntity> allFlows = List.of(
                buildCashFlow(CashFlowType.IN, new BigDecimal("100000")),  // today
                buildCashFlow(CashFlowType.OUT, new BigDecimal("50000"))   // today
        );
        allFlows.get(0).setTransactionDate(today);
        allFlows.get(1).setTransactionDate(today);

        when(cashFlowRepository.findByTenantIdAndDateRange(eq(TENANT_ID), any(), any()))
                .thenReturn(allFlows);

        List<ChartDataResponse> result = dashboardService.getChartData();

        // Hari terakhir (index 6) = today
        ChartDataResponse todayData = result.get(6);
        assertThat(todayData.getIncome()).isEqualByComparingTo("100000");
        assertThat(todayData.getOutcome()).isEqualByComparingTo("50000");
    }

    @Test
    @DisplayName("getChartData: hari tanpa transaksi income & outcome = 0")
    void getChartData_dayWithNoTransactions_returnsZero() {
        when(cashFlowRepository.findByTenantIdAndDateRange(eq(TENANT_ID), any(), any()))
                .thenReturn(List.of());

        List<ChartDataResponse> result = dashboardService.getChartData();

        result.forEach(day -> {
            assertThat(day.getIncome()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(day.getOutcome()).isEqualByComparingTo(BigDecimal.ZERO);
        });
    }

    @Test
    @DisplayName("getChartData: urutan tanggal dari yang paling lama ke hari ini")
    void getChartData_datesInAscendingOrder() {
        when(cashFlowRepository.findByTenantIdAndDateRange(eq(TENANT_ID), any(), any()))
                .thenReturn(List.of());

        List<ChartDataResponse> result = dashboardService.getChartData();

        // Index 0 = 6 hari yang lalu, index 6 = hari ini
        String firstDate = result.get(0).getDate();
        String lastDate = result.get(6).getDate();
        assertThat(firstDate).isLessThan(lastDate);
        assertThat(lastDate).isEqualTo(LocalDate.now().toString());
    }

    // ── getStockAlerts ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getStockAlerts: mengembalikan semua bahan baku kritis")
    void getStockAlerts_returnsCriticalIngredients() {
        List<IngredientsEntity> criticalList = List.of(
                buildIngredient("Gula", new BigDecimal("2"), new BigDecimal("10")),
                buildIngredient("Mentega", new BigDecimal("0"), new BigDecimal("5"))
        );
        when(ingredientRepository.findCriticalStockByTenantId(TENANT_ID)).thenReturn(criticalList);

        List<StockAlertResponse> result = dashboardService.getStockAlerts();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Gula");
        assertThat(result.get(0).getStockQuantity()).isEqualByComparingTo("2");
        assertThat(result.get(0).getMinimumStock()).isEqualByComparingTo("10");
    }

    @Test
    @DisplayName("getStockAlerts: list kosong saat tidak ada stok kritis")
    void getStockAlerts_emptyWhenNoCriticalStock() {
        when(ingredientRepository.findCriticalStockByTenantId(TENANT_ID)).thenReturn(List.of());

        List<StockAlertResponse> result = dashboardService.getStockAlerts();

        assertThat(result).isEmpty();
    }
}
