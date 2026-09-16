package com.tournament.auth;

import com.tournament.audit.AuditService;
import com.tournament.user.Role;
import com.tournament.user.RoleRepository;
import com.tournament.user.User;
import com.tournament.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

    // ─────────────────────────────────────────────────────────────────────────
    // Register
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        Role playerRole = roleRepository.findByName("PLAYER")
            .orElseThrow(() -> new IllegalStateException("Default role PLAYER not found"));

        User user = User.builder()
            .email(request.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .displayName(request.getDisplayName())
            .phone(request.getPhone())
            .roles(Set.of(playerRole))
            .isActive(true)
            .emailVerified(false)
            .build();

        user = userRepository.save(user);

        auditService.log(user.getId(), "USER_REGISTERED", "USER", user.getId(), null,
            "New user registered: " + user.getEmail(), null);

        log.info("New user registered: {}", user.getEmail());

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getExpirationMs())
            .user(toUserDto(user))
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail().toLowerCase().trim(),
                    request.getPassword()
                )
            );

            User user = (User) authentication.getPrincipal();
            user.setLastLoginAt(OffsetDateTime.now());
            userRepository.save(user);

            auditService.log(user.getId(), "USER_LOGIN", "USER", user.getId(), null,
                "User logged in", null);

            String accessToken = jwtTokenProvider.generateAccessToken(user);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user);

            return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .user(toUserDto(user))
                .build();

        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email or password");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh Token
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String email = jwtTokenProvider.extractUsername(refreshToken);
        User user = userRepository.findByEmailWithRoles(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user);

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getExpirationMs())
            .user(toUserDto(user))
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────────────────────────

    private UserDto toUserDto(User user) {
        return UserDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .displayName(user.getEffectiveDisplayName())
            .profilePhotoUrl(user.getProfilePhotoUrl())
            .roles(user.getRoles().stream().map(Role::getName).toList())
            .emailVerified(user.isEmailVerified())
            .build();
    }
}
