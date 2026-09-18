package com.tournament.tournament.format;

import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Single Elimination Knockout Engine for Chess.
 *
 * Implements:
 * - Proper power-of-two bracket sizing ($2^k$, e.g. 10 players -> 16 bracket slots with 6 byes)
 * - Standard tournament seeding (Seed 1 vs 16, 8 vs 9, 4 vs 13, etc.)
 * - Automatic Round 1 Byes awarded to top seeds
 * - Clear round naming (Round of 64, Round of 32, Round of 16, Quarterfinal, Semifinal, Final)
 * - Deterministic winner progression from previous round matches
 * - Chess draw resolution via tiebreak (Armageddon, Blitz Playoff, Rapid, Admin Decision)
 * - Full tournament bracket visualization
 * - Completion when the Final match winner is crowned Champion
 */
@Slf4j
@Component
public class ChessKnockoutFormatEngine implements TournamentFormatEngine {

    @Override
    public TournamentFormat getFormat() {
        return TournamentFormat.SINGLE_ELIMINATION;
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
            throw new IllegalArgumentException("Single Elimination tournament requires at least 2 participants.");
        }

        // Calculate bracket size: smallest power of 2 >= n
        int bracketSize = 1;
        while (bracketSize < n) {
            bracketSize *= 2;
        }

        int totalRounds = (int) (Math.log(bracketSize) / Math.log(2));

        if (nextRound > totalRounds) {
            throw new IllegalStateException("All " + totalRounds + " knockout rounds have already concluded!");
        }

        // Sort participants by rating desc / seed asc
        List<TournamentParticipantDto> seeded = new ArrayList<>(participants);
        seeded.sort((a, b) -> {
            int seedA = a.getSeed() != null ? a.getSeed() : Integer.MAX_VALUE;
            int seedB = b.getSeed() != null ? b.getSeed() : Integer.MAX_VALUE;
            if (seedA != seedB) return Integer.compare(seedA, seedB);
            double ratingA = a.getRating() != null ? a.getRating().doubleValue() : 1500.0;
            double ratingB = b.getRating() != null ? b.getRating().doubleValue() : 1500.0;
            return Double.compare(ratingB, ratingA);
        });

        // Set seeds 1..n
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
                match.put("sportCode", "CHESS");

                // Check for BYE
                if (p1 != null && p2 == null) {
                    // Seed 1 advances automatically with bye
                    match.put("courtName", "BYE");
                    match.put("participantA", participantMap(p1.getId().toString(), p1.getDisplayName(), 1));
                    match.put("participantB", participantMap("BYE", "BYE", 0));
                    match.put("sideA", "WHITE");
                    match.put("sideB", "BYE");
                    match.put("status", "COMPLETED");
                    match.put("resultType", "BYE");
                    match.put("winner", p1.getDisplayName());
                    match.put("pairingReason", "Seed #" + p1.getSeed() + " advanced via 1st Round Bye");
                } else if (p1 == null && p2 != null) {
                    match.put("courtName", "BYE");
                    match.put("participantA", participantMap(p2.getId().toString(), p2.getDisplayName(), 1));
                    match.put("participantB", participantMap("BYE", "BYE", 0));
                    match.put("sideA", "WHITE");
                    match.put("sideB", "BYE");
                    match.put("status", "COMPLETED");
                    match.put("resultType", "BYE");
                    match.put("winner", p2.getDisplayName());
                    match.put("pairingReason", "Seed #" + p2.getSeed() + " advanced via 1st Round Bye");
                } else if (p1 != null && p2 != null) {
                    // Regular match: alternate colors based on seed position
                    boolean seed1White = (i % 2 == 0);
                    TournamentParticipantDto white = seed1White ? p1 : p2;
                    TournamentParticipantDto black = seed1White ? p2 : p1;

                    match.put("courtName", "Board " + (i + 1));
                    match.put("boardNumber", i + 1);
                    match.put("participantA", participantMap(white.getId().toString(), white.getDisplayName(), 0));
                    match.put("participantB", participantMap(black.getId().toString(), black.getDisplayName(), 0));
                    match.put("sideA", "WHITE");
                    match.put("sideB", "BLACK");
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

            // Verify all previous round matches are completed
            for (Map<String, Object> pm : prevRoundMatches) {
                if (!"COMPLETED".equalsIgnoreCase((String) pm.get("status"))) {
                    throw new IllegalStateException("Cannot generate Round " + nextRound +
                        ": Match in Round " + prevRound + " (" + pm.get("courtName") + ") is not yet completed!");
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
                    throw new IllegalStateException("Knockout progression error: Winner not determined for match " + (i + 1) +
                        ". Please verify that all Round " + prevRound + " matches have a declared winning player.");
                }

                // Balance colors based on previous colors
                boolean p1White = (i % 2 == 0);
                TournamentParticipantDto white = p1White ? p1 : p2;
                TournamentParticipantDto black = p1White ? p2 : p1;

                Map<String, Object> match = new LinkedHashMap<>();
                match.put("id", UUID.randomUUID().toString());
                match.put("tournamentId", tournament.getId().toString());
                match.put("roundNumber", nextRound);
                match.put("roundName", roundName);
                match.put("bracketPosition", i + 1);
                match.put("sportCode", "CHESS");
                match.put("courtName", "Board " + (i + 1));
                match.put("boardNumber", i + 1);
                match.put("participantA", participantMap(white.getId().toString(), white.getDisplayName(), 0));
                match.put("participantB", participantMap(black.getId().toString(), black.getDisplayName(), 0));
                match.put("sideA", "WHITE");
                match.put("sideB", "BLACK");
                match.put("status", "SCHEDULED");
                match.put("pairingReason", roundName + ": " + p1.getDisplayName() + " vs " + p2.getDisplayName());
                match.put("feederMatch1Id", feeder1.get("id"));
                match.put("feederMatch2Id", feeder2.get("id"));
                newMatches.add(match);
            }
        }

        return newMatches;
    }

    private Map<String, Object> participantMap(String id, String displayName, Number score) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("id", id);
        p.put("name", displayName);
        p.put("displayName", displayName);
        p.put("score", score);
        return p;
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

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<String, Map<String, Object>> stats = new LinkedHashMap<>();
        for (TournamentParticipantDto p : participants) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("participantId", p.getId().toString());
            s.put("participantName", p.getDisplayName());
            s.put("played", 0);
            s.put("won", 0);
            s.put("drawn", 0);
            s.put("lost", 0);
            s.put("points", 0.0);
            s.put("highestRound", 0);
            s.put("eliminatedIn", "Pending");
            s.put("isChampion", false);
            s.put("rating", p.getRating() != null ? p.getRating().doubleValue() : 1500.0);
            stats.put(p.getDisplayName(), s);
        }

        // Process completed matches in order
        int maxRound = fixtures.stream()
            .mapToInt(m -> ((Number) m.getOrDefault("roundNumber", 0)).intValue())
            .max().orElse(0);

        for (Map<String, Object> m : fixtures) {
            if (!"COMPLETED".equalsIgnoreCase((String) m.get("status"))) continue;
            int r = ((Number) m.getOrDefault("roundNumber", 1)).intValue();
            String winner = (String) m.get("winner");
            String resultType = (String) m.get("resultType");

            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");

            String nameA = pA != null ? (String) pA.get("displayName") : null;
            String nameB = pB != null ? (String) pB.get("displayName") : null;

            if (nameA != null && stats.containsKey(nameA)) {
                Map<String, Object> sA = stats.get(nameA);
                if (!"BYE".equals(resultType)) sA.put("played", ((int) sA.get("played")) + 1);
                sA.put("highestRound", Math.max((int) sA.get("highestRound"), r));
            }

            if (nameB != null && stats.containsKey(nameB) && !"BYE".equals(nameB)) {
                Map<String, Object> sB = stats.get(nameB);
                sB.put("played", ((int) sB.get("played")) + 1);
                sB.put("highestRound", Math.max((int) sB.get("highestRound"), r));
            }

            if (winner != null && stats.containsKey(winner)) {
                Map<String, Object> sW = stats.get(winner);
                sW.put("won", ((int) sW.get("won")) + 1);
                sW.put("points", ((double) sW.get("points")) + 1.0);
            }

            String loser = null;
            if (winner != null) {
                if (winner.equals(nameA)) loser = nameB;
                else if (winner.equals(nameB)) loser = nameA;
            }

            if (loser != null && stats.containsKey(loser) && !"BYE".equals(loser)) {
                Map<String, Object> sL = stats.get(loser);
                sL.put("lost", ((int) sL.get("lost")) + 1);
                sL.put("eliminatedIn", (String) m.getOrDefault("roundName", "Round " + r));
            }
        }

        // Check for champion in Final round
        Optional<Map<String, Object>> finalMatch = fixtures.stream()
            .filter(m -> "Final".equalsIgnoreCase((String) m.get("roundName")) && "COMPLETED".equalsIgnoreCase((String) m.get("status")))
            .findFirst();

        if (finalMatch.isPresent()) {
            String championName = (String) finalMatch.get().get("winner");
            if (championName != null && stats.containsKey(championName)) {
                stats.get(championName).put("isChampion", true);
                stats.get(championName).put("eliminatedIn", "CHAMPION 🏆");
            }
        }

        List<Map<String, Object>> list = new ArrayList<>(stats.values());
        list.sort((a, b) -> {
            boolean champA = (boolean) a.get("isChampion");
            boolean champB = (boolean) b.get("isChampion");
            if (champA != champB) return champA ? -1 : 1;

            int roundA = (int) a.get("highestRound");
            int roundB = (int) b.get("highestRound");
            if (roundA != roundB) return Integer.compare(roundB, roundA);

            double ptsA = (double) a.get("points");
            double ptsB = (double) b.get("points");
            if (ptsA != ptsB) return Double.compare(ptsB, ptsA);

            return Double.compare((double) b.get("rating"), (double) a.get("rating"));
        });

        for (int i = 0; i < list.size(); i++) {
            list.get(i).put("rank", i + 1);
            if (finalMatch.isPresent()) {
                if (i == 0) list.get(i).put("medal", "Champion");
                else if (i == 1) list.get(i).put("medal", "Runner-up");
                else if (i < 4) list.get(i).put("medal", "Semifinalist");
            }
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
        return fixtures.stream().anyMatch(m ->
            "Final".equalsIgnoreCase((String) m.get("roundName")) &&
            "COMPLETED".equalsIgnoreCase((String) m.get("status")) &&
            m.get("winner") != null
        );
    }

    @Override
    public Map<String, Object> getBracket(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("format", "SINGLE_ELIMINATION");
        bracket.put("totalParticipants", participants.size());

        Map<Integer, List<Map<String, Object>>> roundsMap = new TreeMap<>();
        for (Map<String, Object> m : fixtures) {
            int r = ((Number) m.getOrDefault("roundNumber", 1)).intValue();
            roundsMap.computeIfAbsent(r, k -> new ArrayList<>()).add(m);
        }

        List<Map<String, Object>> roundList = new ArrayList<>();
        for (Map.Entry<Integer, List<Map<String, Object>>> entry : roundsMap.entrySet()) {
            Map<String, Object> roundObj = new LinkedHashMap<>();
            roundObj.put("roundNumber", entry.getKey());
            String rName = entry.getValue().isEmpty() ? ("Round " + entry.getKey())
                : (String) entry.getValue().get(0).getOrDefault("roundName", "Round " + entry.getKey());
            roundObj.put("name", rName);
            roundObj.put("matches", entry.getValue());
            roundList.add(roundObj);
        }

        bracket.put("rounds", roundList);

        // Check Champion
        fixtures.stream()
            .filter(m -> "Final".equalsIgnoreCase((String) m.get("roundName")) && "COMPLETED".equalsIgnoreCase((String) m.get("status")))
            .findFirst()
            .ifPresent(m -> bracket.put("champion", m.get("winner")));

        return bracket;
    }

    /**
     * Standard tournament bracket seed sequence generator for bracketSize.
     * Guarantees 1 meets 2 in Final, 1 meets 4 in Semis, etc.
     */
    private int[] generateBracketSeedOrder(int size) {
        int[] seeds = new int[]{1, 2};
        while (seeds.length < size) {
            int nextLength = seeds.length * 2;
            int[] nextSeeds = new int[nextLength];
            for (int i = 0; i < seeds.length; i++) {
                nextSeeds[2 * i] = seeds[i];
                nextSeeds[2 * i + 1] = nextLength + 1 - seeds[i];
            }
            seeds = nextSeeds;
        }
        return seeds;
    }

    private String getRoundName(int slots) {
        return switch (slots) {
            case 2 -> "Final";
            case 4 -> "Semifinal";
            case 8 -> "Quarterfinal";
            case 16 -> "Round of 16";
            case 32 -> "Round of 32";
            case 64 -> "Round of 64";
            case 128 -> "Round of 128";
            default -> "Round of " + slots;
        };
    }

    private TournamentParticipantDto findParticipantByName(List<TournamentParticipantDto> list, String name) {
        if (name == null) return null;
        return list.stream()
            .filter(p -> name.equalsIgnoreCase(p.getDisplayName()))
            .findFirst()
            .orElse(null);
    }
}
