package com.stockflow.controller;

import com.stockflow.dto.request.VenteRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.VenteResponse;
import com.stockflow.service.VenteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventes")
@RequiredArgsConstructor
public class VenteController {

    private final VenteService venteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VenteResponse>>> getAllVentes() {
        List<VenteResponse> ventes = venteService.getAllVentes();
        return ResponseEntity.ok(ApiResponse.success(ventes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VenteResponse>> getVenteById(@PathVariable Long id) {
        VenteResponse vente = venteService.getVenteById(id);
        return ResponseEntity.ok(ApiResponse.success(vente));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VenteResponse>> createVente(
            @Valid @RequestBody VenteRequest request) {
        VenteResponse vente = venteService.createVente(request);
        return new ResponseEntity<>(
                ApiResponse.success("Vente created successfully", vente),
                HttpStatus.CREATED
        );
    }
}
