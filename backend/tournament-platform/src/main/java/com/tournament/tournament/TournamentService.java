package com.tournament.tournament;

import com.tournament.participant.Player;
import com.tournament.participant.PlayerRepository;
import com.tournament.sport.Sport;
import com.tournament.sport.SportRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TournamentParticipantRepository participantRepository;
    private final SportRepository sportRepository;
    private final PlayerRepository playerRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.tournament.tournament.format.TournamentFormatEngineFactory formatEngineFactory;
    private final com.tournament.rules.SportRulesRegistry sportRulesRegistry;

    // In-memory store for active tournament rounds and matches
    private final Map<UUID, List<Map<String, Object>>> tournamentFixtures = new ConcurrentHashMap<>();

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
    public TournamentDto createTournament(CreateTournamentRequest req) {
        // Resolve Sport
        Sport sport = null;
        if (req.getSport() != null && !req.getSport().isBlank()) {
            try {
                UUID sportId = UUID.fromString(req.getSport());
                sport = sportRepository.findById(sportId).orElse(null);
            } catch (IllegalArgumentException ignored) {}

            if (sport == null) {
                sport = sportRepository.findByCodeIgnoreCase(req.getSport())
                    .orElse(sportRepository.findAll().stream().findFirst().orElse(null));
            }
        } else {
            sport = sportRepository.findAll().stream().findFirst().orElse(null);
        }

        if (sport == null) {
            throw new IllegalStateException("No sports configured in the system.");
        }

        // Parse Format
        TournamentFormat format = TournamentFormat.SINGLE_ELIMINATION;
        if (req.getCompetitionType() != null) {
            try {
                format = TournamentFormat.valueOf(req.getCompetitionType().toUpperCase());
            } catch (IllegalArgumentException e) {
                format = TournamentFormat.SINGLE_ELIMINATION;
            }
        }

        // Parse Tier / Type
        TournamentType type = TournamentType.CLUB;
        if (req.getTier() != null) {
            try {
                type = TournamentType.valueOf(req.getTier().toUpperCase());
            } catch (IllegalArgumentException e) {
                type = TournamentType.CLUB;
            }
        }

        // Parse Participant Type
        ParticipantType partType = ParticipantType.INDIVIDUAL;
        if (req.getParticipantType() != null) {
            try {
                partType = ParticipantType.valueOf(req.getParticipantType().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        } else if ("TEAM".equalsIgnoreCase(sport.getParticipantType())) {
            partType = ParticipantType.TEAM;
        }

        String name = (req.getName() != null && !req.getName().isBlank())
            ? req.getName().trim()
            : (sport.getName() + " Championship " + LocalDate.now().getYear());

        String slug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + (System.currentTimeMillis() % 10000);

        Tournament tournament = Tournament.builder()
            .name(name)
            .slug(slug)
            .description(req.getDescription() != null ? req.getDescription() : "")
            .sport(sport)
            .formatCode(format)
            .tournamentType(type)
            .participantType(partType)
            .registrationMode(RegistrationMode.OPEN_REGISTRATION)
            .status(TournamentStatus.REGISTRATION_OPEN)
            .maxParticipants(req.getMaxParticipants() != null ? req.getMaxParticipants() : 16)
            .minParticipants(req.getMinParticipants() != null ? req.getMinParticipants() : 2)
            .totalRounds(req.getTotalRounds())
            .startDate(req.getStartDate() != null ? req.getStartDate() : LocalDate.now())
            .endDate(req.getEndDate() != null ? req.getEndDate() : LocalDate.now().plusDays(7))
            .timezone("Asia/Kolkata")
            .isPublic(true)
            .hasRegistrationFee(req.getEntryFee() != null && req.getEntryFee().compareTo(BigDecimal.ZERO) > 0)
            .registrationFeeAmount(req.getEntryFee() != null ? req.getEntryFee() : BigDecimal.ZERO)
            .build();

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
            t.setStatus(TournamentStatus.LIVE);
            Tournament saved = tournamentRepository.save(t);
            long count = participantRepository.countByTournamentIdAndStatus(saved.getId(), "ACTIVE");
            return TournamentDto.fromEntity(saved, count);
        });
    }

    @Transactional(readOnly = true)
    public List<TournamentParticipantDto> getParticipants(UUID tournamentId) {
        List<TournamentParticipant> list = participantRepository.findByTournamentId(tournamentId);
        List<TournamentParticipantDto> result = new ArrayList<>();
        for (TournamentParticipant tp : list) {
            Player p = tp.getPlayerId() != null ? playerRepository.findById(tp.getPlayerId()).orElse(null) : null;
            result.add(TournamentParticipantDto.builder()
                .id(tp.getId())
                .tournamentId(tournamentId)
                .playerId(tp.getPlayerId())
                .displayName(p != null ? (p.getDisplayName() != null ? p.getDisplayName() : p.getFullName()) : "Participant")
                .fullName(p != null ? p.getFullName() : "Participant")
                .email(p != null ? p.getEmail() : null)
                .seed(tp.getSeed())
                .rating(tp.getRatingAtRegistration())
                .category(tp.getCategory())
                .checkInStatus(tp.getCheckInStatus())
                .status(tp.getStatus())
                .registeredAt(tp.getRegisteredAt())
                .build());
        }
        return result;
    }

    @Transactional
    public TournamentParticipantDto addParticipant(UUID tournamentId, Map<String, Object> req) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found: " + tournamentId));

        String name = (String) req.getOrDefault("name", req.getOrDefault("displayName", req.getOrDefault("fullName", "Player")));
        String email = (String) req.getOrDefault("email", name.toLowerCase().replaceAll("[^a-z0-9]", "") + "@player.io");

        // Find or create Player
        Player player = playerRepository.findByEmailIgnoreCase(email)
            .or(() -> playerRepository.findByFullNameIgnoreCase(name))
            .orElseGet(() -> playerRepository.save(Player.builder()
                .fullName(name)
                .displayName(name)
                .email(email)
                .isActive(true)
                .build()));

        BigDecimal rating = null;
        if (req.containsKey("rating") && req.get("rating") != null) {
            try {
                rating = new BigDecimal(req.get("rating").toString());
            } catch (Exception ignored) {}
        }

        Integer seed = null;
        if (req.containsKey("seed") && req.get("seed") != null) {
            try {
                seed = Integer.parseInt(req.get("seed").toString());
            } catch (Exception ignored) {}
        }

        final Integer finalSeed = seed;
        final BigDecimal finalRating = rating;

        // Check if already registered
        TournamentParticipant tp = participantRepository.findByTournamentIdAndPlayerId(tournamentId, player.getId())
            .orElseGet(() -> TournamentParticipant.builder()
                .tournament(tournament)
                .playerId(player.getId())
                .seed(finalSeed)
                .ratingAtRegistration(finalRating)
                .checkInStatus("CHECKED_IN")
                .status("ACTIVE")
                .whiteGames(0)
                .blackGames(0)
                .build());

        TournamentParticipant saved = participantRepository.save(tp);

        return TournamentParticipantDto.builder()
            .id(saved.getId())
            .tournamentId(tournamentId)
            .playerId(player.getId())
            .displayName(name)
            .fullName(player.getFullName())
            .email(player.getEmail())
            .seed(saved.getSeed())
            .rating(saved.getRatingAtRegistration())
            .category(saved.getCategory())
            .checkInStatus(saved.getCheckInStatus())
            .status(saved.getStatus())
            .registeredAt(saved.getRegisteredAt())
            .build();
    }

    @Transactional
    public List<Map<String, Object>> generateFixtures(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found: " + tournamentId));

        List<TournamentParticipantDto> participants = getParticipants(tournamentId);
        if (participants.size() < 2) {
            throw new IllegalArgumentException("Please add at least 2 participants before generating fixtures.");
        }

        List<Map<String, Object>> existing = tournamentFixtures.getOrDefault(tournamentId, new ArrayList<>());
        int nextRound = 1;
        for (Map<String, Object> m : existing) {
            int r = ((Number) m.getOrDefault("roundNumber", 1)).intValue();
            if (r >= nextRound) {
                nextRound = r + 1;
            }
        }

        // Enforce maximum total rounds if configured
        if (tournament.getTotalRounds() != null && nextRound > tournament.getTotalRounds()) {
            throw new IllegalStateException("All " + tournament.getTotalRounds() + " scheduled rounds have already been generated.");
        }

        // Strict validation: Round 2 onwards requires all previous round matches to be finished
        if (nextRound > 1) {
            final int prevRound = nextRound - 1;
            List<Map<String, Object>> prevMatches = existing.stream()
                .filter(m -> ((Number) m.getOrDefault("roundNumber", 1)).intValue() == prevRound)
                .toList();

            long pendingCount = prevMatches.stream()
                .filter(m -> !"COMPLETED".equalsIgnoreCase((String) m.get("status")))
                .count();

            if (pendingCount > 0) {
                throw new IllegalStateException("Cannot generate Round " + nextRound + " fixtures: " +
                    "Round " + prevRound + " has " + pendingCount + " match(es) with pending scores. " +
                    "Please submit all scores for Round " + prevRound + " before generating the next round.");
            }
        }
        var engine = formatEngineFactory.getEngine(tournament.getFormatCode());
        List<Map<String, Object>> newRoundMatches = engine.generateRound(tournament, participants, existing, nextRound);

        existing.addAll(newRoundMatches);
        tournamentFixtures.put(tournamentId, existing);

        if (tournament.getStatus() != TournamentStatus.LIVE) {
            tournament.setStatus(TournamentStatus.LIVE);
            tournamentRepository.save(tournament);
        }

        return existing;
    }

    public List<Map<String, Object>> getFixtures(UUID tournamentId) {
        return tournamentFixtures.getOrDefault(tournamentId, Collections.emptyList());
    }

    public void updateMatchResult(String matchId, Number scoreA, Number scoreB, String status, String winner) {
        for (Map.Entry<UUID, List<Map<String, Object>>> entry : tournamentFixtures.entrySet()) {
            UUID tournamentId = entry.getKey();
            List<Map<String, Object>> matches = entry.getValue();
            for (Map<String, Object> m : matches) {
                if (matchId.equals(m.get("id"))) {
                    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
                    if (tournament != null) {
                        String sportCode = tournament.getSport() != null ? tournament.getSport().getCode() : "CHESS";
                        var rules = sportRulesRegistry.getEngine(sportCode);

                        // Auto-determine winner if not provided and scores are present
                        if ((winner == null || winner.trim().isEmpty()) && scoreA != null && scoreB != null) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
                            @SuppressWarnings("unchecked")
                            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");
                            String nameA = pA != null ? (String) pA.get("name") : "A";
                            String nameB = pB != null ? (String) pB.get("name") : "B";

                            if (scoreA.doubleValue() > scoreB.doubleValue()) {
                                winner = nameA;
                            } else if (scoreB.doubleValue() > scoreA.doubleValue()) {
                                winner = nameB;
                            } else if (rules.isDrawAllowed(tournament.getFormatCode())) {
                                winner = "DRAW";
                            }
                        }

                        // Validate score & winner against sport rules & tournament format
                        if ("COMPLETED".equalsIgnoreCase(status) || scoreA != null || scoreB != null) {
                            rules.validateScore(scoreA, scoreB, winner, tournament.getFormatCode());
                        }
                    }

                    if (scoreA != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> pA = new LinkedHashMap<>((Map<String, Object>) m.get("participantA"));
                        pA.put("score", scoreA);
                        m.put("participantA", pA);
                    }
                    if (scoreB != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> pB = new LinkedHashMap<>((Map<String, Object>) m.get("participantB"));
                        pB.put("score", scoreB);
                        m.put("participantB", pB);
                    }
                    if (status != null) {
                        m.put("status", status);
                    } else if (scoreA != null && scoreB != null) {
                        m.put("status", "COMPLETED");
                    }
                    if (winner != null) m.put("winner", winner);
                    m.put("updatedAt", OffsetDateTime.now().toString());
                    return;
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStandings(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found: " + tournamentId));
        List<TournamentParticipantDto> participants = getParticipants(tournamentId);
        List<Map<String, Object>> fixtures = getFixtures(tournamentId);

        var engine = formatEngineFactory.getEngine(tournament.getFormatCode());
        return engine.calculateStandings(tournament, participants, fixtures);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBracket(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found: " + tournamentId));
        List<TournamentParticipantDto> participants = getParticipants(tournamentId);
        List<Map<String, Object>> fixtures = getFixtures(tournamentId);

        var engine = formatEngineFactory.getEngine(tournament.getFormatCode());
        return engine.getBracket(tournament, participants, fixtures);
    }

    @Transactional(readOnly = true)
    public boolean isTournamentComplete(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found: " + tournamentId));
        List<TournamentParticipantDto> participants = getParticipants(tournamentId);
        List<Map<String, Object>> fixtures = getFixtures(tournamentId);

        var engine = formatEngineFactory.getEngine(tournament.getFormatCode());
        return engine.isTournamentComplete(tournament, participants, fixtures);
    }

    @Transactional
    public boolean deleteTournament(UUID id) {
        if (!tournamentRepository.existsById(id)) return false;
        jdbcTemplate.update("DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)", id);
        jdbcTemplate.update("DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)", id);
        jdbcTemplate.update("DELETE FROM matches WHERE tournament_id = ?", id);
        jdbcTemplate.update("DELETE FROM tournament_rounds WHERE tournament_id = ?", id);
        jdbcTemplate.update("DELETE FROM tournament_participants WHERE tournament_id = ?", id);
        jdbcTemplate.update("DELETE FROM standings WHERE tournament_id = ?", id);
        tournamentRepository.deleteById(id);
        return true;
    }
}
