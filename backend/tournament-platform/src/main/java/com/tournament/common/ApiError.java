package com.tournament.common;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ApiError {
    private int status;
    private String error;
    private String message;
    private String path;
    private String timestamp;
    private Map<String, String> fieldErrors;
}
