package com.tournament.match;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/matches")
public class MatchController {

    // In-memory live match state store for real-time scorekeeper updates
    private final Map<String, Map<String, Object>> liveMatches = new ConcurrentHashMap<>();

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMatch(@PathVariable String id) {
        Map<String, Object> match = liveMatches.computeIfAbsent(id, this::createInitialMatch);
        return ResponseEntity.ok(match);
    }

    @PostMapping("/{id}/score")
    public ResponseEntity<Map<String, Object>> updateScore(
        @PathVariable String id,
        @RequestBody Map<String, Object> scoreUpdate
    ) {
        Map<String, Object> match = liveMatches.computeIfAbsent(id, this::createInitialMatch);
        if (scoreUpdate.containsKey("scoreA")) match.put("scoreA", scoreUpdate.get("scoreA"));
        if (scoreUpdate.containsKey("scoreB")) match.put("scoreB", scoreUpdate.get("scoreB"));
        if (scoreUpdate.containsKey("status")) match.put("status", scoreUpdate.get("status"));
        match.put("updatedAt", OffsetDateTime.now().toString());
        return ResponseEntity.ok(match);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeMatch(
        @PathVariable String id,
        @RequestBody(required = false) Map<String, Object> body
    ) {
        Map<String, Object> match = liveMatches.computeIfAbsent(id, this::createInitialMatch);
        match.put("status", "COMPLETED");
        if (body != null && body.containsKey("winner")) {
            match.put("winner", body.get("winner"));
        }
        match.put("completedAt", OffsetDateTime.now().toString());
        return ResponseEntity.ok(match);
    }

    @PostMapping("/{id}/events")
    public ResponseEntity<Map<String, Object>> recordEvent(
        @PathVariable String id,
        @RequestBody Map<String, Object> event
    ) {
        Map<String, Object> match = liveMatches.computeIfAbsent(id, this::createInitialMatch);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> events = (List<Map<String, Object>>) match.computeIfAbsent("events", k -> new ArrayList<Map<String, Object>>());
        event.put("id", UUID.randomUUID().toString());
        event.put("timestamp", OffsetDateTime.now().toString());
        events.add(event);
        return ResponseEntity.ok(Map.of("message", "Event recorded", "event", event));
    }

    private Map<String, Object> createInitialMatch(String id) {
        Map<String, Object> match = new LinkedHashMap<>();
        match.put("id", id);
        match.put("courtName", "Center Arena / Pitch 1");
        match.put("sportCode", "FOOTBALL");
        match.put("participantA", Map.of("id", "p1", "displayName", "Arsenal Academy"));
        match.put("participantB", Map.of("id", "p2", "displayName", "Spartans United"));
        match.put("scoreA", 2);
        match.put("scoreB", 1);
        match.put("status", "LIVE");
        match.put("events", new ArrayList<>(List.of(
            Map.of("id", "1", "time", "14'", "text", "Goal scored by Marcus V. (Arsenal)", "type", "GOAL"),
            Map.of("id", "2", "time", "38'", "text", "Yellow card issued to David S. (Spartans)", "type", "CARD"),
            Map.of("id", "3", "time", "52'", "text", "Goal scored by Liam T. (Spartans)", "type", "GOAL"),
            Map.of("id", "4", "time", "64'", "text", "Goal scored by Marcus V. (Arsenal)", "type", "GOAL")
        )));
        return match;
    }
}
