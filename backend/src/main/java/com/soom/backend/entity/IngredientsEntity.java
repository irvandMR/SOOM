package com.soom.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Table(name = "ingredients")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE ingredients SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class IngredientsEntity extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryEntity category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private UnitsEntity unit;

    @Column(nullable = false)
    private String name;

    @Column(name = "stock_quantity")
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(name = "minimum_stock")
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @Column(name = "avg_purchase_price")
    private BigDecimal avgPurchasePrice = BigDecimal.ZERO;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;
}
