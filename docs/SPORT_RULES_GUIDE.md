# Official Sport Rules & Mathematical Tie-Break Specifications

This guide outlines the mathematical implementation and official rule adherence for all 8 sports in the platform.

---

## 1. Chess (FIDE Dutch System)
- **Match Points**: Win = 1.0, Draw = 0.5, Loss = 0.0
- **Tie-Break Hierarchy**:
  1. **Buchholz**: Sum of opponents' scores.
  2. **Buchholz Cut 1**: Sum of opponents' scores excluding the lowest.
  3. **Sonneborn-Berger**: Sum of defeated opponents' scores + half of drawn opponents' scores.
  4. **Direct Encounter**: Result of the game between tied players.
  5. **Number of Wins**: Total wins achieved.

---

## 2. Cricket (ICC / T20 / Limited Overs)
- **Scoring**: Runs, Wickets, Overs, Extras (Wides, No-balls, Leg Byes, Byes, Penalty).
- **Net Run Rate (NRR)**:
  $$\text{NRR} = \left(\frac{\text{Total Runs Scored}}{\text{Total Overs Faced}}\right) - \left(\frac{\text{Total Runs Conceded}}{\text{Total Overs Bowled}}\right)$$
- If a team is bowled out, their full allocated overs quota (e.g. 20.0 overs) is counted for NRR divisor.
- **Duckworth-Lewis-Stern (DLS)**: Rain-interrupted target adjustment using resource percentage tables.
- **Tie Breaker**: Super Over (1 over per side).

---

## 3. Football (FIFA / IFAB)
- **Points Table**: Win = 3 pts, Draw = 1 pt, Loss = 0 pts.
- **Tie-Break Hierarchy**:
  1. Points
  2. Goal Difference ($\text{GD} = \text{Goals For} - \text{Goals Against}$)
  3. Goals Scored ($\text{GF}$)
  4. Head-to-head points between tied teams
  5. Fair Play Disciplinary Points:
     - Yellow card: -1 pt
     - Indirect red card (second yellow): -3 pts
     - Direct red card: -4 pts
     - Yellow card + direct red card: -5 pts

---

## 4. Basketball (FIBA)
- **Period Structure**: 4 quarters of 10 minutes (FIBA) or 12 minutes (NBA-style).
- **Points Table**: Win = 2 pts, Loss = 1 pt, Forfeit = 0 pts.
- **Tie-Break**: Point Differential ($\text{PD} = \text{Points For} - \text{Points Against}$) in head-to-head games.

---

## 5. Badminton (BWF Rally System)
- **Format**: Best of 3 sets to 21 points.
- **Rally Point System**: Point awarded on every rally regardless of server.
- **Deuce Rule**: At 20-20, side winning 2 consecutive points wins the game, capped at 30 points (at 29-29, 30th point wins).

---

## 6. Carrom (ICF International Laws)
- **Board Scoring**:
  - White piece: 1 point
  - Black piece: 1 point
  - Queen (Red piece): 3 points (only valid if covered by another piece on next strike)
- Board points capped at 25 or 8 boards.
- No queen points credited once a player reaches 22 points.

---

## 7. Volleyball (FIVB)
- **Format**: Best of 5 sets.
  - Sets 1-4: Played to 25 points (2-point lead required, no point cap).
  - Set 5 (Decider): Played to 15 points (2-point lead required).
- **Standings Point System (3-2-1-0)**:
  - 3-0 or 3-1 Win: 3 points to winner, 0 to loser.
  - 3-2 Win: 2 points to winner, 1 point to loser.

---

## 8. Table Tennis (ITTF)
- **Format**: Best of 5 or 7 games to 11 points.
- **Deuce Rule**: At 10-10, players alternate single serves until a 2-point margin is established.
