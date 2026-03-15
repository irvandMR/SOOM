package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ChartDataResponse {
    private String date;
    private BigDecimal income;
    private BigDecimal outcome;
}
