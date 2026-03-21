package com.soom.backend.dto.response;

import com.soom.backend.enums.ProductionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProductionResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID recipeId;
    private Integer recipeVersion;

    // Batch info
    private BigDecimal quantityProduced;
    private String unitName;               // unit output produksi (toples)
    private String unitSymbol;             // simbol unit output (toples)

    // Yield info
    private BigDecimal estimatedYield;
    private BigDecimal actualYield;
    private BigDecimal availableQty;
    private String yieldUnitName;          // ← tambah — unit yield resep (pcs)
    private String yieldUnitSymbol;        // ← tambah — simbol yield resep (pcs)

    // Kalkulasi
    private BigDecimal estimatedCostPerUnit;
    private BigDecimal totalEstimatedCost;
    private BigDecimal recommendedPrice;
    private BigDecimal recommendedPricePerUnit;

    private LocalDate productionDate;
    private ProductionStatus status;
    private String notes;
    private LocalDateTime expiredDate;
}
