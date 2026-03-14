package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RecipeResponse {
    private UUID id;
    private Integer versionNumber;
    private Boolean isActive;
    private String notes;
    private List<RecipeItemResponse> items;
    private BigDecimal estimatedCost;
}
