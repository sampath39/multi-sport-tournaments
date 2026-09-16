package com.tournament.tournament;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    public ResponseEntity<Page<TournamentDto>> listTournaments(
        @RequestParam(required = false) TournamentStatus status,
        @RequestParam(required = false) String sport,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TournamentDto> result = tournamentService.listTournaments(status, sport, search, null, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentDto> getTournament(@PathVariable UUID id) {
        return tournamentService.getTournamentById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TournamentDto> createTournament(
        @RequestBody CreateTournamentRequest request
    ) {
        TournamentDto created = tournamentService.createTournament(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentDto> updateTournament(
        @PathVariable UUID id,
        @RequestBody Tournament tournament
    ) {
        return tournamentService.updateTournament(id, tournament)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<TournamentDto> publishTournament(@PathVariable UUID id) {
        return tournamentService.publishTournament(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<TournamentParticipantDto>> getParticipants(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getParticipants(id));
    }

    @PostMapping("/{id}/participants")
    public ResponseEntity<TournamentParticipantDto> addParticipant(
        @PathVariable UUID id,
        @RequestBody Map<String, Object> participant
    ) {
        return ResponseEntity.ok(tournamentService.addParticipant(id, participant));
    }

    @GetMapping("/{id}/fixtures")
    public ResponseEntity<List<Map<String, Object>>> getFixtures(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getFixtures(id));
    }

    @GetMapping("/{id}/rounds")
    public ResponseEntity<List<Map<String, Object>>> getRounds(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getFixtures(id));
    }

    @PostMapping(value = {"/{id}/rounds/generate", "/{id}/generate-fixtures"})
    public ResponseEntity<Map<String, Object>> generateRounds(@PathVariable UUID id) {
        List<Map<String, Object>> fixtures = tournamentService.generateFixtures(id);
        return ResponseEntity.ok(Map.of(
            "message", "Fixtures generated successfully",
            "tournamentId", id,
            "fixturesCount", fixtures.size(),
            "fixtures", fixtures
        ));
    }

    @GetMapping("/{id}/standings")
    public ResponseEntity<List<Map<String, Object>>> getStandings(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getStandings(id));
    }

    @GetMapping("/{id}/bracket")
    public ResponseEntity<Map<String, Object>> getBracket(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getBracket(id));
    }

    @GetMapping("/{id}/complete-status")
    public ResponseEntity<Map<String, Object>> getCompleteStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of(
            "tournamentId", id,
            "isComplete", tournamentService.isTournamentComplete(id)
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable UUID id) {
        if (tournamentService.deleteTournament(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
