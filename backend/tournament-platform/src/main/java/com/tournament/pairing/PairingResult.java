package com.tournament.pairing;

import lombok.*;
import java.util.*;

@Data @Builder
public class PairingResult {
    private UUID tournamentId;
    private int roundNumber;
    private List<Pairing> pairings;
    private UUID byeParticipant;
    private double qualityScore;
    private PairingQuality qualityBreakdown;
}
