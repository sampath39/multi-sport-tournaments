# ----------------------------------------------------
# Stage 1: Build JAR using Maven
# ----------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

# Copy Maven wrapper & pom.xml first for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source code and build production artifact
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ----------------------------------------------------
# Stage 2: Minimal Production Runtime
# ----------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S tournament && adduser -S tournament -G tournament
USER tournament:tournament

# Copy built jar from builder stage
COPY --from=builder /build/target/tournament-platform-1.0.0.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
