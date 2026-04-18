package com.stockflow.service;

import com.stockflow.dto.request.LoginRequest;
import com.stockflow.dto.request.RegisterRequest;
import com.stockflow.dto.response.AuthResponse;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Role;
import com.stockflow.model.User;
import com.stockflow.repository.RoleRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.security.JwtUtil;
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
    private static final java.util.Set<String> ASSIGNABLE_ROLES =
            java.util.Set.of("ADMIN", "STOCK_MANAGER", "SELLER", "MANAGER");

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        String roleName = (request.getRoleName() == null || request.getRoleName().isBlank())
                ? DEFAULT_ROLE
                : request.getRoleName().toUpperCase();

        if (!ASSIGNABLE_ROLES.contains(roleName)) {
            throw new BadRequestException(
                    "Invalid role '" + roleName + "'. Allowed: " + ASSIGNABLE_ROLES);
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));

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
                role.getName()
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
                user.getRole().getName()
        );
    }
}
