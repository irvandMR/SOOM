package com.soom.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "units")
@Getter
@Setter
@NoArgsConstructor
public class UnitsEntity extends BaseEntity{

    @Column(nullable = false)
    private  String name;

    @Column(nullable = false)
    private String symbol;
}
