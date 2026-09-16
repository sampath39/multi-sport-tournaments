package com.tournament.rules;

import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TableTennisRulesEngine extends AbstractSportRulesEngine {

    @Override
    public SportCode getSportCode() {
        return SportCode.TABLE_TENNIS;
    }

    @Override
    public String getParticipantTerminology() {
        return "Player";
    }

    @Override
    public String getCourtTerminology() {
        return "Table";
    }

    @Override
    public boolean isDrawAllowed(TournamentFormat format) {
        return false; // Table Tennis matches are best-of-odd games
    }

    @Override
    public double getWinPoints(TournamentFormat format) {
        return 1.0;
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

        if (sA > sB) return new double[]{1.0, 0.0};
        if (sB > sA) return new double[]{0.0, 1.0};
        if (winner != null && !winner.trim().isEmpty()) {
            return new double[]{1.0, 0.0};
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
        Map<UUID, Integer> gamesWon = new HashMap<>();
        Map<UUID, Integer> gamesLost = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            gamesWon.put(p.getId(), 0);
            gamesLost.put(p.getId(), 0);
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

            gamesWon.put(idA, gamesWon.get(idA) + sA);
            gamesLost.put(idA, gamesLost.get(idA) + sB);
            gamesWon.put(idB, gamesWon.get(idB) + sB);
            gamesLost.put(idB, gamesLost.get(idB) + sA);

            if (sA > sB || (stA.get("participantName").equals(winner))) {
                stA.put("won", (int) stA.get("won") + 1);
                stA.put("points", (double) stA.get("points") + 1.0);
                stB.put("lost", (int) stB.get("lost") + 1);
            } else if (sB > sA || (stB.get("participantName").equals(winner))) {
                stB.put("won", (int) stB.get("won") + 1);
                stB.put("points", (double) stB.get("points") + 1.0);
                stA.put("lost", (int) stA.get("lost") + 1);
            }
        }

        List<Map<String, Object>> standings = new ArrayList<>(stats.values());
        for (Map<String, Object> row : standings) {
            UUID id = parseUuid(row.get("participantId"));
            int gw = gamesWon.getOrDefault(id, 0);
            int gl = gamesLost.getOrDefault(id, 0);
            row.put("gamesWon", gw);
            row.put("gamesLost", gl);
            row.put("gameDiff", gw - gl);
        }

        standings.sort((a, b) -> {
            int cmpPts = Double.compare((double) b.get("points"), (double) a.get("points"));
            if (cmpPts != 0) return cmpPts;
            int cmpDiff = Integer.compare((int) b.get("gameDiff"), (int) a.get("gameDiff"));
            if (cmpDiff != 0) return cmpDiff;
            return Integer.compare((int) b.get("gamesWon"), (int) a.get("gamesWon"));
        });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }
        return standings;
    }
}
