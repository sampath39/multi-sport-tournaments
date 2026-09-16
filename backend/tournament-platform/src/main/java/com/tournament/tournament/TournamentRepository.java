package com.tournament.tournament;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, UUID> {

    Optional<Tournament> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("""
        SELECT t FROM Tournament t
        LEFT JOIN FETCH t.sport
        WHERE (:status IS NULL OR t.status = :status)
        AND (:sportCode IS NULL OR t.sport.code = :sportCode)
        AND (:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (t.isPublic = true OR t.createdBy = :userId)
        ORDER BY t.createdAt DESC
    """)
    Page<Tournament> findWithFilters(
        @Param("status") TournamentStatus status,
        @Param("sportCode") String sportCode,
        @Param("search") String search,
        @Param("userId") UUID userId,
        Pageable pageable
    );

    @Query("SELECT COUNT(tp) FROM TournamentParticipant tp WHERE tp.tournament.id = :tournamentId AND tp.status = 'ACTIVE'")
    long countActiveParticipants(@Param("tournamentId") UUID tournamentId);
}
