package com.soom.backend.dto.request;

import com.soom.backend.enums.PaymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Nama customer tidak boleh kosong")
    private String customerName;

    private String customerPhone;
    private String customerAddress;

    @NotNull(message = "Tanggal order tidak boleh kosong")
    private LocalDate orderDate;

    private LocalDate requiredDate;

    @NotEmpty(message = "Order harus punya minimal 1 produk")
    private List<OrderItemRequest> items;

    // Pembayaran awal (opsional)
    private BigDecimal initialPayment;
    private PaymentType paymentType; // dp | settlement
    private String notes;
}
