package com.tournament.pairing;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class PairingQuality {
    private double overallScore;
    private double sameScorePct;
    private double noRepeatOpponentPct;
    private double colorBalancePct;
    private int totalPairs;

    public static PairingQuality perfect() {
        return PairingQuality.builder()
            .overallScore(100.0)
            .sameScorePct(100.0)
            .noRepeatOpponentPct(100.0)
            .colorBalancePct(100.0)
            .totalPairs(0)
            .build();
    }
}
