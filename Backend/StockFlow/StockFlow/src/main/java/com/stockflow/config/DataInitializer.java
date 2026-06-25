package com.stockflow.config;

import com.stockflow.model.Permission;
import com.stockflow.model.Role;
import com.stockflow.model.RoleType;
import com.stockflow.model.User;
import com.stockflow.repository.PermissionRepository;
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
    public static final String ROLE_USER = "USER";

    /**
     * Reserved names backed by {@code SecurityConfig}; created on startup,
     * upgraded to {@link RoleType#SYSTEM} and {@code active=true} if missing those flags.
     */
    public static final List<String> SYSTEM_ROLES = List.of(
            ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_SELLER, ROLE_MANAGER, ROLE_USER
    );

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initPermissions();
        initRoles();
        normaliseLegacyRoles();
        seedInvoicePermissionsOnSystemRoles();
        initDefaultUsers();
    }

    /**
     * Idempotent: ensures ADMIN and MANAGER inherit the 3 invoice-related permissions.
     * Adds them if missing; does not overwrite other permissions on the role.
     */
    private void seedInvoicePermissionsOnSystemRoles() {
        java.util.List<String> codes = java.util.List.of(
                "VIEW_INVOICES", "CREATE_INVOICE", "DOWNLOAD_INVOICE"
        );
        java.util.List<com.stockflow.model.Permission> perms =
                permissionRepository.findAllByCodeIn(codes);
        if (perms.size() != codes.size()) {
            log.warn("Invoice permissions not fully seeded yet; skipping role grant");
            return;
        }
        java.util.List.of(ROLE_ADMIN, ROLE_MANAGER).forEach(roleName ->
                roleRepository.findByName(roleName).ifPresent(role -> {
                    boolean changed = role.getPermissions().addAll(perms);
                    if (changed) {
                        roleRepository.save(role);
                        log.info("Granted invoice permissions to {}", roleName);
                    }
                })
        );
    }

    /**
     * Defensive migration: any role row whose {@code type} ended up null after a schema
     * upgrade (Hibernate added the column but the row pre-dated the seeding pass) gets
     * normalised to CUSTOM/active=true. Without this, such rows are filtered out by
     * {@code RoleService.listAssignable()} and the role never shows up in the user picker.
     */
    private void normaliseLegacyRoles() {
        roleRepository.findAll().forEach(role -> {
            if (role.getType() == null) {
                role.setType(RoleType.CUSTOM);
                role.setActive(true);
                roleRepository.save(role);
                log.info("Normalised legacy role {} to CUSTOM/active=true", role.getName());
            }
        });
    }

    private void initPermissions() {
        PermissionCatalog.ENTRIES.forEach(entry -> {
            if (!permissionRepository.existsByCode(entry.getCode())) {
                permissionRepository.save(Permission.builder()
                        .code(entry.getCode())
                        .label(entry.getLabel())
                        .category(entry.getCategory())
                        .build());
                log.info("Created permission {}", entry.getCode());
            }
        });
    }

    private void initRoles() {
        SYSTEM_ROLES.forEach(name -> {
            Role role = roleRepository.findByName(name).orElse(null);
            if (role == null) {
                roleRepository.save(Role.builder()
                        .name(name)
                        .type(RoleType.SYSTEM)
                        .active(true)
                        .build());
                log.info("Created system role {}", name);
                return;
            }
            boolean dirty = false;
            if (role.getType() != RoleType.SYSTEM) {
                role.setType(RoleType.SYSTEM);
                dirty = true;
            }
            if (!role.isActive()) {
                role.setActive(true);
                dirty = true;
            }
            if (dirty) {
                roleRepository.save(role);
                log.info("Upgraded role {} to SYSTEM/active", name);
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
