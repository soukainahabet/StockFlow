package com.stockflow.config;

import com.stockflow.model.Role;
import com.stockflow.model.User;
import com.stockflow.repository.RoleRepository;
import com.stockflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_STOCK_MANAGER = "STOCK_MANAGER";
    public static final String ROLE_SELLER = "SELLER";
    public static final String ROLE_MANAGER = "MANAGER";

    public static final List<String> ALL_ROLES = List.of(
            ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_SELLER, ROLE_MANAGER
    );

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initRoles();
        initDefaultUsers();
    }

    private void initRoles() {
        ALL_ROLES.forEach(name -> {
            if (!roleRepository.existsByName(name)) {
                roleRepository.save(Role.builder().name(name).build());
                log.info("Created role {}", name);
            }
        });
    }

    private void initDefaultUsers() {
        createUserIfMissing("Administrator", "admin@stockflow.com", "admin123", ROLE_ADMIN);
        createUserIfMissing("Stock Manager", "stock@stockflow.com", "stock123", ROLE_STOCK_MANAGER);
        createUserIfMissing("Seller",        "seller@stockflow.com", "seller123", ROLE_SELLER);
        createUserIfMissing("Manager",       "manager@stockflow.com", "manager123", ROLE_MANAGER);
    }

    private void createUserIfMissing(String name, String email, String rawPassword, String roleName) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Role not found: " + roleName));

        userRepository.save(User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .build());
        log.info("Created default user: {} / {} [{}]", email, rawPassword, roleName);
    }
}
