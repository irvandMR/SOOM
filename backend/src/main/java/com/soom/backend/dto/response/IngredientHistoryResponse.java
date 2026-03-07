package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class IngredientHistoryResponse {
    private UUID id;
    private String type;
    private BigDecimal quantity;
    private BigDecimal purchasePrice;
    private String notes;
    private String referenceType;
    private UUID referenceId;
    private LocalDateTime createdAt;
}
