package com.tournament.rules;

import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class VolleyballRulesEngine extends AbstractSportRulesEngine {

    @Override
    public SportCode getSportCode() {
        return SportCode.VOLLEYBALL;
    }

    @Override
    public String getParticipantTerminology() {
        return "Team";
    }

    @Override
    public String getCourtTerminology() {
        return "Court";
    }

    @Override
    public boolean isDrawAllowed(TournamentFormat format) {
        return false; // Volleyball sets must be played to a winner
    }

    @Override
    public double getWinPoints(TournamentFormat format) {
        return 3.0;
    }

    @Override
    public double getDrawPoints(TournamentFormat format) {
        return 0.0;
    }

    @Override
    public double getLossPoints(TournamentFormat format) {
        return 0.0;
    }

    @Override
    public double[] calculateMatchPoints(Number scoreA, Number scoreB, String winner, TournamentFormat format) {
        if (scoreA == null || scoreB == null) return new double[]{0.0, 0.0};
        int sA = scoreA.intValue();
        int sB = scoreB.intValue();

        if (sA > sB) {
            // Check if 5th set / deciding set (e.g. 3-2 or 2-1)
            if (sB == sA - 1 && sA >= 2) {
                return new double[]{2.0, 1.0}; // 3-2 or 2-1 win
            }
            return new double[]{3.0, 0.0}; // 3-0 or 3-1 win
        } else if (sB > sA) {
            if (sA == sB - 1 && sB >= 2) {
                return new double[]{1.0, 2.0};
            }
            return new double[]{0.0, 3.0};
        }
        return new double[]{0.0, 0.0};
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<UUID, Map<String, Object>> stats = initializeBaseParticipantStats(participants);
        Map<UUID, Integer> setsWon = new HashMap<>();
        Map<UUID, Integer> setsLost = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            setsWon.put(p.getId(), 0);
            setsLost.put(p.getId(), 0);
        }

        for (Map<String, Object> m : fixtures) {
            if (!"COMPLETED".equalsIgnoreCase((String) m.get("status"))) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> pA = (Map<String, Object>) m.get("participantA");
            @SuppressWarnings("unchecked")
            Map<String, Object> pB = (Map<String, Object>) m.get("participantB");
            if (pA == null || pB == null) continue;

            UUID idA = parseUuid(pA.get("id"));
            UUID idB = parseUuid(pB.get("id"));
            if (idA == null || idB == null) continue;

            int sA = pA.get("score") != null ? ((Number) pA.get("score")).intValue() : 0;
            int sB = pB.get("score") != null ? ((Number) pB.get("score")).intValue() : 0;
            String winner = (String) m.get("winner");

            Map<String, Object> stA = stats.get(idA);
            Map<String, Object> stB = stats.get(idB);
            if (stA == null || stB == null) continue;

            stA.put("played", (int) stA.get("played") + 1);
            stB.put("played", (int) stB.get("played") + 1);

            setsWon.put(idA, setsWon.get(idA) + sA);
            setsLost.put(idA, setsLost.get(idA) + sB);
            setsWon.put(idB, setsWon.get(idB) + sB);
            setsLost.put(idB, setsLost.get(idB) + sA);

            double[] pts = calculateMatchPoints(sA, sB, winner, tournament.getFormatCode());
            stA.put("points", (double) stA.get("points") + pts[0]);
            stB.put("points", (double) stB.get("points") + pts[1]);

            if (sA > sB || (stA.get("participantName").equals(winner))) {
                stA.put("won", (int) stA.get("won") + 1);
                stB.put("lost", (int) stB.get("lost") + 1);
            } else if (sB > sA || (stB.get("participantName").equals(winner))) {
                stB.put("won", (int) stB.get("won") + 1);
                stA.put("lost", (int) stA.get("lost") + 1);
            }
        }

        List<Map<String, Object>> standings = new ArrayList<>(stats.values());
        for (Map<String, Object> row : standings) {
            UUID id = parseUuid(row.get("participantId"));
            int sw = setsWon.getOrDefault(id, 0);
            int sl = setsLost.getOrDefault(id, 0);
            row.put("setsWon", sw);
            row.put("setsLost", sl);
            row.put("setDiff", sw - sl);
        }

        standings.sort((a, b) -> {
            int cmpPts = Double.compare((double) b.get("points"), (double) a.get("points"));
            if (cmpPts != 0) return cmpPts;
            int cmpDiff = Integer.compare((int) b.get("setDiff"), (int) a.get("setDiff"));
            if (cmpDiff != 0) return cmpDiff;
            return Integer.compare((int) b.get("setsWon"), (int) a.get("setsWon"));
        });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }
        return standings;
    }
}
