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
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VenteService {

    private final VenteRepository venteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;
    private final InvoiceService invoiceService;
    private final NotificationService notificationService;

    private static final Set<String> STOCK_AUDIENCE = Set.of("STOCK_MANAGER");
    private static final Set<String> SALE_AUDIENCE = Set.of("MANAGER", "ADMIN");
    private static final Set<String> LOW_STOCK_AUDIENCE = Set.of("ADMIN", "MANAGER", "STOCK_MANAGER");

    public PageResponse<VenteResponse> search(Long userId,
                                              LocalDateTime startDate,
                                              LocalDateTime endDate,
                                              BigDecimal minTotal,
                                              BigDecimal maxTotal,
                                              Pageable pageable) {
        // SELLER scope: ignore any client-supplied userId and pin to the authenticated seller.
        Long effectiveUserId = currentUserIsSeller() ? currentUserId() : userId;
        Page<Vente> page = venteRepository.search(
                effectiveUserId, startDate, endDate, minTotal, maxTotal, pageable);
        return PageResponse.from(page, VenteResponse::fromEntity);
    }

    public VenteResponse getVenteById(Long id) {
        Vente vente = venteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vente", "id", id));
        // SELLER scope: cross-seller reads return 404 to avoid leaking existence.
        if (currentUserIsSeller() && !vente.getUser().getId().equals(currentUserId())) {
            throw new ResourceNotFoundException("Vente", "id", id);
        }
        return VenteResponse.fromEntity(vente);
    }

    public List<VenteResponse> getRecentVentes(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Vente> recent = currentUserIsSeller()
                ? venteRepository.findRecentVentesByUser(currentUserId(), pageable)
                : venteRepository.findRecentVentes(pageable);
        return recent.stream()
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
        List<Product> lowStockTriggered = new ArrayList<>();
        List<String> lineSummaries = new ArrayList<>();

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

            int before = product.getQuantity();
            product.setQuantity(before - ligneRequest.getQuantite());
            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .type(StockMovementType.OUT)
                    .quantity(ligneRequest.getQuantite())
                    .date(LocalDateTime.now())
                    .reason("Vente")
                    .product(product)
                    .user(currentUser)
                    .build();
            stockMovementRepository.save(movement);

            lineSummaries.add(product.getName() + " ×" + ligneRequest.getQuantite());
            // Trigger only when crossing the threshold downward (avoid spam if already below).
            if (product.getQuantity() <= product.getAlertThreshold()
                    && before > product.getAlertThreshold()) {
                lowStockTriggered.add(product);
            }
        }

        vente.setTotal(total);
        Vente savedVente = venteRepository.save(vente);

        // Smart invoice: auto-generated, customer info filled in later by the user.
        invoiceService.createForVente(savedVente);

        fanoutSaleNotifications(savedVente, currentUser, lineSummaries);
        for (Product product : lowStockTriggered) {
            fanoutLowStockNotification(product);
        }

        return VenteResponse.fromEntity(savedVente);
    }

    private void fanoutSaleNotifications(Vente vente, User seller, List<String> lineSummaries) {
        String venteLink = "/ventes/" + vente.getId();
        String saleTitle = "Nouvelle vente #" + vente.getId();
        String saleMessage = String.format(
                "%s a enregistré une vente de %s MAD (%d ligne%s).",
                seller.getName(),
                vente.getTotal().toPlainString(),
                vente.getLignes().size(),
                vente.getLignes().size() > 1 ? "s" : ""
        );
        notificationService.notifyByRoles(
                SALE_AUDIENCE, NotificationType.NEW_SALE, saleTitle, saleMessage, venteLink
        );

        String stockTitle = "Sortie de stock — vente #" + vente.getId();
        String stockMessage = "Sortie automatique : " + String.join(", ", lineSummaries) + ".";
        notificationService.notifyByRoles(
                STOCK_AUDIENCE, NotificationType.STOCK_EXIT, stockTitle, stockMessage, venteLink
        );
    }

    private void fanoutLowStockNotification(Product product) {
        String title = "Stock bas — " + product.getName();
        String message = String.format(
                "Le stock est à %d (seuil d'alerte : %d). Réapprovisionnement recommandé.",
                product.getQuantity(), product.getAlertThreshold()
        );
        notificationService.notifyByRoles(
                LOW_STOCK_AUDIENCE,
                NotificationType.LOW_STOCK,
                title,
                message,
                "/products/" + product.getId()
        );
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

    /** Lightweight: avoids hitting the DB just to read the JWT principal. */
    private CustomUserDetails currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserDetails) authentication.getPrincipal();
    }

    private Long currentUserId() {
        return currentPrincipal().getId();
    }

    private boolean currentUserIsSeller() {
        return "SELLER".equals(currentPrincipal().getRole());
    }
}
