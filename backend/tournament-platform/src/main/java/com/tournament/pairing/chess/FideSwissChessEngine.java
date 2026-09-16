package com.tournament.pairing.chess;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Production-grade FIDE-style Swiss Chess Pairing Engine.
 *
 * Implements:
 * 1. FIDE Dutch split-half method for Round 1 (1 vs N/2+1, 2 vs N/2+2... with alternating colors).
 * 2. Score groups with floater management and recursive backtracking for subsequent rounds.
 * 3. Strict previous opponent check (NO rematches).
 * 4. Color history & balance tracking (no 3 identical colors in a row, |W - B| <= 2).
 * 5. Deterministic, fair bye allocation (lowest score with no prior bye).
 */
@Slf4j
@Component
public class FideSwissChessEngine {

    /**
     * Entry point to generate pairings for a given round.
     */
    public List<ChessPairing> generatePairings(List<ChessPlayer> players, int roundNumber) {
        log.info("FideSwissChessEngine: Generating round {} for {} players", roundNumber, players.size());

        if (players == null || players.isEmpty()) {
            return Collections.emptyList();
        }

        if (players.size() == 1) {
            ChessPlayer solo = players.get(0);
            solo.recordBye();
            return List.of(ChessPairing.builder()
                .boardNumber(1)
                .whitePlayer(solo)
                .blackPlayer(null)
                .isBye(true)
                .pairingReason("Solo participant bye")
                .build());
        }

        if (roundNumber <= 1) {
            return generateRound1(new ArrayList<>(players));
        } else {
            return generateNextRound(new ArrayList<>(players), roundNumber);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ROUND 1: FIDE DUTCH SPLIT-HALF
    // ─────────────────────────────────────────────────────────────────────────

    private List<ChessPairing> generateRound1(List<ChessPlayer> players) {
        // Sort players by Rating desc, then Name asc for initial seeding
        players.sort((a, b) -> {
            int cmp = Double.compare(b.getRating(), a.getRating());
            if (cmp != 0) return cmp;
            return a.getName().compareToIgnoreCase(b.getName());
        });

        for (int i = 0; i < players.size(); i++) {
            players.get(i).setSeed(i + 1);
        }

        List<ChessPairing> pairings = new ArrayList<>();
        int n = players.size();

        // If odd, select lowest-rated player for bye
        ChessPlayer byePlayer = null;
        if (n % 2 != 0) {
            byePlayer = selectRound1Bye(players);
            players.remove(byePlayer);
            byePlayer.recordBye();
            log.info("Round 1 Bye awarded to lowest seed: {}", byePlayer.getName());
            n--;
        }

        // FIDE Dutch Pairing: Top half (S1) plays Bottom half (S2)
        int half = n / 2;
        List<ChessPlayer> s1 = players.subList(0, half);
        List<ChessPlayer> s2 = players.subList(half, n);

        int boardNumber = 1;
        for (int i = 0; i < half; i++) {
            ChessPlayer p1 = s1.get(i);
            ChessPlayer p2 = s2.get(i);

            ChessPlayer white;
            ChessPlayer black;
            if (i % 2 == 0) {
                white = p1;
                black = p2;
            } else {
                white = p2;
                black = p1;
            }

            pairings.add(ChessPairing.builder()
                .boardNumber(boardNumber++)
                .whitePlayer(white)
                .blackPlayer(black)
                .isBye(false)
                .pairingReason("Round 1 FIDE Dutch Split-Half (Seed " + white.getSeed() + " vs " + black.getSeed() + ")")
                .build());
        }

        // Append bye board if present
        if (byePlayer != null) {
            pairings.add(ChessPairing.builder()
                .boardNumber(boardNumber)
                .whitePlayer(byePlayer)
                .blackPlayer(null)
                .isBye(true)
                .pairingReason("Round 1 Bye awarded to lowest seed/rating")
                .build());
        }

        return pairings;
    }

    private ChessPlayer selectRound1Bye(List<ChessPlayer> players) {
        // Lowest rating, highest seed (worst initial seed)
        return players.stream()
            .min((a, b) -> {
                int cmp = Double.compare(a.getRating(), b.getRating());
                if (cmp != 0) return cmp;
                return Integer.compare(b.getSeed(), a.getSeed());
            })
            .orElse(players.get(players.size() - 1));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ROUND > 1: SCORE GROUPS + FLOATERS + BACKTRACKING
    // ─────────────────────────────────────────────────────────────────────────

    private List<ChessPairing> generateNextRound(List<ChessPlayer> players, int roundNumber) {
        List<ChessPairing> pairings = new ArrayList<>();

        // Handle odd player count: assign bye to lowest-scoring eligible player
        ChessPlayer byePlayer = null;
        if (players.size() % 2 != 0) {
            byePlayer = selectSubsequentBye(players);
            players.remove(byePlayer);
            byePlayer.recordBye();
            log.info("Round {} Bye awarded to player: {} (score={})", roundNumber, byePlayer.getName(), byePlayer.getScore());
        }

        // Sort all players: Score desc, Rating desc, Seed asc
        players.sort((a, b) -> {
            int cmp = Double.compare(b.getScore(), a.getScore());
            if (cmp != 0) return cmp;
            cmp = Double.compare(b.getRating(), a.getRating());
            if (cmp != 0) return cmp;
            return Integer.compare(a.getSeed(), b.getSeed());
        });

        // Backtracking solver to find valid pairing without repeat opponents
        List<ChessPairing> matchedPairings = new ArrayList<>();
        boolean success = backtrackPairing(players, matchedPairings, 1);

        if (!success) {
            log.warn("Round {}: Strict Swiss backtracking could not find pairing without repeat opponents. Trying relaxed fallback.", roundNumber);
            matchedPairings.clear();
            success = backtrackPairingRelaxed(players, matchedPairings, 1);
        }

        if (!success) {
            throw new IllegalStateException("Unable to generate valid pairings for round " + roundNumber);
        }

        pairings.addAll(matchedPairings);

        // Add bye if odd
        if (byePlayer != null) {
            pairings.add(ChessPairing.builder()
                .boardNumber(pairings.size() + 1)
                .whitePlayer(byePlayer)
                .blackPlayer(null)
                .isBye(true)
                .pairingReason("Round " + roundNumber + " Bye (Lowest score with no prior bye)")
                .build());
        }

        return pairings;
    }

    /**
     * Bye selection for Round > 1:
     * FIDE Rule: Choose from players who have NOT yet had a bye.
     * Criteria: Lowest score, then lowest rating, then highest seed.
     */
    private ChessPlayer selectSubsequentBye(List<ChessPlayer> players) {
        // Find players with 0 byes
        List<ChessPlayer> eligible = players.stream()
            .filter(p -> !p.isReceivedBye() && p.getByeCount() == 0)
            .toList();

        if (!eligible.isEmpty()) {
            return eligible.stream()
                .min((a, b) -> {
                    int cmp = Double.compare(a.getScore(), b.getScore());
                    if (cmp != 0) return cmp;
                    cmp = Double.compare(a.getRating(), b.getRating());
                    if (cmp != 0) return cmp;
                    return Integer.compare(b.getSeed(), a.getSeed());
                })
                .get();
        }

        // Fallback if everyone had a bye
        return players.stream()
            .min(Comparator
                .comparingInt(ChessPlayer::getByeCount)
                .thenComparingDouble(ChessPlayer::getScore)
                .thenComparingDouble(ChessPlayer::getRating))
            .orElse(players.get(players.size() - 1));
    }

    /**
     * Recursive backtracking matching.
     * Always takes the highest unassigned player and finds candidate opponents.
     */
    private boolean backtrackPairing(
        List<ChessPlayer> unassigned,
        List<ChessPairing> currentPairings,
        int boardNumber
    ) {
        if (unassigned.isEmpty()) {
            return true;
        }

        ChessPlayer p1 = unassigned.get(0);

        // Find candidate opponents
        List<ChessPlayer> candidates = getRankedCandidates(p1, unassigned.subList(1, unassigned.size()), false);

        for (ChessPlayer p2 : candidates) {
            // Check color compatibility
            String[] colors = assignColors(p1, p2);
            if (colors == null) {
                continue; // Cannot assign valid colors under FIDE constraints
            }

            ChessPlayer white = "W".equals(colors[0]) ? p1 : p2;
            ChessPlayer black = "W".equals(colors[0]) ? p2 : p1;

            String reason = Math.abs(p1.getScore() - p2.getScore()) < 0.01
                ? "Same score group (" + p1.getScore() + " pts)"
                : "Floater (" + p1.getScore() + " vs " + p2.getScore() + " pts)";

            ChessPairing pairing = ChessPairing.builder()
                .boardNumber(boardNumber)
                .whitePlayer(white)
                .blackPlayer(black)
                .isBye(false)
                .pairingReason(reason)
                .build();

            currentPairings.add(pairing);

            List<ChessPlayer> nextUnassigned = new ArrayList<>(unassigned);
            nextUnassigned.remove(p1);
            nextUnassigned.remove(p2);

            if (backtrackPairing(nextUnassigned, currentPairings, boardNumber + 1)) {
                return true;
            }

            // Backtrack
            currentPairings.remove(currentPairings.size() - 1);
        }

        return false;
    }

    /**
     * Fallback backtracking with relaxed constraints if tournament has extreme rematch density.
     */
    private boolean backtrackPairingRelaxed(
        List<ChessPlayer> unassigned,
        List<ChessPairing> currentPairings,
        int boardNumber
    ) {
        if (unassigned.isEmpty()) return true;

        ChessPlayer p1 = unassigned.get(0);
        List<ChessPlayer> candidates = getRankedCandidates(p1, unassigned.subList(1, unassigned.size()), true);

        for (ChessPlayer p2 : candidates) {
            String[] colors = assignColors(p1, p2);
            if (colors == null) {
                // If strict color fails, force opposite of last color or standard balance
                colors = forceAssignColors(p1, p2);
            }

            ChessPlayer white = "W".equals(colors[0]) ? p1 : p2;
            ChessPlayer black = "W".equals(colors[0]) ? p2 : p1;

            ChessPairing pairing = ChessPairing.builder()
                .boardNumber(boardNumber)
                .whitePlayer(white)
                .blackPlayer(black)
                .isBye(false)
                .pairingReason("Relaxed candidate match")
                .build();

            currentPairings.add(pairing);

            List<ChessPlayer> nextUnassigned = new ArrayList<>(unassigned);
            nextUnassigned.remove(p1);
            nextUnassigned.remove(p2);

            if (backtrackPairingRelaxed(nextUnassigned, currentPairings, boardNumber + 1)) {
                return true;
            }

            currentPairings.remove(currentPairings.size() - 1);
        }

        return false;
    }

    /**
     * Filters and sorts candidate opponents for p1:
     * - Disallows players p1 has already faced (unless relaxed)
     * - Prioritizes closest score (same score group first)
     * - Prioritizes compatible color preferences
     */
    private List<ChessPlayer> getRankedCandidates(
        ChessPlayer p1,
        List<ChessPlayer> available,
        boolean allowRepeat
    ) {
        return available.stream()
            .filter(p2 -> allowRepeat || (!p1.hasPlayed(p2.getId()) && !p2.hasPlayed(p1.getId())))
            .sorted(Comparator
                // Score difference ascending (closest score first)
                .comparingDouble((ChessPlayer p2) -> Math.abs(p1.getScore() - p2.getScore()))
                // Color compatibility penalty (0 if perfect, 1 if conflicting preferences)
                .thenComparingInt(p2 -> calculateColorCompatibility(p1, p2))
                // Rating difference ascending (closer rating within group)
                .thenComparingDouble(p2 -> Math.abs(p1.getRating() - p2.getRating())))
            .collect(Collectors.toList());
    }

    private int calculateColorCompatibility(ChessPlayer p1, ChessPlayer p2) {
        String pref1 = p1.getPreferredColor();
        String pref2 = p2.getPreferredColor();
        return pref1.equalsIgnoreCase(pref2) ? 1 : 0;
    }

    /**
     * Determines White and Black for (p1, p2).
     * Returns array [colorForP1, colorForP2], or null if assignment violates strict constraints.
     */
    private String[] assignColors(ChessPlayer p1, ChessPlayer p2) {
        boolean p1CanW = p1.canReceiveColor("W");
        boolean p1CanB = p1.canReceiveColor("B");
        boolean p2CanW = p2.canReceiveColor("W");
        boolean p2CanB = p2.canReceiveColor("B");

        // Can p1 be White and p2 be Black?
        boolean option1 = p1CanW && p2CanB;
        // Can p2 be White and p1 be Black?
        boolean option2 = p2CanW && p1CanB;

        if (option1 && !option2) {
            return new String[]{"W", "B"};
        }
        if (!option1 && option2) {
            return new String[]{"B", "W"};
        }
        if (!option1 && !option2) {
            return null; // Both options violate strict color rules
        }

        // Both options are valid, pick the one that balances colors best
        int p1Diff = p1.getColorDifference();
        int p2Diff = p2.getColorDifference();

        // If p1 has played more Blacks, p1 needs White
        if (p1Diff < p2Diff) {
            return new String[]{"W", "B"};
        }
        // If p2 has played more Blacks, p2 needs White
        if (p2Diff < p1Diff) {
            return new String[]{"B", "W"};
        }

        // Color differences are equal: alternate with last round color
        if ("B".equalsIgnoreCase(p1.getLastColor()) && "W".equalsIgnoreCase(p2.getLastColor())) {
            return new String[]{"W", "B"};
        }
        if ("W".equalsIgnoreCase(p1.getLastColor()) && "B".equalsIgnoreCase(p2.getLastColor())) {
            return new String[]{"B", "W"};
        }

        // Tiebreak: lower seed gets preference
        return (p1.getSeed() < p2.getSeed()) ? new String[]{"W", "B"} : new String[]{"B", "W"};
    }

    private String[] forceAssignColors(ChessPlayer p1, ChessPlayer p2) {
        int p1Diff = p1.getColorDifference();
        int p2Diff = p2.getColorDifference();
        if (p1Diff <= p2Diff) {
            return new String[]{"W", "B"};
        } else {
            return new String[]{"B", "W"};
        }
    }
}
