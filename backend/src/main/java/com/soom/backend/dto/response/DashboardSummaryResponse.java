package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardSummaryResponse {
    private Integer totalOrdersToday;
    private BigDecimal incomeToday;
    private BigDecimal outcomeToday;
    private Integer criticalStockCount;
}
