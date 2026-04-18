package com.stockflow.service;

import com.stockflow.dto.request.RoleRequest;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.RoleResponse;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Role;
import com.stockflow.repository.RoleRepository;
import com.stockflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Manages Role entities. The 4 roles defined by the functional spec (§6) are reserved:
 * they cannot be renamed nor deleted to avoid breaking the SecurityConfig RBAC rules.
 * The legacy "USER" role is also reserved (backwards compatibility).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleService {

    public static final Set<String> SYSTEM_ROLES = Set.of(
            "ADMIN", "STOCK_MANAGER", "SELLER", "MANAGER", "USER"
    );

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public PageResponse<RoleResponse> getAllRoles(Pageable pageable) {
        Page<Role> page = roleRepository.findAll(pageable);
        return PageResponse.from(page, this::toResponse);
    }

    public RoleResponse getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return toResponse(role);
    }

    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        String name = request.getName().toUpperCase();
        if (roleRepository.existsByName(name)) {
            throw new DuplicateResourceException("Role", "name", name);
        }
        Role saved = roleRepository.save(Role.builder().name(name).build());
        return toResponse(saved);
    }

    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        if (SYSTEM_ROLES.contains(role.getName())) {
            throw new BadRequestException(
                    "System role '" + role.getName() + "' cannot be renamed");
        }

        String newName = request.getName().toUpperCase();
        if (!role.getName().equals(newName) && roleRepository.existsByName(newName)) {
            throw new DuplicateResourceException("Role", "name", newName);
        }

        role.setName(newName);
        return toResponse(roleRepository.save(role));
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        if (SYSTEM_ROLES.contains(role.getName())) {
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

    private RoleResponse toResponse(Role role) {
        return RoleResponse.fromEntity(role, SYSTEM_ROLES.contains(role.getName()));
    }
}
