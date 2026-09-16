package com.tournament.rules;

import com.tournament.sport.SportCode;
import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;

import java.util.List;
import java.util.Map;

/**
 * Strategy interface encapsulating sport-specific rules, scoring conventions,
 * draw policies, tiebreakers, and standings calculations.
 */
public interface SportRulesEngine {

    SportCode getSportCode();

    String getParticipantTerminology(); // "Team" or "Player"

    String getCourtTerminology(); // "Pitch", "Court", "Table", "Board"

    boolean isDrawAllowed(TournamentFormat format);

    double getWinPoints(TournamentFormat format);

    double getDrawPoints(TournamentFormat format);

    double getLossPoints(TournamentFormat format);

    /**
     * Calculates match points awarded to side A and side B.
     * @return [pointsA, pointsB]
     */
    double[] calculateMatchPoints(Number scoreA, Number scoreB, String winner, TournamentFormat format);

    /**
     * Validates if score and winner conform to sport rules and tournament format.
     */
    void validateScore(Number scoreA, Number scoreB, String winner, TournamentFormat format);

    /**
     * Calculates sport-specific standings table.
     */
    List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    );
}
