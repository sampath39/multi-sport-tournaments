package com.tournament.pairing.chess;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChessPairing {
    private int boardNumber;
    private ChessPlayer whitePlayer;
    private ChessPlayer blackPlayer; // null if bye
    private boolean isBye;
    private String pairingReason;
}
