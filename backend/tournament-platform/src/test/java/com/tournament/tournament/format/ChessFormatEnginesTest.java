package com.tournament.tournament.format;

import com.tournament.pairing.chess.FideSwissChessEngine;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ChessFormatEnginesTest {

    private ChessSwissFormatEngine swissEngine;
    private ChessKnockoutFormatEngine knockoutEngine;
    private ChessRoundRobinFormatEngine roundRobinEngine;
    private TournamentFormatEngineFactory factory;

    @BeforeEach
    void setUp() {
        FideSwissChessEngine fideEngine = new FideSwissChessEngine();
        swissEngine = new ChessSwissFormatEngine(fideEngine);
        knockoutEngine = new ChessKnockoutFormatEngine();
        roundRobinEngine = new ChessRoundRobinFormatEngine();
        factory = new TournamentFormatEngineFactory(List.of(swissEngine, knockoutEngine, roundRobinEngine));
    }

    private Tournament createTournament(UUID id, TournamentFormat format, int roundsCount) {
        return Tournament.builder()
            .id(id)
            .name("Test " + format)
            .formatCode(format)
            .totalRounds(roundsCount)
            .build();
    }

    private List<TournamentParticipantDto> createParticipants(int count) {
        List<TournamentParticipantDto> list = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            list.add(TournamentParticipantDto.builder()
                .id(UUID.randomUUID())
                .displayName("Player " + i)
                .rating(BigDecimal.valueOf(2000 - (i * 50)))
                .seed(i)
                .status("ACTIVE")
                .build());
        }
        return list;
    }

    @Test
    @DisplayName("Factory correctly resolves engines for each format")
    void testFactoryResolution() {
        assertEquals(TournamentFormat.SWISS, factory.getEngine(TournamentFormat.SWISS).getFormat());
        assertEquals(TournamentFormat.SINGLE_ELIMINATION, factory.getEngine(TournamentFormat.SINGLE_ELIMINATION).getFormat());
        assertEquals(TournamentFormat.ROUND_ROBIN, factory.getEngine(TournamentFormat.ROUND_ROBIN).getFormat());
    }

    // ==========================================
    // 1. CHESS SWISS FORMAT ENGINE TESTS
    // ==========================================

    @Test
    @DisplayName("Swiss: Round 1 Dutch split-half and Round 2 score-based pairing without rematch")
    void testSwissProgression() {
        UUID tourneyId = UUID.randomUUID();
        Tournament tournament = createTournament(tourneyId, TournamentFormat.SWISS, 3);
        List<TournamentParticipantDto> participants = createParticipants(4);

        // Round 1
        List<Map<String, Object>> r1Matches = swissEngine.generateRound(tournament, participants, new ArrayList<>(), 1);
        assertEquals(2, r1Matches.size());

        // Complete Round 1: Player 1 beats Player 3 (1.0 vs 0.0), Player 2 draws Player 4 (0.5 vs 0.5)
        Map<String, Object> m1 = r1Matches.get(0);
        m1.put("status", "COMPLETED");
        @SuppressWarnings("unchecked")
        Map<String, Object> p1A = (Map<String, Object>) m1.get("participantA");
        @SuppressWarnings("unchecked")
        Map<String, Object> p1B = (Map<String, Object>) m1.get("participantB");
        p1A.put("score", 1.0);
        p1B.put("score", 0.0);
        m1.put("winner", p1A.get("displayName"));

        Map<String, Object> m2 = r1Matches.get(1);
        m2.put("status", "COMPLETED");
        @SuppressWarnings("unchecked")
        Map<String, Object> p2A = (Map<String, Object>) m2.get("participantA");
        @SuppressWarnings("unchecked")
        Map<String, Object> p2B = (Map<String, Object>) m2.get("participantB");
        p2A.put("score", 0.5);
        p2B.put("score", 0.5);

        List<Map<String, Object>> existing = new ArrayList<>(r1Matches);

        // Standings check after Round 1
        List<Map<String, Object>> standings = swissEngine.calculateStandings(tournament, participants, existing);
        assertEquals(4, standings.size());
        assertEquals(1, standings.get(0).get("rank"));
        assertEquals(1.0, standings.get(0).get("points"));

        // Round 2 generation
        List<Map<String, Object>> r2Matches = swissEngine.generateRound(tournament, participants, existing, 2);
        assertEquals(2, r2Matches.size());

        // Check no rematches occurred
        for (Map<String, Object> r2m : r2Matches) {
            @SuppressWarnings("unchecked")
            String aName = (String) ((Map<String, Object>) r2m.get("participantA")).get("displayName");
            @SuppressWarnings("unchecked")
            String bName = (String) ((Map<String, Object>) r2m.get("participantB")).get("displayName");

            boolean wasRematch = (aName.equals(p1A.get("displayName")) && bName.equals(p1B.get("displayName"))) ||
                                 (aName.equals(p1B.get("displayName")) && bName.equals(p1A.get("displayName")));
            assertFalse(wasRematch, "Swiss round 2 must not repeat round 1 pairings");
        }
    }

    // ==========================================
    // 2. CHESS KNOCKOUT FORMAT ENGINE TESTS
    // ==========================================

    @Test
    @DisplayName("Single Elimination: 6 players bracket -> size 8 with 2 Byes for top seeds")
    void testKnockoutBracketSizingAndByes() {
        UUID tourneyId = UUID.randomUUID();
        Tournament tournament = createTournament(tourneyId, TournamentFormat.SINGLE_ELIMINATION, 3);
        List<TournamentParticipantDto> participants = createParticipants(6);

        // Round 1
        List<Map<String, Object>> r1Matches = knockoutEngine.generateRound(tournament, participants, new ArrayList<>(), 1);
        assertEquals(4, r1Matches.size(), "8-bracket has 4 matches in round 1");

        // Top 2 seeds should receive BYEs
        long byeCount = r1Matches.stream()
            .filter(m -> "BYE".equalsIgnoreCase((String) m.get("resultType")))
            .count();
        assertEquals(2, byeCount, "With 6 players in size 8 bracket, exactly 2 matches are BYEs");

        // Winners of Byes are Seed 1 and Seed 2
        List<String> byeWinners = r1Matches.stream()
            .filter(m -> "BYE".equalsIgnoreCase((String) m.get("resultType")))
            .map(m -> (String) m.get("winner"))
            .toList();
        assertTrue(byeWinners.contains("Player 1"));
        assertTrue(byeWinners.contains("Player 2"));
    }

    @Test
    @DisplayName("Single Elimination: Winner progression from Round 1 to Final Champion")
    void testKnockoutFullProgression() {
        UUID tourneyId = UUID.randomUUID();
        Tournament tournament = createTournament(tourneyId, TournamentFormat.SINGLE_ELIMINATION, 2);
        List<TournamentParticipantDto> participants = createParticipants(4);

        // Round 1 (Semifinals)
        List<Map<String, Object>> r1Matches = knockoutEngine.generateRound(tournament, participants, new ArrayList<>(), 1);
        assertEquals(2, r1Matches.size());
        assertEquals("Semifinal", r1Matches.get(0).get("roundName"));

        // Complete Round 1: Player 1 wins match 1, Player 2 wins match 2
        r1Matches.get(0).put("status", "COMPLETED");
        r1Matches.get(0).put("winner", "Player 1");
        r1Matches.get(1).put("status", "COMPLETED");
        r1Matches.get(1).put("winner", "Player 2");

        List<Map<String, Object>> existing = new ArrayList<>(r1Matches);

        // Round 2 (Final)
        List<Map<String, Object>> r2Matches = knockoutEngine.generateRound(tournament, participants, existing, 2);
        assertEquals(1, r2Matches.size());
        assertEquals("Final", r2Matches.get(0).get("roundName"));

        // Final match must be between the two winners
        @SuppressWarnings("unchecked")
        String fA = (String) ((Map<String, Object>) r2Matches.get(0).get("participantA")).get("displayName");
        @SuppressWarnings("unchecked")
        String fB = (String) ((Map<String, Object>) r2Matches.get(0).get("participantB")).get("displayName");
        assertTrue((fA.equals("Player 1") && fB.equals("Player 2")) || (fA.equals("Player 2") && fB.equals("Player 1")));

        // Complete Final: Player 1 wins championship
        Map<String, Object> finalMatch = r2Matches.get(0);
        finalMatch.put("status", "COMPLETED");
        finalMatch.put("winner", "Player 1");
        existing.addAll(r2Matches);

        // Tournament should now be complete
        assertTrue(knockoutEngine.isTournamentComplete(tournament, participants, existing));

        // Standings should show Champion as rank 1
        List<Map<String, Object>> standings = knockoutEngine.calculateStandings(tournament, participants, existing);
        assertEquals("Player 1", standings.get(0).get("participantName"));
        assertEquals("Champion", standings.get(0).get("medal"));
        assertEquals("Runner-up", standings.get(1).get("medal"));
    }

    // ==========================================
    // 3. CHESS ROUND ROBIN FORMAT ENGINE TESTS
    // ==========================================

    @Test
    @DisplayName("Round Robin: 4 players -> exactly 3 rounds, 6 unique matches (all-play-all)")
    void testRoundRobinEven() {
        UUID tourneyId = UUID.randomUUID();
        Tournament tournament = createTournament(tourneyId, TournamentFormat.ROUND_ROBIN, 3);
        List<TournamentParticipantDto> participants = createParticipants(4);

        // Round 1
        List<Map<String, Object>> allMatches = new ArrayList<>();
        List<Map<String, Object>> r1 = roundRobinEngine.generateRound(tournament, participants, allMatches, 1);
        assertEquals(2, r1.size());
        allMatches.addAll(r1);

        // Complete R1
        for (Map<String, Object> m : r1) {
            m.put("status", "COMPLETED");
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            pA.put("score", 1.0);
            m.put("winner", pA.get("displayName"));
        }

        // Round 2
        List<Map<String, Object>> r2 = roundRobinEngine.generateRound(tournament, participants, allMatches, 2);
        assertEquals(2, r2.size());
        allMatches.addAll(r2);

        // Complete R2
        for (Map<String, Object> m : r2) {
            m.put("status", "COMPLETED");
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            pA.put("score", 1.0);
            m.put("winner", pA.get("displayName"));
        }

        // Round 3
        List<Map<String, Object>> r3 = roundRobinEngine.generateRound(tournament, participants, allMatches, 3);
        assertEquals(2, r3.size());
        allMatches.addAll(r3);

        // Complete R3
        for (Map<String, Object> m : r3) {
            m.put("status", "COMPLETED");
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            pA.put("score", 1.0);
            m.put("winner", pA.get("displayName"));
        }

        // Verify total matches: N * (N - 1) / 2 = 4 * 3 / 2 = 6 matches
        assertEquals(6, allMatches.size());

        // Verify every pair played exactly once
        Set<String> pairs = new HashSet<>();
        for (Map<String, Object> m : allMatches) {
            @SuppressWarnings("unchecked")
            String a = (String) ((Map<String, Object>) m.get("participantA")).get("displayName");
            @SuppressWarnings("unchecked")
            String b = (String) ((Map<String, Object>) m.get("participantB")).get("displayName");
            String key = a.compareTo(b) < 0 ? a + " vs " + b : b + " vs " + a;
            assertFalse(pairs.contains(key), "Duplicate pairing found in Round Robin: " + key);
            pairs.add(key);
        }
        assertEquals(6, pairs.size(), "All 6 distinct pairs must play");

        // Tournament should now be complete
        assertTrue(roundRobinEngine.isTournamentComplete(tournament, participants, allMatches));
    }

    @Test
    @DisplayName("Round Robin: Odd player count (3 players) gives virtual BYE to each player once")
    void testRoundRobinOddByes() {
        UUID tourneyId = UUID.randomUUID();
        Tournament tournament = createTournament(tourneyId, TournamentFormat.ROUND_ROBIN, 3);
        List<TournamentParticipantDto> participants = createParticipants(3);

        List<Map<String, Object>> allMatches = new ArrayList<>();

        for (int r = 1; r <= 3; r++) {
            List<Map<String, Object>> roundMatches = roundRobinEngine.generateRound(tournament, participants, allMatches, r);
            assertEquals(2, roundMatches.size(), "Each round has 1 game and 1 bye for 3 players");

            for (Map<String, Object> m : roundMatches) {
                m.put("status", "COMPLETED");
                if ("BYE".equalsIgnoreCase((String) m.get("resultType"))) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
                    m.put("winner", pA.get("displayName"));
                } else {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
                    pA.put("score", 1.0);
                    m.put("winner", pA.get("displayName"));
                }
            }
            allMatches.addAll(roundMatches);
        }

        // Verify each player got exactly 1 bye
        Map<String, Integer> byeCounts = new HashMap<>();
        for (Map<String, Object> m : allMatches) {
            if ("BYE".equalsIgnoreCase((String) m.get("resultType"))) {
                @SuppressWarnings("unchecked")
                String recipient = (String) ((Map<String, Object>) m.get("participantA")).get("displayName");
                byeCounts.put(recipient, byeCounts.getOrDefault(recipient, 0) + 1);
            }
        }

        assertEquals(3, byeCounts.size());
        for (TournamentParticipantDto p : participants) {
            assertEquals(1, byeCounts.get(p.getDisplayName()), p.getDisplayName() + " should receive exactly 1 bye");
        }
    }
}
