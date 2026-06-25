package com.stockflow.service;

import com.stockflow.dto.request.LoginRequest;
import com.stockflow.dto.request.RegisterRequest;
import com.stockflow.dto.response.AuthResponse;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Permission;
import com.stockflow.model.Role;
import com.stockflow.model.RoleType;
import com.stockflow.model.User;
import com.stockflow.repository.RoleRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.security.JwtUtil;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    private static final String DEFAULT_ROLE = "SELLER";

    /**
     * Self-service signup is restricted to a small set of system roles.
     * Privileged roles (ADMIN, USER) and any CUSTOM role must be assigned by an admin
     * via {@link UserService#updateUser}.
     */
    private static final java.util.Set<String> SELF_SERVICE_ROLES =
            java.util.Set.of("SELLER", "STOCK_MANAGER", "MANAGER");

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        String roleName = (request.getRoleName() == null || request.getRoleName().isBlank())
                ? DEFAULT_ROLE
                : request.getRoleName().toUpperCase();

        if (!SELF_SERVICE_ROLES.contains(roleName)) {
            throw new BadRequestException(
                    "Role '" + roleName + "' cannot be self-assigned. Allowed: " + SELF_SERVICE_ROLES);
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));
        if (role.getType() == RoleType.CUSTOM && !role.isActive()) {
            throw new BadRequestException(
                    "Role '" + roleName + "' is inactive and cannot be assigned");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), "ROLE_" + role.getName());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                role.getName(),
                permissionCodes(role)
        );
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtUtil.generateToken(user.getEmail(), "ROLE_" + user.getRole().getName());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().getName(),
                permissionCodes(user.getRole())
        );
    }

    private static Set<String> permissionCodes(Role role) {
        if (role.getPermissions() == null) {
            return new HashSet<>();
        }
        return role.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toCollection(HashSet::new));
    }
}
