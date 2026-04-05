package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.request.ManualCashFlowRequest;
import com.soom.backend.dto.response.CashFlowResponse;
import com.soom.backend.dto.response.CashFlowSummaryResponse;
import com.soom.backend.dto.response.MonthlyReportResponse;
import com.soom.backend.entity.CashFlowEntity;
import com.soom.backend.entity.TenantEntity;
import com.soom.backend.enums.CashFlowType;
import com.soom.backend.repository.CashFlowRepository;
import com.soom.backend.repository.TenantRepository;
import com.soom.backend.utils.AuthUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CashFlowServiceTest {

    @Mock
    private CashFlowRepository cashFlowRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private AuthUtil authUtil;

    @InjectMocks
    private CashFlowService cashFlowService;

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

    // ── Helper ─────────────────────────────────────────────────────────────────

    private CashFlowEntity buildEntity(CashFlowType type, BigDecimal amount, LocalDate date) {
        CashFlowEntity e = new CashFlowEntity();
        e.setId(UUID.randomUUID());
        e.setType(type);
        e.setAmount(amount);
        e.setTransactionDate(date);
        e.setCategory("Test");
        e.setDescription("Desc");
        return e;
    }

    // ── getSummary ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getSummary: hitung totalIn, totalOut, balance dengan benar")
    void getSummary_returnsCorrectTotals() {
        List<CashFlowEntity> data = List.of(
                buildEntity(CashFlowType.IN,  new BigDecimal("500000"), LocalDate.now()),
                buildEntity(CashFlowType.IN,  new BigDecimal("300000"), LocalDate.now()),
                buildEntity(CashFlowType.OUT, new BigDecimal("200000"), LocalDate.now())
        );
        when(cashFlowRepository.findByTenant_IdAndIsDeletedFalseOrderByTransactionDateDesc(TENANT_ID))
                .thenReturn(data);

        CashFlowSummaryResponse result = cashFlowService.getSummary();

        assertThat(result.getTotalIn()).isEqualByComparingTo("800000");
        assertThat(result.getTotalOut()).isEqualByComparingTo("200000");
        assertThat(result.getBalance()).isEqualByComparingTo("600000");
    }

    @Test
    @DisplayName("getSummary: tidak ada data → semua nol")
    void getSummary_emptyData_returnsZeros() {
        when(cashFlowRepository.findByTenant_IdAndIsDeletedFalseOrderByTransactionDateDesc(TENANT_ID))
                .thenReturn(List.of());

        CashFlowSummaryResponse result = cashFlowService.getSummary();

        assertThat(result.getTotalIn()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTotalOut()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getSummary: balance bisa negatif jika pengeluaran lebih besar")
    void getSummary_negativeBalance() {
        List<CashFlowEntity> data = List.of(
                buildEntity(CashFlowType.IN,  new BigDecimal("100000"), LocalDate.now()),
                buildEntity(CashFlowType.OUT, new BigDecimal("400000"), LocalDate.now())
        );
        when(cashFlowRepository.findByTenant_IdAndIsDeletedFalseOrderByTransactionDateDesc(TENANT_ID))
                .thenReturn(data);

        CashFlowSummaryResponse result = cashFlowService.getSummary();

        assertThat(result.getBalance()).isEqualByComparingTo("-300000");
    }

    // ── getMonthly ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMonthly: selalu mengembalikan 12 bulan")
    void getMonthly_alwaysReturns12Months() {
        LocalDate jan = LocalDate.of(2025, 1, 15);
        LocalDate mar = LocalDate.of(2025, 3, 10);
        List<CashFlowEntity> data = List.of(
                buildEntity(CashFlowType.IN, new BigDecimal("1000000"), jan),
                buildEntity(CashFlowType.OUT, new BigDecimal("500000"), mar)
        );
        when(cashFlowRepository.findByTenant_IdAndIsDeletedFalseOrderByTransactionDateDesc(TENANT_ID))
                .thenReturn(data);

        List<MonthlyReportResponse> result = cashFlowService.getMonthly(2025);

        assertThat(result).hasSize(12);
    }

    @Test
    @DisplayName("getMonthly: hanya data tahun yang diminta yang dihitung")
    void getMonthly_filtersCorrectYear() {
        LocalDate year2025 = LocalDate.of(2025, 1, 10);
        LocalDate year2024 = LocalDate.of(2024, 1, 10);
        List<CashFlowEntity> data = List.of(
                buildEntity(CashFlowType.IN, new BigDecimal("999000"), year2025),
                buildEntity(CashFlowType.IN, new BigDecimal("111000"), year2024)  // harus diabaikan
        );
        when(cashFlowRepository.findByTenant_IdAndIsDeletedFalseOrderByTransactionDateDesc(TENANT_ID))
                .thenReturn(data);

        List<MonthlyReportResponse> result = cashFlowService.getMonthly(2025);

        // Bulan Januari 2025 harus 999000, bukan 1.110.000
        MonthlyReportResponse january = result.get(0);
        assertThat(january.getMonth()).isEqualTo(1);
        assertThat(january.getTotalIn()).isEqualByComparingTo("999000");
    }

    @Test
    @DisplayName("getMonthly: bulan tanpa transaksi totalIn & totalOut = 0")
    void getMonthly_monthWithNoData_returnsZero() {
        LocalDate jan = LocalDate.of(2025, 1, 5);
        when(cashFlowRepository.findByTenant_IdAndIsDeletedFalseOrderByTransactionDateDesc(TENANT_ID))
                .thenReturn(List.of(buildEntity(CashFlowType.IN, new BigDecimal("100000"), jan)));

        List<MonthlyReportResponse> result = cashFlowService.getMonthly(2025);

        // Bulan Februari (index 1) harus nol
        MonthlyReportResponse feb = result.get(1);
        assertThat(feb.getTotalIn()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(feb.getTotalOut()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(feb.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ── create ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create: menyimpan entity ke repository dan mengembalikan response")
    void create_savesEntityAndReturnsResponse() {
        TenantEntity tenant = new TenantEntity();
        ManualCashFlowRequest request = new ManualCashFlowRequest();
        request.setType(CashFlowType.IN);
        request.setCategory("Penjualan");
        request.setAmount(new BigDecimal("750000"));
        request.setDescription("Bayar order #001");
        request.setTransactionDate(LocalDate.now());

        when(tenantRepository.getReferenceById(TENANT_ID)).thenReturn(tenant);
        when(authUtil.getCurrentUserEmail()).thenReturn("admin@soom.com");
        when(cashFlowRepository.save(any(CashFlowEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CashFlowResponse response = cashFlowService.create(request);

        verify(cashFlowRepository, times(1)).save(any(CashFlowEntity.class));
        assertThat(response.getType()).isEqualTo(CashFlowType.IN);
        assertThat(response.getAmount()).isEqualByComparingTo("750000");
        assertThat(response.getCategory()).isEqualTo("Penjualan");
    }
}
