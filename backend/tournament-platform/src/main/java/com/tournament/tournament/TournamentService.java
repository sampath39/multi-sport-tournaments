package com.tournament.tournament;

import com.tournament.sport.Sport;
import com.tournament.sport.SportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TournamentParticipantRepository participantRepository;
    private final SportRepository sportRepository;

    @Transactional(readOnly = true)
    public Page<TournamentDto> listTournaments(
        TournamentStatus status,
        String sportCode,
        String search,
        UUID userId,
        Pageable pageable
    ) {
        Specification<Tournament> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (sportCode != null && !sportCode.isBlank()) {
                predicates.add(cb.equal(root.join("sport", JoinType.LEFT).get("code"), sportCode));
            }
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Tournament> page = tournamentRepository.findAll(spec, pageable);
        List<TournamentDto> dtos = page.getContent().stream().map(t -> {
            long count = participantRepository.countByTournamentIdAndStatus(t.getId(), "ACTIVE");
            return TournamentDto.fromEntity(t, count);
        }).toList();

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Optional<TournamentDto> getTournamentById(UUID id) {
        return tournamentRepository.findById(id).map(t -> {
            long count = participantRepository.countByTournamentIdAndStatus(t.getId(), "ACTIVE");
            return TournamentDto.fromEntity(t, count);
        });
    }

    @Transactional
    public TournamentDto createTournament(Tournament tournament, UUID sportId) {
        if (sportId != null) {
            Sport sport = sportRepository.findById(sportId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found with id: " + sportId));
            tournament.setSport(sport);
        }
        if (tournament.getSlug() == null || tournament.getSlug().isBlank()) {
            tournament.setSlug(tournament.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + System.currentTimeMillis() % 10000);
        }
        if (tournament.getStatus() == null) {
            tournament.setStatus(TournamentStatus.DRAFT);
        }
        if (tournament.getTimezone() == null) {
            tournament.setTimezone("Asia/Kolkata");
        }
        Tournament saved = tournamentRepository.save(tournament);
        return TournamentDto.fromEntity(saved, 0);
    }

    @Transactional
    public Optional<TournamentDto> updateTournament(UUID id, Tournament updated) {
        return tournamentRepository.findById(id).map(t -> {
            if (updated.getName() != null) t.setName(updated.getName());
            if (updated.getDescription() != null) t.setDescription(updated.getDescription());
            if (updated.getStatus() != null) t.setStatus(updated.getStatus());
            if (updated.getStartDate() != null) t.setStartDate(updated.getStartDate());
            if (updated.getEndDate() != null) t.setEndDate(updated.getEndDate());
            if (updated.getVenue() != null) t.setVenue(updated.getVenue());
            Tournament saved = tournamentRepository.save(t);
            long count = participantRepository.countByTournamentIdAndStatus(saved.getId(), "ACTIVE");
            return TournamentDto.fromEntity(saved, count);
        });
    }

    @Transactional
    public Optional<TournamentDto> publishTournament(UUID id) {
        return tournamentRepository.findById(id).map(t -> {
            t.setStatus(TournamentStatus.REGISTRATION_OPEN);
            Tournament saved = tournamentRepository.save(t);
            long count = participantRepository.countByTournamentIdAndStatus(saved.getId(), "ACTIVE");
            return TournamentDto.fromEntity(saved, count);
        });
    }

    @Transactional(readOnly = true)
    public List<TournamentParticipant> getParticipants(UUID tournamentId) {
        return participantRepository.findByTournamentId(tournamentId);
    }

    @Transactional
    public TournamentParticipant addParticipant(UUID tournamentId, TournamentParticipant participant) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found: " + tournamentId));
        participant.setTournament(tournament);
        if (participant.getStatus() == null) {
            participant.setStatus("ACTIVE");
        }
        return participantRepository.save(participant);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFixtures(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
        String sportName = tournament != null && tournament.getSport() != null ? tournament.getSport().getName() : "Tournament";
        String sportCode = tournament != null && tournament.getSport() != null ? tournament.getSport().getCode() : "GENERAL";

        List<Map<String, Object>> fixtures = new ArrayList<>();

        Map<String, Object> m1 = new LinkedHashMap<>();
        m1.put("id", UUID.nameUUIDFromBytes((tournamentId.toString() + "-m1").getBytes()).toString());
        m1.put("tournamentId", tournamentId.toString());
        m1.put("roundNumber", 1);
        m1.put("courtName", "Court 1 / Board 1");
        m1.put("participantA", Map.of("id", "p1", "displayName", "Magnus Carlsen", "score", 1));
        m1.put("participantB", Map.of("id", "p2", "displayName", "Hikaru Nakamura", "score", 0));
        m1.put("status", "COMPLETED");
        m1.put("resultType", "WIN");
        m1.put("sportCode", sportCode);
        fixtures.add(m1);

        Map<String, Object> m2 = new LinkedHashMap<>();
        m2.put("id", UUID.nameUUIDFromBytes((tournamentId.toString() + "-m2").getBytes()).toString());
        m2.put("tournamentId", tournamentId.toString());
        m2.put("roundNumber", 1);
        m2.put("courtName", "Court 2 / Board 2");
        m2.put("participantA", Map.of("id", "p3", "displayName", "Ding Liren", "score", 0.5));
        m2.put("participantB", Map.of("id", "p4", "displayName", "Ian Nepomniachtchi", "score", 0.5));
        m2.put("status", "COMPLETED");
        m2.put("resultType", "DRAW");
        m2.put("sportCode", sportCode);
        fixtures.add(m2);

        Map<String, Object> m3 = new LinkedHashMap<>();
        m3.put("id", UUID.nameUUIDFromBytes((tournamentId.toString() + "-m3").getBytes()).toString());
        m3.put("tournamentId", tournamentId.toString());
        m3.put("roundNumber", 2);
        m3.put("courtName", "Center Arena / Pitch 1");
        m3.put("participantA", Map.of("id", "p1", "displayName", "Arsenal Academy", "score", 2));
        m3.put("participantB", Map.of("id", "p3", "displayName", "Spartans United", "score", 1));
        m3.put("status", "LIVE");
        m3.put("sportCode", sportCode);
        fixtures.add(m3);

        return fixtures;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStandings(UUID tournamentId) {
        List<Map<String, Object>> standings = new ArrayList<>();

        standings.add(Map.of(
            "rank", 1,
            "participantId", "p1",
            "participantName", "Magnus Carlsen",
            "played", 3,
            "won", 3,
            "drawn", 0,
            "lost", 0,
            "points", 3.0,
            "buchholz", 5.5,
            "sonnebornBerger", 5.0
        ));

        standings.add(Map.of(
            "rank", 2,
            "participantId", "p2",
            "participantName", "Hikaru Nakamura",
            "played", 3,
            "won", 2,
            "drawn", 0,
            "lost", 1,
            "points", 2.0,
            "buchholz", 4.5,
            "sonnebornBerger", 3.0
        ));

        standings.add(Map.of(
            "rank", 3,
            "participantId", "p3",
            "participantName", "Ding Liren",
            "played", 3,
            "won", 1,
            "drawn", 1,
            "lost", 1,
            "points", 1.5,
            "buchholz", 4.0,
            "sonnebornBerger", 2.0
        ));

        return standings;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBracket(UUID tournamentId) {
        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("tournamentId", tournamentId);

        List<Map<String, Object>> rounds = new ArrayList<>();

        // Semi-Finals
        Map<String, Object> r1 = new LinkedHashMap<>();
        r1.put("roundNumber", 1);
        r1.put("roundName", "Semi-Finals");
        r1.put("matches", List.of(
            Map.of(
                "id", "sf-1",
                "participantA", Map.of("name", "Arsenal Academy", "score", 2),
                "participantB", Map.of("name", "Spartans FC", "score", 0),
                "winner", "Arsenal Academy",
                "status", "COMPLETED"
            ),
            Map.of(
                "id", "sf-2",
                "participantA", Map.of("name", "Red Dragons", "score", 3),
                "participantB", Map.of("name", "Blue Hawks", "score", 1),
                "winner", "Red Dragons",
                "status", "COMPLETED"
            )
        ));
        rounds.add(r1);

        // Grand Final
        Map<String, Object> r2 = new LinkedHashMap<>();
        r2.put("roundNumber", 2);
        r2.put("roundName", "Grand Final");
        r2.put("matches", List.of(
            Map.of(
                "id", "gf-1",
                "participantA", Map.of("name", "Arsenal Academy", "score", 2),
                "participantB", Map.of("name", "Red Dragons", "score", 1),
                "winner", "Arsenal Academy",
                "status", "LIVE"
            )
        ));
        rounds.add(r2);

        bracket.put("rounds", rounds);
        return bracket;
    }
}
