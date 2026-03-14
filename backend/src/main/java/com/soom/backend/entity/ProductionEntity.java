package com.soom.backend.entity;

import com.soom.backend.enums.ProductionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "productions")
@Getter
@Setter
@NoArgsConstructor
public class ProductionEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private ProductEntity product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private ProductRecipesEntity recipes;

    @Column(name = "quantity_produced", nullable = false)
    private BigDecimal quantityProduced;

    @Column(name = "production_date", nullable = false)
    private LocalDate productionDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductionStatus status;

    @Column(columnDefinition = "text")
    private String notes;
}
