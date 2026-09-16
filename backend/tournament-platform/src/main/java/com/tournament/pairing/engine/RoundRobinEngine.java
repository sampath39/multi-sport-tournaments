package com.tournament.pairing.engine;

import com.tournament.pairing.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Round Robin Pairing Engine.
 *
 * Implements the Berger / Circle method for generating all round-robin pairings.
 * For N participants:
 *   - Single Round Robin: N-1 rounds (or N rounds if N is odd, with bye)
 *   - Double Round Robin: 2*(N-1) rounds
 *
 * Algorithm: Fix participant 0, rotate participants 1..N-1 clockwise.
 * Home/away assignment alternates for team sports.
 */
@Slf4j
@Component
public class RoundRobinEngine implements PairingEngine {

    @Override
    public PairingResult generatePairings(PairingRequest request) {
        List<ParticipantState> participants = new ArrayList<>(request.getParticipants().stream()
            .filter(p -> p.getStatus() == ParticipantStatus.ACTIVE && !p.isWithdrawn())
            .toList());

        int n = participants.size();
        if (n < 2) throw new com.tournament.common.PairingException("Need at least 2 active participants for Round Robin.");

        // For odd n, add a "dummy" bye slot
        ParticipantState byeSlot = null;
        if (n % 2 == 1) {
            byeSlot = ParticipantState.builder()
                .participantId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .displayName("BYE")
                .status(ParticipantStatus.BYE)
                .build();
            participants.add(byeSlot);
            n++;
        }

        int roundNumber = request.getRoundNumber();
        int totalRounds = n - 1;
        int roundIndex = (roundNumber - 1) % totalRounds;  // 0-indexed

        // Berger rotation: fix first, rotate rest
        List<ParticipantState> rotation = new ArrayList<>(participants);

        // Apply rotation for the given round index
        for (int i = 0; i < roundIndex; i++) {
            ParticipantState last = rotation.remove(rotation.size() - 1);
            rotation.add(1, last);
        }

        List<Pairing> pairings = new ArrayList<>();
        int half = n / 2;

        for (int i = 0; i < half; i++) {
            ParticipantState a = rotation.get(i);
            ParticipantState b = rotation.get(n - 1 - i);

            boolean isByeMatch = a.getParticipantId().equals(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                || b.getParticipantId().equals(UUID.fromString("00000000-0000-0000-0000-000000000000"));

            if (!isByeMatch) {
                // Alternate home/away per round (for team sports)
                String homeAway = (roundIndex % 2 == 0) ? "HOME" : "AWAY";

                pairings.add(Pairing.builder()
                    .participantAId(a.getParticipantId())
                    .participantBId(b.getParticipantId())
                    .colorA(request.getPairingConfig().isSideBalanceEnabled() ? homeAway : null)
                    .colorB(request.getPairingConfig().isSideBalanceEnabled()
                        ? (homeAway.equals("HOME") ? "AWAY" : "HOME") : null)
                    .scoreDiff(0.0)
                    .repeatEncounterNumber(a.getEncounterCount(b.getParticipantId()))
                    .pairingReason(Map.of("method", "BERGER_ROTATION", "round_index", roundIndex))
                    .build());
            }
        }

        UUID byeParticipantId = null;
        if (byeSlot != null) {
            // Find which real participant got the bye slot
            for (int i = 0; i < half; i++) {
                ParticipantState a = rotation.get(i);
                ParticipantState b = rotation.get(n - 1 - i);
                if (a.getParticipantId().equals(byeSlot.getParticipantId())) {
                    byeParticipantId = b.getParticipantId();
                    break;
                }
                if (b.getParticipantId().equals(byeSlot.getParticipantId())) {
                    byeParticipantId = a.getParticipantId();
                    break;
                }
            }
        }

        log.info("Round robin pairing: round={} pairs={}", roundNumber, pairings.size());

        return PairingResult.builder()
            .tournamentId(request.getTournamentId())
            .roundNumber(roundNumber)
            .pairings(pairings)
            .byeParticipant(byeParticipantId)
            .qualityScore(100.0)
            .qualityBreakdown(PairingQuality.perfect())
            .build();
    }

    @Override
    public String getFormatCode() { return "ROUND_ROBIN"; }
}
