package com.stockflow.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Generic paginated response wrapper")
public class PageResponse<T> {

    @Schema(description = "Page content")
    private List<T> content;

    @Schema(description = "Current page number (0-based)")
    private int page;

    @Schema(description = "Page size")
    private int size;

    @Schema(description = "Total number of elements across all pages")
    private long totalElements;

    @Schema(description = "Total number of pages")
    private int totalPages;

    @Schema(description = "Whether the current page is the first one")
    private boolean first;

    @Schema(description = "Whether the current page is the last one")
    private boolean last;

    @Schema(description = "Whether the current page is empty")
    private boolean empty;

    public static <E, D> PageResponse<D> from(Page<E> page, Function<E, D> mapper) {
        return PageResponse.<D>builder()
                .content(page.getContent().stream().map(mapper).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return from(page, Function.identity());
    }
}
