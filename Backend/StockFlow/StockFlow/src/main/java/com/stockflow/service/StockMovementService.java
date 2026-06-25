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
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockMovementService {

    private static final Set<String> LOW_STOCK_AUDIENCE = Set.of("ADMIN", "MANAGER", "STOCK_MANAGER");

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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

        int before = product.getQuantity();
        if (request.getType() == StockMovementType.IN) {
            product.setQuantity(before + request.getQuantity());
        } else if (request.getType() == StockMovementType.OUT) {
            if (before < request.getQuantity()) {
                throw new InsufficientStockException(
                        product.getName(),
                        before,
                        request.getQuantity()
                );
            }
            product.setQuantity(before - request.getQuantity());
        }

        productRepository.save(product);

        if (request.getType() == StockMovementType.OUT
                && product.getQuantity() <= product.getAlertThreshold()
                && before > product.getAlertThreshold()) {
            notificationService.notifyByRoles(
                    LOW_STOCK_AUDIENCE,
                    com.stockflow.model.NotificationType.LOW_STOCK,
                    "Stock bas — " + product.getName(),
                    String.format("Le stock est à %d (seuil d'alerte : %d). Réapprovisionnement recommandé.",
                            product.getQuantity(), product.getAlertThreshold()),
                    "/products/" + product.getId()
            );
        }

        StockMovement movement = StockMovement.builder()
                .type(request.getType())
                .quantity(request.getQuantity())
                .date(LocalDateTime.now())
                .reason(request.getReason())
                .product(product)
                .user(currentUser)
                .build();

        movement = stockMovementRepository.save(movement);
        return StockMovementResponse.fromEntity(movement);
    }

    /**
     * Records an internal movement (no quantity mutation on the product — caller is responsible).
     * Used for system-generated entries such as the initial stock movement on product creation,
     * where the product entity is built with the right quantity in the same transaction.
     */
    @Transactional
    public StockMovement recordInternal(Product product, StockMovementType type, int quantity, String reason, User user) {
        StockMovement movement = StockMovement.builder()
                .type(type)
                .quantity(quantity)
                .date(LocalDateTime.now())
                .reason(reason)
                .product(product)
                .user(user)
                .build();
        return stockMovementRepository.save(movement);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
    }
}
