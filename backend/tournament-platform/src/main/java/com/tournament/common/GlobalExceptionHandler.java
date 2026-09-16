package com.tournament.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            fieldErrors.put(fieldName, message);
        });

        ApiError apiError = ApiError.builder()
            .status(400)
            .error("Validation Failed")
            .message("Request validation failed. Check field errors.")
            .fieldErrors(fieldErrors)
            .timestamp(Instant.now().toString())
            .build();

        return ResponseEntity.badRequest().body(apiError);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        ApiError apiError = ApiError.builder()
            .status(400)
            .error("Bad Request")
            .message(ex.getMessage())
            .path(request.getDescription(false))
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.badRequest().body(apiError);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalState(IllegalStateException ex, WebRequest request) {
        ApiError apiError = ApiError.builder()
            .status(409)
            .error("Conflict")
            .message(ex.getMessage())
            .path(request.getDescription(false))
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiError);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiError> handleNotFound(NoSuchElementException ex, WebRequest request) {
        ApiError apiError = ApiError.builder()
            .status(404)
            .error("Not Found")
            .message(ex.getMessage())
            .path(request.getDescription(false))
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiError);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        ApiError apiError = ApiError.builder()
            .status(403)
            .error("Forbidden")
            .message("You do not have permission to perform this action.")
            .path(request.getDescription(false))
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(apiError);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, WebRequest request) {
        ApiError apiError = ApiError.builder()
            .status(401)
            .error("Unauthorized")
            .message("Invalid credentials.")
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiError);
    }

    @ExceptionHandler(TournamentStateException.class)
    public ResponseEntity<ApiError> handleTournamentState(TournamentStateException ex, WebRequest request) {
        ApiError apiError = ApiError.builder()
            .status(422)
            .error("Tournament State Error")
            .message(ex.getMessage())
            .path(request.getDescription(false))
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(apiError);
    }

    @ExceptionHandler(PairingException.class)
    public ResponseEntity<ApiError> handlePairing(PairingException ex, WebRequest request) {
        ApiError apiError = ApiError.builder()
            .status(422)
            .error("Pairing Error")
            .message(ex.getMessage())
            .path(request.getDescription(false))
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(apiError);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(Exception ex, WebRequest request) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        ApiError apiError = ApiError.builder()
            .status(500)
            .error("Internal Server Error")
            .message("An unexpected error occurred. Please try again.")
            .timestamp(Instant.now().toString())
            .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiError);
    }
}
