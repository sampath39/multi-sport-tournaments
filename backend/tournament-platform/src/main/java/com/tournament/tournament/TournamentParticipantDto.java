package com.tournament.tournament;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    private String captainName;
    private Integer squadSize;
    private List<Map<String, Object>> squadMembers = new ArrayList<>();
    private OffsetDateTime registeredAt;

    public TournamentParticipantDto() {}

    public TournamentParticipantDto(UUID id, UUID tournamentId, UUID playerId, String displayName, String fullName,
                                  String email, Integer seed, BigDecimal rating, String category, String checkInStatus,
                                  String status, String captainName, Integer squadSize, List<Map<String, Object>> squadMembers,
                                  OffsetDateTime registeredAt) {
        this.id = id;
        this.tournamentId = tournamentId;
        this.playerId = playerId;
        this.displayName = displayName;
        this.fullName = fullName;
        this.email = email;
        this.seed = seed;
        this.rating = rating;
        this.category = category;
        this.checkInStatus = checkInStatus;
        this.status = status;
        this.captainName = captainName;
        this.squadSize = squadSize;
        this.squadMembers = squadMembers;
        this.registeredAt = registeredAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTournamentId() { return tournamentId; }
    public void setTournamentId(UUID tournamentId) { this.tournamentId = tournamentId; }
    public UUID getPlayerId() { return playerId; }
    public void setPlayerId(UUID playerId) { this.playerId = playerId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getSeed() { return seed; }
    public void setSeed(Integer seed) { this.seed = seed; }
    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCheckInStatus() { return checkInStatus; }
    public void setCheckInStatus(String checkInStatus) { this.checkInStatus = checkInStatus; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCaptainName() { return captainName; }
    public void setCaptainName(String captainName) { this.captainName = captainName; }
    public Integer getSquadSize() { return squadSize; }
    public void setSquadSize(Integer squadSize) { this.squadSize = squadSize; }
    public List<Map<String, Object>> getSquadMembers() { return squadMembers; }
    public void setSquadMembers(List<Map<String, Object>> squadMembers) { this.squadMembers = squadMembers; }
    public OffsetDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(OffsetDateTime registeredAt) { this.registeredAt = registeredAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
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
        private String captainName;
        private Integer squadSize;
        private List<Map<String, Object>> squadMembers;
        private OffsetDateTime registeredAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder tournamentId(UUID tournamentId) { this.tournamentId = tournamentId; return this; }
        public Builder playerId(UUID playerId) { this.playerId = playerId; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder seed(Integer seed) { this.seed = seed; return this; }
        public Builder rating(BigDecimal rating) { this.rating = rating; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder checkInStatus(String checkInStatus) { this.checkInStatus = checkInStatus; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder captainName(String captainName) { this.captainName = captainName; return this; }
        public Builder squadSize(Integer squadSize) { this.squadSize = squadSize; return this; }
        public Builder squadMembers(List<Map<String, Object>> squadMembers) { this.squadMembers = squadMembers; return this; }
        public Builder registeredAt(OffsetDateTime registeredAt) { this.registeredAt = registeredAt; return this; }

        public TournamentParticipantDto build() {
            return new TournamentParticipantDto(id, tournamentId, playerId, displayName, fullName, email, seed, rating,
                    category, checkInStatus, status, captainName, squadSize, squadMembers, registeredAt);
        }
    }
}


