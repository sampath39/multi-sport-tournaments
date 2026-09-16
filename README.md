# 🏆 Production Multi-Sport Tournament Management Platform

An enterprise-grade, multi-sport competition engine and tournament orchestration platform supporting official playing rules, mathematical tie-breaks, automated pairing, live scorekeeping, and stadium TV displays.

---

## 🚀 Key Features

* **8 Supported Disciplines**: Chess (FIDE), Cricket (ICC), Football (FIFA), Basketball (FIBA), Badminton (BWF), Carrom (ICF), Volleyball (FIVB), Table Tennis (ITTF).
* **Competition Engines**:
  * Single Elimination (with 3rd place playoff)
  * Double Elimination (Winners, Losers, Grand Final Reset)
  * Round Robin & Double Round Robin
  * FIDE Dutch Swiss Pairing Engine
  * Group Stage + Knockout Playoff
* **Automated Mathematical Tie-Breaks**: Buchholz, Sonneborn-Berger, Net Run Rate (NRR), Goal Difference (GD), Head-to-Head (H2H), Fair-Play Disciplinary Points.
* **Live Scorer Console**: Real-time timer, goal/card/score logging, and immutable audit trails.
* **Stadium TV Display HUD**: Fullscreen broadcast scoreboard with spectator companion QR code.
* **Venue & Court Allocation**: Conflict-free scheduling across courts, pitches, and tables.
* **Enterprise Security**: JWT authentication with refresh token rotation, RBAC across 10 roles, and audit trail ledger.

---

## 🛠️ Technology Stack

* **Backend**: Spring Boot 3.3.5, Java 21, JPA/Hibernate, Flyway Migrations, STOMP WebSockets, Redis.
* **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Recharts, Lucide Icons.
* **Data Layer**: PostgreSQL 16 (41 tables), Redis 7 (caching & pubsub).
* **DevOps**: Multi-stage Dockerfiles, Docker Compose, Nginx reverse proxy.

---

## 🏁 Quick Start with Docker

### 1. Start Database & Cache
```bash
docker compose up -d postgres redis
```

### 2. Run Database Migrations & Seeds
The initial schema and seeds are placed in `docker/database/init/01_init.sql` and `backend/tournament-platform/src/main/resources/db/migration/`.

### 3. Build & Run Application Services
```bash
docker compose up -d --build
```

### 4. Direct Frontend Local Development
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@tournament.io` | `Password@123` |
| **Tournament Director** | `organizer@tournament.io` | `Password@123` |

---

## 📚 Technical Documentation

* [Architecture & System Design](docs/ARCHITECTURE.md)
* [Sport Rules & Tie-Break Guide](docs/SPORT_RULES_GUIDE.md)
