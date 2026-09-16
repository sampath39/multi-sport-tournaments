package com.tournament.rules;

import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ChessRulesEngine extends AbstractSportRulesEngine {

    @Override
    public SportCode getSportCode() {
        return SportCode.CHESS;
    }

    @Override
    public String getParticipantTerminology() {
        return "Player";
    }

    @Override
    public String getCourtTerminology() {
        return "Board";
    }

    @Override
    public boolean isDrawAllowed(TournamentFormat format) {
        return !isKnockout(format);
    }

    @Override
    public double getWinPoints(TournamentFormat format) {
        return 1.0;
    }

    @Override
    public double getDrawPoints(TournamentFormat format) {
        return 0.5;
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

        if (a > b) return new double[]{1.0, 0.0};
        if (b > a) return new double[]{0.0, 1.0};
        if (winner != null && !winner.trim().isEmpty() && !"DRAW".equalsIgnoreCase(winner)) {
            // Armageddon or tiebreak winner in Knockout
            return new double[]{1.0, 0.0};
        }
        return new double[]{0.5, 0.5};
    }

    @Override
    public List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    ) {
        Map<UUID, Map<String, Object>> stats = initializeBaseParticipantStats(participants);
        Map<UUID, List<UUID>> opponents = new HashMap<>();
        Map<UUID, Map<UUID, Double>> matchResults = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            opponents.put(p.getId(), new ArrayList<>());
            matchResults.put(p.getId(), new HashMap<>());
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
            if (idA == null) continue;

            String resultType = (String) m.get("resultType");
            if ("BYE".equalsIgnoreCase(resultType) || idB == null) {
                Map<String, Object> stA = stats.get(idA);
                if (stA != null) {
                    stA.put("points", (double) stA.get("points") + 1.0);
                    stA.put("won", (int) stA.get("won") + 1);
                    stA.put("played", (int) stA.get("played") + 1);
                }
                continue;
            }

            double sA = pA.get("score") != null ? ((Number) pA.get("score")).doubleValue() : 0.0;
            double sB = pB.get("score") != null ? ((Number) pB.get("score")).doubleValue() : 0.0;

            Map<String, Object> stA = stats.get(idA);
            Map<String, Object> stB = stats.get(idB);
            if (stA == null || stB == null) continue;

            stA.put("played", (int) stA.get("played") + 1);
            stB.put("played", (int) stB.get("played") + 1);

            opponents.get(idA).add(idB);
            opponents.get(idB).add(idA);

            if (sA > sB) {
                stA.put("won", (int) stA.get("won") + 1);
                stA.put("points", (double) stA.get("points") + 1.0);
                stB.put("lost", (int) stB.get("lost") + 1);
                matchResults.get(idA).put(idB, 1.0);
                matchResults.get(idB).put(idA, 0.0);
            } else if (sB > sA) {
                stB.put("won", (int) stB.get("won") + 1);
                stB.put("points", (double) stB.get("points") + 1.0);
                stA.put("lost", (int) stA.get("lost") + 1);
                matchResults.get(idA).put(idB, 0.0);
                matchResults.get(idB).put(idA, 1.0);
            } else {
                stA.put("drawn", (int) stA.get("drawn") + 1);
                stB.put("drawn", (int) stB.get("drawn") + 1);
                stA.put("points", (double) stA.get("points") + 0.5);
                stB.put("points", (double) stB.get("points") + 0.5);
                matchResults.get(idA).put(idB, 0.5);
                matchResults.get(idB).put(idA, 0.5);
            }
        }

        List<Map<String, Object>> standings = new ArrayList<>(stats.values());
        for (Map<String, Object> row : standings) {
            UUID id = parseUuid(row.get("participantId"));
            double buchholz = 0.0;
            double sonnebornBerger = 0.0;

            for (UUID oppId : opponents.getOrDefault(id, Collections.emptyList())) {
                Map<String, Object> oppStat = stats.get(oppId);
                if (oppStat != null) {
                    double oppScore = (double) oppStat.get("points");
                    buchholz += oppScore;

                    double res = matchResults.get(id).getOrDefault(oppId, 0.0);
                    sonnebornBerger += res * oppScore;
                }
            }
            row.put("buchholz", Math.round(buchholz * 10.0) / 10.0);
            row.put("sonnebornBerger", Math.round(sonnebornBerger * 100.0) / 100.0);
        }

        standings.sort((a, b) -> {
            int cmpPts = Double.compare((double) b.get("points"), (double) a.get("points"));
            if (cmpPts != 0) return cmpPts;
            int cmpBuch = Double.compare((double) b.get("buchholz"), (double) a.get("buchholz"));
            if (cmpBuch != 0) return cmpBuch;
            int cmpSb = Double.compare((double) b.get("sonnebornBerger"), (double) a.get("sonnebornBerger"));
            if (cmpSb != 0) return cmpSb;
            return Integer.compare((int) b.get("won"), (int) a.get("won"));
        });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }
        return standings;
    }
}
