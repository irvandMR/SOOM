package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class StockAlertResponse {
    private UUID id;
    private String name;
    private BigDecimal stockQuantity;
    private BigDecimal minimumStock;
    private String unitSymbol;
}
