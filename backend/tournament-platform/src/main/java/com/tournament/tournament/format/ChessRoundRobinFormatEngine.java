package com.tournament.tournament.format;

import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Round Robin Tournament Engine for Chess.
 *
 * Implements:
 * - Standard Berger Circle Method for round-by-round pairing
 * - Full schedule generation:
 *   - Even N: N - 1 rounds, N(N - 1) / 2 games
 *   - Odd N: N rounds with 1 Bye per round, N(N - 1) / 2 games
 * - Strict rematch validation: every player pair plays exactly once
 * - Color assignment: Berger White/Black alternation balancing colors
 * - Official chess standings with Sonneborn-Berger (SB), Direct Encounter, and Wins tiebreakers
 * - Cross-Table (Head-to-head result matrix)
 * - Completion when all scheduled games are completed
 */
@Slf4j
@Component
public class ChessRoundRobinFormatEngine implements TournamentFormatEngine {

    @Override
    public TournamentFormat getFormat() {
        return TournamentFormat.ROUND_ROBIN;
    }

    @Override
    public List<Map<String, Object>> generateRound(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> existingFixtures,
        int nextRound
    ) {
        int n = participants.size();
        if (n < 2) {
            throw new IllegalArgumentException("Round Robin tournament requires at least 2 participants.");
        }

        // Calculate total rounds: N is even -> N-1; N is odd -> N
        int totalRounds = (n % 2 == 0) ? (n - 1) : n;

        if (nextRound > totalRounds) {
            throw new IllegalStateException("All " + totalRounds + " Round Robin rounds have already been generated.");
        }

        // Generate full schedule internally via Berger Circle Method
        List<List<Map<String, Object>>> allRounds = generateFullBergerSchedule(tournament, participants);

        // Validate schedule integrity (every pair occurs exactly once)
        validateScheduleIntegrity(allRounds, participants);

        // Return the fixtures for the requested nextRound (1-indexed)
        if (nextRound - 1 < allRounds.size()) {
            return allRounds.get(nextRound - 1);
        }

        return Collections.emptyList();
    }

    /**
     * Generates the complete round-by-round schedule using Berger's circle method.
     */
    public List<List<Map<String, Object>>> generateFullBergerSchedule(
        Tournament tournament,
        List<TournamentParticipantDto> rawParticipants
    ) {
        // Sort participants by seed/rating for deterministic initial positioning
        List<TournamentParticipantDto> participants = new ArrayList<>(rawParticipants);
        participants.sort((a, b) -> {
            int seedA = a.getSeed() != null ? a.getSeed() : Integer.MAX_VALUE;
            int seedB = b.getSeed() != null ? b.getSeed() : Integer.MAX_VALUE;
            if (seedA != seedB) return Integer.compare(seedA, seedB);
            double ratingA = a.getRating() != null ? a.getRating().doubleValue() : 1500.0;
            double ratingB = b.getRating() != null ? b.getRating().doubleValue() : 1500.0;
            return Double.compare(ratingB, ratingA);
        });

        int n = participants.size();
        boolean hasBye = (n % 2 != 0);

        List<TournamentParticipantDto> circle = new ArrayList<>(participants);
        TournamentParticipantDto byeDummy = null;
        if (hasBye) {
            byeDummy = TournamentParticipantDto.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .displayName("BYE")
                .status("BYE")
                .build();
            circle.add(byeDummy);
            n++;
        }

        int totalRounds = n - 1;
        int half = n / 2;

        List<List<Map<String, Object>>> schedule = new ArrayList<>();

        for (int r = 1; r <= totalRounds; r++) {
            List<Map<String, Object>> roundMatches = new ArrayList<>();
            int boardNumber = 1;

            for (int i = 0; i < half; i++) {
                TournamentParticipantDto p1 = circle.get(i);
                TournamentParticipantDto p2 = circle.get(n - 1 - i);

                // If one of the players is the BYE dummy slot
                if (p1.equals(byeDummy) || p2.equals(byeDummy)) {
                    TournamentParticipantDto realPlayer = p1.equals(byeDummy) ? p2 : p1;
                    Map<String, Object> byeMatch = new LinkedHashMap<>();
                    byeMatch.put("id", UUID.randomUUID().toString());
                    byeMatch.put("tournamentId", tournament.getId().toString());
                    byeMatch.put("roundNumber", r);
                    byeMatch.put("courtName", "BYE");
                    byeMatch.put("participantA", participantMap(realPlayer.getId().toString(), realPlayer.getDisplayName(), 1));
                    byeMatch.put("participantB", participantMap("BYE", "BYE", 0));
                    byeMatch.put("sideA", "WHITE");
                    byeMatch.put("sideB", "BYE");
                    byeMatch.put("status", "COMPLETED");
                    byeMatch.put("resultType", "BYE");
                    byeMatch.put("winner", realPlayer.getDisplayName());
                    byeMatch.put("sportCode", "CHESS");
                    byeMatch.put("pairingReason", "Round Robin Bye for " + realPlayer.getDisplayName());
                    roundMatches.add(byeMatch);
                } else {
                    // Regular match with Berger color alternation
                    boolean p1White;
                    if (i == 0) {
                        // Fixed board alternates colors by round
                        p1White = (r % 2 == 1);
                    } else {
                        // Alternates by board and round
                        p1White = ((i + r) % 2 == 1);
                    }

                    TournamentParticipantDto white = p1White ? p1 : p2;
                    TournamentParticipantDto black = p1White ? p2 : p1;

                    Map<String, Object> match = new LinkedHashMap<>();
                    match.put("id", UUID.randomUUID().toString());
                    match.put("tournamentId", tournament.getId().toString());
                    match.put("roundNumber", r);
                    match.put("boardNumber", boardNumber);
                    match.put("courtName", "Board " + boardNumber++);
                    match.put("participantA", participantMap(white.getId().toString(), white.getDisplayName(), 0));
                    match.put("participantB", participantMap(black.getId().toString(), black.getDisplayName(), 0));
                    match.put("sideA", "WHITE");
                    match.put("sideB", "BLACK");
                    match.put("status", "SCHEDULED");
                    match.put("sportCode", "CHESS");
                    match.put("pairingReason", "Round " + r + " Berger Pairing: " + white.getDisplayName() + " (W) vs " + black.getDisplayName() + " (B)");
                    roundMatches.add(match);
                }
            }

            schedule.add(roundMatches);

            // Rotate circle: fix position 0, rotate positions 1..N-1 clockwise
            TournamentParticipantDto last = circle.remove(circle.size() - 1);
            circle.add(1, last);
        }

        return schedule;
    }

    private Map<String, Object> participantMap(String id, String displayName, Number score) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("id", id);
        p.put("name", displayName);
        p.put("displayName", displayName);
        p.put("score", score);
        return p;
    }

    /**
     * Validates that every pair of real participants meets exactly once.
     */
    private void validateScheduleIntegrity(
        List<List<Map<String, Object>>> schedule,
        List<TournamentParticipantDto> participants
    ) {
        Map<String, Integer> encounterCount = new HashMap<>();

        for (List<Map<String, Object>> round : schedule) {
            for (Map<String, Object> m : round) {
                if ("BYE".equalsIgnoreCase((String) m.get("resultType"))) continue;

                @SuppressWarnings("unchecked")
                Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
                @SuppressWarnings("unchecked")
                Map<String, Object> pB = (Map<String, Object>) m.get("participantB");

                if (pA == null || pB == null) continue;
                String idA = (String) pA.get("id");
                String idB = (String) pB.get("id");

                if ("BYE".equals(idB) || "BYE".equals(idA)) continue;

                String key = idA.compareTo(idB) < 0 ? (idA + "_" + idB) : (idB + "_" + idA);
                encounterCount.put(key, encounterCount.getOrDefault(key, 0) + 1);
            }
        }

        int expectedMatches = participants.size() * (participants.size() - 1) / 2;
        if (encounterCount.size() != expectedMatches) {
            throw new IllegalStateException("Round Robin schedule validation failed: expected " +
                expectedMatches + " unique encounters but found " + encounterCount.size());
        }

        for (Map.Entry<String, Integer> entry : encounterCount.entrySet()) {
            if (entry.getValue() != 1) {
                throw new IllegalStateException("Round Robin rematch constraint violated: pair " +
                    entry.getKey() + " scheduled " + entry.getValue() + " times!");
            }
        }
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<String, Map<String, Object>> stats = new LinkedHashMap<>();
        Map<String, List<String>> defeatedMap = new HashMap<>();
        Map<String, List<String>> drawnMap = new HashMap<>();
        Map<String, Map<String, Double>> directEncounterMap = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("participantId", p.getId().toString());
            s.put("participantName", p.getDisplayName());
            s.put("played", 0);
            s.put("won", 0);
            s.put("drawn", 0);
            s.put("lost", 0);
            s.put("points", 0.0);
            s.put("sonnebornBerger", 0.0);
            s.put("rating", p.getRating() != null ? p.getRating().doubleValue() : 1500.0);
            stats.put(p.getDisplayName(), s);
            defeatedMap.put(p.getDisplayName(), new ArrayList<>());
            drawnMap.put(p.getDisplayName(), new ArrayList<>());
            directEncounterMap.put(p.getDisplayName(), new HashMap<>());
        }

        for (Map<String, Object> m : fixtures) {
            if (!"COMPLETED".equalsIgnoreCase((String) m.get("status"))) continue;

            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");

            String nameA = pA != null ? (String) pA.get("displayName") : null;
            String nameB = pB != null ? (String) pB.get("displayName") : null;

            double scoreA = pA != null && pA.get("score") != null ? ((Number) pA.get("score")).doubleValue() : 0.0;
            double scoreB = pB != null && pB.get("score") != null ? ((Number) pB.get("score")).doubleValue() : 0.0;
            String winner = (String) m.get("winner");

            if ("BYE".equalsIgnoreCase((String) m.get("resultType")) || "BYE".equalsIgnoreCase(nameB)) {
                if (nameA != null && stats.containsKey(nameA)) {
                    Map<String, Object> sA = stats.get(nameA);
                    sA.put("played", ((int) sA.get("played")) + 1);
                    sA.put("won", ((int) sA.get("won")) + 1);
                    sA.put("points", ((double) sA.get("points")) + 1.0);
                }
                continue;
            }

            if (nameA != null && nameB != null && stats.containsKey(nameA) && stats.containsKey(nameB)) {
                Map<String, Object> sA = stats.get(nameA);
                Map<String, Object> sB = stats.get(nameB);

                sA.put("played", ((int) sA.get("played")) + 1);
                sB.put("played", ((int) sB.get("played")) + 1);

                if (scoreA > scoreB || (winner != null && winner.equals(nameA))) {
                    sA.put("won", ((int) sA.get("won")) + 1);
                    sA.put("points", ((double) sA.get("points")) + 1.0);
                    sB.put("lost", ((int) sB.get("lost")) + 1);
                    defeatedMap.get(nameA).add(nameB);
                    directEncounterMap.get(nameA).put(nameB, 1.0);
                    directEncounterMap.get(nameB).put(nameA, 0.0);
                } else if (scoreB > scoreA || (winner != null && winner.equals(nameB))) {
                    sB.put("won", ((int) sB.get("won")) + 1);
                    sB.put("points", ((double) sB.get("points")) + 1.0);
                    sA.put("lost", ((int) sA.get("lost")) + 1);
                    defeatedMap.get(nameB).add(nameA);
                    directEncounterMap.get(nameB).put(nameA, 1.0);
                    directEncounterMap.get(nameA).put(nameB, 0.0);
                } else {
                    sA.put("drawn", ((int) sA.get("drawn")) + 1);
                    sB.put("drawn", ((int) sB.get("drawn")) + 1);
                    sA.put("points", ((double) sA.get("points")) + 0.5);
                    sB.put("points", ((double) sB.get("points")) + 0.5);
                    drawnMap.get(nameA).add(nameB);
                    drawnMap.get(nameB).add(nameA);
                    directEncounterMap.get(nameA).put(nameB, 0.5);
                    directEncounterMap.get(nameB).put(nameA, 0.5);
                }
            }
        }

        // Calculate Sonneborn-Berger
        for (Map.Entry<String, Map<String, Object>> entry : stats.entrySet()) {
            String name = entry.getKey();
            Map<String, Object> row = entry.getValue();

            double sb = 0.0;
            for (String defOpp : defeatedMap.getOrDefault(name, Collections.emptyList())) {
                if (stats.containsKey(defOpp)) {
                    sb += (double) stats.get(defOpp).get("points");
                }
            }
            for (String drOpp : drawnMap.getOrDefault(name, Collections.emptyList())) {
                if (stats.containsKey(drOpp)) {
                    sb += 0.5 * (double) stats.get(drOpp).get("points");
                }
            }
            row.put("sonnebornBerger", sb);
        }

        List<Map<String, Object>> list = new ArrayList<>(stats.values());
        list.sort((a, b) -> {
            int cmp = Double.compare((double) b.get("points"), (double) a.get("points"));
            if (cmp != 0) return cmp;

            // Direct encounter tiebreak
            String nameA = (String) a.get("participantName");
            String nameB = (String) b.get("participantName");
            if (directEncounterMap.containsKey(nameA) && directEncounterMap.get(nameA).containsKey(nameB)) {
                double headToHead = directEncounterMap.get(nameA).get(nameB);
                if (headToHead > 0.5) return -1;
                if (headToHead < 0.5) return 1;
            }

            cmp = Double.compare((double) b.get("sonnebornBerger"), (double) a.get("sonnebornBerger"));
            if (cmp != 0) return cmp;

            cmp = Integer.compare((int) b.get("won"), (int) a.get("won"));
            if (cmp != 0) return cmp;

            return Double.compare((double) b.get("rating"), (double) a.get("rating"));
        });

        for (int i = 0; i < list.size(); i++) {
            list.get(i).put("rank", i + 1);
        }

        return list;
    }

    @Override
    public boolean isTournamentComplete(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        if (fixtures.isEmpty()) return false;
        int n = participants.size();
        int expectedMatches = n * (n - 1) / 2;

        long completedRealMatches = fixtures.stream()
            .filter(m -> !"BYE".equalsIgnoreCase((String) m.get("resultType")))
            .filter(m -> "COMPLETED".equalsIgnoreCase((String) m.get("status")))
            .count();

        return completedRealMatches >= expectedMatches;
    }

    @Override
    public Map<String, Object> getBracket(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        // Round Robin cross-table matrix representation
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("format", "ROUND_ROBIN");
        result.put("totalRounds", (participants.size() % 2 == 0) ? (participants.size() - 1) : participants.size());
        result.put("totalMatchesExpected", participants.size() * (participants.size() - 1) / 2);

        Map<Integer, List<Map<String, Object>>> roundsMap = new TreeMap<>();
        for (Map<String, Object> m : fixtures) {
            int r = ((Number) m.getOrDefault("roundNumber", 1)).intValue();
            roundsMap.computeIfAbsent(r, k -> new ArrayList<>()).add(m);
        }
        result.put("rounds", roundsMap);

        return result;
    }
}
