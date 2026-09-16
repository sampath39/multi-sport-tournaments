package com.tournament.tournament.format;

import com.tournament.pairing.chess.ChessPairing;
import com.tournament.pairing.chess.ChessPlayer;
import com.tournament.pairing.chess.FideSwissChessEngine;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Chess Swiss-System Tournament Engine.
 *
 * Implements FIDE Dutch pairing principles:
 * - Score group sorting and matching
 * - Strict rematch prevention across the entire tournament
 * - Floater management with backtracking
 * - Fair bye allocation (lowest score, no duplicate byes)
 * - Color alternation and balancing
 * - Buchholz and Sonneborn-Berger tiebreakers
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChessSwissFormatEngine implements TournamentFormatEngine {

    private final FideSwissChessEngine chessEngine;

    @Override
    public TournamentFormat getFormat() {
        return TournamentFormat.SWISS;
    }

    @Override
    public List<Map<String, Object>> generateRound(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> existingFixtures,
        int nextRound
    ) {
        if (participants.size() < 2) {
            throw new IllegalArgumentException("Swiss tournament requires at least 2 participants.");
        }

        // Build player history map
        Map<UUID, ChessPlayer> chessPlayerMap = new LinkedHashMap<>();
        for (int i = 0; i < participants.size(); i++) {
            TournamentParticipantDto p = participants.get(i);
            double rating = p.getRating() != null ? p.getRating().doubleValue() : 1500.0;
            int seed = p.getSeed() != null ? p.getSeed() : (i + 1);
            chessPlayerMap.put(p.getId(), ChessPlayer.builder()
                .id(p.getId())
                .name(p.getDisplayName())
                .rating(rating)
                .seed(seed)
                .score(0.0)
                .wins(0)
                .draws(0)
                .losses(0)
                .gamesPlayed(0)
                .whiteGames(0)
                .blackGames(0)
                .colorHistory(new ArrayList<>())
                .opponents(new HashSet<>())
                .byeCount(0)
                .receivedBye(false)
                .build());
        }

        // Reconstruct tournament state from completed / existing fixtures
        for (Map<String, Object> m : existingFixtures) {
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");

            if (pA == null) continue;
            String idAStr = (String) pA.get("id");
            String idBStr = pB != null ? (String) pB.get("id") : null;

            UUID idA = null;
            try { idA = UUID.fromString(idAStr); } catch (Exception ignored) {}
            UUID idB = null;
            try { if (idBStr != null && !"BYE".equalsIgnoreCase(idBStr)) idB = UUID.fromString(idBStr); } catch (Exception ignored) {}

            String resultType = (String) m.get("resultType");
            String winner = (String) m.get("winner");
            double scoreA = pA.get("score") != null ? ((Number) pA.get("score")).doubleValue() : 0.0;
            double scoreB = (pB != null && pB.get("score") != null) ? ((Number) pB.get("score")).doubleValue() : 0.0;

            if ("BYE".equalsIgnoreCase(resultType) || idB == null || "BYE".equalsIgnoreCase(idBStr)) {
                if (idA != null && chessPlayerMap.containsKey(idA)) {
                    chessPlayerMap.get(idA).recordBye();
                }
                continue;
            }

            ChessPlayer playerA = (idA != null) ? chessPlayerMap.get(idA) : null;
            ChessPlayer playerB = (idB != null) ? chessPlayerMap.get(idB) : null;

            if (playerA != null && playerB != null) {
                double resA;
                double resB;
                if (scoreA > scoreB || (winner != null && winner.equals(playerA.getName()))) {
                    resA = 1.0;
                    resB = 0.0;
                } else if (scoreB > scoreA || (winner != null && winner.equals(playerB.getName()))) {
                    resA = 0.0;
                    resB = 1.0;
                } else {
                    resA = 0.5;
                    resB = 0.5;
                }

                // Participant A is White, Participant B is Black
                playerA.recordResult("W", resA, playerB.getId());
                playerB.recordResult("B", resB, playerA.getId());
            }
        }

        // Run FIDE Swiss Engine
        List<ChessPlayer> playerList = new ArrayList<>(chessPlayerMap.values());
        List<ChessPairing> pairings = chessEngine.generatePairings(playerList, nextRound);

        List<Map<String, Object>> newMatches = new ArrayList<>();
        for (ChessPairing cp : pairings) {
            Map<String, Object> match = new LinkedHashMap<>();
            match.put("id", UUID.randomUUID().toString());
            match.put("tournamentId", tournament.getId().toString());
            match.put("roundNumber", nextRound);
            match.put("sportCode", "CHESS");
            match.put("pairingReason", cp.getPairingReason());

            if (cp.isBye()) {
                match.put("courtName", "BYE");
                match.put("participantA", participantMap(cp.getWhitePlayer().getId().toString(), cp.getWhitePlayer().getName(), 1));
                match.put("participantB", participantMap("BYE", "BYE", 0));
                match.put("sideA", "WHITE");
                match.put("sideB", "BYE");
                match.put("status", "COMPLETED");
                match.put("resultType", "BYE");
                match.put("winner", cp.getWhitePlayer().getName());
            } else {
                match.put("courtName", "Board " + cp.getBoardNumber());
                match.put("boardNumber", cp.getBoardNumber());
                match.put("participantA", participantMap(cp.getWhitePlayer().getId().toString(), cp.getWhitePlayer().getName(), 0));
                match.put("participantB", participantMap(cp.getBlackPlayer().getId().toString(), cp.getBlackPlayer().getName(), 0));
                match.put("sideA", "WHITE");
                match.put("sideB", "BLACK");
                match.put("status", "SCHEDULED");
            }
            newMatches.add(match);
        }

        return newMatches;
    }

    private Map<String, Object> participantMap(String id, String displayName, Number score) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("id", id);
        p.put("displayName", displayName);
        p.put("score", score);
        return p;
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<String, Map<String, Object>> stats = new LinkedHashMap<>();
        Map<String, List<String>> opponentsMap = new HashMap<>();
        Map<String, List<String>> defeatedMap = new HashMap<>();
        Map<String, List<String>> drawnMap = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("participantId", p.getId().toString());
            s.put("participantName", p.getDisplayName());
            s.put("played", 0);
            s.put("won", 0);
            s.put("drawn", 0);
            s.put("lost", 0);
            s.put("points", 0.0);
            s.put("buchholz", 0.0);
            s.put("sonnebornBerger", 0.0);
            s.put("rating", p.getRating() != null ? p.getRating().doubleValue() : 1500.0);
            stats.put(p.getDisplayName(), s);
            opponentsMap.put(p.getDisplayName(), new ArrayList<>());
            defeatedMap.put(p.getDisplayName(), new ArrayList<>());
            drawnMap.put(p.getDisplayName(), new ArrayList<>());
        }

        for (Map<String, Object> m : fixtures) {
            String status = (String) m.get("status");
            if (!"COMPLETED".equalsIgnoreCase(status)) continue;

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

            if (nameA != null && stats.containsKey(nameA)) {
                Map<String, Object> sA = stats.get(nameA);
                sA.put("played", ((int) sA.get("played")) + 1);
                if (nameB != null && !"BYE".equals(nameB)) opponentsMap.get(nameA).add(nameB);

                if (scoreA > scoreB || (winner != null && winner.equals(nameA))) {
                    sA.put("won", ((int) sA.get("won")) + 1);
                    sA.put("points", ((double) sA.get("points")) + 1.0);
                    if (nameB != null) defeatedMap.get(nameA).add(nameB);
                } else if (scoreA == scoreB && (winner == null || "DRAW".equalsIgnoreCase(winner))) {
                    sA.put("drawn", ((int) sA.get("drawn")) + 1);
                    sA.put("points", ((double) sA.get("points")) + 0.5);
                    if (nameB != null) drawnMap.get(nameA).add(nameB);
                } else {
                    sA.put("lost", ((int) sA.get("lost")) + 1);
                }
            }

            if (nameB != null && stats.containsKey(nameB) && !"BYE".equals(nameB)) {
                Map<String, Object> sB = stats.get(nameB);
                sB.put("played", ((int) sB.get("played")) + 1);
                if (nameA != null) opponentsMap.get(nameB).add(nameA);

                if (scoreB > scoreA || (winner != null && winner.equals(nameB))) {
                    sB.put("won", ((int) sB.get("won")) + 1);
                    sB.put("points", ((double) sB.get("points")) + 1.0);
                    if (nameA != null) defeatedMap.get(nameB).add(nameA);
                } else if (scoreB == scoreA && (winner == null || "DRAW".equalsIgnoreCase(winner))) {
                    sB.put("drawn", ((int) sB.get("drawn")) + 1);
                    sB.put("points", ((double) sB.get("points")) + 0.5);
                    if (nameA != null) drawnMap.get(nameB).add(nameA);
                } else {
                    sB.put("lost", ((int) sB.get("lost")) + 1);
                }
            }
        }

        // Calculate Buchholz and Sonneborn-Berger
        for (Map.Entry<String, Map<String, Object>> entry : stats.entrySet()) {
            String name = entry.getKey();
            Map<String, Object> row = entry.getValue();

            // Buchholz = sum of opponents' total points
            double buchholz = 0.0;
            List<String> opps = opponentsMap.getOrDefault(name, Collections.emptyList());
            for (String opp : opps) {
                if (stats.containsKey(opp)) {
                    buchholz += (double) stats.get(opp).get("points");
                }
            }
            row.put("buchholz", buchholz);

            // Sonneborn-Berger = 1.0 * points of defeated opponents + 0.5 * points of drawn opponents
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
            cmp = Double.compare((double) b.get("buchholz"), (double) a.get("buchholz"));
            if (cmp != 0) return cmp;
            cmp = Double.compare((double) b.get("sonnebornBerger"), (double) a.get("sonnebornBerger"));
            if (cmp != 0) return cmp;
            return Double.compare((double) b.getOrDefault("rating", 1500.0), (double) a.getOrDefault("rating", 1500.0));
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
        int totalRounds = tournament.getTotalRounds() != null ? tournament.getTotalRounds() : 5;

        int maxRoundGenerated = fixtures.stream()
            .mapToInt(m -> ((Number) m.getOrDefault("roundNumber", 1)).intValue())
            .max().orElse(0);

        if (maxRoundGenerated < totalRounds) return false;

        return fixtures.stream().allMatch(m -> "COMPLETED".equalsIgnoreCase((String) m.get("status")));
    }

    @Override
    public Map<String, Object> getBracket(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        // Swiss tournaments don't have a tree bracket; return round-by-round summary
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("format", "SWISS");
        result.put("totalRounds", tournament.getTotalRounds());
        result.put("rounds", fixtures);
        return result;
    }
}
