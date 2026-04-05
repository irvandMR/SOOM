package com.soom.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class RecipeRequest {

    @NotEmpty(message = "Resep harus punya minimal 1 bahan")
    private List<RecipeItemRequest> items;

    private BigDecimal estimatedYield;   // estimasi hasil per batch

    private String notes;
}
