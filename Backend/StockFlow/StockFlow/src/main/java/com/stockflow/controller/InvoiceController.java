package com.stockflow.controller;

import com.stockflow.dto.request.InvoiceUpdateRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.InvoiceResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "Auto-generated invoices, PDF export, customer info")
@SecurityRequirement(name = "bearerAuth")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    @Operation(summary = "List invoices (paginated + searchable on number/customer + date range)")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @ParameterObject @PageableDefault(size = 20, sort = "issueDate", direction = Sort.Direction.DESC)
            Pageable pageable) {
        PageResponse<InvoiceResponse> page = invoiceService.search(q, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one invoice with its lines and customer info")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getById(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update the customer info / notes attached to an invoice (ADMIN, SELLER)")
    public ResponseEntity<ApiResponse<InvoiceResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Invoice updated",
                invoiceService.updateCustomerInfo(id, request)
        ));
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download the invoice as a styled PDF")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = invoiceService.renderPdf(id);
        String number = invoiceService.getById(id).getInvoiceNumber();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(number + ".pdf")
                .build());
        headers.setContentLength(pdf.length);
        return new ResponseEntity<>(pdf, headers, 200);
    }
}
