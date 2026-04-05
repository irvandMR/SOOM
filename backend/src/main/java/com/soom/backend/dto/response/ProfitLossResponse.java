package com.soom.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitLossResponse {
    private BigDecimal revenue;
    private BigDecimal cogs;
    private BigDecimal grossProfit;
    private BigDecimal grossMargin;   // Percentage
    private BigDecimal operationalExpenses;
    private BigDecimal netProfit;
    private BigDecimal netMargin;     // Percentage
}
