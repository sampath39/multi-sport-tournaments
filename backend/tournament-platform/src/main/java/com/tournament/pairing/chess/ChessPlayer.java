package com.tournament.pairing.chess;

import lombok.*;

import java.util.*;

/**
 * Full tournament state model for a Chess player in Swiss system pairings.
 * Adheres to FIDE Handbook standards for tracking history, colors, and encounters.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChessPlayer {
    private UUID id;
    private String name;
    private double rating;
    private int seed;

    @Builder.Default
    private double score = 0.0;

    @Builder.Default
    private int wins = 0;

    @Builder.Default
    private int draws = 0;

    @Builder.Default
    private int losses = 0;

    @Builder.Default
    private int gamesPlayed = 0;

    @Builder.Default
    private int whiteGames = 0;

    @Builder.Default
    private int blackGames = 0;

    @Builder.Default
    private List<String> colorHistory = new ArrayList<>(); // "W" or "B"

    @Builder.Default
    private Set<UUID> opponents = new HashSet<>();

    @Builder.Default
    private int byeCount = 0;

    @Builder.Default
    private boolean receivedBye = false;

    private String lastColor; // "W" or "B"

    private String floatDirection; // "UP", "DOWN", "NONE"
    private Double floatedFromScore;

    public void addOpponent(UUID oppId) {
        if (opponents == null) opponents = new HashSet<>();
        opponents.add(oppId);
    }

    public boolean hasPlayed(UUID oppId) {
        return opponents != null && opponents.contains(oppId);
    }

    public void recordResult(String color, double result, UUID oppId) {
        gamesPlayed++;
        if ("W".equalsIgnoreCase(color) || "WHITE".equalsIgnoreCase(color)) {
            whiteGames++;
            lastColor = "W";
            if (colorHistory == null) colorHistory = new ArrayList<>();
            colorHistory.add("W");
        } else if ("B".equalsIgnoreCase(color) || "BLACK".equalsIgnoreCase(color)) {
            blackGames++;
            lastColor = "B";
            if (colorHistory == null) colorHistory = new ArrayList<>();
            colorHistory.add("B");
        }

        if (oppId != null) {
            addOpponent(oppId);
        }

        if (result >= 1.0) {
            wins++;
            score += 1.0;
        } else if (result >= 0.5) {
            draws++;
            score += 0.5;
        } else {
            losses++;
        }
    }

    public void recordBye() {
        byeCount++;
        receivedBye = true;
        score += 1.0;
        gamesPlayed++;
    }

    public int getColorDifference() {
        return whiteGames - blackGames;
    }

    /**
     * FIDE Rule: A player must not be assigned the same color 3 times in a row.
     */
    public boolean canReceiveColor(String color) {
        if (colorHistory == null || colorHistory.size() < 2) {
            return true;
        }
        int len = colorHistory.size();
        String c1 = colorHistory.get(len - 1);
        String c2 = colorHistory.get(len - 2);

        // Disallow 3 in a row
        if (c1.equalsIgnoreCase(color) && c2.equalsIgnoreCase(color)) {
            return false;
        }

        // Absolute color difference should not exceed 2
        int diff = getColorDifference();
        if ("W".equalsIgnoreCase(color) && diff >= 2) {
            return false;
        }
        if ("B".equalsIgnoreCase(color) && diff <= -2) {
            return false;
        }

        return true;
    }

    /**
     * Preferred color for this round.
     */
    public String getPreferredColor() {
        if (!canReceiveColor("W")) return "B";
        if (!canReceiveColor("B")) return "W";

        int diff = getColorDifference();
        if (diff > 0) return "B";
        if (diff < 0) return "W";

        if ("W".equalsIgnoreCase(lastColor)) return "B";
        if ("B".equalsIgnoreCase(lastColor)) return "W";

        return (seed % 2 == 1) ? "W" : "B";
    }
}
