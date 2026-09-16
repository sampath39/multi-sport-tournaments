package com.tournament.sport;

public enum SportCode {
    CHESS,
    CRICKET,
    FOOTBALL,
    BASKETBALL,
    CARROM,
    VOLLEYBALL,
    TABLE_TENNIS,
    BADMINTON;

    public static SportCode fromString(String code) {
        if (code == null) return CHESS;
        try {
            return SportCode.valueOf(code.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return CHESS;
        }
    }
}
