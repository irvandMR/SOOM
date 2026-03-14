package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateProductionRequest {

    @NotNull(message = "Produk tidak boleh kosong")
    private UUID productId;

    @NotNull(message = "Resep tidak boleh kosong")
    private UUID recipeId;

    @NotNull(message = "Jumlah produksi tidak boleh kosong")
    private BigDecimal quantityProduced;

    @NotNull(message = "Tanggal produksi tidak boleh kosong")
    private LocalDate productionDate;

    private String notes;
}
