package com.stockflow.repository;

import com.stockflow.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRoleId(Long roleId);

    @EntityGraph(attributePaths = "role")
    @Override
    Page<User> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "role")
    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String email, Pageable pageable);
}
