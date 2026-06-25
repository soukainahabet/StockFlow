package com.stockflow.repository;

import com.stockflow.model.Role;
import com.stockflow.model.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    boolean existsByName(String name);
    List<Role> findByType(RoleType type);
    List<Role> findByTypeAndActive(RoleType type, boolean active);
}
