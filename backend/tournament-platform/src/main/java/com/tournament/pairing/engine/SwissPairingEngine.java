package com.tournament.pairing.engine;

import com.tournament.common.PairingException;
import com.tournament.pairing.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Swiss Pairing Engine
 *
 * Implements the Dutch (FIDE) Swiss system as the baseline with configurable overrides.
 *
 * RULE CLASSIFICATION:
 *  - Hard constraints = must never be violated (correctness)
 *  - Soft constraints = weighted preferences (fairness)
 *
 * Official source: FIDE Handbook — Rules for FIDE Swiss Tournaments (as baseline)
 * Tournament administrators can override soft constraints via configuration.
 */
@Slf4j
@Component
public class SwissPairingEngine implements PairingEngine {

    // ─── Soft constraint penalty weights ────────────────────────────────────
    private static final double SCORE_DIFF_WEIGHT    = 100.0;
    private static final double REPEAT_OPPONENT_PEN  = 1000.0;
    private static final double COLOR_IMBALANCE_PEN  = 10.0;
    private static final double SEED_VIOLATION_PEN   = 5.0;

    @Override
    public PairingResult generatePairings(PairingRequest request) {
        log.info("Swiss pairing: tournament={} round={} participants={}",
            request.getTournamentId(), request.getRoundNumber(), request.getParticipants().size());

        List<ParticipantState> participants = filterEligible(request.getParticipants());

        if (participants.isEmpty()) {
            throw new PairingException("No eligible participants available for pairing.");
        }

        // Sort by score desc, then by rating desc (seeding as tiebreak within score groups)
        participants.sort(Comparator
            .comparingDouble(ParticipantState::getPoints).reversed()
            .thenComparingDouble(ParticipantState::getRating).reversed());

        // Handle bye if odd number of participants
        ParticipantState byeParticipant = null;
        if (participants.size() % 2 != 0) {
            byeParticipant = selectByeParticipant(participants, request);
            participants.remove(byeParticipant);
            log.info("Bye assigned to: {} (points={})", byeParticipant.getParticipantId(), byeParticipant.getPoints());
        }

        // Generate pairings using weighted matching
        List<Pairing> pairings = generateOptimalPairings(participants, request);

        // Validate all hard constraints
        validateHardConstraints(pairings, request);

        // Calculate pairing quality score
        PairingQuality quality = calculateQuality(pairings, participants, request);

        // Build result
        PairingResult result = PairingResult.builder()
            .tournamentId(request.getTournamentId())
            .roundNumber(request.getRoundNumber())
            .pairings(pairings)
            .byeParticipant(byeParticipant != null ? byeParticipant.getParticipantId() : null)
            .qualityScore(quality.getOverallScore())
            .qualityBreakdown(quality)
            .build();

        log.info("Swiss pairing complete: {} pairs generated, quality={:.1f}%",
            pairings.size(), quality.getOverallScore());

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HARD CONSTRAINT: Filter eligible participants only
    // ─────────────────────────────────────────────────────────────────────────

    private List<ParticipantState> filterEligible(List<ParticipantState> all) {
        return all.stream()
            .filter(p -> p.getStatus() == ParticipantStatus.ACTIVE)
            .filter(p -> !p.isWithdrawn())
            .filter(p -> !p.isDisqualified())
            .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BYE SELECTION
    // Fairness: give bye to player with lowest score who hasn't had one
    // (FIDE baseline: last-place player receives bye)
    // ─────────────────────────────────────────────────────────────────────────

    private ParticipantState selectByeParticipant(
        List<ParticipantState> participants, PairingRequest request
    ) {
        // First: prefer player with 0 previous byes, starting from bottom
        Optional<ParticipantState> noBye = participants.stream()
            .filter(p -> p.getByeCount() == 0)
            .min(Comparator.comparingDouble(ParticipantState::getPoints)
                .thenComparingDouble(ParticipantState::getRating));

        if (noBye.isPresent()) return noBye.get();

        // If all have had byes: pick the one with fewest byes, lowest score
        return participants.stream()
            .min(Comparator.comparingInt(ParticipantState::getByeCount)
                .thenComparingDouble(ParticipantState::getPoints)
                .thenComparingDouble(ParticipantState::getRating))
            .orElseThrow(() -> new PairingException("Cannot select bye participant"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE PAIRING: Score-group based with backtracking for small tournaments
    // ─────────────────────────────────────────────────────────────────────────

    private List<Pairing> generateOptimalPairings(
        List<ParticipantState> participants, PairingRequest request
    ) {
        // Group participants by score
        Map<Double, List<ParticipantState>> scoreGroups = participants.stream()
            .collect(Collectors.groupingBy(ParticipantState::getPoints));

        List<Double> sortedScores = scoreGroups.keySet().stream()
            .sorted(Comparator.reverseOrder())
            .collect(Collectors.toList());

        List<Pairing> result = new ArrayList<>();
        List<ParticipantState> floaters = new ArrayList<>();  // Players who drop from a higher group

        for (Double score : sortedScores) {
            List<ParticipantState> group = new ArrayList<>(scoreGroups.get(score));
            group.addAll(floaters);
            floaters.clear();

            // Sort group: top-half will be paired with bottom-half (FIDE method)
            group.sort(Comparator.comparingDouble(ParticipantState::getRating).reversed());

            List<Pairing> groupPairings = pairScoreGroup(group, floaters, request);
            result.addAll(groupPairings);
        }

        // If any floaters remain unpaired (shouldn't happen after bye handling, but safety check)
        if (!floaters.isEmpty()) {
            throw new PairingException(
                "Pairing failed: " + floaters.size() + " participants could not be paired. " +
                "Check eligibility and constraint configuration."
            );
        }

        return result;
    }

    /**
     * Pair a single score group using the FIDE split-half method with backtracking.
     * Top half paired against bottom half, avoiding repeat opponents.
     * Floaters (excess players) are returned for the next score group.
     */
    private List<Pairing> pairScoreGroup(
        List<ParticipantState> group,
        List<ParticipantState> floaters,
        PairingRequest request
    ) {
        List<Pairing> pairings = new ArrayList<>();

        if (group.size() % 2 == 1) {
            // One player will float to next group
            // Float the one with highest score in this group (drop-down to lower group is standard)
            floaters.add(group.remove(group.size() - 1));
        }

        if (group.isEmpty()) return pairings;

        int half = group.size() / 2;
        List<ParticipantState> topHalf = new ArrayList<>(group.subList(0, half));
        List<ParticipantState> bottomHalf = new ArrayList<>(group.subList(half, group.size()));

        // Try optimal matching with backtracking
        boolean[] bottomUsed = new boolean[bottomHalf.size()];
        pairWithBacktracking(topHalf, bottomHalf, bottomUsed, 0, pairings, request);

        return pairings;
    }

    /**
     * Recursive backtracking pairing.
     * For each top-half player, find the best available bottom-half opponent.
     */
    private boolean pairWithBacktracking(
        List<ParticipantState> topHalf,
        List<ParticipantState> bottomHalf,
        boolean[] used,
        int topIndex,
        List<Pairing> pairings,
        PairingRequest request
    ) {
        if (topIndex == topHalf.size()) return true;

        ParticipantState top = topHalf.get(topIndex);

        // Get candidates sorted by preference (lowest penalty first)
        List<Integer> candidates = rankCandidates(top, bottomHalf, used, request);

        for (int candidateIdx : candidates) {
            ParticipantState bottom = bottomHalf.get(candidateIdx);

            // HARD CONSTRAINT: Never pair player with themselves (shouldn't happen, but safety)
            if (top.getParticipantId().equals(bottom.getParticipantId())) continue;

            // HARD CONSTRAINT: No repeat opponents (unless config allows it)
            if (!request.getPairingConfig().isAllowRepeatOpponents()
                && top.hasPreviouslyFaced(bottom.getParticipantId())) {
                continue;
            }

            used[candidateIdx] = true;
            String colorA = determineColor(top, bottom, request);
            String colorB = colorA != null ? (colorA.equals("WHITE") ? "BLACK" : "WHITE") : null;

            pairings.add(Pairing.builder()
                .participantAId(top.getParticipantId())
                .participantBId(bottom.getParticipantId())
                .colorA(colorA)
                .colorB(colorB)
                .scoreDiff(Math.abs(top.getPoints() - bottom.getPoints()))
                .repeatEncounterNumber(top.getEncounterCount(bottom.getParticipantId()))
                .pairingReason(buildPairingReason(top, bottom, request))
                .build());

            if (pairWithBacktracking(topHalf, bottomHalf, used, topIndex + 1, pairings, request)) {
                return true;
            }

            // Backtrack
            pairings.remove(pairings.size() - 1);
            used[candidateIdx] = false;
        }

        // If we couldn't pair — relax constraint: allow repeat opponent
        if (!request.getPairingConfig().isAllowRepeatOpponents()) {
            log.warn("Relaxing repeat-opponent constraint for participant {}", top.getParticipantId());
            for (int i = 0; i < bottomHalf.size(); i++) {
                if (used[i]) continue;
                ParticipantState bottom = bottomHalf.get(i);
                used[i] = true;
                String colorA = determineColor(top, bottom, request);
                String colorB = colorA != null ? (colorA.equals("WHITE") ? "BLACK" : "WHITE") : null;

                pairings.add(Pairing.builder()
                    .participantAId(top.getParticipantId())
                    .participantBId(bottom.getParticipantId())
                    .colorA(colorA)
                    .colorB(colorB)
                    .scoreDiff(Math.abs(top.getPoints() - bottom.getPoints()))
                    .repeatEncounterNumber(top.getEncounterCount(bottom.getParticipantId()))
                    .constraintRelaxation("REPEAT_OPPONENT_ALLOWED")
                    .pairingReason(buildPairingReason(top, bottom, request))
                    .build());

                if (pairWithBacktracking(topHalf, bottomHalf, used, topIndex + 1, pairings, request)) {
                    return true;
                }
                pairings.remove(pairings.size() - 1);
                used[i] = false;
            }
        }

        return false;
    }

    /**
     * Rank bottom-half candidates for a given top-half player.
     * Lower penalty = better candidate.
     */
    private List<Integer> rankCandidates(
        ParticipantState top,
        List<ParticipantState> bottomHalf,
        boolean[] used,
        PairingRequest request
    ) {
        List<int[]> scored = new ArrayList<>();
        for (int i = 0; i < bottomHalf.size(); i++) {
            if (used[i]) continue;
            double penalty = calculatePenalty(top, bottomHalf.get(i), request);
            scored.add(new int[]{i, (int)(penalty * 100)});
        }
        scored.sort(Comparator.comparingInt(a -> a[1]));
        return scored.stream().map(a -> a[0]).collect(Collectors.toList());
    }

    /**
     * Calculate soft-constraint penalty for a potential pairing.
     * Lower is better.
     */
    private double calculatePenalty(ParticipantState a, ParticipantState b, PairingRequest request) {
        double penalty = 0.0;

        // Score difference penalty
        penalty += Math.abs(a.getPoints() - b.getPoints()) * SCORE_DIFF_WEIGHT;

        // Repeat opponent penalty
        int encounters = a.getEncounterCount(b.getParticipantId());
        penalty += encounters * REPEAT_OPPONENT_PEN;

        // Color balance penalty (for chess)
        if (request.getPairingConfig().isColorBalanceEnabled()) {
            penalty += calculateColorPenalty(a, b);
        }

        // Seed violation penalty
        penalty += calculateSeedPenalty(a, b) * SEED_VIOLATION_PEN;

        return penalty;
    }

    /**
     * Color assignment for chess (WHITE/BLACK balance).
     * Returns color for participant A.
     */
    private String determineColor(ParticipantState a, ParticipantState b, PairingRequest request) {
        if (!request.getPairingConfig().isColorBalanceEnabled()) return null;

        int aDiff = a.getWhiteGames() - a.getBlackGames();
        int bDiff = b.getWhiteGames() - b.getBlackGames();

        if (aDiff < bDiff) return "WHITE";   // A needs white
        if (aDiff > bDiff) return "BLACK";   // A needs black
        if (a.getLastColor() != null && a.getLastColor().equals("WHITE")) return "BLACK";
        if (b.getLastColor() != null && b.getLastColor().equals("WHITE")) return "WHITE";
        return Math.random() < 0.5 ? "WHITE" : "BLACK";  // Random if perfectly balanced
    }

    private double calculateColorPenalty(ParticipantState a, ParticipantState b) {
        int aDiff = a.getWhiteGames() - a.getBlackGames();
        int bDiff = b.getWhiteGames() - b.getBlackGames();
        // Same color preference = worse
        return (aDiff > 0 && bDiff > 0) || (aDiff < 0 && bDiff < 0) ? COLOR_IMBALANCE_PEN : 0;
    }

    private double calculateSeedPenalty(ParticipantState a, ParticipantState b) {
        if (a.getSeed() == null || b.getSeed() == null) return 0;
        // Ideally seed 1 plays seed 2 in same score group — deviation penalized slightly
        return Math.abs((a.getSeed() - b.getSeed()) - 1) * 0.1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HARD CONSTRAINT VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    private void validateHardConstraints(List<Pairing> pairings, PairingRequest request) {
        Set<UUID> seen = new HashSet<>();

        for (Pairing p : pairings) {
            // HARD: No player appears twice in same round
            if (!seen.add(p.getParticipantAId())) {
                throw new PairingException("HARD CONSTRAINT VIOLATION: Participant " +
                    p.getParticipantAId() + " appears twice in round " + request.getRoundNumber());
            }
            if (p.getParticipantBId() != null && !seen.add(p.getParticipantBId())) {
                throw new PairingException("HARD CONSTRAINT VIOLATION: Participant " +
                    p.getParticipantBId() + " appears twice in round " + request.getRoundNumber());
            }

            // HARD: Player cannot face themselves
            if (p.getParticipantAId().equals(p.getParticipantBId())) {
                throw new PairingException("HARD CONSTRAINT VIOLATION: Self-pairing detected for " +
                    p.getParticipantAId());
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAIRING QUALITY SCORE
    // ─────────────────────────────────────────────────────────────────────────

    private PairingQuality calculateQuality(
        List<Pairing> pairings, List<ParticipantState> participants, PairingRequest request
    ) {
        if (pairings.isEmpty()) return PairingQuality.perfect();

        long sameScoreCount = pairings.stream()
            .filter(p -> p.getScoreDiff() == 0.0)
            .count();
        double sameScorePct = (double) sameScoreCount / pairings.size() * 100;

        long noRepeatCount = pairings.stream()
            .filter(p -> p.getRepeatEncounterNumber() == 0)
            .count();
        double noRepeatPct = (double) noRepeatCount / pairings.size() * 100;

        // Color balance quality
        double colorBalancePct = calculateColorBalanceQuality(pairings, participants);

        double overall = (sameScorePct * 0.4) + (noRepeatPct * 0.4) + (colorBalancePct * 0.2);

        return PairingQuality.builder()
            .overallScore(overall)
            .sameScorePct(sameScorePct)
            .noRepeatOpponentPct(noRepeatPct)
            .colorBalancePct(colorBalancePct)
            .totalPairs(pairings.size())
            .build();
    }

    private double calculateColorBalanceQuality(List<Pairing> pairings, List<ParticipantState> participants) {
        if (pairings.stream().allMatch(p -> p.getColorA() == null)) return 100.0;
        long balanced = pairings.stream()
            .filter(p -> p.getColorA() != null && p.getColorB() != null)
            .count();
        return pairings.isEmpty() ? 100.0 : (double) balanced / pairings.size() * 100;
    }

    private Map<String, Object> buildPairingReason(
        ParticipantState a, ParticipantState b, PairingRequest request
    ) {
        Map<String, Object> reason = new LinkedHashMap<>();
        reason.put("participantA_points", a.getPoints());
        reason.put("participantB_points", b.getPoints());
        reason.put("score_difference", Math.abs(a.getPoints() - b.getPoints()));
        reason.put("previous_encounters", a.getEncounterCount(b.getParticipantId()));
        reason.put("color_a", determineColor(a, b, request));
        reason.put("pairing_method", "SWISS_DUTCH");
        reason.put("reason", a.getPoints() == b.getPoints()
            ? "Same score group with no previous encounter and acceptable color balance."
            : "Score-group float: closest available opponent after same-group exhausted.");
        return reason;
    }

    @Override
    public String getFormatCode() { return "SWISS"; }
}
