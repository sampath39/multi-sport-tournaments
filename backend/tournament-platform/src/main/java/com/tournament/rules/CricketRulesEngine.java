package com.tournament.rules;

import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CricketRulesEngine extends AbstractSportRulesEngine {

    @Override
    public SportCode getSportCode() {
        return SportCode.CRICKET;
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
        return 2.0;
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

        if (a > b) return new double[]{2.0, 0.0};
        if (b > a) return new double[]{0.0, 2.0};

        if (winner != null && !winner.trim().isEmpty() && !"DRAW".equalsIgnoreCase(winner)) {
            // Tiebreaker / Super Over was used
            return new double[]{2.0, 0.0}; // winner gets 2, loser gets 0
        }
        return new double[]{1.0, 1.0}; // Tied / No Result
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<UUID, Map<String, Object>> stats = initializeBaseParticipantStats(participants);
        Map<UUID, Double> runsScored = new HashMap<>();
        Map<UUID, Double> runsConceded = new HashMap<>();
        Map<UUID, Double> oversBatted = new HashMap<>();
        Map<UUID, Double> oversBowled = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            runsScored.put(p.getId(), 0.0);
            runsConceded.put(p.getId(), 0.0);
            oversBatted.put(p.getId(), 0.0);
            oversBowled.put(p.getId(), 0.0);
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

            double sA = pA.get("score") != null ? ((Number) pA.get("score")).doubleValue() : 0.0;
            double sB = pB.get("score") != null ? ((Number) pB.get("score")).doubleValue() : 0.0;
            String winner = (String) m.get("winner");

            Map<String, Object> stA = stats.get(idA);
            Map<String, Object> stB = stats.get(idB);
            if (stA == null || stB == null) continue;

            stA.put("played", (int) stA.get("played") + 1);
            stB.put("played", (int) stB.get("played") + 1);

            runsScored.put(idA, runsScored.get(idA) + sA);
            runsConceded.put(idA, runsConceded.get(idA) + sB);
            oversBatted.put(idA, oversBatted.get(idA) + 20.0); // standard T20 / 20 overs default
            oversBowled.put(idA, oversBowled.get(idA) + 20.0);

            runsScored.put(idB, runsScored.get(idB) + sB);
            runsConceded.put(idB, runsConceded.get(idB) + sA);
            oversBatted.put(idB, oversBatted.get(idB) + 20.0);
            oversBowled.put(idB, oversBowled.get(idB) + 20.0);

            if (sA > sB || (stA.get("participantName").equals(winner))) {
                stA.put("won", (int) stA.get("won") + 1);
                stA.put("points", (double) stA.get("points") + 2.0);
                stB.put("lost", (int) stB.get("lost") + 1);
            } else if (sB > sA || (stB.get("participantName").equals(winner))) {
                stB.put("won", (int) stB.get("won") + 1);
                stB.put("points", (double) stB.get("points") + 2.0);
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
            double scored = runsScored.getOrDefault(id, 0.0);
            double conceded = runsConceded.getOrDefault(id, 0.0);
            double oBatted = oversBatted.getOrDefault(id, 1.0);
            double oBowled = oversBowled.getOrDefault(id, 1.0);

            double nrr = (oBatted > 0 ? (scored / oBatted) : 0.0) - (oBowled > 0 ? (conceded / oBowled) : 0.0);
            row.put("runsScored", (int) scored);
            row.put("runsConceded", (int) conceded);
            row.put("nrr", Math.round(nrr * 1000.0) / 1000.0);
        }

        // Sort by Points desc, then NRR desc, then runsScored desc
        standings.sort((a, b) -> {
            int cmpPts = Double.compare((double) b.get("points"), (double) a.get("points"));
            if (cmpPts != 0) return cmpPts;
            int cmpNrr = Double.compare((double) b.get("nrr"), (double) a.get("nrr"));
            if (cmpNrr != 0) return cmpNrr;
            return Integer.compare((int) b.get("runsScored"), (int) a.get("runsScored"));
        });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }
        return standings;
    }
}
