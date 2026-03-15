package com.soom.backend.service;

import com.soom.backend.dto.request.ManualCashFlowRequest;
import com.soom.backend.dto.response.CashFlowResponse;
import com.soom.backend.dto.response.CashFlowSummaryResponse;
import com.soom.backend.dto.response.MonthlyReportResponse;
import com.soom.backend.entity.CashFlowEntity;
import com.soom.backend.enums.CashFlowType;
import com.soom.backend.repository.CashFlowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CashFlowService {

    private final CashFlowRepository cashFlowRepository;

    public List<CashFlowResponse> getAll(){
        return cashFlowRepository.findByIsDeletedFalseOrderByTransactionDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CashFlowResponse create(ManualCashFlowRequest request){
        CashFlowEntity cashFlow = new CashFlowEntity();
        cashFlow.setType(request.getType());
        cashFlow.setCategory(request.getCategory());
        cashFlow.setAmount(request.getAmount());
        cashFlow.setDescription(request.getDescription());
        cashFlow.setTransactionDate(request.getTransactionDate());

        cashFlowRepository.save(cashFlow);
        return toResponse(cashFlow);
    }

    //summary
    public CashFlowSummaryResponse getSummary() {
        List<CashFlowEntity> all = cashFlowRepository.findByIsDeletedFalseOrderByTransactionDateDesc();

        BigDecimal totalIn = all.stream().filter(c -> c.getType() == CashFlowType.IN)
                .map(CashFlowEntity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOut = all.stream().filter(c -> c.getType() == CashFlowType.OUT)
                .map(CashFlowEntity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);;

        return CashFlowSummaryResponse.builder()
                .totalIn(totalIn)
                .totalOut(totalOut)
                .balance(totalIn.subtract(totalOut))
                .build();
    }

    // ── MONTHLY REPORT ─────────────────────────────────
    public List<MonthlyReportResponse> getMonthly(Integer year) {
        List<CashFlowEntity> all = cashFlowRepository
                .findByIsDeletedFalseOrderByTransactionDateDesc();

        // Filter by year
        List<CashFlowEntity> filtered = all.stream()
                .filter(cf -> cf.getTransactionDate().getYear() == year)
                .toList();

        // Group by month
        List<MonthlyReportResponse> result = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            final int m = month;
            List<CashFlowEntity> monthData = filtered.stream()
                    .filter(cf -> cf.getTransactionDate().getMonthValue() == m)
                    .toList();

            BigDecimal totalIn = monthData.stream()
                    .filter(cf -> cf.getType() == CashFlowType.IN)
                    .map(CashFlowEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalOut = monthData.stream()
                    .filter(cf -> cf.getType() == CashFlowType.OUT)
                    .map(CashFlowEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(MonthlyReportResponse.builder()
                    .month(month)
                    .year(year)
                    .totalIn(totalIn)
                    .totalOut(totalOut)
                    .balance(totalIn.subtract(totalOut))
                    .build());
        }
        return result;
    }

    // ── YEARLY REPORT ──────────────────────────────────
    public List<MonthlyReportResponse> getYearly() {
        List<CashFlowEntity> all = cashFlowRepository
                .findByIsDeletedFalseOrderByTransactionDateDesc();

        // Ambil semua tahun yang ada
        List<Integer> years = all.stream()
                .map(cf -> cf.getTransactionDate().getYear())
                .distinct()
                .sorted()
                .toList();

        List<MonthlyReportResponse> result = new ArrayList<>();
        for (Integer year : years) {
            List<CashFlowEntity> yearData = all.stream()
                    .filter(cf -> cf.getTransactionDate().getYear() == year)
                    .toList();

            BigDecimal totalIn = yearData.stream()
                    .filter(cf -> cf.getType() == CashFlowType.IN)
                    .map(CashFlowEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalOut = yearData.stream()
                    .filter(cf -> cf.getType() == CashFlowType.OUT)
                    .map(CashFlowEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(MonthlyReportResponse.builder()
                    .month(null)
                    .year(year)
                    .totalIn(totalIn)
                    .totalOut(totalOut)
                    .balance(totalIn.subtract(totalOut))
                    .build());
        }
        return result;
    }


    private CashFlowResponse toResponse(CashFlowEntity cashFlow){
        return CashFlowResponse.builder()
                .id(cashFlow.getId())
                .type(cashFlow.getType())
                .category(cashFlow.getCategory())
                .amount(cashFlow.getAmount())
                .description(cashFlow.getDescription())
                .referenceType(cashFlow.getReferenceType())
                .referenceId(cashFlow.getReferenceId())
                .transactionDate(cashFlow.getTransactionDate())
                .build();
    }

}
