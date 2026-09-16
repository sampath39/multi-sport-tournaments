package com.tournament.tournament.format;

import com.tournament.tournament.Tournament;
import com.tournament.tournament.TournamentFormat;
import com.tournament.tournament.TournamentParticipantDto;

import java.util.List;
import java.util.Map;

/**
 * Strategy interface for tournament formats (Swiss, Single Elimination, Round Robin).
 * Each format encapsulates its own pairing logic, round progression, standings calculation,
 * and completion conditions.
 */
public interface TournamentFormatEngine {

    /**
     * @return The format this engine handles
     */
    TournamentFormat getFormat();

    /**
     * Generates fixtures for the next round (or full schedule for Round Robin).
     *
     * @param tournament Tournament entity
     * @param participants All registered participants
     * @param existingFixtures Existing fixtures across all rounds
     * @param nextRound Round number to generate
     * @return List of newly generated match fixtures
     */
    List<Map<String, Object>> generateRound(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> existingFixtures,
        int nextRound
    );

    /**
     * Calculates standings/leaderboard for this tournament format.
     *
     * @param tournament Tournament entity
     * @param participants All registered participants
     * @param fixtures All tournament fixtures
     * @return Ordered list of standings entries
     */
    List<Map<String, Object>> calculateStandings(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    );

    /**
     * Checks if the tournament format has reached full conclusion.
     *
     * @param tournament Tournament entity
     * @param participants All registered participants
     * @param fixtures All tournament fixtures
     * @return true if all matches/rounds are completed
     */
    boolean isTournamentComplete(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    );

    /**
     * Generates format-specific bracket or tree view (primarily for Single Elimination).
     *
     * @param tournament Tournament entity
     * @param participants All registered participants
     * @param fixtures All tournament fixtures
     * @return Bracket structure map
     */
    Map<String, Object> getBracket(
        Tournament tournament,
        List<TournamentParticipantDto> participants,
        List<Map<String, Object>> fixtures
    );
}
