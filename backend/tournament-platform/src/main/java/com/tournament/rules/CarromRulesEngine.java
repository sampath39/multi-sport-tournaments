package com.tournament.rules;

import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CarromRulesEngine extends AbstractSportRulesEngine {

    @Override
    public SportCode getSportCode() {
        return SportCode.CARROM;
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
            return new double[]{2.0, 0.0};
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
        Map<UUID, Integer> boardPtsFor = new HashMap<>();
        Map<UUID, Integer> boardPtsAgainst = new HashMap<>();

        for (TournamentParticipantDto p : participants) {
            boardPtsFor.put(p.getId(), 0);
            boardPtsAgainst.put(p.getId(), 0);
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

            boardPtsFor.put(idA, boardPtsFor.get(idA) + sA);
            boardPtsAgainst.put(idA, boardPtsAgainst.get(idA) + sB);
            boardPtsFor.put(idB, boardPtsFor.get(idB) + sB);
            boardPtsAgainst.put(idB, boardPtsAgainst.get(idB) + sA);

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
            int bpf = boardPtsFor.getOrDefault(id, 0);
            int bpa = boardPtsAgainst.getOrDefault(id, 0);
            row.put("boardPointsFor", bpf);
            row.put("boardPointsAgainst", bpa);
            row.put("netBoardPoints", bpf - bpa);
        }

        standings.sort((a, b) -> {
            int cmpPts = Double.compare((double) b.get("points"), (double) a.get("points"));
            if (cmpPts != 0) return cmpPts;
            int cmpNbp = Integer.compare((int) b.get("netBoardPoints"), (int) a.get("netBoardPoints"));
            if (cmpNbp != 0) return cmpNbp;
            return Integer.compare((int) b.get("boardPointsFor"), (int) a.get("boardPointsFor"));
        });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }
        return standings;
    }
}
