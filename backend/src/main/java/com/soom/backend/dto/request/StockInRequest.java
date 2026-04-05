package com.soom.backend.dto.request;

import com.soom.backend.enums.StockHistoryType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockInRequest {

    @NotNull(message = "Jumlah tidak boleh kosong")
    private BigDecimal quantity;

    private StockHistoryType type = StockHistoryType.IN;

    private BigDecimal purchasePrice = BigDecimal.ZERO;
    private String notes;
}
