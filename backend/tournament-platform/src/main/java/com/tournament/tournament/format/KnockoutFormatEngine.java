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
 * Multi-Sport Knockout Engine.
 *
 * Implements:
 * - Single-elimination tree where losers are eliminated immediately.
 * - Standard power-of-two bracket sizing (2^k) with seeds 1..n.
 * - Automatic Round 1 Byes awarded to top seeds.
 * - Dynamic sport terminology (Pitch, Court, Table, Board; Team vs Player).
 * - Draw disallowance: requires definitive winner for progression.
 * - Clear round naming (Round of 64, Round of 32, Round of 16, Quarterfinal, Semifinal, Final).
 * - Full tournament bracket visualization and ranked standings (Champion, Runner-up, Semifinalists).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KnockoutFormatEngine implements TournamentFormatEngine {

    private final SportRulesRegistry sportRulesRegistry;

    @Override
    public TournamentFormat getFormat() {
        return TournamentFormat.KNOCKOUT;
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
            throw new IllegalArgumentException("Knockout tournament requires at least 2 participants.");
        }

        SportRulesEngine rules = getSportRules(tournament);
        String courtTerm = rules.getCourtTerminology();

        // Calculate bracket size: smallest power of 2 >= n
        int bracketSize = 1;
        while (bracketSize < n) {
            bracketSize *= 2;
        }

        int totalRounds = (int) (Math.log(bracketSize) / Math.log(2));
        if (nextRound > totalRounds) {
            throw new IllegalStateException("All " + totalRounds + " knockout rounds have already concluded!");
        }

        // Sort participants by seed asc, then rating desc
        List<TournamentParticipantDto> seeded = new ArrayList<>(participants);
        seeded.sort((a, b) -> {
            int seedA = a.getSeed() != null ? a.getSeed() : Integer.MAX_VALUE;
            int seedB = b.getSeed() != null ? b.getSeed() : Integer.MAX_VALUE;
            if (seedA != seedB) return Integer.compare(seedA, seedB);
            double ratingA = a.getRating() != null ? a.getRating().doubleValue() : 1500.0;
            double ratingB = b.getRating() != null ? b.getRating().doubleValue() : 1500.0;
            return Double.compare(ratingB, ratingA);
        });

        for (int i = 0; i < seeded.size(); i++) {
            if (seeded.get(i).getSeed() == null) {
                seeded.get(i).setSeed(i + 1);
            }
        }

        List<Map<String, Object>> newMatches = new ArrayList<>();

        if (nextRound == 1) {
            // ROUND 1: Generate initial bracket slots using standard seed distribution
            int[] seedOrder = generateBracketSeedOrder(bracketSize);
            int matchCount = bracketSize / 2;
            String roundName = getRoundName(bracketSize);

            for (int i = 0; i < matchCount; i++) {
                int seed1 = seedOrder[2 * i];
                int seed2 = seedOrder[2 * i + 1];

                TournamentParticipantDto p1 = seed1 <= n ? seeded.get(seed1 - 1) : null;
                TournamentParticipantDto p2 = seed2 <= n ? seeded.get(seed2 - 1) : null;

                Map<String, Object> match = new LinkedHashMap<>();
                match.put("id", UUID.randomUUID().toString());
                match.put("tournamentId", tournament.getId().toString());
                match.put("roundNumber", 1);
                match.put("roundName", roundName);
                match.put("bracketPosition", i + 1);
                match.put("sportCode", rules.getSportCode().name());

                if (p1 != null && p2 == null) {
                    // Seed 1 advances automatically with bye
                    match.put("courtName", "BYE");
                    match.put("participantA", participantMap(p1.getId().toString(), p1.getDisplayName(), 1));
                    match.put("participantB", participantMap("BYE", "BYE", 0));
                    match.put("sideA", "SIDE A");
                    match.put("sideB", "BYE");
                    match.put("status", "COMPLETED");
                    match.put("resultType", "BYE");
                    match.put("winner", p1.getDisplayName());
                    match.put("pairingReason", "Seed #" + p1.getSeed() + " advanced via 1st Round Bye");
                } else if (p1 == null && p2 != null) {
                    match.put("courtName", "BYE");
                    match.put("participantA", participantMap(p2.getId().toString(), p2.getDisplayName(), 1));
                    match.put("participantB", participantMap("BYE", "BYE", 0));
                    match.put("sideA", "SIDE A");
                    match.put("sideB", "BYE");
                    match.put("status", "COMPLETED");
                    match.put("resultType", "BYE");
                    match.put("winner", p2.getDisplayName());
                    match.put("pairingReason", "Seed #" + p2.getSeed() + " advanced via 1st Round Bye");
                } else if (p1 != null && p2 != null) {
                    match.put("courtName", courtTerm + " " + (i + 1));
                    match.put("boardNumber", i + 1);
                    boolean isChess = "CHESS".equalsIgnoreCase(rules.getSportCode().name());
                    String sideA = isChess ? (i % 2 == 0 ? "WHITE" : "BLACK") : "SIDE A";
                    String sideB = isChess ? (i % 2 == 0 ? "BLACK" : "WHITE") : "SIDE B";
                    match.put("participantA", participantMap(p1.getId().toString(), p1.getDisplayName(), 0));
                    match.put("participantB", participantMap(p2.getId().toString(), p2.getDisplayName(), 0));
                    match.put("sideA", sideA);
                    match.put("sideB", sideB);
                    match.put("status", "SCHEDULED");
                    match.put("pairingReason", roundName + " (Seed " + p1.getSeed() + " vs Seed " + p2.getSeed() + ")");
                }
                newMatches.add(match);
            }
        } else {
            // SUBSEQUENT ROUNDS: Advance winners from previous round
            int prevRound = nextRound - 1;
            List<Map<String, Object>> prevRoundMatches = existingFixtures.stream()
                .filter(m -> ((Number) m.getOrDefault("roundNumber", 0)).intValue() == prevRound)
                .sorted(Comparator.comparingInt(m -> ((Number) m.getOrDefault("bracketPosition", 0)).intValue()))
                .toList();

            for (Map<String, Object> pm : prevRoundMatches) {
                if (!"COMPLETED".equalsIgnoreCase((String) pm.get("status"))) {
                    throw new IllegalStateException("Cannot generate Round " + nextRound +
                        ": Match in Round " + prevRound + " (" + pm.get("courtName") + ") is not yet completed!");
                }
                String winner = (String) pm.get("winner");
                if (winner == null || winner.trim().isEmpty() || "DRAW".equalsIgnoreCase(winner)) {
                    throw new IllegalStateException("Cannot generate Round " + nextRound +
                        ": Match in Round " + prevRound + " (" + pm.get("courtName") + ") does not have an advancing winner! Knockout matches must determine a winner.");
                }
            }

            int currentRoundSlots = bracketSize / (int) Math.pow(2, nextRound - 1);
            String roundName = getRoundName(currentRoundSlots);
            int matchCount = currentRoundSlots / 2;

            for (int i = 0; i < matchCount; i++) {
                Map<String, Object> feeder1 = prevRoundMatches.get(2 * i);
                Map<String, Object> feeder2 = prevRoundMatches.get(2 * i + 1);

                TournamentParticipantDto p1 = resolveWinnerParticipant(seeded, feeder1);
                TournamentParticipantDto p2 = resolveWinnerParticipant(seeded, feeder2);

                if (p1 == null || p2 == null) {
                    throw new IllegalStateException("Knockout progression error: Winner not determined for feeder matches into match " + (i + 1) + 
                        ". Please ensure all matches in Round " + prevRound + " have a verified winner selected.");
                }

                Map<String, Object> match = new LinkedHashMap<>();
                match.put("id", UUID.randomUUID().toString());
                match.put("tournamentId", tournament.getId().toString());
                match.put("roundNumber", nextRound);
                match.put("roundName", roundName);
                match.put("bracketPosition", i + 1);
                match.put("courtName", courtTerm + " " + (i + 1));
                match.put("boardNumber", i + 1);
                match.put("sportCode", rules.getSportCode().name());

                boolean isChess = "CHESS".equalsIgnoreCase(rules.getSportCode().name());
                String sideA = isChess ? (i % 2 == 0 ? "WHITE" : "BLACK") : "SIDE A";
                String sideB = isChess ? (i % 2 == 0 ? "BLACK" : "WHITE") : "SIDE B";

                match.put("participantA", participantMap(p1.getId().toString(), p1.getDisplayName(), 0));
                match.put("participantB", participantMap(p2.getId().toString(), p2.getDisplayName(), 0));
                match.put("sideA", sideA);
                match.put("sideB", sideB);
                match.put("status", "SCHEDULED");
                match.put("pairingReason", roundName + ": " + p1.getDisplayName() + " vs " + p2.getDisplayName());
                match.put("feederMatch1Id", feeder1.get("id"));
                match.put("feederMatch2Id", feeder2.get("id"));

                newMatches.add(match);
            }
        }

        return newMatches;
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        int n = participants.size();
        int bracketSize = 1;
        while (bracketSize < n) bracketSize *= 2;
        int totalRounds = (int) (Math.log(bracketSize) / Math.log(2));

        Map<String, Integer> highestRoundReached = new HashMap<>();
        Map<String, String> finalStatus = new HashMap<>();
        Map<String, Double> matchWins = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            highestRoundReached.put(p.getDisplayName(), 1);
            finalStatus.put(p.getDisplayName(), "Participating");
            matchWins.put(p.getDisplayName(), 0.0);
        }

        // Trace progression across all completed matches
        for (Map<String, Object> m : fixtures) {
            int round = ((Number) m.getOrDefault("roundNumber", 1)).intValue();
            String status = (String) m.get("status");
            String winner = (String) m.get("winner");

            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");

            String nameA = pA != null ? (String) pA.get("name") : null;
            String nameB = pB != null ? (String) pB.get("name") : null;

            if (nameA != null && !"BYE".equals(nameA)) {
                highestRoundReached.put(nameA, Math.max(highestRoundReached.getOrDefault(nameA, 1), round));
            }
            if (nameB != null && !"BYE".equals(nameB)) {
                highestRoundReached.put(nameB, Math.max(highestRoundReached.getOrDefault(nameB, 1), round));
            }

            if ("COMPLETED".equalsIgnoreCase(status) && winner != null) {
                matchWins.put(winner, matchWins.getOrDefault(winner, 0.0) + 1.0);

                String loser = winner.equals(nameA) ? nameB : nameA;
                if (loser != null && !"BYE".equals(loser)) {
                    if (round == totalRounds) {
                        finalStatus.put(loser, "Finalist (Runner-Up)");
                    } else if (round == totalRounds - 1) {
                        finalStatus.put(loser, "Semifinalist");
                    } else if (round == totalRounds - 2) {
                        finalStatus.put(loser, "Quarterfinalist");
                    } else {
                        finalStatus.put(loser, "Eliminated in Round " + round);
                    }
                }
                if (round == totalRounds) {
                    finalStatus.put(winner, "CHAMPION");
                }
            }
        }

        List<Map<String, Object>> standings = new ArrayList<>();
        for (TournamentParticipantDto p : participants) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("participantId", p.getId().toString());
            row.put("participantName", p.getDisplayName());
            row.put("seed", p.getSeed() != null ? p.getSeed() : 0);
            row.put("highestRound", highestRoundReached.getOrDefault(p.getDisplayName(), 1));
            row.put("resultStage", finalStatus.getOrDefault(p.getDisplayName(), "In Progress"));
            row.put("wins", matchWins.getOrDefault(p.getDisplayName(), 0.0).intValue());
            row.put("points", matchWins.getOrDefault(p.getDisplayName(), 0.0));
            standings.add(row);
        }

        standings.sort((a, b) -> {
            boolean aChamp = "CHAMPION".equals(a.get("resultStage"));
            boolean bChamp = "CHAMPION".equals(b.get("resultStage"));
            if (aChamp) return -1;
            if (bChamp) return 1;

            boolean aFinalist = "Finalist (Runner-Up)".equals(a.get("resultStage"));
            boolean bFinalist = "Finalist (Runner-Up)".equals(b.get("resultStage"));
            if (aFinalist) return -1;
            if (bFinalist) return 1;

            int roundCmp = Integer.compare((int) b.get("highestRound"), (int) a.get("highestRound"));
            if (roundCmp != 0) return roundCmp;

            int winCmp = Integer.compare((int) b.get("wins"), (int) a.get("wins"));
            if (winCmp != 0) return winCmp;

            return Integer.compare((int) a.get("seed"), (int) b.get("seed"));
        });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }

        return standings;
    }

    @Override
    public boolean isTournamentComplete(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        if (fixtures.isEmpty()) return false;

        int n = participants.size();
        int bracketSize = 1;
        while (bracketSize < n) bracketSize *= 2;
        int totalRounds = (int) (Math.log(bracketSize) / Math.log(2));

        // Check if final match exists and is completed
        return fixtures.stream()
            .anyMatch(m -> ((Number) m.getOrDefault("roundNumber", 0)).intValue() == totalRounds &&
                "COMPLETED".equalsIgnoreCase((String) m.get("status")) &&
                m.get("winner") != null);
    }

    @Override
    public Map<String, Object> getBracket(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        int n = participants.size();
        int bracketSize = 1;
        while (bracketSize < n) bracketSize *= 2;
        int totalRounds = (int) (Math.log(bracketSize) / Math.log(2));

        Map<Integer, List<Map<String, Object>>> roundsMap = new LinkedHashMap<>();
        for (int r = 1; r <= totalRounds; r++) {
            roundsMap.put(r, new ArrayList<>());
        }

        for (Map<String, Object> m : fixtures) {
            int round = ((Number) m.getOrDefault("roundNumber", 1)).intValue();
            if (roundsMap.containsKey(round)) {
                roundsMap.get(round).add(m);
            }
        }

        List<Map<String, Object>> roundsList = new ArrayList<>();
        for (Map.Entry<Integer, List<Map<String, Object>>> entry : roundsMap.entrySet()) {
            int r = entry.getKey();
            int slots = bracketSize / (int) Math.pow(2, r - 1);
            Map<String, Object> roundObj = new LinkedHashMap<>();
            roundObj.put("roundNumber", r);
            roundObj.put("roundName", getRoundName(slots));
            roundObj.put("matches", entry.getValue());
            roundsList.add(roundObj);
        }

        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("format", "KNOCKOUT");
        bracket.put("bracketSize", bracketSize);
        bracket.put("totalRounds", totalRounds);
        bracket.put("rounds", roundsList);

        // Identify current champion if tournament concluded
        fixtures.stream()
            .filter(m -> ((Number) m.getOrDefault("roundNumber", 0)).intValue() == totalRounds &&
                "COMPLETED".equalsIgnoreCase((String) m.get("status")))
            .findFirst()
            .ifPresent(finalMatch -> bracket.put("champion", finalMatch.get("winner")));

        return bracket;
    }

    public static int[] generateBracketSeedOrder(int size) {
        if (size == 2) return new int[]{1, 2};
        int[] half = generateBracketSeedOrder(size / 2);
        int[] result = new int[size];
        for (int i = 0; i < half.length; i++) {
            result[2 * i] = half[i];
            result[2 * i + 1] = size + 1 - half[i];
        }
        return result;
    }

    public static String getRoundName(int slotsInRound) {
        return switch (slotsInRound) {
            case 2 -> "Final";
            case 4 -> "Semifinals";
            case 8 -> "Quarterfinals";
            default -> "Round of " + slotsInRound;
        };
    }

    private Map<String, Object> participantMap(String id, String name, Number score) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("name", name);
        map.put("displayName", name);
        map.put("score", score);
        return map;
    }

    private TournamentParticipantDto resolveWinnerParticipant(List<TournamentParticipantDto> participants, Map<String, Object> match) {
        if (match == null) return null;
        String winner = (String) match.get("winner");
        @SuppressWarnings("unchecked")
        Map<String, Object> pA = (Map<String, Object>) match.get("participantA");
        @SuppressWarnings("unchecked")
        Map<String, Object> pB = (Map<String, Object>) match.get("participantB");
        String idA = pA != null ? (String) pA.get("id") : null;
        String idB = pB != null ? (String) pB.get("id") : null;
        String nameA = pA != null ? (String) pA.getOrDefault("displayName", pA.get("name")) : null;
        String nameB = pB != null ? (String) pB.getOrDefault("displayName", pB.get("name")) : null;

        if (winner != null && !winner.isBlank() && !"DRAW".equalsIgnoreCase(winner)) {
            for (TournamentParticipantDto p : participants) {
                if (winner.equalsIgnoreCase(p.getDisplayName()) ||
                    winner.equalsIgnoreCase(p.getFullName()) ||
                    winner.equalsIgnoreCase(p.getId().toString())) {
                    return p;
                }
            }
            if ("participantA".equalsIgnoreCase(winner) || winner.equalsIgnoreCase(nameA) || (idA != null && winner.equalsIgnoreCase(idA))) {
                return findParticipantByIdOrName(participants, idA, nameA);
            }
            if ("participantB".equalsIgnoreCase(winner) || winner.equalsIgnoreCase(nameB) || (idB != null && winner.equalsIgnoreCase(idB))) {
                return findParticipantByIdOrName(participants, idB, nameB);
            }
        }

        // Compare scores if winner string wasn't explicit
        Number sA = pA != null ? (Number) pA.get("score") : null;
        Number sB = pB != null ? (Number) pB.get("score") : null;
        if (sA != null && sB != null) {
            if (sA.doubleValue() > sB.doubleValue()) {
                return findParticipantByIdOrName(participants, idA, nameA);
            } else if (sB.doubleValue() > sA.doubleValue()) {
                return findParticipantByIdOrName(participants, idB, nameB);
            }
        }

        // Check for BYE match
        if ("BYE".equalsIgnoreCase((String) match.get("resultType")) || "BYE".equalsIgnoreCase(nameB) || "BYE".equalsIgnoreCase(idB)) {
            return findParticipantByIdOrName(participants, idA, nameA);
        }
        if ("BYE".equalsIgnoreCase(nameA) || "BYE".equalsIgnoreCase(idA)) {
            return findParticipantByIdOrName(participants, idB, nameB);
        }

        return null;
    }

    private TournamentParticipantDto findParticipantByIdOrName(List<TournamentParticipantDto> participants, String id, String name) {
        if (id != null) {
            for (TournamentParticipantDto p : participants) {
                if (id.equalsIgnoreCase(p.getId().toString())) return p;
            }
        }
        if (name != null) {
            for (TournamentParticipantDto p : participants) {
                if (name.equalsIgnoreCase(p.getDisplayName()) || name.equalsIgnoreCase(p.getFullName())) return p;
            }
        }
        return null;
    }
}
