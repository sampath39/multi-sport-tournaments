package com.tournament.tournament.format;

import com.tournament.rules.SportRulesEngine;
import com.tournament.rules.SportRulesRegistry;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Multi-Sport Round Robin Tournament Engine.
 *
 * Implements:
 * - Berger Circle Method for round-by-round pairing across all sports.
 * - Even N: N - 1 rounds; Odd N: N rounds with 1 Bye per round.
 * - Strict rematch validation: every pair plays exactly once.
 * - Dynamic sport terminology (Pitch, Court, Table, Board).
 * - Cross-Table (head-to-head matrix) generation.
 * - Standings calculated using dedicated SportRulesEngine (GD, NRR, Sets, Games, SB).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoundRobinFormatEngine implements TournamentFormatEngine {

    private final SportRulesRegistry sportRulesRegistry;

    @Override
    public TournamentFormat getFormat() {
        return TournamentFormat.ROUND_ROBIN;
    }

    private SportRulesEngine getSportRules(Tournament tournament) {
        String code = tournament.getSport() != null ? tournament.getSport().getCode() : "CHESS";
        return sportRulesRegistry.getEngine(code);
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

        int totalRounds = (n % 2 == 0) ? (n - 1) : n;
        if (nextRound > totalRounds) {
            throw new IllegalStateException("All " + totalRounds + " Round Robin rounds have already been generated.");
        }

        List<List<Map<String, Object>>> allRounds = generateFullBergerSchedule(tournament, participants);
        validateScheduleIntegrity(allRounds, participants);

        if (nextRound - 1 < allRounds.size()) {
            return allRounds.get(nextRound - 1);
        }

        return Collections.emptyList();
    }

    public List<List<Map<String, Object>>> generateFullBergerSchedule(
        Tournament tournament,
        List<TournamentParticipantDto> rawParticipants
    ) {
        SportRulesEngine rules = getSportRules(tournament);
        String courtTerm = rules.getCourtTerminology();
        boolean isChess = "CHESS".equalsIgnoreCase(rules.getSportCode().name());

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

                if (p1.equals(byeDummy) || p2.equals(byeDummy)) {
                    TournamentParticipantDto realPlayer = p1.equals(byeDummy) ? p2 : p1;
                    Map<String, Object> byeMatch = new LinkedHashMap<>();
                    byeMatch.put("id", UUID.randomUUID().toString());
                    byeMatch.put("tournamentId", tournament.getId().toString());
                    byeMatch.put("roundNumber", r);
                    byeMatch.put("courtName", "BYE");
                    byeMatch.put("participantA", participantMap(realPlayer.getId().toString(), realPlayer.getDisplayName(), 1));
                    byeMatch.put("participantB", participantMap("BYE", "BYE", 0));
                    byeMatch.put("sideA", "SIDE A");
                    byeMatch.put("sideB", "BYE");
                    byeMatch.put("status", "COMPLETED");
                    byeMatch.put("resultType", "BYE");
                    byeMatch.put("winner", realPlayer.getDisplayName());
                    byeMatch.put("pairingReason", "Round " + r + " Bye");
                    byeMatch.put("sportCode", rules.getSportCode().name());
                    roundMatches.add(byeMatch);
                } else {
                    boolean swapSides = (r % 2 == 1 && i == 0) || (i > 0 && (i + r) % 2 == 1);
                    TournamentParticipantDto sideA = swapSides ? p2 : p1;
                    TournamentParticipantDto sideB = swapSides ? p1 : p2;

                    String sideALabel = isChess ? "WHITE" : "SIDE A";
                    String sideBLabel = isChess ? "BLACK" : "SIDE B";

                    Map<String, Object> match = new LinkedHashMap<>();
                    match.put("id", UUID.randomUUID().toString());
                    match.put("tournamentId", tournament.getId().toString());
                    match.put("roundNumber", r);
                    match.put("boardNumber", boardNumber);
                    match.put("courtName", courtTerm + " " + boardNumber);
                    match.put("participantA", participantMap(sideA.getId().toString(), sideA.getDisplayName(), 0));
                    match.put("participantB", participantMap(sideB.getId().toString(), sideB.getDisplayName(), 0));
                    match.put("sideA", sideALabel);
                    match.put("sideB", sideBLabel);
                    match.put("status", "SCHEDULED");
                    match.put("pairingReason", "Round Robin: " + sideA.getDisplayName() + " vs " + sideB.getDisplayName());
                    match.put("sportCode", rules.getSportCode().name());
                    roundMatches.add(match);
                    boardNumber++;
                }
            }

            schedule.add(roundMatches);

            // Rotate circle keeping index 0 fixed
            List<TournamentParticipantDto> nextCircle = new ArrayList<>();
            nextCircle.add(circle.get(0));
            nextCircle.add(circle.get(n - 1));
            for (int k = 1; k < n - 1; k++) {
                nextCircle.add(circle.get(k));
            }
            circle = nextCircle;
        }

        return schedule;
    }

    public void validateScheduleIntegrity(
        List<List<Map<String, Object>>> allRounds,
        List<TournamentParticipantDto> participants
    ) {
        Set<String> pairedPairs = new HashSet<>();
        for (List<Map<String, Object>> round : allRounds) {
            for (Map<String, Object> m : round) {
                @SuppressWarnings("unchecked")
                Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
                @SuppressWarnings("unchecked")
                Map<String, Object> pB = (Map<String, Object>) m.get("participantB");
                if (pA == null || pB == null) continue;

                String idA = (String) pA.get("id");
                String idB = (String) pB.get("id");
                if ("BYE".equals(idB) || "BYE".equals(idA)) continue;

                String pairKey = idA.compareTo(idB) < 0 ? idA + ":" + idB : idB + ":" + idA;
                if (!pairedPairs.add(pairKey)) {
                    throw new IllegalStateException("Duplicate fixture detected in Round Robin schedule: " + pairKey);
                }
            }
        }
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        SportRulesEngine rules = getSportRules(tournament);
        return rules.calculateStandings(tournament, participants, fixtures);
    }

    @Override
    public boolean isTournamentComplete(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        int n = participants.size();
        int totalExpectedMatches = n * (n - 1) / 2;

        long completedRealMatches = fixtures.stream()
            .filter(m -> !"BYE".equalsIgnoreCase((String) m.get("resultType")))
            .filter(m -> "COMPLETED".equalsIgnoreCase((String) m.get("status")))
            .count();

        return completedRealMatches >= totalExpectedMatches;
    }

    @Override
    public Map<String, Object> getBracket(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("format", "ROUND_ROBIN");
        result.put("participantsCount", participants.size());
        result.put("totalRounds", (participants.size() % 2 == 0) ? participants.size() - 1 : participants.size());
        result.put("crossTable", buildCrossTable(participants, fixtures));
        return result;
    }

    public List<Map<String, Object>> buildCrossTable(
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        List<Map<String, Object>> crossTable = new ArrayList<>();
        Map<String, Map<String, String>> matrix = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            matrix.put(p.getId().toString(), new HashMap<>());
        }

        for (Map<String, Object> m : fixtures) {
            if (!"COMPLETED".equalsIgnoreCase((String) m.get("status"))) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");
            if (pA == null || pB == null) continue;

            String idA = (String) pA.get("id");
            String idB = (String) pB.get("id");
            if ("BYE".equals(idB) || idB == null) continue;

            Number sA = (Number) pA.get("score");
            Number sB = (Number) pB.get("score");

            if (matrix.containsKey(idA) && matrix.containsKey(idB)) {
                String scoreStrA = sA != null && sB != null ? sA + "-" + sB : "-";
                String scoreStrB = sA != null && sB != null ? sB + "-" + sA : "-";
                matrix.get(idA).put(idB, scoreStrA);
                matrix.get(idB).put(idA, scoreStrB);
            }
        }

        for (TournamentParticipantDto p : participants) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("participantId", p.getId().toString());
            row.put("participantName", p.getDisplayName());
            row.put("resultsAgainst", matrix.getOrDefault(p.getId().toString(), Collections.emptyMap()));
            crossTable.add(row);
        }

        return crossTable;
    }

    private Map<String, Object> participantMap(String id, String name, Number score) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("name", name);
        map.put("score", score);
        return map;
    }
}
