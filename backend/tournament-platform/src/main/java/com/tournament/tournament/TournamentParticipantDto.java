package com.tournament.tournament;

import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TournamentParticipantDto {
    private UUID id;
    private UUID tournamentId;
    private UUID playerId;
    private String displayName;
    private String fullName;
    private String email;
    private Integer seed;
    private BigDecimal rating;
    private String category;
    private String checkInStatus;
    private String status;
    private OffsetDateTime registeredAt;
}
