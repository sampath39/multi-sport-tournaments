package com.tournament.sport;

import com.tournament.common.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sports")
@RequiredArgsConstructor
@Tag(name = "Sports", description = "Sport registry endpoints")
public class SportController {

    private final SportRepository sportRepository;

    @GetMapping
    @Operation(summary = "List all active sports")
    public ResponseEntity<List<Sport>> listSports() {
        return ResponseEntity.ok(sportRepository.findByIsActiveTrueOrderBySortOrderAsc());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sport by ID")
    public ResponseEntity<Sport> getSport(@PathVariable UUID id) {
        return sportRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
