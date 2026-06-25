package com.stockflow.repository;

import com.stockflow.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);
    boolean existsByCode(String code);
    List<Permission> findAllByCodeIn(Collection<String> codes);
}
