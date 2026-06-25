package com.stockflow.dto.response;

import com.stockflow.model.Permission;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Permission catalog entry")
public class PermissionResponse {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "PRODUCT_WRITE")
    private String code;

    @Schema(example = "Créer / modifier des produits")
    private String label;

    @Schema(example = "Produits")
    private String category;

    public static PermissionResponse fromEntity(Permission permission) {
        return PermissionResponse.builder()
                .id(permission.getId())
                .code(permission.getCode())
                .label(permission.getLabel())
                .category(permission.getCategory())
                .build();
    }
}
