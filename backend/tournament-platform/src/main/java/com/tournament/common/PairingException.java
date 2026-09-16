package com.tournament.common;

public class PairingException extends RuntimeException {
    public PairingException(String message) { super(message); }
    public PairingException(String message, Throwable cause) { super(message, cause); }
}
