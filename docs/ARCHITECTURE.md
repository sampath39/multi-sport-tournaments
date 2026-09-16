# Multi-Sport Tournament Management Platform — Architecture Document

## 1. Executive Summary

This platform is an enterprise, production-grade tournament management ecosystem engineered to orchestrate sports competitions across Casual, School, College, Corporate, Club, Academy, Community, District, State, and Professional tiers.

### Core Supported Disciplines
1. **Chess** (FIDE Dutch Swiss system, Buchholz, Sonneborn-Berger)
2. **Cricket** (ICC/T20/ODI/Box Cricket, Net Run Rate, Duckworth-Lewis-Stern, Super Overs)
3. **Football** (FIFA/IFAB rules, extra time, penalty shootouts, card disciplinary points, H2H)
4. **Basketball** (FIBA rules, 4 quarters, foul limits, overtime)
5. **Badminton** (BWF 21-point rally scoring, 2-point clear up to 30, deuce tracking)
6. **Carrom** (ICF board points, queen cover +3 bonus, white/black breakdown)
7. **Volleyball** (FIVB 5-set matches, 25-pt sets, 5th set to 15, libero & rotation tracking)
8. **Table Tennis** (ITTF 11-point best-of-5/7 games, deuce rules)

---

## 2. High-Level Architecture

```
                       [ Spectators / Mobile Companion ]
                                      |
                                  (QR Code)
                                      v
 [ Web Admin / Scorers ] ----> [ React 19 Frontend ] ----> [ Stadium TV HUD ]
                                      |
                           (HTTP / REST & WebSocket)
                                      v
                         [ Spring Boot 3.3 Backend ]
                                      |
               +----------------------+----------------------+
               |                      |                      |
      [ PostgreSQL 16 ]         [ Redis 7 ]           [ Supabase / S3 ]
      - Relational DDL          - Live Match PubSub   - Media Storage
      - JSONB Rulesets          - Session Cache
      - Audit Trails            - Distributed Locks
```

---

## 3. Competition & Pairing Algorithms

### 3.1 FIDE Dutch Swiss System (Chess)
- Scores are grouped by brackets ($S_0, S_1, \dots$).
- Avoids rematches: no two players play each other twice in the same tournament.
- Alternates color allocation (White/Black) with a maximum consecutive color run of 2.
- Handles odd participant counts via official Bye points.

### 3.2 Double Elimination & Single Elimination
- Standard tree seeding by rating/seed with automatic power-of-two padding (Byes).
- In Double Elimination:
  - Upper Bracket: Winners advance towards the Grand Final.
  - Lower Bracket: Losers from Upper drop into Lower rounds.
  - Grand Final: Lower champion must beat Upper champion twice (bracket reset) or sudden death.

### 3.3 Round Robin & Group Stages
- Berger tables / circle pairing algorithm ensures fair schedule distribution.
- Automated generation of home/away assignments.
- Real-time standings calculation based on sport-specific points, head-to-head records, goal/run differences.

---

## 4. Anti-Cheat, Security & Auditability

1. **Immutable Audit Ledger (`audit_logs`)**:
   - Every administrative override, score edit, participant disqualification, and manual bye assignment is cryptographically stamped with actor ID, IP address, timestamp, before/after diffs.
2. **Role-Based Access Control (RBAC)**:
   - 10 distinct roles (`SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `TOURNAMENT_ADMIN`, `REFEREE`, `SCORER`, `TEAM_MANAGER`, `PLAYER`, `SPECTATOR`, `COACH`, `ANALYST`).
3. **Score Dispute Resolution**:
   - Matches can be locked, reviewed, and reverted with dual-scorer signoff mechanisms.
