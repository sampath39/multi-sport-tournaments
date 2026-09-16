package com.tournament.pairing;

import lombok.*;
import java.util.*;

/**
 * Represents the state of a participant going into a pairing round.
 * Includes all data needed to make fair pairing decisions.
 */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ParticipantState {
    private UUID participantId;
    private String displayName;
    private double points;
    private double rating;
    private Integer seed;
    private Integer rank;
    private ParticipantStatus status;
    private boolean withdrawn;
    private boolean disqualified;

    // History
    private Set<UUID> previousOpponents;       // all previous opponent IDs
    private Map<UUID, Integer> encounterCounts; // opponentId -> number of encounters
    private int byeCount;

    // Chess-specific color tracking
    private int whiteGames;
    private int blackGames;
    private String lastColor;  // "WHITE" or "BLACK"

    public boolean hasPreviouslyFaced(UUID opponentId) {
        return previousOpponents != null && previousOpponents.contains(opponentId);
    }

    public int getEncounterCount(UUID opponentId) {
        if (encounterCounts == null) return 0;
        return encounterCounts.getOrDefault(opponentId, 0);
    }
}
