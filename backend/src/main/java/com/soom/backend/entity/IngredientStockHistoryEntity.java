package com.soom.backend.entity;

import com.soom.backend.enums.StockHistoryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ingredients_stock_histories")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE ingredients_stock_histories SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
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
