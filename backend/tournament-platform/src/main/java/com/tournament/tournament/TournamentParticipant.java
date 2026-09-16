package com.tournament.tournament;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a participant (player or team) registered in a tournament.
 */
@Entity
@Table(name = "tournament_participants")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TournamentParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "player_id")
    private UUID playerId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    private Integer seed;

    @Column(name = "initial_rating")
    private Double initialRating;

    @Column(name = "current_rating")
    private Double currentRating;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private String status = "ACTIVE";  // ACTIVE, WITHDRAWN, DISQUALIFIED, BYE

    @Column(name = "check_in_at")
    private OffsetDateTime checkInAt;

    @Column(name = "withdrawal_reason")
    private String withdrawalReason;

    @CreatedDate
    @Column(name = "registered_at", updatable = false)
    private OffsetDateTime registeredAt;
}
