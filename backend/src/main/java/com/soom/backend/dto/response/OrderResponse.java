package com.soom.backend.dto.response;

import com.soom.backend.enums.OrderStatus;
import com.soom.backend.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class OrderResponse {
    private UUID id;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private LocalDate orderDate;
    private LocalDate requiredDate;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private PaymentStatus paymentStatus;
    private String notes;
}
