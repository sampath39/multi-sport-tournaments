package com.tournament.tournament;

import com.tournament.sport.Sport;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TournamentDto {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private String bannerUrl;
    private TournamentStatus status;
    private TournamentFormat formatCode;
    private TournamentType tournamentType;
    private ParticipantType participantType;
    private Integer totalRounds;
    private Integer roundsPerDay;
    private Integer minParticipants;
    private Integer maxParticipants;
    private long currentParticipants;

    // Sport details
    private SportSummary sport;
    private String sportCode;
    private String sportName;

    // Dates & Venue
    private LocalDate startDate;
    private LocalDate endDate;
    private String locationText;
    private String city;
    private String state;
    private String country;
    private UUID venueId;
    private String venueName;

    // Flags
    private boolean isOfficial;
    private boolean isRated;
    private boolean isPublic;
    private boolean hasRegistrationFee;
    private BigDecimal registrationFeeAmount;
    private OffsetDateTime createdAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SportSummary {
        private UUID id;
        private String name;
        private String code;
        private String iconUrl;
        private String participantType;
    }

    public static TournamentDto fromEntity(Tournament t, long activeCount) {
        SportSummary sportSummary = null;
        if (t.getSport() != null) {
            Sport s = t.getSport();
            sportSummary = SportSummary.builder()
                .id(s.getId())
                .name(s.getName())
                .code(s.getCode())
                .iconUrl(s.getIconUrl())
                .participantType(s.getParticipantType())
                .build();
        }

        return TournamentDto.builder()
            .id(t.getId())
            .name(t.getName())
            .slug(t.getSlug())
            .description(t.getDescription())
            .logoUrl(t.getLogoUrl())
            .bannerUrl(t.getBannerUrl())
            .status(t.getStatus())
            .formatCode(t.getFormatCode())
            .tournamentType(t.getTournamentType())
            .participantType(t.getParticipantType())
            .totalRounds(t.getTotalRounds())
            .roundsPerDay(t.getRoundsPerDay())
            .minParticipants(t.getMinParticipants())
            .maxParticipants(t.getMaxParticipants())
            .currentParticipants(activeCount)
            .sport(sportSummary)
            .sportCode(sportSummary != null ? sportSummary.getCode() : null)
            .sportName(sportSummary != null ? sportSummary.getName() : null)
            .startDate(t.getStartDate())
            .endDate(t.getEndDate())
            .locationText(t.getLocationText())
            .city(t.getCity())
            .state(t.getState())
            .country(t.getCountry())
            .venueId(t.getVenue() != null ? t.getVenue().getId() : null)
            .venueName(t.getVenue() != null ? t.getVenue().getName() : null)
            .isOfficial(t.isOfficial())
            .isRated(t.isRated())
            .isPublic(t.isPublic())
            .hasRegistrationFee(t.isHasRegistrationFee())
            .registrationFeeAmount(t.getRegistrationFeeAmount())
            .createdAt(t.getCreatedAt())
            .build();
    }
}
