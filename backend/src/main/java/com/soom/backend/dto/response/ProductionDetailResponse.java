package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProductionDetailResponse {
    private UUID id;
    private String productName;
    private Integer recipeVersion;
    private BigDecimal quantityProduced;
    private String unitName;             // ← tambah
    private String unitSymbol;           // ← tambah
    private BigDecimal estimatedYield;   // ← tambah
    private BigDecimal actualYield;      // ← tambah
    private BigDecimal availableQty;     // ← tambah
    private LocalDate productionDate;
    private LocalDateTime expiredDate;
    private String status;
    private String notes;
    private BigDecimal estimatedCostPerUnit;
    private BigDecimal totalEstimatedCost;
    private BigDecimal recommendedPrice;  // ← tambah
    private String yieldUnitSymbol;   // unit yield resep (pcs)
    private List<ProductionIngredientDetail> ingredients;

    @Data
    @Builder
    public static class ProductionIngredientDetail {
        private String ingredientName;
        private String unitSymbol;
        private BigDecimal qtyPerUnit;
        private BigDecimal totalQtyUsed;
        private BigDecimal avgPurchasePrice;
        private BigDecimal totalCost;

    }
}