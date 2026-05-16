package com.stockflow.dto.response;

import com.stockflow.model.Invoice;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Invoice representation with its underlying vente lines and customer info")
public class InvoiceResponse {

    private Long id;

    @Schema(example = "INV-2026-00001")
    private String invoiceNumber;

    private Long venteId;
    private LocalDateTime issueDate;
    private BigDecimal totalAmount;

    private String issuedByName;

    private String customerName;
    private String customerEmail;
    private String customerAddress;
    private String customerPhone;
    private String notes;

    /** Lines snapshot — same content as the underlying vente. */
    private List<LigneVenteResponse> lignes;

    /** True when at least one customer field is filled in. */
    private boolean hasCustomerInfo;

    public static InvoiceResponse fromEntity(Invoice invoice) {
        List<LigneVenteResponse> lignes = invoice.getVente() == null
                ? List.of()
                : invoice.getVente().getLignes().stream()
                    .map(LigneVenteResponse::fromEntity)
                    .toList();

        boolean hasInfo = isFilled(invoice.getCustomerName())
                || isFilled(invoice.getCustomerEmail())
                || isFilled(invoice.getCustomerAddress())
                || isFilled(invoice.getCustomerPhone());

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .venteId(invoice.getVente() != null ? invoice.getVente().getId() : null)
                .issueDate(invoice.getIssueDate())
                .totalAmount(invoice.getTotalAmount())
                .issuedByName(invoice.getVente() != null && invoice.getVente().getUser() != null
                        ? invoice.getVente().getUser().getName()
                        : null)
                .customerName(invoice.getCustomerName())
                .customerEmail(invoice.getCustomerEmail())
                .customerAddress(invoice.getCustomerAddress())
                .customerPhone(invoice.getCustomerPhone())
                .notes(invoice.getNotes())
                .lignes(lignes)
                .hasCustomerInfo(hasInfo)
                .build();
    }

    private static boolean isFilled(String s) {
        return s != null && !s.isBlank();
    }
}
