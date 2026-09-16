package com.tournament.tournament;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTournamentRequest {
    private String name;
    private String description;

    @JsonAlias({"sportId", "sport", "sportCode"})
    private String sport;

    @JsonAlias({"competitionType", "format", "formatCode"})
    private String competitionType;

    @JsonAlias({"tier", "tournamentType", "type"})
    private String tier;

    private String participantType;

    private Integer maxParticipants;
    private Integer minParticipants;
    private Integer totalRounds;

    @JsonAlias({"entryFee", "registrationFeeAmount"})
    private BigDecimal entryFee;

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationStart;
    private LocalDate registrationEnd;

    private String venueId;
    private String locationText;
}
