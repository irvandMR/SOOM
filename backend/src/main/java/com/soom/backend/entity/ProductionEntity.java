package com.soom.backend.entity;

import com.soom.backend.enums.ProductionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "productions")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE productions SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class ProductionEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private ProductEntity product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private ProductRecipesEntity recipes;

    @Column(name = "quantity_produced", nullable = false)
    private BigDecimal quantityProduced;  // dalam unit produk

    @Column(name = "production_date", nullable = false)
    private LocalDate productionDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductionStatus status;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "expired_date", nullable = false)
    private LocalDateTime expiredDate;

    @Column(name = "actual_yield")
    private BigDecimal actualYield;  // opsional

    @Column(name = "available_qty")
    private BigDecimal availableQty;  // dalam unit produk

    // ── COGS Snapshot (disimpan saat produksi, tidak berubah) ──────────────────
    @Column(name = "actual_cost_per_unit", nullable = false)
    private BigDecimal actualCostPerUnit = BigDecimal.ZERO;

    @Column(name = "total_actual_cost", nullable = false)
    private BigDecimal totalActualCost = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private TenantEntity tenant;

}