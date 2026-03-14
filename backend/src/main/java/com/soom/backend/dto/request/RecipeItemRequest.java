package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class RecipeItemRequest {

    @NotNull(message = "Bahan baku tidak boleh kosong")
    private UUID ingredientId;

    @NotNull(message = "Jumlah tidak boleh kosong")
    private BigDecimal quantity;
}
