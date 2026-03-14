package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CashFlowSummaryResponse {
    private BigDecimal totalIn;
    private BigDecimal totalOut;
    private BigDecimal balance;
}
