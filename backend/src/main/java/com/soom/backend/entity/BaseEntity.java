package com.soom.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Setter
@Getter
public abstract class BaseEntity {
    @Id
    @GeneratedValue
    private UUID id;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private String createdBy = "SYSTEM";

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private String updatedBy;

    private Boolean isDeleted = false;
}
