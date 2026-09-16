package com.tournament.tournament;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TournamentParticipantRepository extends JpaRepository<TournamentParticipant, UUID> {
    List<TournamentParticipant> findByTournamentId(UUID tournamentId);
    Optional<TournamentParticipant> findByTournamentIdAndPlayerId(UUID tournamentId, UUID playerId);
    long countByTournamentIdAndStatus(UUID tournamentId, String status);
}
