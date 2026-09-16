-- ─────────────────────────────────────────────────────────────────────────────
-- V7: Seed Default Users, Roles, Venues, and Tournaments
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Default Users (password: Password@123)
-- BCrypt $2a$10$w3U6yQ/M5w1J5D4Q6O8BGe.d8gE6E0L6qW.6uW8P8d2uK0e12A9a2
INSERT INTO users (id, email, password_hash, full_name, display_name, email_verified, is_active, created_at, updated_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@tournament.io', '$2a$10$w3U6yQ/M5w1J5D4Q6O8BGe.d8gE6E0L6qW.6uW8P8d2uK0e12A9a2', 'Master Administrator', 'Admin', true, true, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'organizer@tournament.io', '$2a$10$w3U6yQ/M5w1J5D4Q6O8BGe.d8gE6E0L6qW.6uW8P8d2uK0e12A9a2', 'Tournament Director', 'Director', true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Link Roles with granted_at
INSERT INTO user_roles (id, user_id, role_id, granted_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u, roles r
WHERE u.email = 'admin@tournament.io' AND r.name IN ('SUPER_ADMIN', 'TOURNAMENT_ADMIN')
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (id, user_id, role_id, granted_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u, roles r
WHERE u.email = 'organizer@tournament.io' AND r.name = 'TOURNAMENT_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 3. Venues
INSERT INTO venues (id, name, address, city, state, country, capacity, is_active, created_at, updated_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Metropolitan Sports Arena', '750 Arena Blvd', 'San Francisco', 'California', 'USA', 8000, true, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'Olympic Park Grounds', '1200 Olympic Way', 'San Jose', 'California', 'USA', 15000, true, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'Grandmaster Chess Club Hall', '320 University Ave', 'Palo Alto', 'California', 'USA', 500, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Tournaments
INSERT INTO tournaments (
  id, name, slug, sport_id, format_code, tournament_type, participant_type, status,
  max_participants, start_date, end_date, venue_id, created_by, description, created_at, updated_at
)
SELECT
  'c0000000-0000-0000-0000-000000000001',
  'National Chess Masters Championship 2026',
  'national-chess-masters-2026',
  s.id,
  'SWISS',
  'NATIONAL',
  'INDIVIDUAL',
  'IN_PROGRESS',
  32,
  CURRENT_DATE - 3,
  CURRENT_DATE + 4,
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Premier national championship conducted under official FIDE regulations. Swiss System 7 rounds with classical 90+30 time control.',
  NOW(),
  NOW()
FROM sports s WHERE s.code = 'CHESS'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tournaments (
  id, name, slug, sport_id, format_code, tournament_type, participant_type, status,
  max_participants, start_date, end_date, venue_id, created_by, description, created_at, updated_at
)
SELECT
  'c0000000-0000-0000-0000-000000000002',
  'Premier Youth Football Cup 2026',
  'premier-youth-football-2026',
  s.id,
  'SINGLE_ELIMINATION',
  'CLUB',
  'TEAM',
  'IN_PROGRESS',
  16,
  CURRENT_DATE - 1,
  CURRENT_DATE + 5,
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'State knockout championship with 16 elite academy clubs competing under official FIFA/IFAB regulations.',
  NOW(),
  NOW()
FROM sports s WHERE s.code = 'FOOTBALL'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tournaments (
  id, name, slug, sport_id, format_code, tournament_type, participant_type, status,
  max_participants, start_date, end_date, venue_id, created_by, description, created_at, updated_at
)
SELECT
  'c0000000-0000-0000-0000-000000000003',
  'Inter-Club Badminton Open 2026',
  'inter-club-badminton-open-2026',
  s.id,
  'ROUND_ROBIN',
  'COMMUNITY',
  'BOTH',
  'REGISTRATION_OPEN',
  32,
  CURRENT_DATE + 15,
  CURRENT_DATE + 18,
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Open doubles and singles championship featuring BWF rally scoring system (best of 3 sets to 21 points).',
  NOW(),
  NOW()
FROM sports s WHERE s.code = 'BADMINTON'
ON CONFLICT (slug) DO NOTHING;
