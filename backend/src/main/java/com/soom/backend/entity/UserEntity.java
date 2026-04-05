package com.soom.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@SQLDelete(sql = "UPDATE users SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
@Setter
@Getter
@NoArgsConstructor
public class UserEntity extends BaseEntity{

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(name = "is_active")
    private Boolean isActive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private TenantEntity tenant;

    @Column(name = "tenant_role")
    private String tenantRole;  // OWNER, STAFF

    @Column(name = "must_change_password")
    private Boolean mustChangePassword = false;

    @Column(name = "temp_password_expires_at")
    private LocalDateTime tempPasswordExpiresAt;
}
