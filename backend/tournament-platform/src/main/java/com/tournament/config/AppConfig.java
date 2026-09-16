package com.tournament.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
@EnableAsync
public class AppConfig {

    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> {
            try {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    Object principal = auth.getPrincipal();
                    if (principal instanceof com.tournament.user.User user) {
                        return Optional.of(user.getId());
                    }
                }
            } catch (Exception ignored) {}
            return Optional.empty();
        };
    }
}
