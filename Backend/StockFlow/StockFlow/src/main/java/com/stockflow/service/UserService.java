package com.stockflow.service;

import com.stockflow.dto.request.UserCreateRequest;
import com.stockflow.dto.request.UserUpdateRequest;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.UserResponse;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Role;
import com.stockflow.model.RoleType;
import com.stockflow.model.User;
import com.stockflow.repository.RoleRepository;
import com.stockflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public PageResponse<UserResponse> getAllUsers(String search, Pageable pageable) {
        Page<User> page;
        if (search == null || search.isBlank()) {
            page = userRepository.findAll(pageable);
        } else {
            String term = search.trim();
            page = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(term, term, pageable);
        }
        return PageResponse.from(page, UserResponse::fromEntity);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserResponse.fromEntity(user);
    }

    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        String roleName = request.getRoleName().toUpperCase();
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
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.getName() != null) {
            user.setName(request.getName());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("User", "email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRoleName() != null) {
            String roleName = request.getRoleName().toUpperCase();
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));
            if (role.getType() == RoleType.CUSTOM && !role.isActive()) {
                throw new BadRequestException(
                        "Role '" + roleName + "' is inactive and cannot be assigned");
            }
            user.setRole(role);
        }

        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }
}
