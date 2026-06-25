package com.stockflow.dto.response;

import com.stockflow.model.StockMovement;
import com.stockflow.model.StockMovementType;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementResponse {
    private Long id;
    private StockMovementType type;
    private Integer quantity;
    private LocalDateTime date;
    private String reason;
    private String productName;
    private Long productId;
    private String userName;
    private Long userId;

    public static StockMovementResponse fromEntity(StockMovement movement) {
        return StockMovementResponse.builder()
                .id(movement.getId())
                .type(movement.getType())
                .quantity(movement.getQuantity())
                .date(movement.getDate())
                .reason(movement.getReason())
                .productName(movement.getProduct().getName())
                .productId(movement.getProduct().getId())
                .userName(movement.getUser().getName())
                .userId(movement.getUser().getId())
                .build();
    }
}
