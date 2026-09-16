package com.tournament.participant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlayerRepository extends JpaRepository<Player, UUID> {
    Optional<Player> findByEmailIgnoreCase(String email);
    Optional<Player> findByFullNameIgnoreCase(String fullName);
}
