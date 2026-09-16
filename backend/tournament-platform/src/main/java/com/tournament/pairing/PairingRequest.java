package com.tournament.pairing;

import lombok.*;
import java.util.*;

@Data @Builder
public class PairingRequest {
    private UUID tournamentId;
    private int roundNumber;
    private List<ParticipantState> participants;
    private PairingConfig pairingConfig;
}
