package com.tournament.pairing.engine;

import com.tournament.pairing.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Single Elimination Knockout Engine.
 *
 * Seeds participants and generates brackets.
 * Standard seeding: 1 vs last, 2 vs second-last, etc.
 * Bracket automatically advances winners.
 */
@Slf4j
@Component
public class KnockoutEngine implements PairingEngine {

    @Override
    public PairingResult generatePairings(PairingRequest request) {
        List<ParticipantState> participants = request.getParticipants().stream()
            .filter(p -> p.getStatus() == ParticipantStatus.ACTIVE && !p.isWithdrawn())
            .sorted(Comparator.comparingDouble(ParticipantState::getPoints).reversed()
                .thenComparingInt(p -> p.getSeed() != null ? p.getSeed() : Integer.MAX_VALUE))
            .collect(Collectors.toList());

        int n = participants.size();
        if (n < 2) throw new com.tournament.common.PairingException("Need at least 2 participants for knockout.");

        // Find next power of 2 to determine bracket size
        int bracketSize = Integer.highestOneBit(n - 1) << 1;
        if (bracketSize < n) bracketSize *= 2;

        List<Pairing> pairings = new ArrayList<>();
        int half = bracketSize / 2;

        // Standard seeding: Seed 1 vs Seed N, Seed 2 vs Seed N-1, etc.
        for (int i = 0; i < half; i++) {
            int topIdx = i;
            int botIdx = bracketSize - 1 - i;

            if (topIdx >= n) continue;  // Bye slot

            if (botIdx >= n) {
                // This is a bye — top participant advances automatically
                // Mark as bye match (participant_b = null)
                pairings.add(Pairing.builder()
                    .participantAId(participants.get(topIdx).getParticipantId())
                    .participantBId(null)
                    .scoreDiff(0.0)
                    .repeatEncounterNumber(0)
                    .pairingReason(Map.of("method", "SINGLE_ELIMINATION", "bracket_position", i + 1, "is_bye", true))
                    .build());
            } else {
                pairings.add(Pairing.builder()
                    .participantAId(participants.get(topIdx).getParticipantId())
                    .participantBId(participants.get(botIdx).getParticipantId())
                    .scoreDiff(Math.abs(participants.get(topIdx).getPoints() - participants.get(botIdx).getPoints()))
                    .repeatEncounterNumber(participants.get(topIdx).getEncounterCount(participants.get(botIdx).getParticipantId()))
                    .pairingReason(Map.of("method", "SINGLE_ELIMINATION", "bracket_position", i + 1,
                        "seed_a", topIdx + 1, "seed_b", botIdx + 1))
                    .build());
            }
        }

        log.info("Knockout bracket: {} matchups generated (bracket size={})", pairings.size(), bracketSize);

        return PairingResult.builder()
            .tournamentId(request.getTournamentId())
            .roundNumber(request.getRoundNumber())
            .pairings(pairings)
            .qualityScore(100.0)
            .qualityBreakdown(PairingQuality.perfect())
            .build();
    }

    @Override
    public String getFormatCode() { return "SINGLE_ELIMINATION"; }
}
