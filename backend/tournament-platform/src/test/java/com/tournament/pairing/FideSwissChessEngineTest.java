package com.tournament.pairing;

import com.tournament.pairing.chess.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class FideSwissChessEngineTest {

    private FideSwissChessEngine engine;

    @BeforeEach
    void setUp() {
        engine = new FideSwissChessEngine();
    }

    @Test
    @DisplayName("Round 1: 4 players - FIDE Dutch Split-Half (Seed 1 vs 3, Seed 2 vs 4)")
    void testRound1Even() {
        List<ChessPlayer> players = new ArrayList<>(List.of(
            ChessPlayer.builder().id(UUID.randomUUID()).name("Magnus").rating(2880).seed(1).build(),
            ChessPlayer.builder().id(UUID.randomUUID()).name("Hikaru").rating(2850).seed(2).build(),
            ChessPlayer.builder().id(UUID.randomUUID()).name("Gukesh").rating(2790).seed(3).build(),
            ChessPlayer.builder().id(UUID.randomUUID()).name("Pragg").rating(2770).seed(4).build()
        ));

        List<ChessPairing> pairings = engine.generatePairings(players, 1);
        assertEquals(2, pairings.size());

        // Board 1: Seed 1 (Magnus) vs Seed 3 (Gukesh)
        ChessPairing b1 = pairings.get(0);
        assertEquals("Magnus", b1.getWhitePlayer().getName());
        assertEquals("Gukesh", b1.getBlackPlayer().getName());

        // Board 2: Seed 4 (Pragg) vs Seed 2 (Hikaru) with alternate colors
        ChessPairing b2 = pairings.get(1);
        assertEquals("Pragg", b2.getWhitePlayer().getName());
        assertEquals("Hikaru", b2.getBlackPlayer().getName());
    }

    @Test
    @DisplayName("Round 1: Odd player count (3 players) - Lowest rated receives bye, top 2 paired")
    void testRound1Odd() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        UUID idC = UUID.randomUUID();

        List<ChessPlayer> players = new ArrayList<>(List.of(
            ChessPlayer.builder().id(idA).name("hello").rating(2000).seed(1).build(),
            ChessPlayer.builder().id(idB).name("hi").rating(1900).seed(2).build(),
            ChessPlayer.builder().id(idC).name("th").rating(1800).seed(3).build()
        ));

        List<ChessPairing> pairings = engine.generatePairings(players, 1);
        assertEquals(2, pairings.size());

        // Board 1: hello vs hi
        ChessPairing b1 = pairings.get(0);
        assertFalse(b1.isBye());
        assertTrue(
            (b1.getWhitePlayer().getName().equals("hello") && b1.getBlackPlayer().getName().equals("hi")) ||
            (b1.getWhitePlayer().getName().equals("hi") && b1.getBlackPlayer().getName().equals("hello"))
        );

        // Board 2: th receives Bye
        ChessPairing b2 = pairings.get(1);
        assertTrue(b2.isBye());
        assertEquals("th", b2.getWhitePlayer().getName());
    }

    @Test
    @DisplayName("Round 2: Odd player count - Ensure SAME player does NOT get Bye again, and NO rematch")
    void testRound2OddNoDuplicateByeAndNoRematch() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        UUID idC = UUID.randomUUID();

        // After Round 1:
        // 'hello' played 'hi': hi won (1 pt), hello lost (0 pt).
        // 'th' got Bye in Round 1 (1 pt).
        ChessPlayer pA = ChessPlayer.builder().id(idA).name("hello").rating(2000).seed(1).build();
        ChessPlayer pB = ChessPlayer.builder().id(idB).name("hi").rating(1900).seed(2).build();
        ChessPlayer pC = ChessPlayer.builder().id(idC).name("th").rating(1800).seed(3).build();

        pA.recordResult("W", 0.0, idB);
        pB.recordResult("B", 1.0, idA);
        pC.recordBye(); // th got bye in Round 1!

        assertEquals(0.0, pA.getScore());
        assertEquals(1.0, pB.getScore());
        assertEquals(1.0, pC.getScore());
        assertTrue(pC.isReceivedBye());

        List<ChessPlayer> players = new ArrayList<>(List.of(pA, pB, pC));

        // Generate Round 2
        List<ChessPairing> pairings = engine.generatePairings(players, 2);
        assertEquals(2, pairings.size());

        // The bye CANNOT be given to 'th' again! It must go to 'hello' (lowest score with 0 byes)
        Optional<ChessPairing> byePairing = pairings.stream().filter(ChessPairing::isBye).findFirst();
        assertTrue(byePairing.isPresent());
        assertEquals("hello", byePairing.get().getWhitePlayer().getName(), "Bye in round 2 must go to 'hello' because 'th' already had a bye!");

        // The game match MUST be between 'hi' and 'th' (NOT hello vs hi again!)
        Optional<ChessPairing> gamePairing = pairings.stream().filter(p -> !p.isBye()).findFirst();
        assertTrue(gamePairing.isPresent());
        Set<String> matchedNames = Set.of(gamePairing.get().getWhitePlayer().getName(), gamePairing.get().getBlackPlayer().getName());
        assertEquals(Set.of("hi", "th"), matchedNames, "Round 2 must pair 'hi' and 'th', avoiding rematch of 'hello' vs 'hi'!");
    }

    @Test
    @DisplayName("Round 2: Score groups - 1.0 vs 1.0 and 0.0 vs 0.0, No rematches")
    void testRound2ScoreGroupsEven() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        UUID id3 = UUID.randomUUID();
        UUID id4 = UUID.randomUUID();

        ChessPlayer p1 = ChessPlayer.builder().id(id1).name("P1").rating(2400).seed(1).build();
        ChessPlayer p2 = ChessPlayer.builder().id(id2).name("P2").rating(2300).seed(2).build();
        ChessPlayer p3 = ChessPlayer.builder().id(id3).name("P3").rating(2200).seed(3).build();
        ChessPlayer p4 = ChessPlayer.builder().id(id4).name("P4").rating(2100).seed(4).build();

        // Round 1: P1 beat P3 (P1=1.0, P3=0.0), P4 beat P2 (P4=1.0, P2=0.0)
        p1.recordResult("W", 1.0, id3);
        p3.recordResult("B", 0.0, id1);
        p4.recordResult("W", 1.0, id2);
        p2.recordResult("B", 0.0, id4);

        List<ChessPlayer> players = new ArrayList<>(List.of(p1, p2, p3, p4));

        List<ChessPairing> pairings = engine.generatePairings(players, 2);
        assertEquals(2, pairings.size());

        // Winners group (1.0 pt): P1 must play P4!
        // Losers group (0.0 pt): P2 must play P3!
        ChessPairing b1 = pairings.get(0);
        Set<String> topBoard = Set.of(b1.getWhitePlayer().getName(), b1.getBlackPlayer().getName());
        assertEquals(Set.of("P1", "P4"), topBoard, "Winners group (1.0 pts) must be paired together");

        ChessPairing b2 = pairings.get(1);
        Set<String> bottomBoard = Set.of(b2.getWhitePlayer().getName(), b2.getBlackPlayer().getName());
        assertEquals(Set.of("P2", "P3"), bottomBoard, "0.0 group must be paired together");
    }
}
