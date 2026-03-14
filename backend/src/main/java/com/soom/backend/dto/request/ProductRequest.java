package com.soom.backend.dto.request;

import com.soom.backend.enums.ProductType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductRequest {

    @NotNull(message = "Kategori tidak boleh kosong")
    private UUID categoryId;

    @NotNull(message = "Unit tidak boleh kosong")
    private UUID unitId;

    @NotBlank(message = "Nama tidak boleh kosong")
    private String name;

    @NotNull(message = "Tipe tidak boleh kosong")
    private ProductType type;

    @NotNull(message = "Harga tidak boleh kosong")
    private BigDecimal defaultPrice;

    private BigDecimal targetMargin = new BigDecimal("30");
}
