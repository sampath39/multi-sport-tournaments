package com.tournament.tournament;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a participant registered in a tournament.
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

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    private Integer seed;

    @Column(name = "rating_at_registration")
    private BigDecimal ratingAtRegistration;

    private String category;

    @Builder.Default
    @Column(name = "check_in_status", nullable = false)
    private String checkInStatus = "NOT_CHECKED_IN";

    @Column(name = "checked_in_at")
    private OffsetDateTime checkedInAt;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE";  // ACTIVE, WITHDRAWN, DISQUALIFIED, BYE

    @Builder.Default
    @Column(name = "white_games", nullable = false)
    private Integer whiteGames = 0;

    @Builder.Default
    @Column(name = "black_games", nullable = false)
    private Integer blackGames = 0;

    @Column(name = "withdrawal_reason")
    private String withdrawalReason;

    @Column(name = "withdrawal_at")
    private OffsetDateTime withdrawalAt;

    @Column(name = "disqualification_reason")
    private String disqualificationReason;

    @Column(name = "disqualification_at")
    private OffsetDateTime disqualificationAt;

    @Column(name = "registration_id")
    private UUID registrationId;

    @CreatedDate
    @Column(name = "registered_at", updatable = false)
    private OffsetDateTime registeredAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
