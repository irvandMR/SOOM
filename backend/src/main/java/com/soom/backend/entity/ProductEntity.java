package com.soom.backend.entity;

import com.soom.backend.enums.ProductType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE products SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class ProductEntity extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryEntity category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private UnitsEntity unit;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductType type;

    @Column(name = "default_price")
    private BigDecimal defaultPrice = BigDecimal.ZERO;

    @Column(name = "stock_quantity")
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(name = "estimated_cost")
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(name = "target_margin")
    private BigDecimal targetMargin = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;
}
