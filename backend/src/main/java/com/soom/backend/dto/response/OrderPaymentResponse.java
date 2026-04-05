package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class OrderPaymentResponse {
    private UUID id;
    private BigDecimal amount;
    private String paymentType;
    private LocalDate paymentDate;
    private String notes;
}
