package com.stockflow.service;

import com.stockflow.dto.request.InvoiceUpdateRequest;
import com.stockflow.dto.response.InvoiceResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Invoice;
import com.stockflow.model.Vente;
import com.stockflow.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoicePdfGenerator pdfGenerator;

    public PageResponse<InvoiceResponse> search(String q,
                                                LocalDateTime startDate,
                                                LocalDateTime endDate,
                                                Pageable pageable) {
        String search = (q == null || q.isBlank()) ? null : q.trim();
        Page<Invoice> page = invoiceRepository.search(search, startDate, endDate, pageable);
        return PageResponse.from(page, InvoiceResponse::fromEntity);
    }

    public InvoiceResponse getById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return InvoiceResponse.fromEntity(invoice);
    }

    public byte[] renderPdf(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return pdfGenerator.render(invoice);
    }

    /**
     * Auto-creates an invoice for a freshly created Vente. Customer info is
     * empty and can be filled in via {@link #updateCustomerInfo}.
     * Must be called within the same transaction as the vente save.
     */
    @Transactional
    public Invoice createForVente(Vente vente) {
        int year = LocalDate.now().getYear();
        String prefix = "INV-" + year + "-";
        long count = invoiceRepository.countByInvoiceNumberStartingWith(prefix);
        String number = String.format("INV-%d-%05d", year, count + 1);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(number)
                .vente(vente)
                .issueDate(LocalDateTime.now())
                .totalAmount(vente.getTotal())
                .build();
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public InvoiceResponse updateCustomerInfo(Long id, InvoiceUpdateRequest req) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        if (req.getCustomerName() != null) invoice.setCustomerName(blankToNull(req.getCustomerName()));
        if (req.getCustomerEmail() != null) invoice.setCustomerEmail(blankToNull(req.getCustomerEmail()));
        if (req.getCustomerAddress() != null) invoice.setCustomerAddress(blankToNull(req.getCustomerAddress()));
        if (req.getCustomerPhone() != null) invoice.setCustomerPhone(blankToNull(req.getCustomerPhone()));
        if (req.getNotes() != null) invoice.setNotes(blankToNull(req.getNotes()));

        return InvoiceResponse.fromEntity(invoiceRepository.save(invoice));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
