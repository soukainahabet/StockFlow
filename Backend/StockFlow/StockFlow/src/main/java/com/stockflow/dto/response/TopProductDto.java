package com.stockflow.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Best-selling product analytics row")
public class TopProductDto {

    @Schema(example = "42")
    private Long productId;

    @Schema(example = "Vis M5 inox")
    private String productName;

    @Schema(example = "Quincaillerie")
    private String categoryName;

    @Schema(example = "1240", description = "Total units sold over the considered period")
    private Long quantitySold;

    @Schema(example = "38", description = "Number of distinct sales (ventes) the product appeared in")
    private Long salesCount;

    @Schema(example = "1860.00", description = "Total revenue generated (sum of line sub-totals)")
    private BigDecimal revenue;
}
