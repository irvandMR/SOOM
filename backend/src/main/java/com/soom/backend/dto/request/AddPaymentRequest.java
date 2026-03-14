package com.soom.backend.dto.request;

import com.soom.backend.enums.PaymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AddPaymentRequest {

    @NotNull(message = "Jumlah tidak boleh kosong")
    private BigDecimal amount;

    @NotBlank(message = "Tipe pembayaran tidak boleh kosong")
    private PaymentType paymentType; // dp | settlement

    @NotNull(message = "Tanggal pembayaran tidak boleh kosong")
    private LocalDate paymentDate;

    private String notes;
}
