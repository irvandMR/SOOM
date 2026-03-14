package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID id;
    private String name;
    private String type;
    private String categoryName;
    private String unitName;
    private BigDecimal defaultPrice;
    private BigDecimal stockQuantity;
    private BigDecimal estimatedCost;
    private BigDecimal targetMargin;
}
