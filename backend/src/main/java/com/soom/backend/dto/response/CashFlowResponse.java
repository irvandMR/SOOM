package com.soom.backend.dto.response;

import com.soom.backend.enums.CashFlowType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CashFlowResponse {
    private UUID id;
    private CashFlowType type;
    private String category;
    private BigDecimal amount;
    private String description;
    private String referenceType;
    private UUID referenceId;
    private LocalDate transactionDate;
}
