package com.tournament.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Multi-Sport Tournament Management Platform API")
                .description("""
                    Production-grade REST API for managing multi-sport tournaments.
                    
                    Supports: Chess, Cricket, Football, Basketball, Badminton, Carrom, Volleyball, Table Tennis.
                    
                    Tournament formats: Swiss, Round Robin, Single/Double Elimination, Group+Knockout.
                    
                    Rule classification:
                    - OFFICIAL_RULE: Based on sport governing body (FIDE, ICC, FIFA, etc.)
                    - TOURNAMENT_REGULATION: Specific to this tournament
                    - ADMIN_CONFIGURATION: Set by tournament administrator
                    """)
                .version("1.0.0")
                .contact(new Contact()
                    .name("Tournament Platform")
                    .email("support@tournamentplatform.com"))
                .license(new License().name("Proprietary")))
            .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
            .components(new Components()
                .addSecuritySchemes("Bearer Authentication", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT token obtained from /api/v1/auth/login")));
    }
}
