package com.tournament.tournament.format;

import com.tournament.pairing.chess.FideSwissChessEngine;
import com.tournament.rules.*;
import com.tournament.sport.Sport;
import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class MultiSportTournamentEnginesTest {

    private SportRulesRegistry rulesRegistry;
    private KnockoutFormatEngine knockoutEngine;
    private RoundRobinFormatEngine roundRobinEngine;
    private SwissFormatEngine swissEngine;
    private TournamentFormatEngineFactory factory;

    @BeforeEach
    void setUp() {
        List<SportRulesEngine> engines = List.of(
            new CricketRulesEngine(),
            new FootballRulesEngine(),
            new BasketballRulesEngine(),
            new VolleyballRulesEngine(),
            new TableTennisRulesEngine(),
            new CarromRulesEngine(),
            new ChessRulesEngine()
        );
        rulesRegistry = new SportRulesRegistry(engines);
        knockoutEngine = new KnockoutFormatEngine(rulesRegistry);
        roundRobinEngine = new RoundRobinFormatEngine(rulesRegistry);
        FideSwissChessEngine fide = new FideSwissChessEngine();
        swissEngine = new SwissFormatEngine(fide, rulesRegistry);
        factory = new TournamentFormatEngineFactory(List.of(knockoutEngine, roundRobinEngine, swissEngine));
    }

    private Tournament createTournament(String sportCode, TournamentFormat format, int rounds) {
        Sport sport = Sport.builder()
            .code(sportCode)
            .name(sportCode)
            .build();
        return Tournament.builder()
            .id(UUID.randomUUID())
            .name(sportCode + " " + format)
            .sport(sport)
            .formatCode(format)
            .totalRounds(rounds)
            .build();
    }

    private List<TournamentParticipantDto> createParticipants(int count, String prefix) {
        List<TournamentParticipantDto> list = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            list.add(TournamentParticipantDto.builder()
                .id(UUID.randomUUID())
                .displayName(prefix + " " + i)
                .seed(i)
                .rating(java.math.BigDecimal.valueOf(1500.0 + (count - i) * 20.0))
                .build());
        }
        return list;
    }

    @Test
    @DisplayName("Factory maps KNOCKOUT and SINGLE_ELIMINATION to KnockoutFormatEngine")
    void testFactoryKnockoutMapping() {
        assertSame(knockoutEngine, factory.getEngine(TournamentFormat.KNOCKOUT));
        assertSame(knockoutEngine, factory.getEngine(TournamentFormat.SINGLE_ELIMINATION));
        assertSame(roundRobinEngine, factory.getEngine(TournamentFormat.ROUND_ROBIN));
        assertSame(swissEngine, factory.getEngine(TournamentFormat.SWISS));
    }

    @Test
    @DisplayName("Cricket Knockout: 8 teams generate Quarterfinals, Semifinals, and Final with loser elimination")
    void testCricketKnockoutProgression() {
        Tournament t = createTournament("CRICKET", TournamentFormat.KNOCKOUT, 3);
        List<TournamentParticipantDto> teams = createParticipants(8, "Team");

        // Round 1: Quarterfinals
        List<Map<String, Object>> r1 = knockoutEngine.generateRound(t, teams, Collections.emptyList(), 1);
        assertEquals(4, r1.size(), "8 teams should have 4 quarterfinal matches");
        assertEquals("Pitch 1", r1.get(0).get("courtName"));

        // Play Round 1: Seed 1, 2, 3, 4 win
        for (Map<String, Object> m : r1) {
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            m.put("status", "COMPLETED");
            m.put("winner", pA.get("name"));
        }

        // Round 2: Semifinals
        List<Map<String, Object>> r2 = knockoutEngine.generateRound(t, teams, r1, 2);
        assertEquals(2, r2.size(), "4 quarterfinal winners advance to 2 semifinal matches");

        for (Map<String, Object> m : r2) {
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            m.put("status", "COMPLETED");
            m.put("winner", pA.get("name"));
        }

        // Round 3: Final
        List<Map<String, Object>> r3 = knockoutEngine.generateRound(t, teams, combine(r1, r2), 3);
        assertEquals(1, r3.size(), "2 semifinal winners advance to the Final match");
        assertEquals("Final", r3.get(0).get("roundName"));

        // Winner of Final is crowned Champion
        @SuppressWarnings("unchecked")
        Map<String, Object> pA = (Map<String, Object>) r3.get(0).get("participantA");
        r3.get(0).put("status", "COMPLETED");
        r3.get(0).put("winner", pA.get("name"));

        List<Map<String, Object>> allMatches = combine(r1, r2, r3);
        assertTrue(knockoutEngine.isTournamentComplete(t, teams, allMatches));

        List<Map<String, Object>> standings = knockoutEngine.calculateStandings(t, teams, allMatches);
        assertEquals("CHAMPION", standings.get(0).get("resultStage"));
        assertEquals("Finalist (Runner-Up)", standings.get(1).get("resultStage"));
    }

    @Test
    @DisplayName("Knockout Draw Rejection: Draw is disallowed in knockout matches across sports")
    void testKnockoutDrawRejection() {
        SportRulesEngine football = rulesRegistry.getEngine(SportCode.FOOTBALL);
        assertThrows(IllegalArgumentException.class, () ->
            football.validateScore(1, 1, null, TournamentFormat.KNOCKOUT));

        SportRulesEngine cricket = rulesRegistry.getEngine(SportCode.CRICKET);
        assertThrows(IllegalArgumentException.class, () ->
            cricket.validateScore(150, 150, "DRAW", TournamentFormat.KNOCKOUT));

        // Allowed with winner tiebreaker
        assertDoesNotThrow(() ->
            football.validateScore(1, 1, "Team 1", TournamentFormat.KNOCKOUT));
    }

    @Test
    @DisplayName("Football Round Robin: 3 pts for win, 1 pt for draw, Goal Difference standings")
    void testFootballRoundRobin() {
        Tournament t = createTournament("FOOTBALL", TournamentFormat.ROUND_ROBIN, 3);
        List<TournamentParticipantDto> teams = createParticipants(4, "FC");

        List<Map<String, Object>> r1 = roundRobinEngine.generateRound(t, teams, Collections.emptyList(), 1);
        assertEquals(2, r1.size());

        // Match 1: FC 1 beats FC 4 (3 - 0) -> FC 1 gets 3 pts, GD +3
        Map<String, Object> m1 = r1.get(0);
        setScore(m1, 3, 0, "FC 1");

        // Match 2: FC 2 draws FC 3 (1 - 1) -> 1 pt each
        Map<String, Object> m2 = r1.get(1);
        setScore(m2, 1, 1, "DRAW");

        List<Map<String, Object>> standings = roundRobinEngine.calculateStandings(t, teams, r1);
        assertEquals("FC 1", standings.get(0).get("participantName"));
        assertEquals(3.0, standings.get(0).get("points"));
        assertEquals(3, standings.get(0).get("goalDifference"));

        // Draw gives 1 pt each
        assertEquals(1.0, standings.get(1).get("points"));
        assertEquals(1.0, standings.get(2).get("points"));
        assertEquals(0.0, standings.get(3).get("points"));
    }

    @Test
    @DisplayName("Basketball Round Robin: No draws allowed and Point Differential calculated")
    void testBasketballRoundRobin() {
        SportRulesEngine basketball = rulesRegistry.getEngine(SportCode.BASKETBALL);
        assertFalse(basketball.isDrawAllowed(TournamentFormat.ROUND_ROBIN));
        assertThrows(IllegalArgumentException.class, () ->
            basketball.validateScore(80, 80, null, TournamentFormat.ROUND_ROBIN));

        Tournament t = createTournament("BASKETBALL", TournamentFormat.ROUND_ROBIN, 3);
        List<TournamentParticipantDto> teams = createParticipants(4, "Bulls");

        List<Map<String, Object>> r1 = roundRobinEngine.generateRound(t, teams, Collections.emptyList(), 1);
        setScore(r1.get(0), 95, 80, "Bulls 1"); // +15 PD
        setScore(r1.get(1), 70, 72, "Bulls 3"); // +2 PD

        List<Map<String, Object>> standings = roundRobinEngine.calculateStandings(t, teams, r1);
        assertEquals("Bulls 1", standings.get(0).get("participantName"));
        assertEquals(15, standings.get(0).get("pointDiff"));
    }

    @Test
    @DisplayName("Volleyball Rules: FIVB 3-point system (3-0 gives 3 pts, 3-2 gives 2 pts / 1 pt)")
    void testVolleyballScoring() {
        SportRulesEngine vb = rulesRegistry.getEngine(SportCode.VOLLEYBALL);
        assertFalse(vb.isDrawAllowed(TournamentFormat.ROUND_ROBIN));

        // 3-0 win -> [3.0, 0.0]
        double[] pts30 = vb.calculateMatchPoints(3, 0, "Team A", TournamentFormat.ROUND_ROBIN);
        assertEquals(3.0, pts30[0]);
        assertEquals(0.0, pts30[1]);

        // 3-2 win -> [2.0, 1.0]
        double[] pts32 = vb.calculateMatchPoints(3, 2, "Team A", TournamentFormat.ROUND_ROBIN);
        assertEquals(2.0, pts32[0]);
        assertEquals(1.0, pts32[1]);
    }

    @Test
    @DisplayName("Table Tennis: Games differential and clean tournament progression")
    void testTableTennisProgression() {
        Tournament t = createTournament("TABLE_TENNIS", TournamentFormat.ROUND_ROBIN, 3);
        List<TournamentParticipantDto> players = createParticipants(4, "Player");

        List<Map<String, Object>> r1 = roundRobinEngine.generateRound(t, players, Collections.emptyList(), 1);
        setScore(r1.get(0), 3, 0, "Player 1");
        setScore(r1.get(1), 3, 1, "Player 2");

        List<Map<String, Object>> standings = roundRobinEngine.calculateStandings(t, players, r1);
        assertEquals("Player 1", standings.get(0).get("participantName"));
        assertEquals(3, standings.get(0).get("gameDiff"));
        assertEquals("Player 2", standings.get(1).get("participantName"));
        assertEquals(2, standings.get(1).get("gameDiff"));
    }

    @Test
    @DisplayName("Carrom: Net Board Points calculated in standings")
    void testCarromStandings() {
        Tournament t = createTournament("CARROM", TournamentFormat.ROUND_ROBIN, 3);
        List<TournamentParticipantDto> players = createParticipants(4, "CarromPlayer");

        List<Map<String, Object>> r1 = roundRobinEngine.generateRound(t, players, Collections.emptyList(), 1);
        setScore(r1.get(0), 25, 10, "CarromPlayer 1"); // +15 NBP
        setScore(r1.get(1), 15, 15, "DRAW");           // Draw: 1 pt each

        List<Map<String, Object>> standings = roundRobinEngine.calculateStandings(t, players, r1);
        assertEquals("CarromPlayer 1", standings.get(0).get("participantName"));
        assertEquals(15, standings.get(0).get("netBoardPoints"));
        assertEquals(2.0, standings.get(0).get("points"));
    }

    @Test
    @DisplayName("Swiss System: Odd participant count gets bye, rematch prevention across rounds")
    void testSwissMultiSportOddCount() {
        Tournament t = createTournament("FOOTBALL", TournamentFormat.SWISS, 3);
        List<TournamentParticipantDto> teams = createParticipants(5, "Team");

        // Round 1
        List<Map<String, Object>> r1 = swissEngine.generateRound(t, teams, Collections.emptyList(), 1);
        assertEquals(3, r1.size(), "5 teams should have 2 regular matches and 1 bye");

        long byeCount = r1.stream().filter(m -> "BYE".equalsIgnoreCase((String) m.get("courtName"))).count();
        assertEquals(1, byeCount, "Exactly 1 team should receive a bye");

        for (Map<String, Object> m : r1) {
            if ("SCHEDULED".equalsIgnoreCase((String) m.get("status"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
                setScore(m, 2, 0, (String) pA.get("name"));
            }
        }

        // Round 2: Generate next round
        List<Map<String, Object>> r2 = swissEngine.generateRound(t, teams, r1, 2);
        assertEquals(3, r2.size());

        // Check rematch prevention
        for (Map<String, Object> m2 : r2) {
            if ("BYE".equalsIgnoreCase((String) m2.get("courtName"))) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> pA2 = (Map<String, Object>) m2.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB2 = (Map<String, Object>) m2.get("participantB");

            for (Map<String, Object> m1 : r1) {
                if ("BYE".equalsIgnoreCase((String) m1.get("courtName"))) continue;
                @SuppressWarnings("unchecked")
                Map<String, Object> pA1 = (Map<String, Object>) m1.get("participantA");
                @SuppressWarnings("unchecked")
                Map<String, Object> pB1 = (Map<String, Object>) m1.get("participantB");

                boolean samePair = (pA2.get("id").equals(pA1.get("id")) && pB2.get("id").equals(pB1.get("id"))) ||
                                   (pA2.get("id").equals(pB1.get("id")) && pB2.get("id").equals(pA1.get("id")));
                assertFalse(samePair, "Swiss engine must not repeat match pairings across rounds");
            }
        }
    }

    private void setScore(Map<String, Object> match, int scoreA, int scoreB, String winner) {
        @SuppressWarnings("unchecked")
        Map<String, Object> pA = new LinkedHashMap<>((Map<String, Object>) match.get("participantA"));
        @SuppressWarnings("unchecked")
        Map<String, Object> pB = new LinkedHashMap<>((Map<String, Object>) match.get("participantB"));

        String nameA = (String) pA.get("name");
        String nameB = (String) pB.get("name");

        if ("DRAW".equalsIgnoreCase(winner)) {
            pA.put("score", scoreA);
            pB.put("score", scoreB);
            match.put("winner", "DRAW");
        } else if (winner != null && winner.equals(nameB)) {
            pB.put("score", Math.max(scoreA, scoreB));
            pA.put("score", Math.min(scoreA, scoreB));
            match.put("winner", winner);
        } else {
            pA.put("score", Math.max(scoreA, scoreB));
            pB.put("score", Math.min(scoreA, scoreB));
            match.put("winner", winner);
        }

        match.put("participantA", pA);
        match.put("participantB", pB);
        match.put("status", "COMPLETED");
    }

    @SafeVarargs
    private List<Map<String, Object>> combine(List<Map<String, Object>>... lists) {
        List<Map<String, Object>> combined = new ArrayList<>();
        for (List<Map<String, Object>> l : lists) {
            combined.addAll(l);
        }
        return combined;
    }
}
