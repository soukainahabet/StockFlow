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

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initRoles();
        initAdminUser();
    }

    private void initRoles() {
        if (!roleRepository.existsByName("ADMIN")) {
            Role adminRole = Role.builder().name("ADMIN").build();
            roleRepository.save(adminRole);
            log.info("Created ADMIN role");
        }

        if (!roleRepository.existsByName("USER")) {
            Role userRole = Role.builder().name("USER").build();
            roleRepository.save(userRole);
            log.info("Created USER role");
        }
    }

    private void initAdminUser() {
        if (!userRepository.existsByEmail("admin@stockflow.com")) {
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            User admin = User.builder()
                    .name("Administrator")
                    .email("admin@stockflow.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(adminRole)
                    .build();

            userRepository.save(admin);
            log.info("Created default admin user: admin@stockflow.com / admin123");
        }
    }
}
