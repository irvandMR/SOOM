package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class TenantResponse {
    private UUID id;
    private String businessName;
    private String address;
    private String phone;
    private String email;
    private String bankName;
    private String bankAccount;
    private String bankAccountName;
    private String invoiceFooter;
}