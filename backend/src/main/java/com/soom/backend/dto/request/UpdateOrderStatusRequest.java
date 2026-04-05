package com.soom.backend.dto.request;

import com.soom.backend.enums.OrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {

    @NotNull(message = "Status tidak boleh kosong")
    private OrderStatus status;
}
