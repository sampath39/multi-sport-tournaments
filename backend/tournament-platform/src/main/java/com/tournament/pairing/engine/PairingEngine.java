package com.tournament.pairing.engine;

import com.tournament.pairing.PairingRequest;
import com.tournament.pairing.PairingResult;

/**
 * PairingEngine interface — implemented by Swiss, Round Robin, Knockout, GroupKnockout engines.
 * New sports and formats can be supported by implementing this interface without modifying existing code.
 */
public interface PairingEngine {

    /**
     * Generate pairings for a round.
     * @param request All participant states, config, and tournament context
     * @return PairingResult with pairings, quality, and bye assignment
     */
    PairingResult generatePairings(PairingRequest request);

    /**
     * @return The format code this engine handles (e.g., "SWISS", "ROUND_ROBIN")
     */
    String getFormatCode();
}
