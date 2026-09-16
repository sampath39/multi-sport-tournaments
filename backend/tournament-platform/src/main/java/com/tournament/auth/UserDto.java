package com.tournament.auth;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String displayName;
    private String profilePhotoUrl;
    private List<String> roles;
    private boolean emailVerified;
}
