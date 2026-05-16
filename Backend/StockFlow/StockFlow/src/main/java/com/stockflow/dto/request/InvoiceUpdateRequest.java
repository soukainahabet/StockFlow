package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Customer info update for an existing invoice. All fields optional.")
public class InvoiceUpdateRequest {

    @Schema(example = "Acme Corp")
    @Size(max = 150)
    private String customerName;

    @Schema(example = "billing@acme.example")
    @Email
    @Size(max = 150)
    private String customerEmail;

    @Schema(example = "10 Rue de la Paix, 75002 Paris")
    @Size(max = 500)
    private String customerAddress;

    @Schema(example = "+33 1 23 45 67 89")
    @Size(max = 30)
    private String customerPhone;

    @Schema(example = "Paid by bank transfer")
    @Size(max = 500)
    private String notes;
}
