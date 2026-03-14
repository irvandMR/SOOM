package com.soom.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_recipes")
@Getter
@Setter
@NoArgsConstructor
public class ProductRecipesEntity extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private ProductEntity product;

    @Column(nullable = false)
    private Integer versionNumber;

    private boolean isActive;

    @Column(columnDefinition = "text")
    private String notes;

}