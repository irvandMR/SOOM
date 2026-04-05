package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Nama tidak boleh kosong")
    private String name;

    @NotBlank(message = "Type tidak boleh kosong")
    private String type;
}
