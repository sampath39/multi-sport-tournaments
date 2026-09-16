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

        String sportCode = tournament.getSport() != null ? tournament.getSport().getCode() : "GENERAL";
        List<Map<String, Object>> newRoundMatches = new ArrayList<>();

        // If knockout and round > 1, take winners of previous round
        List<TournamentParticipantDto> activeForRound = new ArrayList<>(participants);
        if (tournament.getFormatCode() == TournamentFormat.SINGLE_ELIMINATION && nextRound > 1) {
            final int prevRound = nextRound - 1;
            List<String> winnerNames = existing.stream()
                .filter(m -> ((Number) m.getOrDefault("roundNumber", 0)).intValue() == prevRound)
                .map(m -> (String) m.get("winner"))
                .filter(Objects::nonNull)
                .toList();

            if (!winnerNames.isEmpty()) {
                activeForRound = participants.stream()
                    .filter(p -> winnerNames.contains(p.getDisplayName()))
                    .toList();
            }
        }

        // Pair up active participants in pairs of 2
        for (int i = 0; i < activeForRound.size(); i += 2) {
            if (i + 1 < activeForRound.size()) {
                TournamentParticipantDto pA = activeForRound.get(i);
                TournamentParticipantDto pB = activeForRound.get(i + 1);

                Map<String, Object> match = new LinkedHashMap<>();
                String matchId = UUID.randomUUID().toString();
                match.put("id", matchId);
                match.put("tournamentId", tournamentId.toString());
                match.put("roundNumber", nextRound);
                match.put("courtName", "Court / Board " + ((i / 2) + 1));
                match.put("participantA", Map.of(
                    "id", pA.getId().toString(),
                    "displayName", pA.getDisplayName(),
                    "score", 0
                ));
                match.put("participantB", Map.of(
                    "id", pB.getId().toString(),
                    "displayName", pB.getDisplayName(),
                    "score", 0
                ));
                match.put("status", "SCHEDULED");
                match.put("sportCode", sportCode);
                newRoundMatches.add(match);
            } else {
                // Odd participant gets a bye
                TournamentParticipantDto pBye = activeForRound.get(i);
                Map<String, Object> byeMatch = new LinkedHashMap<>();
                byeMatch.put("id", UUID.randomUUID().toString());
                byeMatch.put("tournamentId", tournamentId.toString());
                byeMatch.put("roundNumber", nextRound);
                byeMatch.put("courtName", "BYE");
                byeMatch.put("participantA", Map.of(
                    "id", pBye.getId().toString(),
                    "displayName", pBye.getDisplayName(),
                    "score", 1
                ));
                byeMatch.put("participantB", Map.of(
                    "id", "BYE",
                    "displayName", "BYE",
                    "score", 0
                ));
                byeMatch.put("status", "COMPLETED");
                byeMatch.put("resultType", "BYE");
                byeMatch.put("winner", pBye.getDisplayName());
                byeMatch.put("sportCode", sportCode);
                newRoundMatches.add(byeMatch);
            }
        }

        existing.addAll(newRoundMatches);
        tournamentFixtures.put(tournamentId, existing);

        // Update tournament status to LIVE if draft or registration
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
        for (List<Map<String, Object>> matches : tournamentFixtures.values()) {
            for (Map<String, Object> m : matches) {
                if (matchId.equals(m.get("id"))) {
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
                    if (status != null) m.put("status", status);
                    if (winner != null) m.put("winner", winner);
                    m.put("updatedAt", OffsetDateTime.now().toString());
                    return;
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStandings(UUID tournamentId) {
        List<TournamentParticipantDto> participants = getParticipants(tournamentId);
        List<Map<String, Object>> fixtures = getFixtures(tournamentId);

        Map<String, Map<String, Object>> stats = new LinkedHashMap<>();
        for (TournamentParticipantDto p : participants) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("participantId", p.getId().toString());
            row.put("participantName", p.getDisplayName());
            row.put("played", 0);
            row.put("won", 0);
            row.put("drawn", 0);
            row.put("lost", 0);
            row.put("points", 0.0);
            row.put("buchholz", 0.0);
            row.put("sonnebornBerger", 0.0);
            stats.put(p.getDisplayName(), row);
        }

        // Calculate points from completed fixtures
        for (Map<String, Object> m : fixtures) {
            String status = (String) m.get("status");
            if (!"COMPLETED".equalsIgnoreCase(status) && !"FINAL".equalsIgnoreCase(status)) continue;

            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");

            String nameA = pA != null ? (String) pA.get("displayName") : null;
            String nameB = pB != null ? (String) pB.get("displayName") : null;

            double scoreA = pA != null && pA.get("score") != null ? ((Number) pA.get("score")).doubleValue() : 0.0;
            double scoreB = pB != null && pB.get("score") != null ? ((Number) pB.get("score")).doubleValue() : 0.0;

            if (nameA != null && stats.containsKey(nameA)) {
                Map<String, Object> sA = stats.get(nameA);
                sA.put("played", ((int) sA.get("played")) + 1);
                if (scoreA > scoreB) {
                    sA.put("won", ((int) sA.get("won")) + 1);
                    sA.put("points", ((double) sA.get("points")) + 1.0);
                } else if (scoreA == scoreB) {
                    sA.put("drawn", ((int) sA.get("drawn")) + 1);
                    sA.put("points", ((double) sA.get("points")) + 0.5);
                } else {
                    sA.put("lost", ((int) sA.get("lost")) + 1);
                }
            }

            if (nameB != null && stats.containsKey(nameB) && !"BYE".equals(nameB)) {
                Map<String, Object> sB = stats.get(nameB);
                sB.put("played", ((int) sB.get("played")) + 1);
                if (scoreB > scoreA) {
                    sB.put("won", ((int) sB.get("won")) + 1);
                    sB.put("points", ((double) sB.get("points")) + 1.0);
                } else if (scoreB == scoreA) {
                    sB.put("drawn", ((int) sB.get("drawn")) + 1);
                    sB.put("points", ((double) sB.get("points")) + 0.5);
                } else {
                    sB.put("lost", ((int) sB.get("lost")) + 1);
                }
            }
        }

        List<Map<String, Object>> list = new ArrayList<>(stats.values());
        list.sort((a, b) -> Double.compare((double) b.get("points"), (double) a.get("points")));

        for (int i = 0; i < list.size(); i++) {
            list.get(i).put("rank", i + 1);
        }

        return list;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBracket(UUID tournamentId) {
        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("tournamentId", tournamentId);

        List<Map<String, Object>> fixtures = getFixtures(tournamentId);
        Map<Integer, List<Map<String, Object>>> byRound = new TreeMap<>();
        for (Map<String, Object> m : fixtures) {
            int r = ((Number) m.getOrDefault("roundNumber", 1)).intValue();
            byRound.computeIfAbsent(r, k -> new ArrayList<>()).add(m);
        }

        List<Map<String, Object>> rounds = new ArrayList<>();
        for (Map.Entry<Integer, List<Map<String, Object>>> entry : byRound.entrySet()) {
            Map<String, Object> roundMap = new LinkedHashMap<>();
            roundMap.put("roundNumber", entry.getKey());
            roundMap.put("roundName", "Round " + entry.getKey());
            roundMap.put("matches", entry.getValue());
            rounds.add(roundMap);
        }

        bracket.put("rounds", rounds);
        return bracket;
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
