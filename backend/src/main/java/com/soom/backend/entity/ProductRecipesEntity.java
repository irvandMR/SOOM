package com.soom.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Table(name = "product_recipes")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE product_recipes SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class ProductRecipesEntity extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private ProductEntity product;

    @Column(nullable = false)
    private Integer versionNumber;

    private boolean isActive;

    @Column(columnDefinition = "text")
    private String notes;

    // Estimasi hasil produksi per batch resep ini
    @Column(name = "estimated_yield")
    private BigDecimal estimatedYield;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "yield_unit_id")
    private UnitsEntity yieldUnit;  // satuan hasil (pcs, loyang, dll)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;

}