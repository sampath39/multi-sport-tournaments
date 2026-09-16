package com.tournament.pairing;

import java.util.UUID;
import java.util.Map;
import lombok.*;

@Data @Builder
public class Pairing {
    private UUID participantAId;
    private UUID participantBId;
    private String colorA;
    private String colorB;
    private double scoreDiff;
    private int repeatEncounterNumber;
    private String constraintRelaxation;  // null if no relaxation needed
    private Map<String, Object> pairingReason;
}
