package com.soom.backend.dto.response;

import com.soom.backend.enums.ProductionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class ProductionResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID recipeId;
    private Integer recipeVersion;
    private BigDecimal quantityProduced;
    private LocalDate productionDate;
    private ProductionStatus status;
    private String notes;
}
