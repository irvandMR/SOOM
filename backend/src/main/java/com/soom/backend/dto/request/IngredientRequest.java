package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class IngredientRequest {
    @NotNull(message = "Kategori tidak boleh kosong")
    private UUID categoryId;

    @NotNull(message = "Unit tidak boleh kosong")
    private UUID unitId;

    @NotBlank(message = "Nama tidak boleh kosong")
    private String name;

    private BigDecimal minimumStock = BigDecimal.ZERO;
}
