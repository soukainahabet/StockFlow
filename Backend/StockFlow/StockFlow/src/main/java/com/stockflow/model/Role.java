package com.stockflow.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16, columnDefinition = "VARCHAR(16) DEFAULT 'CUSTOM'")
    @Builder.Default
    private RoleType type = RoleType.CUSTOM;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    @Builder.Default
    private boolean active = true;

    /**
     * Permissions granted by this role. EAGER so {@link com.stockflow.security.CustomUserDetails}
     * can expand them into Spring authorities without an extra round-trip.
     * Join table name chosen to avoid clashing with the legacy {@code role_permissions}
     * element-collection table from a prior schema iteration.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "role_permission_assignments",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "permission_id"})
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    public boolean isSystem() {
        return type == RoleType.SYSTEM;
    }
}
