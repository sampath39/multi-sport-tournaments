package com.tournament.tournament;

import com.tournament.sport.Sport;
import com.tournament.venue.Venue;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tournaments")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sport_id", nullable = false)
    private Sport sport;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "short_name")
    private String shortName;

    private String description;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(name = "tournament_type")
    @Enumerated(EnumType.STRING)
    private TournamentType tournamentType = TournamentType.CASUAL;

    @Column(name = "participant_type")
    @Enumerated(EnumType.STRING)
    private ParticipantType participantType = ParticipantType.INDIVIDUAL;

    @Column(name = "format_code", nullable = false)
    @Enumerated(EnumType.STRING)
    private TournamentFormat formatCode;

    @Column(name = "total_rounds")
    private Integer totalRounds;

    @Column(name = "rounds_per_day")
    private Integer roundsPerDay;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TournamentStatus status = TournamentStatus.DRAFT;

    // Dates
    @Column(name = "registration_start_at")
    private OffsetDateTime registrationStartAt;

    @Column(name = "registration_deadline_at")
    private OffsetDateTime registrationDeadlineAt;

    @Column(name = "check_in_start_at")
    private OffsetDateTime checkInStartAt;

    @Column(name = "check_in_deadline_at")
    private OffsetDateTime checkInDeadlineAt;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    // Location
    @Column(name = "location_text")
    private String locationText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id")
    private Venue venue;

    private String city;
    private String state;
    private String country;
    private String timezone;

    // Participants
    @Column(name = "min_participants")
    private Integer minParticipants;

    @Column(name = "expected_participants")
    private Integer expectedParticipants;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "registration_mode")
    @Enumerated(EnumType.STRING)
    private RegistrationMode registrationMode = RegistrationMode.OPEN_REGISTRATION;

    // Eligibility
    @Column(name = "age_restriction_min")
    private Integer ageRestrictionMin;

    @Column(name = "age_restriction_max")
    private Integer ageRestrictionMax;

    @Column(name = "gender_restriction")
    private String genderRestriction;

    // Flags
    @Column(name = "is_official")
    private boolean isOfficial = false;

    @Column(name = "is_rated")
    private boolean isRated = false;

    @Column(name = "is_public")
    private boolean isPublic = true;

    @Column(name = "has_registration_fee")
    private boolean hasRegistrationFee = false;

    @Column(name = "registration_fee_amount")
    private BigDecimal registrationFeeAmount;

    // Config snapshot (immutable after publish)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config_snapshot", columnDefinition = "jsonb")
    private Map<String, Object> configSnapshot;

    @Column(name = "config_snapshot_at")
    private OffsetDateTime configSnapshotAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ─── State Machine Helpers ──────────────────────────────────────────────

    public boolean canTransitionTo(TournamentStatus newStatus) {
        return switch (this.status) {
            case DRAFT -> newStatus == TournamentStatus.REGISTRATION_OPEN || newStatus == TournamentStatus.CANCELLED;
            case REGISTRATION_OPEN -> newStatus == TournamentStatus.REGISTRATION_CLOSED || newStatus == TournamentStatus.CANCELLED;
            case REGISTRATION_CLOSED -> newStatus == TournamentStatus.CHECK_IN || newStatus == TournamentStatus.SEEDING || newStatus == TournamentStatus.SCHEDULED;
            case CHECK_IN -> newStatus == TournamentStatus.SEEDING || newStatus == TournamentStatus.SCHEDULED;
            case SEEDING -> newStatus == TournamentStatus.SCHEDULED;
            case SCHEDULED -> newStatus == TournamentStatus.LIVE || newStatus == TournamentStatus.CANCELLED;
            case LIVE -> newStatus == TournamentStatus.PAUSED || newStatus == TournamentStatus.COMPLETED;
            case PAUSED -> newStatus == TournamentStatus.LIVE || newStatus == TournamentStatus.CANCELLED;
            case COMPLETED -> newStatus == TournamentStatus.ARCHIVED;
            default -> false;
        };
    }

    public boolean isConfigurationLocked() {
        // Configuration is locked once tournament is LIVE or beyond
        return status == TournamentStatus.LIVE
            || status == TournamentStatus.PAUSED
            || status == TournamentStatus.COMPLETED
            || status == TournamentStatus.ARCHIVED;
    }

    public boolean isActive() {
        return status == TournamentStatus.LIVE || status == TournamentStatus.PAUSED;
    }
}
