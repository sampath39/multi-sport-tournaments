package com.tournament.rules;

import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;

import java.util.*;

public abstract class AbstractSportRulesEngine implements SportRulesEngine {

    protected boolean isKnockout(TournamentFormat format) {
        return format == TournamentFormat.SINGLE_ELIMINATION
            || format == TournamentFormat.KNOCKOUT
            || format == TournamentFormat.DOUBLE_ELIMINATION;
    }

    @Override
    public void validateScore(Number scoreA, Number scoreB, String winner, TournamentFormat format) {
        if (scoreA == null || scoreB == null) {
            return;
        }
        double a = scoreA.doubleValue();
        double b = scoreB.doubleValue();
        if (a < 0 || b < 0) {
            throw new IllegalArgumentException("Scores cannot be negative.");
        }

        if (isKnockout(format)) {
            if (Double.compare(a, b) == 0 && (winner == null || winner.trim().isEmpty() || "DRAW".equalsIgnoreCase(winner))) {
                throw new IllegalArgumentException(
                    "Knockout matches cannot conclude in a tie. A definitive winner must be determined via tiebreaker (Super Over, Penalties, Overtime, Deciding Set, Armageddon)."
                );
            }
        } else if (!isDrawAllowed(format) && Double.compare(a, b) == 0 && (winner == null || winner.trim().isEmpty())) {
            throw new IllegalArgumentException(
                getSportCode().name() + " matches cannot end in a draw. Please record the winning side."
            );
        }
    }

    protected Map<UUID, Map<String, Object>> initializeBaseParticipantStats(List<TournamentParticipantDto> participants) {
        Map<UUID, Map<String, Object>> map = new LinkedHashMap<>();
        for (int i = 0; i < participants.size(); i++) {
            TournamentParticipantDto p = participants.get(i);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("participantId", p.getId().toString());
            row.put("participantName", p.getDisplayName());
            row.put("seed", p.getSeed() != null ? p.getSeed() : (i + 1));
            row.put("rating", p.getRating() != null ? p.getRating().doubleValue() : 1500.0);
            row.put("played", 0);
            row.put("won", 0);
            row.put("drawn", 0);
            row.put("lost", 0);
            row.put("points", 0.0);
            map.put(p.getId(), row);
        }
        return map;
    }

    protected UUID parseUuid(Object idObj) {
        if (idObj == null) return null;
        try {
            return UUID.fromString(idObj.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
