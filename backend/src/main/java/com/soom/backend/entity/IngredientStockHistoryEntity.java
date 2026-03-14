package com.soom.backend.entity;

import com.soom.backend.enums.StockHistoryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ingredients_stock_histories")
@Getter
@Setter
@NoArgsConstructor
public class IngredientStockHistoryEntity extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private IngredientsEntity ingredients;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StockHistoryType type;

    @Column(nullable = false)
    private BigDecimal quantity;

    private BigDecimal purchasePrice;

    @Column(columnDefinition = "text")
    private String notes;

    // Tidak pakai @ManyToOne karena reference bisa ke tabel mana saja
    // Cukup simpan UUID-nya saja
    private UUID referenceId;

    private String referenceType;


}
