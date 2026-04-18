package com.stockflow.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standard error response payload")
public class ErrorResponse {

    @Schema(description = "HTTP status code", example = "400")
    private int status;

    @Schema(description = "Short error label", example = "Bad Request")
    private String error;

    @Schema(description = "Human-readable error message")
    private String message;

    @Schema(description = "Request path that raised the error")
    private String path;

    @Schema(description = "When the error was produced (server time)")
    private LocalDateTime timestamp;

    @Schema(description = "Field-level validation errors (when applicable)")
    private Map<String, String> validationErrors;
}
