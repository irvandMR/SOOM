package com.soom.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE order_items SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class OrderItemEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    // Produksi yang dipakai untuk order ini
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_id")
    private ProductionEntity production;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal subtotal;

    // ── COGS Snapshot (disimpan saat order DONE, tidak berubah) ────────────────
    @Column(name = "cogs_per_unit", nullable = false)
    private BigDecimal cogsPerUnit = BigDecimal.ZERO;

    @Column(name = "total_cogs", nullable = false)
    private BigDecimal totalCogs = BigDecimal.ZERO;

    @Column(columnDefinition = "text")
    private String notes;
}