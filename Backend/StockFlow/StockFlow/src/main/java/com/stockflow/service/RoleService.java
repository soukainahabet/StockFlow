package com.stockflow.service;

import com.stockflow.dto.request.RoleRequest;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.RoleResponse;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Permission;
import com.stockflow.model.Role;
import com.stockflow.model.RoleType;
import com.stockflow.repository.PermissionRepository;
import com.stockflow.repository.RoleRepository;
import com.stockflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Manages Role entities. The 5 reserved names (ADMIN, STOCK_MANAGER, SELLER, MANAGER, USER)
 * are flagged {@link RoleType#SYSTEM} by {@code DataInitializer} and cannot be renamed,
 * deactivated nor deleted — they back the {@code SecurityConfig} RBAC matrix.
 * Custom roles created from the admin UI start empty (no permissions) and can be edited.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class RoleService {

    public static final Set<String> SYSTEM_ROLE_NAMES = Set.of(
            "ADMIN", "STOCK_MANAGER", "SELLER", "MANAGER", "USER"
    );

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;

    public PageResponse<RoleResponse> getAllRoles(RoleType type, Boolean active, Pageable pageable) {
        // Roles count stays small (~10–50): full scan + in-memory filtering keeps the API simple.
        List<Role> filtered = roleRepository.findAll().stream()
                .filter(r -> type == null || r.getType() == type)
                .filter(r -> active == null || r.isActive() == active)
                .sorted(Comparator.comparing(Role::getName))
                .toList();
        int from = Math.min((int) pageable.getOffset(), filtered.size());
        int to = Math.min(from + pageable.getPageSize(), filtered.size());
        List<Role> pageSlice = filtered.subList(from, to);
        return PageResponse.from(
                new PageImpl<>(pageSlice, pageable, filtered.size()),
                RoleResponse::fromEntity
        );
    }

    public RoleResponse getRoleById(Long id) {
        return RoleResponse.fromEntity(loadRole(id));
    }

    public List<RoleResponse> listAssignable() {
        List<Role> all = roleRepository.findAll();
        List<RoleResponse> assignable = all.stream()
                // A row with null type is treated as CUSTOM so a half-migrated DB row
                // doesn't silently vanish from the user-assignment dropdown.
                .filter(r -> {
                    RoleType type = r.getType() == null ? RoleType.CUSTOM : r.getType();
                    return type == RoleType.SYSTEM || (type == RoleType.CUSTOM && r.isActive());
                })
                .map(RoleResponse::fromEntity)
                .toList();
        log.debug("listAssignable: {} role(s) in DB, {} returned", all.size(), assignable.size());
        return assignable;
    }

    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        String name = request.getName().toUpperCase();
        if (SYSTEM_ROLE_NAMES.contains(name)) {
            throw new BadRequestException(
                    "Name '" + name + "' is reserved for system roles");
        }
        if (roleRepository.existsByName(name)) {
            throw new DuplicateResourceException("Role", "name", name);
        }

        Role saved = roleRepository.save(Role.builder()
                .name(name)
                .type(RoleType.CUSTOM)
                .active(request.getActive() == null || request.getActive())
                // Spec: CUSTOM roles start with no permissions.
                // Any 'permissions' passed on creation is ignored and must be added via update.
                .permissions(new HashSet<>())
                .build());
        return RoleResponse.fromEntity(saved);
    }

    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role role = loadRole(id);

        if (role.getType() == RoleType.SYSTEM) {
            throw new BadRequestException(
                    "System role '" + role.getName() + "' is immutable");
        }

        String newName = request.getName().toUpperCase();
        if (SYSTEM_ROLE_NAMES.contains(newName) && !newName.equals(role.getName())) {
            throw new BadRequestException(
                    "Name '" + newName + "' is reserved for system roles");
        }
        if (!role.getName().equals(newName) && roleRepository.existsByName(newName)) {
            throw new DuplicateResourceException("Role", "name", newName);
        }

        role.setName(newName);
        if (request.getActive() != null) {
            role.setActive(request.getActive());
        }
        if (request.getPermissions() != null) {
            role.setPermissions(resolvePermissions(request.getPermissions()));
        }

        return RoleResponse.fromEntity(roleRepository.save(role));
    }

    /**
     * Resolves a set of permission codes to their managed entities.
     * Unknown codes raise {@link BadRequestException} — silent drops mask seeding bugs.
     */
    private Set<Permission> resolvePermissions(Set<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return new HashSet<>();
        }
        List<Permission> found = permissionRepository.findAllByCodeIn(codes);
        if (found.size() != codes.size()) {
            Set<String> foundCodes = found.stream().map(Permission::getCode).collect(java.util.stream.Collectors.toSet());
            Set<String> unknown = new HashSet<>(codes);
            unknown.removeAll(foundCodes);
            throw new BadRequestException("Unknown permission codes: " + unknown);
        }
        return new HashSet<>(found);
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = loadRole(id);

        if (role.getType() == RoleType.SYSTEM) {
            throw new BadRequestException(
                    "System role '" + role.getName() + "' cannot be deleted");
        }

        long usersWithRole = userRepository.countByRoleId(id);
        if (usersWithRole > 0) {
            throw new BadRequestException(
                    "Role '" + role.getName() + "' is assigned to " + usersWithRole
                            + " user(s); reassign them before deleting");
        }

        roleRepository.delete(role);
    }

    private Role loadRole(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
    }
}
