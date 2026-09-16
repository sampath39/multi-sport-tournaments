package com.tournament.tournament.format;

import com.tournament.pairing.chess.ChessPairing;
import com.tournament.pairing.chess.ChessPlayer;
import com.tournament.pairing.chess.FideSwissChessEngine;
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
 * Multi-Sport Swiss System Engine.
 *
 * Implements:
 * - Score-group sorting and matching (participants with equal scores paired together).
 * - Strict rematch prevention across the entire tournament.
 * - Floater management with backtracking between adjacent score groups.
 * - Fair bye allocation (lowest score group, no duplicate byes).
 * - Sport-specific match point attribution and standings.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SwissFormatEngine implements TournamentFormatEngine {

    private final FideSwissChessEngine pairingCore;
    private final SportRulesRegistry sportRulesRegistry;

    @Override
    public TournamentFormat getFormat() {
        return TournamentFormat.SWISS;
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
        if (participants.size() < 2) {
            throw new IllegalArgumentException("Swiss tournament requires at least 2 participants.");
        }

        SportRulesEngine rules = getSportRules(tournament);
        String courtTerm = rules.getCourtTerminology();
        boolean isChess = "CHESS".equalsIgnoreCase(rules.getSportCode().name());

        // Build participant state map
        Map<UUID, ChessPlayer> playerMap = new LinkedHashMap<>();
        for (int i = 0; i < participants.size(); i++) {
            TournamentParticipantDto p = participants.get(i);
            double rating = p.getRating() != null ? p.getRating().doubleValue() : 1500.0;
            int seed = p.getSeed() != null ? p.getSeed() : (i + 1);
            playerMap.put(p.getId(), ChessPlayer.builder()
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

        // Reconstruct tournament state from existing fixtures using sport-specific rules
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
            Number scoreA = (Number) pA.get("score");
            Number scoreB = pB != null ? (Number) pB.get("score") : null;

            if ("BYE".equalsIgnoreCase(resultType) || idB == null || "BYE".equalsIgnoreCase(idBStr)) {
                if (idA != null && playerMap.containsKey(idA)) {
                    playerMap.get(idA).recordBye();
                }
                continue;
            }

            if (idA == null || !playerMap.containsKey(idA) || !playerMap.containsKey(idB)) {
                continue;
            }

            ChessPlayer plA = playerMap.get(idA);
            ChessPlayer plB = playerMap.get(idB);

            plA.getOpponents().add(idB);
            plB.getOpponents().add(idA);
            plA.setGamesPlayed(plA.getGamesPlayed() + 1);
            plB.setGamesPlayed(plB.getGamesPlayed() + 1);

            String sideA = (String) m.get("sideA");
            boolean whiteA = "WHITE".equalsIgnoreCase(sideA) || (m.get("boardNumber") != null && ((Number) m.get("boardNumber")).intValue() % 2 == 1);
            String colA = whiteA ? "W" : "B";
            String colB = whiteA ? "B" : "W";

            if ("COMPLETED".equalsIgnoreCase((String) m.get("status"))) {
                double[] pts = rules.calculateMatchPoints(scoreA, scoreB, winner, tournament.getFormatCode());
                plA.recordResult(colA, pts[0], idB);
                plB.recordResult(colB, pts[1], idA);
            } else {
                plA.addOpponent(idB);
                plB.addOpponent(idA);
            }
        }

        List<ChessPlayer> players = new ArrayList<>(playerMap.values());
        List<ChessPairing> pairings = pairingCore.generatePairings(players, nextRound);

        List<Map<String, Object>> newFixtures = new ArrayList<>();
        int boardNum = 1;

        for (ChessPairing p : pairings) {
            Map<String, Object> match = new LinkedHashMap<>();
            match.put("id", UUID.randomUUID().toString());
            match.put("tournamentId", tournament.getId().toString());
            match.put("roundNumber", nextRound);
            match.put("boardNumber", boardNum);
            match.put("sportCode", rules.getSportCode().name());

            if (p.isBye()) {
                match.put("courtName", "BYE");
                match.put("participantA", participantMap(p.getWhitePlayer().getId().toString(), p.getWhitePlayer().getName(), rules.getWinPoints(tournament.getFormatCode())));
                match.put("participantB", participantMap("BYE", "BYE", 0));
                match.put("sideA", "SIDE A");
                match.put("sideB", "BYE");
                match.put("status", "COMPLETED");
                match.put("resultType", "BYE");
                match.put("winner", p.getWhitePlayer().getName());
                match.put("pairingReason", "Swiss Bye (lowest available score group, no previous bye)");
            } else {
                match.put("courtName", courtTerm + " " + boardNum);
                String sideALabel = isChess ? "WHITE" : "SIDE A";
                String sideBLabel = isChess ? "BLACK" : "SIDE B";
                match.put("participantA", participantMap(p.getWhitePlayer().getId().toString(), p.getWhitePlayer().getName(), 0));
                match.put("participantB", participantMap(p.getBlackPlayer().getId().toString(), p.getBlackPlayer().getName(), 0));
                match.put("sideA", sideALabel);
                match.put("sideB", sideBLabel);
                match.put("status", "SCHEDULED");
                match.put("pairingReason", "Score " + p.getWhitePlayer().getScore() + " vs " + p.getBlackPlayer().getScore());
                boardNum++;
            }

            newFixtures.add(match);
        }

        return newFixtures;
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
        int totalRounds = tournament.getTotalRounds() != null ? tournament.getTotalRounds() : 5;
        long completedRounds = fixtures.stream()
            .map(m -> ((Number) m.getOrDefault("roundNumber", 1)).intValue())
            .distinct()
            .count();

        boolean allMatchesCompleted = fixtures.stream()
            .allMatch(m -> "COMPLETED".equalsIgnoreCase((String) m.get("status")));

        return completedRounds >= totalRounds && allMatchesCompleted && !fixtures.isEmpty();
    }

    @Override
    public Map<String, Object> getBracket(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("format", "SWISS");
        bracket.put("participantsCount", participants.size());
        bracket.put("totalRounds", tournament.getTotalRounds());
        bracket.put("standings", calculateStandings(tournament, participants, fixtures));
        return bracket;
    }

    private Map<String, Object> participantMap(String id, String name, Number score) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("name", name);
        map.put("score", score);
        return map;
    }
}
