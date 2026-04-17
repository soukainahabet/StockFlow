package com.stockflow.service;

import com.stockflow.dto.request.StockMovementRequest;
import com.stockflow.dto.response.StockMovementResponse;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Product;
import com.stockflow.model.StockMovement;
import com.stockflow.model.StockMovementType;
import com.stockflow.model.User;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.StockMovementRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<StockMovementResponse> getAllMovements() {
        return stockMovementRepository.findAllByOrderByDateDesc().stream()
                .map(StockMovementResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public StockMovementResponse getMovementById(Long id) {
        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement", "id", id));
        return StockMovementResponse.fromEntity(movement);
    }

    public List<StockMovementResponse> getMovementsByProduct(Long productId) {
        return stockMovementRepository.findByProductId(productId).stream()
                .map(StockMovementResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public StockMovementResponse createMovement(StockMovementRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        User currentUser = getCurrentUser();

        // Handle stock quantity based on movement type
        if (request.getType() == StockMovementType.IN) {
            // Increase stock
            product.setQuantity(product.getQuantity() + request.getQuantity());
        } else if (request.getType() == StockMovementType.OUT) {
            // Check if sufficient stock
            if (product.getQuantity() < request.getQuantity()) {
                throw new InsufficientStockException(
                        product.getName(),
                        product.getQuantity(),
                        request.getQuantity()
                );
            }
            // Decrease stock
            product.setQuantity(product.getQuantity() - request.getQuantity());
        }

        productRepository.save(product);

        // Create movement record
        StockMovement movement = StockMovement.builder()
                .type(request.getType())
                .quantity(request.getQuantity())
                .date(LocalDateTime.now())
                .product(product)
                .user(currentUser)
                .build();

        movement = stockMovementRepository.save(movement);
        return StockMovementResponse.fromEntity(movement);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
    }
}
