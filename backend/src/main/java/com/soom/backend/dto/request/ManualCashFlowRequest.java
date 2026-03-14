package com.soom.backend.dto.request;

import com.soom.backend.enums.CashFlowType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ManualCashFlowRequest {

    @NotNull(message = "Tipe tidak boleh kosong")
    private CashFlowType type;

    @NotBlank(message = "Kategori tidak boleh kosong")
    private String category;

    @NotNull(message = "Jumlah tidak boleh kosong")
    private BigDecimal amount;

    @NotBlank(message = "Deskripsi tidak boleh kosong")
    private String description;

    @NotNull(message = "Tanggal tidak boleh kosong")
    private LocalDate transactionDate;
}
