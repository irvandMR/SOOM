package com.soom.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateIngredientRequest {

    @NotNull(message = "Nama bahan baku wajib diisi")
    private String name;

    @NotNull(message = "Kategori wajib dipilih")
    private UUID categoryId;

    @NotNull(message = "Unit wajib dipilih")
    private UUID unitId;

    @NotNull(message = "Minimum stok wajib diisi")
    @Min(value = 0, message = "Minimum stok tidak boleh negatif")
    private BigDecimal minimumStock;

    @NotNull(message = "Stok aktual wajib diisi")
    @Min(value = 0, message = "Stok aktual tidak boleh negatif")
    private BigDecimal stockQuantity;

    @NotNull(message = "Harga beli wajib diisi")
    @Min(value = 0, message = "Harga beli tidak boleh negatif")
    private BigDecimal purchasePrice;

}
