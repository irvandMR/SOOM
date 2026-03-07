package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockInRequest {

    @NotNull(message = "Jumlah tidak boleh kosong")
    private BigDecimal quantity;

    private BigDecimal purchasePrice = BigDecimal.ZERO;
    private String notes;
}
