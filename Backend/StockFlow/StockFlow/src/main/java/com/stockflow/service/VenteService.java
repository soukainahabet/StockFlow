package com.stockflow.service;

import com.stockflow.dto.request.LigneVenteRequest;
import com.stockflow.dto.request.VenteRequest;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.VenteResponse;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.*;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.StockMovementRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.repository.VenteRepository;
import com.stockflow.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VenteService {

    private final VenteRepository venteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;
    private final InvoiceService invoiceService;

    public PageResponse<VenteResponse> search(Long userId,
                                              LocalDateTime startDate,
                                              LocalDateTime endDate,
                                              BigDecimal minTotal,
                                              BigDecimal maxTotal,
                                              Pageable pageable) {
        Page<Vente> page = venteRepository.search(userId, startDate, endDate, minTotal, maxTotal, pageable);
        return PageResponse.from(page, VenteResponse::fromEntity);
    }

    public VenteResponse getVenteById(Long id) {
        Vente vente = venteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vente", "id", id));
        return VenteResponse.fromEntity(vente);
    }

    public List<VenteResponse> getRecentVentes(int limit) {
        return venteRepository.findRecentVentes(PageRequest.of(0, limit)).stream()
                .map(VenteResponse::fromEntity)
                .toList();
    }

    @Transactional
    public VenteResponse createVente(VenteRequest request) {
        User currentUser = getCurrentUser();

        Vente vente = Vente.builder()
                .date(LocalDateTime.now())
                .total(BigDecimal.ZERO)
                .user(currentUser)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (LigneVenteRequest ligneRequest : request.getLignes()) {
            Product product = productRepository.findById(ligneRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product", "id", ligneRequest.getProductId()));

            if (product.getQuantity() < ligneRequest.getQuantite()) {
                throw new InsufficientStockException(
                        product.getName(),
                        product.getQuantity(),
                        ligneRequest.getQuantite()
                );
            }

            LigneVente ligne = LigneVente.builder()
                    .product(product)
                    .quantite(ligneRequest.getQuantite())
                    .prixUnitaire(product.getPrice())
                    .build();

            vente.addLigne(ligne);

            BigDecimal sousTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(ligneRequest.getQuantite()));
            total = total.add(sousTotal);

            product.setQuantity(product.getQuantity() - ligneRequest.getQuantite());
            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .type(StockMovementType.OUT)
                    .quantity(ligneRequest.getQuantite())
                    .date(LocalDateTime.now())
                    .product(product)
                    .user(currentUser)
                    .build();
            stockMovementRepository.save(movement);
        }

        vente.setTotal(total);
        Vente savedVente = venteRepository.save(vente);

        // Smart invoice: auto-generated, customer info filled in later by the user.
        invoiceService.createForVente(savedVente);

        return VenteResponse.fromEntity(savedVente);
    }

    @Transactional
    public void deleteVente(Long id) {
        if (!venteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vente", "id", id);
        }
        venteRepository.deleteById(id);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userDetails.getId()));
    }
}
