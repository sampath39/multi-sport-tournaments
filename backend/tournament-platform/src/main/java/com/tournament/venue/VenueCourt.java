package com.tournament.venue;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "venue_courts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VenueCourt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(nullable = false)
    private String name;   // "Court 1", "Board 12", "Table 3"

    @Column(name = "court_type")
    private String courtType;   // COURT, BOARD, TABLE, GROUND, ROOM, RING

    private Integer capacity;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
