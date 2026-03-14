package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class RecipeItemResponse {
    private UUID id;
    private UUID ingredientId;
    private String ingredientName;
    private String unitSymbol;
    private BigDecimal quantity;
}
