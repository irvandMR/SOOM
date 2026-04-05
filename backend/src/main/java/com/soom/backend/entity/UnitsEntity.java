package com.soom.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Table(name = "units")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE units SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class UnitsEntity extends BaseEntity{

    @Column(nullable = false)
    private  String name;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private String baseUnit;

    @Column(nullable = false)
    private BigDecimal conversionFactor;

}
