package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.response.ProfitLossResponse;
import com.soom.backend.entity.CashFlowEntity;
import com.soom.backend.enums.CashFlowType;
import com.soom.backend.repository.CashFlowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfitLossService {

    private final CashFlowRepository cashFlowRepository;

    public ProfitLossResponse getProfitLoss(int year, int month) {
        UUID tenantId = TenantContext.getTenantId();
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        List<CashFlowEntity> flows = cashFlowRepository.findByTenantIdAndDateRange(tenantId, start, end);

        BigDecimal revenue = flows.stream()
                .filter(cf -> cf.getType() == CashFlowType.IN)
                .map(CashFlowEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cogs = flows.stream()
                .filter(cf -> cf.getType() == CashFlowType.OUT && "HPP".equalsIgnoreCase(cf.getCategory()))
                .map(CashFlowEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal opex = flows.stream()
                .filter(cf -> cf.getType() == CashFlowType.OUT && !"HPP".equalsIgnoreCase(cf.getCategory()))
                .map(CashFlowEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = revenue.subtract(cogs);
        BigDecimal netProfit = grossProfit.subtract(opex);

        BigDecimal grossMargin = BigDecimal.ZERO;
        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            grossMargin = grossProfit.multiply(BigDecimal.valueOf(100))
                    .divide(revenue, 2, RoundingMode.HALF_UP);
        }

        BigDecimal netMargin = BigDecimal.ZERO;
        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            netMargin = netProfit.multiply(BigDecimal.valueOf(100))
                    .divide(revenue, 2, RoundingMode.HALF_UP);
        }

        return ProfitLossResponse.builder()
                .revenue(revenue)
                .cogs(cogs)
                .grossProfit(grossProfit)
                .grossMargin(grossMargin)
                .operationalExpenses(opex)
                .netProfit(netProfit)
                .netMargin(netMargin)
                .build();
    }
}
