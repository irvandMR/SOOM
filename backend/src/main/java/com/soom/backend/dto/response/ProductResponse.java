package com.soom.backend.dto.response;

import com.soom.backend.enums.ProductType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID id;
    private String name;
    private ProductType type;
    private String categoryName;
    private String unitName;           // unit dasar produk (pcs)
    private BigDecimal stockQuantity;
    private BigDecimal estimatedCost;
    private Integer versionNumber;
    private String stockUnitName;      // ← tambah — unit stok (toples)
    private String stockUnitSymbol;
    private String unitSymbol;
}
