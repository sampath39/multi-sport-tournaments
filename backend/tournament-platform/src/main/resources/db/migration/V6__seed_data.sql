-- ─────────────────────────────────────────────────────────────────────────────
-- V6: Seed Data — Roles, Sports, Default Rules
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Roles ───────────────────────────────────────────────────────────────────
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
  (gen_random_uuid(), 'SUPER_ADMIN',       'Platform superadministrator',         NOW(), NOW()),
  (gen_random_uuid(), 'ORGANIZATION_ADMIN','Organization administrator',           NOW(), NOW()),
  (gen_random_uuid(), 'TOURNAMENT_ADMIN',  'Tournament creator and manager',       NOW(), NOW()),
  (gen_random_uuid(), 'REFEREE',           'Official match referee or arbiter',    NOW(), NOW()),
  (gen_random_uuid(), 'SCORER',            'Live score entry operator',            NOW(), NOW()),
  (gen_random_uuid(), 'TEAM_MANAGER',      'Team captain or manager',              NOW(), NOW()),
  (gen_random_uuid(), 'PLAYER',            'Registered participant',               NOW(), NOW()),
  (gen_random_uuid(), 'SPECTATOR',         'Read-only observer',                   NOW(), NOW()),
  (gen_random_uuid(), 'COACH',             'Team coach',                           NOW(), NOW()),
  (gen_random_uuid(), 'ANALYST',           'Statistics and analytics operator',    NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ─── Sports ──────────────────────────────────────────────────────────────────
INSERT INTO sports (id, name, code, participant_type, min_participants, max_participants, description, is_active, sort_order, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Chess',        'CHESS',        'INDIVIDUAL', 2,    NULL,  'Classic board game — FIDE rules',                      TRUE, 1,  NOW(), NOW()),
  (gen_random_uuid(), 'Cricket',      'CRICKET',      'TEAM',       10,   11,    'Bat-and-ball game — ICC rules',                        TRUE, 2,  NOW(), NOW()),
  (gen_random_uuid(), 'Football',     'FOOTBALL',     'TEAM',       11,   11,    'Association football — FIFA rules',                    TRUE, 3,  NOW(), NOW()),
  (gen_random_uuid(), 'Basketball',   'BASKETBALL',   'TEAM',       5,    5,     'Basket sport — FIBA rules',                            TRUE, 4,  NOW(), NOW()),
  (gen_random_uuid(), 'Badminton',    'BADMINTON',    'BOTH',       1,    2,     'Racket sport — BWF rules',                             TRUE, 5,  NOW(), NOW()),
  (gen_random_uuid(), 'Carrom',       'CARROM',       'BOTH',       1,    2,     'Strike-and-pocket board game — ICF rules',             TRUE, 6,  NOW(), NOW()),
  (gen_random_uuid(), 'Volleyball',   'VOLLEYBALL',   'TEAM',       6,    6,     'Net sport — FIVB rules',                               TRUE, 7,  NOW(), NOW()),
  (gen_random_uuid(), 'Table Tennis', 'TABLE_TENNIS', 'BOTH',       1,    2,     'Ping-pong — ITTF rules',                               TRUE, 8,  NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ─── Sport-specific scoring config in sport_configs ──────────────────────────
-- (Stored as JSONB per sport for extensibility)

-- ─── Default tournament formats available per sport ──────────────────────────
-- This would normally be in a sport_formats table, but we seed as reference

-- ─── Audit log table initial check ───────────────────────────────────────────
-- (already created in V1 migrations)
