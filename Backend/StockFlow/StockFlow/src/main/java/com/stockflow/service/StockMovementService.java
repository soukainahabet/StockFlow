package com.stockflow.service;

import com.stockflow.dto.request.StockMovementRequest;
import com.stockflow.dto.response.PageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public PageResponse<StockMovementResponse> search(Long productId,
                                                      Long userId,
                                                      StockMovementType type,
                                                      LocalDateTime startDate,
                                                      LocalDateTime endDate,
                                                      Pageable pageable) {
        Page<StockMovement> page = stockMovementRepository.search(productId, userId, type, startDate, endDate, pageable);
        return PageResponse.from(page, StockMovementResponse::fromEntity);
    }

    public StockMovementResponse getMovementById(Long id) {
        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement", "id", id));
        return StockMovementResponse.fromEntity(movement);
    }

    public PageResponse<StockMovementResponse> getMovementsByProduct(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", "id", productId);
        }
        Page<StockMovement> page = stockMovementRepository.findByProductId(productId, pageable);
        return PageResponse.from(page, StockMovementResponse::fromEntity);
    }

    @Transactional
    public StockMovementResponse createMovement(StockMovementRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        User currentUser = getCurrentUser();

        if (request.getType() == StockMovementType.IN) {
            product.setQuantity(product.getQuantity() + request.getQuantity());
        } else if (request.getType() == StockMovementType.OUT) {
            if (product.getQuantity() < request.getQuantity()) {
                throw new InsufficientStockException(
                        product.getName(),
                        product.getQuantity(),
                        request.getQuantity()
                );
            }
            product.setQuantity(product.getQuantity() - request.getQuantity());
        }

        productRepository.save(product);

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
