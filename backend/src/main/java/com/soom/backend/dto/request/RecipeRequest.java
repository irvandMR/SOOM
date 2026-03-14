package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class RecipeRequest {

    @NotEmpty(message = "Resep harus punya minimal 1 bahan")
    private List<RecipeItemRequest> items;

    private String notes;
}
