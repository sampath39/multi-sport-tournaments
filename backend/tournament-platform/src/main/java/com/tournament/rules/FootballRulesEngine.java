package com.tournament.rules;

import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class FootballRulesEngine extends AbstractSportRulesEngine {

    @Override
    public SportCode getSportCode() {
        return SportCode.FOOTBALL;
    }

    @Override
    public String getParticipantTerminology() {
        return "Team";
    }

    @Override
    public String getCourtTerminology() {
        return "Pitch";
    }

    @Override
    public boolean isDrawAllowed(TournamentFormat format) {
        return !isKnockout(format);
    }

    @Override
    public double getWinPoints(TournamentFormat format) {
        return 3.0;
    }

    @Override
    public double getDrawPoints(TournamentFormat format) {
        return 1.0;
    }

    @Override
    public double getLossPoints(TournamentFormat format) {
        return 0.0;
    }

    @Override
    public double[] calculateMatchPoints(Number scoreA, Number scoreB, String winner, TournamentFormat format) {
        if (scoreA == null || scoreB == null) return new double[]{0.0, 0.0};
        double a = scoreA.doubleValue();
        double b = scoreB.doubleValue();

        if (a > b) return new double[]{3.0, 0.0};
        if (b > a) return new double[]{0.0, 3.0};

        if (winner != null && !winner.trim().isEmpty() && !"DRAW".equalsIgnoreCase(winner)) {
            // Penalty shootout or extra time winner in knockout
            return new double[]{3.0, 0.0};
        }
        return new double[]{1.0, 1.0};
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<UUID, Map<String, Object>> stats = initializeBaseParticipantStats(participants);
        Map<UUID, Integer> goalsFor = new HashMap<>();
        Map<UUID, Integer> goalsAgainst = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            goalsFor.put(p.getId(), 0);
            goalsAgainst.put(p.getId(), 0);
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

            int gfA = pA.get("score") != null ? ((Number) pA.get("score")).intValue() : 0;
            int gfB = pB.get("score") != null ? ((Number) pB.get("score")).intValue() : 0;
            String winner = (String) m.get("winner");

            Map<String, Object> stA = stats.get(idA);
            Map<String, Object> stB = stats.get(idB);
            if (stA == null || stB == null) continue;

            stA.put("played", (int) stA.get("played") + 1);
            stB.put("played", (int) stB.get("played") + 1);

            goalsFor.put(idA, goalsFor.get(idA) + gfA);
            goalsAgainst.put(idA, goalsAgainst.get(idA) + gfB);
            goalsFor.put(idB, goalsFor.get(idB) + gfB);
            goalsAgainst.put(idB, goalsAgainst.get(idB) + gfA);

            if (gfA > gfB || (stA.get("participantName").equals(winner))) {
                stA.put("won", (int) stA.get("won") + 1);
                stA.put("points", (double) stA.get("points") + 3.0);
                stB.put("lost", (int) stB.get("lost") + 1);
            } else if (gfB > gfA || (stB.get("participantName").equals(winner))) {
                stB.put("won", (int) stB.get("won") + 1);
                stB.put("points", (double) stB.get("points") + 3.0);
                stA.put("lost", (int) stA.get("lost") + 1);
            } else {
                stA.put("drawn", (int) stA.get("drawn") + 1);
                stB.put("drawn", (int) stB.get("drawn") + 1);
                stA.put("points", (double) stA.get("points") + 1.0);
                stB.put("points", (double) stB.get("points") + 1.0);
            }
        }

        List<Map<String, Object>> standings = new ArrayList<>(stats.values());
        for (Map<String, Object> row : standings) {
            UUID id = parseUuid(row.get("participantId"));
            int gf = goalsFor.getOrDefault(id, 0);
            int ga = goalsAgainst.getOrDefault(id, 0);
            row.put("goalsFor", gf);
            row.put("goalsAgainst", ga);
            row.put("goalDifference", gf - ga);
        }

        standings.sort((a, b) -> {
            int cmpPts = Double.compare((double) b.get("points"), (double) a.get("points"));
            if (cmpPts != 0) return cmpPts;
            int cmpGd = Integer.compare((int) b.get("goalDifference"), (int) a.get("goalDifference"));
            if (cmpGd != 0) return cmpGd;
            return Integer.compare((int) b.get("goalsFor"), (int) a.get("goalsFor"));
        });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }
        return standings;
    }
}
