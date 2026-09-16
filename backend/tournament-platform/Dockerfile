FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S tournament && adduser -S tournament -G tournament
USER tournament:tournament

# Copy compiled production Spring Boot jar
COPY target/tournament-platform-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
