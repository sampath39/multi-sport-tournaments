package com.tournament.pairing;

import lombok.*;
import java.util.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class PairingConfig {
    private boolean allowRepeatOpponents;
    private boolean colorBalanceEnabled;
    private boolean sideBalanceEnabled;
    private String byeMethod;
    private int maxByesPerPlayer;
    private String seedingMethod;
    private boolean useRatingForPairing;
}
