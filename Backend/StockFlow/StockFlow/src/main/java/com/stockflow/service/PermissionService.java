package com.stockflow.service;

import com.stockflow.dto.response.PermissionResponse;
import com.stockflow.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionService {

    private final PermissionRepository permissionRepository;

    public List<PermissionResponse> listAll() {
        return permissionRepository.findAll().stream()
                .sorted(Comparator
                        .comparing((com.stockflow.model.Permission p) -> p.getCategory())
                        .thenComparing(com.stockflow.model.Permission::getCode))
                .map(PermissionResponse::fromEntity)
                .toList();
    }
}
