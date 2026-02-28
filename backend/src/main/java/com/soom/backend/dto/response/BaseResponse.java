package com.soom.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BaseResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
