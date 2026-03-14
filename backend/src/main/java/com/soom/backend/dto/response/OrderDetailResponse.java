package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderDetailResponse {
    private UUID id;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private LocalDate orderDate;
    private LocalDate requiredDate;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String paymentStatus;
    private String notes;
    private String systemNotes;
    private List<OrderItemResponse> items;
    private List<OrderPaymentResponse> payments;
}
