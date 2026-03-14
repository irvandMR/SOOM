package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemRequest {
    @NotNull(message = "Produk tidak boleh kosong")
    private UUID productId;

    @NotNull(message = "Jumlah tidak boleh kosong")
    private BigDecimal quantity;

    private String notes;
}
