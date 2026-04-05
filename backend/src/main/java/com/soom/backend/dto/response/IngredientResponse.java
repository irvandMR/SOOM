package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class IngredientResponse {
    private UUID id;
    private String name;
    private String categoryName;
    private UUID categoryId;
    private String unitName;
    private String unitSymbol;
    private UUID unitId;
    private BigDecimal stockQuantity;
    private BigDecimal minimumStock;
    private BigDecimal avgPurchasePrice;
    private BigDecimal purchasePrice;
}
