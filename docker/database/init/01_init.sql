-- V1: Core Schema â€” Users, Roles, Organizations
-- Tournament Management Platform
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ROLES
-- =====================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN', 'Platform super administrator'),
    ('ORGANIZATION_ADMIN', 'Organization administrator'),
    ('TOURNAMENT_ADMIN', 'Tournament administrator'),
    ('REFEREE', 'Match referee / official'),
    ('SCORER', 'Score entry operator'),
    ('TEAM_MANAGER', 'Team manager'),
    ('PLAYER', 'Registered player'),
    ('SPECTATOR', 'Public spectator / viewer');

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    phone VARCHAR(30),
    date_of_birth DATE,
    gender VARCHAR(20),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    profile_photo_url TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =====================================================
-- USER ROLES (many-to-many)
-- =====================================================
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- =====================================================
-- REFRESH TOKENS
-- =====================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- =====================================================
-- ORGANIZATIONS
-- =====================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- =====================================================
-- ORGANIZATION MEMBERS
-- =====================================================
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);

-- =====================================================
-- AUDIT LOGS
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);


-- V2: Sports & Rule Engine
-- =====================================================

-- =====================================================
-- SPORTS REGISTRY
-- =====================================================
CREATE TABLE sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,  -- CHESS, CRICKET, FOOTBALL, etc.
    icon_url TEXT,
    participant_type VARCHAR(20) NOT NULL DEFAULT 'BOTH',  -- INDIVIDUAL, TEAM, BOTH
    min_participants INTEGER NOT NULL DEFAULT 2,
    max_participants INTEGER,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SPORT RULE VERSIONS
-- =====================================================
CREATE TABLE sport_rule_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID NOT NULL REFERENCES sports(id),
    version VARCHAR(50) NOT NULL,
    governing_body VARCHAR(200),     -- e.g. FIDE, ICC, FIFA
    source_url TEXT,                  -- link to official rulebook
    effective_from DATE,
    effective_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, SUPERSEDED, ARCHIVED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rule_versions_sport_id ON sport_rule_versions(sport_id);
CREATE INDEX idx_rule_versions_status ON sport_rule_versions(status);

-- =====================================================
-- SPORT DEFAULT CONFIGS (smart defaults per sport)
-- =====================================================
CREATE TABLE sport_default_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID NOT NULL REFERENCES sports(id),
    tournament_format VARCHAR(50) NOT NULL,  -- SWISS, ROUND_ROBIN, etc.
    participant_count_min INTEGER,
    participant_count_max INTEGER,
    recommended_rounds INTEGER,
    default_scoring JSONB NOT NULL DEFAULT '{}',   -- {"win":1,"draw":0.5,"loss":0}
    default_tiebreakers JSONB NOT NULL DEFAULT '[]',
    default_match_config JSONB NOT NULL DEFAULT '{}',
    notes TEXT
);

-- =====================================================
-- SPORT FORMATS SUPPORTED (which formats each sport supports)
-- =====================================================
CREATE TABLE sport_format_support (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID NOT NULL REFERENCES sports(id),
    format_code VARCHAR(50) NOT NULL,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(sport_id, format_code)
);

-- Insert the 8 sports
INSERT INTO sports (name, code, participant_type, min_participants, description, sort_order) VALUES
    ('Chess',        'CHESS',        'INDIVIDUAL', 2,  'Individual chess tournament',    1),
    ('Cricket',      'CRICKET',      'TEAM',       2,  'Cricket team tournament',        2),
    ('Football',     'FOOTBALL',     'TEAM',       2,  'Association football tournament', 3),
    ('Basketball',   'BASKETBALL',   'TEAM',       2,  'Basketball tournament',           4),
    ('Badminton',    'BADMINTON',    'BOTH',       2,  'Badminton tournament',            5),
    ('Carrom',       'CARROM',       'BOTH',       2,  'Carrom board tournament',         6),
    ('Volleyball',   'VOLLEYBALL',   'TEAM',       2,  'Volleyball tournament',           7),
    ('Table Tennis', 'TABLE_TENNIS', 'BOTH',       2,  'Table tennis tournament',         8);

-- Insert rule version metadata (not copying rulebooks, just metadata links)
INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2023', 'FIDE', 'https://www.fide.com/FIDE/handbook/LawsOfChess.pdf', '2023-01-01', 'ACTIVE',
       'FIDE Laws of Chess 2023 â€” used as baseline for Swiss pairing and competition rules.'
FROM sports WHERE code = 'CHESS';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2022', 'ICC', 'https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions', '2022-10-01', 'ACTIVE',
       'ICC Playing Conditions 2022 â€” used as baseline for match play, scoring and competition rules.'
FROM sports WHERE code = 'CRICKET';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'FIFA', 'https://www.fifa.com/about-fifa/official-documents/laws-of-the-game', '2024-07-01', 'ACTIVE',
       'FIFA Laws of the Game 2024/25 â€” used as baseline. Tournament regulations may supplement.'
FROM sports WHERE code = 'FOOTBALL';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'FIBA', 'https://www.fiba.basketball/documents/fiba-official-basketball-rules.pdf', '2024-05-01', 'ACTIVE',
       'FIBA Official Basketball Rules 2024 â€” used as baseline.'
FROM sports WHERE code = 'BASKETBALL';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2021', 'BWF', 'https://corporate.bwfbadminton.com/statutes/laws-of-badminton/', '2021-01-01', 'ACTIVE',
       'BWF Laws of Badminton 2021 â€” used as baseline.'
FROM sports WHERE code = 'BADMINTON';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'FIVB', 'https://www.fivb.com/en/volleyball/thegame_volleyball/rulesofthegame_volleyball.htm', '2024-01-01', 'ACTIVE',
       'FIVB Official Volleyball Rules 2025-2028 â€” used as baseline.'
FROM sports WHERE code = 'VOLLEYBALL';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'ITTF', 'https://www.ittf.com/handbook/', '2024-01-01', 'ACTIVE',
       'ITTF Regulations for International Competitions 2024 â€” used as baseline.'
FROM sports WHERE code = 'TABLE_TENNIS';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2023', 'ICF', 'https://www.carrom.org/rules', '2023-01-01', 'ACTIVE',
       'International Carrom Federation rules â€” used as baseline. Local tournament rules may vary significantly.'
FROM sports WHERE code = 'CARROM';

-- Smart defaults: Chess + Swiss (7 rounds, standard FIDE scoring)
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'SWISS', 4, 9999, 7,
       '{"win":1.0,"draw":0.5,"loss":0.0,"bye":1.0,"forfeit_win":1.0,"forfeit_loss":0.0}'::jsonb,
       '["BUCHHOLZ","BUCHHOLZ_CUT_1","SONNEBORN_BERGER","DIRECT_ENCOUNTER","MOST_WINS","RATING"]'::jsonb,
       '{"time_control":"rapid","minutes_per_side":15,"increment_seconds":10,"allow_draws":true}'::jsonb
FROM sports WHERE code = 'CHESS';

INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'ROUND_ROBIN', 4, 20, null,
       '{"win":1.0,"draw":0.5,"loss":0.0}'::jsonb,
       '["POINTS","DIRECT_ENCOUNTER","SONNEBORN_BERGER"]'::jsonb,
       '{"time_control":"rapid","minutes_per_side":15}'::jsonb
FROM sports WHERE code = 'CHESS';

-- Cricket + League defaults
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'ROUND_ROBIN', 4, 20, null,
       '{"win":2,"loss":0,"tie":1,"no_result":1}'::jsonb,
       '["POINTS","NET_RUN_RATE","HEAD_TO_HEAD","MOST_WINS"]'::jsonb,
       '{"format":"T20","overs":20,"powerplay_overs":6}'::jsonb
FROM sports WHERE code = 'CRICKET';

-- Football defaults
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'ROUND_ROBIN', 4, 20, null,
       '{"win":3,"draw":1,"loss":0}'::jsonb,
       '["POINTS","GOAL_DIFFERENCE","GOALS_SCORED","HEAD_TO_HEAD","FAIR_PLAY"]'::jsonb,
       '{"duration_minutes":90,"extra_time":true,"penalty_shootout":true}'::jsonb
FROM sports WHERE code = 'FOOTBALL';

-- Basketball defaults
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'SINGLE_ELIMINATION', 4, 64, null,
       '{"win":1,"loss":0}'::jsonb,
       '["POINTS","POINT_DIFFERENTIAL"]'::jsonb,
       '{"quarters":4,"quarter_minutes":10,"overtime":true}'::jsonb
FROM sports WHERE code = 'BASKETBALL';

-- Badminton defaults
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'SINGLE_ELIMINATION', 4, 128, null,
       '{"win":1,"loss":0}'::jsonb,
       '["POINTS"]'::jsonb,
       '{"best_of":3,"points_per_game":21,"final_game_points":21}'::jsonb
FROM sports WHERE code = 'BADMINTON';

-- Volleyball defaults
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'ROUND_ROBIN', 4, 16, null,
       '{"win":3,"win_3_0":3,"win_3_1":3,"win_3_2":2,"loss_2_3":1,"loss_0_3":0,"loss_1_3":0}'::jsonb,
       '["POINTS","SET_RATIO","POINT_RATIO"]'::jsonb,
       '{"best_of":5,"points_per_set":25,"final_set_points":15}'::jsonb
FROM sports WHERE code = 'VOLLEYBALL';

-- Table Tennis defaults
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'SINGLE_ELIMINATION', 4, 128, null,
       '{"win":1,"loss":0}'::jsonb,
       '["POINTS"]'::jsonb,
       '{"best_of":5,"points_per_game":11}'::jsonb
FROM sports WHERE code = 'TABLE_TENNIS';

-- Carrom defaults
INSERT INTO sport_default_configs (sport_id, tournament_format, participant_count_min, participant_count_max, recommended_rounds, default_scoring, default_tiebreakers, default_match_config)
SELECT id, 'ROUND_ROBIN', 4, 32, null,
       '{"win":2,"draw":1,"loss":0}'::jsonb,
       '["POINTS","BOARD_SCORE","DIRECT_ENCOUNTER"]'::jsonb,
       '{"boards":25,"queen_value":5}'::jsonb
FROM sports WHERE code = 'CARROM';


-- V3: Tournaments, Venues, Stages
-- =====================================================

-- =====================================================
-- VENUES
-- =====================================================
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    capacity INTEGER,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courts/Boards/Tables/Grounds within a venue
CREATE TABLE venue_courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,       -- "Court 1", "Board 12", "Table 3"
    court_type VARCHAR(50),           -- COURT, BOARD, TABLE, GROUND, ROOM, RING
    capacity INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_venue_courts_venue_id ON venue_courts(venue_id);

-- =====================================================
-- TOURNAMENTS
-- =====================================================
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    sport_id UUID NOT NULL REFERENCES sports(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    short_name VARCHAR(100),
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,

    -- Classification
    tournament_type VARCHAR(50) NOT NULL DEFAULT 'CASUAL',  -- CASUAL,SCHOOL,COLLEGE,CORPORATE,CLUB,ACADEMY,COMMUNITY,DISTRICT,PROFESSIONAL,OFFICIAL
    participant_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',  -- INDIVIDUAL, TEAM

    -- Format
    format_code VARCHAR(50) NOT NULL,   -- SWISS, ROUND_ROBIN, SINGLE_ELIMINATION, etc.
    total_rounds INTEGER,
    rounds_per_day INTEGER,

    -- State machine
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, REGISTRATION_OPEN, REGISTRATION_CLOSED, CHECK_IN, SEEDING, SCHEDULED, LIVE, PAUSED, COMPLETED, CANCELLED, ARCHIVED

    -- Dates
    registration_start_at TIMESTAMPTZ,
    registration_deadline_at TIMESTAMPTZ,
    check_in_start_at TIMESTAMPTZ,
    check_in_deadline_at TIMESTAMPTZ,
    start_date DATE,
    end_date DATE,
    start_time TIME,

    -- Location
    location_text VARCHAR(255),
    venue_id UUID REFERENCES venues(id),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',

    -- Participant limits
    min_participants INTEGER DEFAULT 4,
    expected_participants INTEGER,
    max_participants INTEGER,

    -- Registration mode
    registration_mode VARCHAR(30) NOT NULL DEFAULT 'OPEN_REGISTRATION',  -- OPEN_REGISTRATION, INVITE_ONLY, ADMIN_ADDED, APPROVAL_REQUIRED, CLOSED

    -- Eligibility
    age_restriction_min INTEGER,
    age_restriction_max INTEGER,
    gender_restriction VARCHAR(20),    -- MALE, FEMALE, MIXED
    institution_restriction TEXT,

    -- Configuration flags
    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    is_rated BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    has_registration_fee BOOLEAN NOT NULL DEFAULT FALSE,
    registration_fee_amount DECIMAL(10,2),

    -- Config snapshot (immutable after publish)
    config_snapshot JSONB,
    config_snapshot_at TIMESTAMPTZ,

    -- Source rule version used
    rule_version_id UUID REFERENCES sport_rule_versions(id),

    -- Template
    template_id UUID,

    -- Created by
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tournaments_sport_id ON tournaments(sport_id);
CREATE INDEX idx_tournaments_organization_id ON tournaments(organization_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_slug ON tournaments(slug);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);

-- =====================================================
-- TOURNAMENT ADMINS
-- =====================================================
CREATE TABLE tournament_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'TOURNAMENT_ADMIN',  -- TOURNAMENT_ADMIN, REFEREE, SCORER
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- =====================================================
-- TOURNAMENT SCORING CONFIG
-- =====================================================
CREATE TABLE tournament_scoring_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    win_points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    draw_points DECIMAL(5,2) NOT NULL DEFAULT 0.5,
    loss_points DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    bye_points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    walkover_win_points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    walkover_loss_points DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    forfeit_win_points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    forfeit_loss_points DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    no_result_points DECIMAL(5,2) NOT NULL DEFAULT 0.5,
    bonus_points_config JSONB,            -- sport-specific bonus points
    sport_specific_config JSONB,          -- e.g. NRR for cricket, set-ratio for volleyball
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id)
);

-- =====================================================
-- TIE-BREAK RULES (ordered list per tournament)
-- =====================================================
CREATE TABLE tournament_tiebreak_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    tiebreak_code VARCHAR(50) NOT NULL,   -- BUCHHOLZ, SONNEBORN_BERGER, DIRECT_ENCOUNTER, GOAL_DIFF, NRR, etc.
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB,
    UNIQUE(tournament_id, sort_order)
);

-- =====================================================
-- PAIRING CONFIG
-- =====================================================
CREATE TABLE tournament_pairing_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    pairing_system VARCHAR(50) NOT NULL DEFAULT 'DUTCH',   -- DUTCH, ACCELERATED, MANUAL
    allow_repeat_opponents BOOLEAN NOT NULL DEFAULT FALSE,
    allow_repeat_after_rounds INTEGER,
    color_balance_enabled BOOLEAN NOT NULL DEFAULT TRUE,    -- Chess: W/B balance
    side_balance_enabled BOOLEAN NOT NULL DEFAULT FALSE,    -- Football: home/away
    seeding_method VARCHAR(30) NOT NULL DEFAULT 'RATING',   -- RATING, RANDOM, MANUAL, RANKING
    use_rating_for_pairing BOOLEAN NOT NULL DEFAULT TRUE,
    bye_method VARCHAR(30) NOT NULL DEFAULT 'LOWEST_SCORE', -- LOWEST_SCORE, RANDOM, ROTATION
    max_byes_per_player INTEGER NOT NULL DEFAULT 1,
    UNIQUE(tournament_id)
);

-- =====================================================
-- TOURNAMENT CUSTOM RULES
-- =====================================================
CREATE TABLE tournament_custom_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,   -- SCORING, ELIGIBILITY, TIE_BREAK, PAIRING, SCHEDULING
    rule_classification VARCHAR(30) NOT NULL DEFAULT 'ADMIN_CONFIGURATION',  -- OFFICIAL_RULE, TOURNAMENT_REGULATION, ADMIN_CONFIGURATION
    condition_config JSONB NOT NULL,
    action_config JSONB NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STAGES (group stage, knockout stage, etc.)
-- =====================================================
CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,           -- "Group Stage", "Quarter Finals", "Final"
    stage_type VARCHAR(30) NOT NULL,      -- GROUP, KNOCKOUT, ROUND_ROBIN, SWISS
    stage_order INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    start_date DATE,
    end_date DATE,
    config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stages_tournament_id ON stages(tournament_id);

-- =====================================================
-- GROUPS (within group stage)
-- =====================================================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,          -- "Group A", "Pool 1"
    group_order INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    advance_count INTEGER NOT NULL DEFAULT 2,  -- How many advance to next stage
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_stage_id ON groups(stage_id);

-- =====================================================
-- ROUNDS
-- =====================================================
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),
    group_id UUID REFERENCES groups(id),
    round_number INTEGER NOT NULL,
    name VARCHAR(100),                    -- "Round 1", "Quarter Finals"
    round_type VARCHAR(30) NOT NULL DEFAULT 'SWISS',  -- SWISS, ROUND_ROBIN, SINGLE_ELIMINATION, DOUBLE_ELIMINATION
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',    -- PENDING, PAIRING, SCHEDULED, LIVE, COMPLETED, CANCELLED
    scheduled_start_at TIMESTAMPTZ,
    actual_start_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    pairing_method VARCHAR(30),           -- AUTOMATIC, MANUAL
    pairing_generated_by UUID REFERENCES users(id),
    pairing_generated_at TIMESTAMPTZ,
    pairing_quality_score DECIMAL(5,2),   -- 0-100 quality score
    pairing_metadata JSONB,               -- pairing explanation data
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, round_number)
);

CREATE INDEX idx_rounds_tournament_id ON rounds(tournament_id);
CREATE INDEX idx_rounds_status ON rounds(status);

-- =====================================================
-- TOURNAMENT TEMPLATES
-- =====================================================
CREATE TABLE tournament_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50),   -- SCHOOL, COLLEGE, CORPORATE, COMMUNITY, etc.
    sport_id UUID REFERENCES sports(id),
    config_snapshot JSONB NOT NULL,   -- Full tournament config (without results)
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- V4: Players, Teams, Participants, Registration
-- =====================================================

-- =====================================================
-- PLAYERS
-- =====================================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),        -- May be null for admin-added players
    organization_id UUID REFERENCES organizations(id),

    -- Identity
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    date_of_birth DATE,
    gender VARCHAR(20),

    -- Location
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),

    -- Institutional
    institution VARCHAR(255),
    department VARCHAR(100),
    year_of_study VARCHAR(20),

    -- IDs
    player_code VARCHAR(50),
    registration_number VARCHAR(100),
    employee_id VARCHAR(100),
    student_id VARCHAR(100),
    national_id VARCHAR(100),

    -- Profile
    profile_photo_url TEXT,
    bio TEXT,

    -- Sport-specific ratings (JSONB allows multiple sport ratings)
    ratings JSONB NOT NULL DEFAULT '{}',   -- {"CHESS": 1500, "BADMINTON": 800}
    rankings JSONB NOT NULL DEFAULT '{}',

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_organization_id ON players(organization_id);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_player_code ON players(player_code);

-- =====================================================
-- TEAMS
-- =====================================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    sport_id UUID NOT NULL REFERENCES sports(id),

    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(20),
    logo_url TEXT,

    captain_player_id UUID REFERENCES players(id),
    coach_name VARCHAR(255),
    manager_name VARCHAR(255),

    home_city VARCHAR(100),
    home_state VARCHAR(100),

    -- Ratings
    rating DECIMAL(8,2),
    ranking INTEGER,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_organization_id ON teams(organization_id);
CREATE INDEX idx_teams_sport_id ON teams(sport_id);

-- =====================================================
-- TEAM MEMBERS
-- =====================================================
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    role VARCHAR(30) NOT NULL DEFAULT 'PLAYER',  -- PLAYER, CAPTAIN, VICE_CAPTAIN, SUBSTITUTE
    jersey_number VARCHAR(10),
    position VARCHAR(50),            -- Sport-specific position
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, player_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_player_id ON team_members(player_id);

-- =====================================================
-- TOURNAMENT PARTICIPANTS (individual players)
-- =====================================================
CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),

    seed INTEGER,
    rating_at_registration DECIMAL(8,2),
    category VARCHAR(50),    -- e.g. OPEN, U18, WOMEN, SENIOR

    -- Check-in
    check_in_status VARCHAR(20) NOT NULL DEFAULT 'NOT_CHECKED_IN',  -- NOT_CHECKED_IN, CHECKED_IN, LATE, ABSENT
    checked_in_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, WITHDRAWN, DISQUALIFIED, BYE

    -- Color tracking (Chess)
    white_games INTEGER NOT NULL DEFAULT 0,
    black_games INTEGER NOT NULL DEFAULT 0,

    withdrawal_reason TEXT,
    withdrawal_at TIMESTAMPTZ,
    disqualification_reason TEXT,
    disqualification_at TIMESTAMPTZ,

    -- Registration
    registration_id UUID,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tournament_id, player_id)
);

CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_player_id ON tournament_participants(player_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(status);

-- =====================================================
-- TOURNAMENT TEAMS
-- =====================================================
CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),

    seed INTEGER,
    category VARCHAR(50),
    rating_at_registration DECIMAL(8,2),

    -- Lineup (sport-specific)
    playing_lineup JSONB,     -- list of player_ids in starting lineup
    substitutes JSONB,

    -- Check-in
    check_in_status VARCHAR(20) NOT NULL DEFAULT 'NOT_CHECKED_IN',
    checked_in_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, WITHDRAWN, DISQUALIFIED

    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tournament_id, team_id)
);

CREATE INDEX idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);

-- =====================================================
-- GROUP PARTICIPANTS (which team/player is in which group)
-- =====================================================
CREATE TABLE group_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    participant_id UUID NOT NULL,        -- points to tournament_participants.id or tournament_teams.id
    participant_type VARCHAR(10) NOT NULL,  -- PLAYER, TEAM
    seed_in_group INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, participant_id)
);

-- =====================================================
-- REGISTRATION FORMS
-- =====================================================
CREATE TABLE registration_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL DEFAULT 'Registration Form',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id)
);

CREATE TABLE registration_form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type VARCHAR(30) NOT NULL,   -- TEXT, NUMBER, DATE, DROPDOWN, MULTI_SELECT, CHECKBOX, RADIO, FILE, BOOLEAN
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    options JSONB,        -- for dropdown/radio/multi-select
    validation_rules JSONB,
    sort_order INTEGER NOT NULL DEFAULT 0,
    placeholder TEXT,
    help_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- REGISTRATIONS
-- =====================================================
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    player_id UUID REFERENCES players(id),
    team_id UUID REFERENCES teams(id),
    form_data JSONB NOT NULL DEFAULT '{}',   -- custom field values
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, WAITLISTED, WITHDRAWN
    waitlist_position INTEGER,
    payment_status VARCHAR(20),    -- PENDING, PAID, REFUNDED, WAIVED
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registrations_tournament_id ON registrations(tournament_id);
CREATE INDEX idx_registrations_player_id ON registrations(player_id);
CREATE INDEX idx_registrations_status ON registrations(status);


-- V5: Matches, Scoring, Pairings, Standings
-- =====================================================

-- =====================================================
-- OFFICIALS
-- =====================================================
CREATE TABLE officials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'REFEREE',  -- REFEREE, SCORER, ARBITER, UMPIRE
    sport_id UUID REFERENCES sports(id),
    certification VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MATCHES
-- =====================================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    stage_id UUID REFERENCES stages(id),
    round_id UUID REFERENCES rounds(id),
    group_id UUID REFERENCES groups(id),

    -- Participants (polymorphic: player or team)
    participant_a_id UUID NOT NULL,       -- tournament_participants.id or tournament_teams.id
    participant_b_id UUID,                -- null if bye
    participant_type VARCHAR(10) NOT NULL DEFAULT 'PLAYER',  -- PLAYER, TEAM

    -- Venue
    venue_id UUID REFERENCES venues(id),
    court_id UUID REFERENCES venue_courts(id),

    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',  -- SCHEDULED, READY, LIVE, PAUSED, COMPLETED, POSTPONED, CANCELLED, WALKOVER, FORFEIT

    -- Results
    winner_participant_id UUID,
    result_type VARCHAR(20),   -- WIN, DRAW, BYE, WALKOVER, FORFEIT, NO_RESULT, CANCELLED

    -- Scores (generic â€” interpreted per sport)
    score_a DECIMAL(10,2),
    score_b DECIMAL(10,2),

    -- Sport-specific score details (JSONB for flexibility)
    score_details_a JSONB,    -- e.g. cricket: {runs, wickets, overs}; football: {goals, cards}
    score_details_b JSONB,

    -- Officials
    referee_id UUID REFERENCES officials(id),
    scorer_id UUID REFERENCES officials(id),

    -- Bracket position (for knockout)
    bracket_position VARCHAR(50),

    -- Pairing metadata
    pairing_reason TEXT,
    pairing_metadata JSONB,

    -- Color assignment (Chess: WHITE, BLACK)
    side_a VARCHAR(20),
    side_b VARCHAR(20),

    -- Match configuration for this specific match
    match_config JSONB,

    -- Double elimination: winner side / loser side
    bracket_side VARCHAR(20),   -- WINNER, LOSER

    -- For series (best of N)
    series_number INTEGER,        -- which game in the series
    parent_match_id UUID REFERENCES matches(id),

    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_round_id ON matches(round_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_participant_a ON matches(participant_a_id);
CREATE INDEX idx_matches_participant_b ON matches(participant_b_id);
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);

-- =====================================================
-- MATCH EVENTS (goals, cards, wickets, fouls, etc.)
-- =====================================================
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    event_type VARCHAR(50) NOT NULL,      -- GOAL, CARD, WICKET, FOUL, SUBSTITUTION, TIMEOUT, etc.
    participant_id UUID,                   -- which participant caused event
    player_id UUID REFERENCES players(id),-- specific player
    event_time_seconds INTEGER,           -- when in match
    period VARCHAR(20),                   -- "Q1", "1st Half", "Over 3", "Set 2"
    details JSONB NOT NULL DEFAULT '{}',  -- sport-specific details
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_events_match_id ON match_events(match_id);
CREATE INDEX idx_match_events_event_type ON match_events(event_type);

-- =====================================================
-- MATCH OFFICIALS
-- =====================================================
CREATE TABLE match_officials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    official_id UUID NOT NULL REFERENCES officials(id),
    role VARCHAR(50) NOT NULL,
    UNIQUE(match_id, official_id)
);

-- =====================================================
-- PAIRINGS (pairing record per round)
-- =====================================================
CREATE TABLE pairings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    match_id UUID REFERENCES matches(id),

    participant_a_id UUID NOT NULL,
    participant_b_id UUID,              -- null = bye

    is_bye BOOLEAN NOT NULL DEFAULT FALSE,
    pairing_order INTEGER,

    -- Pairing quality metadata
    score_diff DECIMAL(5,2),
    repeat_encounter_number INTEGER NOT NULL DEFAULT 0,
    color_a VARCHAR(10),                -- For chess: WHITE, BLACK
    color_b VARCHAR(10),

    -- Explanation
    pairing_reason JSONB,              -- structured explanation for transparency
    constraint_relaxations JSONB,      -- which soft constraints were relaxed

    -- Override tracking
    is_manually_overridden BOOLEAN NOT NULL DEFAULT FALSE,
    original_pairing JSONB,
    overridden_by UUID REFERENCES users(id),
    override_reason TEXT,
    overridden_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pairings_round_id ON pairings(round_id);
CREATE INDEX idx_pairings_participant_a ON pairings(participant_a_id);
CREATE INDEX idx_pairings_participant_b ON pairings(participant_b_id);

-- =====================================================
-- BYE RECORDS
-- =====================================================
CREATE TABLE bye_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    round_id UUID NOT NULL REFERENCES rounds(id),
    participant_id UUID NOT NULL,
    bye_type VARCHAR(20) NOT NULL DEFAULT 'FULL',   -- FULL, HALF
    bye_points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    bye_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(round_id, participant_id)
);

CREATE INDEX idx_bye_records_tournament_id ON bye_records(tournament_id);
CREATE INDEX idx_bye_records_participant_id ON bye_records(participant_id);

-- =====================================================
-- STANDINGS
-- =====================================================
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),
    group_id UUID REFERENCES groups(id),
    round_id UUID REFERENCES rounds(id),   -- standings after this round

    participant_id UUID NOT NULL,
    participant_type VARCHAR(10) NOT NULL DEFAULT 'PLAYER',

    -- Rank
    rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER,         -- positive = moved up

    -- Core stats
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    byes INTEGER NOT NULL DEFAULT 0,
    walkovers INTEGER NOT NULL DEFAULT 0,
    forfeits INTEGER NOT NULL DEFAULT 0,

    -- Points
    points DECIMAL(8,2) NOT NULL DEFAULT 0,
    bonus_points DECIMAL(8,2) NOT NULL DEFAULT 0,
    penalty_points DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_points DECIMAL(8,2) NOT NULL DEFAULT 0,

    -- Score tracking (for goals/runs/baskets)
    score_for DECIMAL(10,2) NOT NULL DEFAULT 0,
    score_against DECIMAL(10,2) NOT NULL DEFAULT 0,
    score_difference DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Sport-specific tie-break values (JSONB for flexibility)
    tiebreak_data JSONB NOT NULL DEFAULT '{}',
    -- Chess: {buchholz, buchholz_cut1, sonneborn_berger, direct_encounter_points}
    -- Cricket: {net_run_rate, runs_for, runs_against, overs_faced}
    -- Football: {goal_difference, goals_scored, fair_play_points}

    -- Form (last 5: W/D/L)
    form JSONB,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_standings_unique ON standings(tournament_id, (COALESCE(round_id::text, 'final')), participant_id);
CREATE INDEX idx_standings_tournament_id ON standings(tournament_id);
CREATE INDEX idx_standings_participant_id ON standings(participant_id);
CREATE INDEX idx_standings_rank ON standings(rank);

-- =====================================================
-- STANDINGS SNAPSHOTS (immutable per round)
-- =====================================================
CREATE TABLE standings_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    round_id UUID NOT NULL REFERENCES rounds(id),
    snapshot_data JSONB NOT NULL,         -- full standings at that point in time
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, round_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id),
    match_id UUID REFERENCES matches(id),
    type VARCHAR(50) NOT NULL,         -- ROUND_START, MATCH_ASSIGNED, RESULT_ENTERED, etc.
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- V6: Seed Data â€” Roles, Sports, Default Rules
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€â”€ Roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ Sports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO sports (id, name, code, participant_type, min_participants, max_participants, description, is_active, sort_order, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Chess',        'CHESS',        'INDIVIDUAL', 2,    NULL,  'Classic board game â€” FIDE rules',                      TRUE, 1,  NOW(), NOW()),
  (gen_random_uuid(), 'Cricket',      'CRICKET',      'TEAM',       10,   11,    'Bat-and-ball game â€” ICC rules',                        TRUE, 2,  NOW(), NOW()),
  (gen_random_uuid(), 'Football',     'FOOTBALL',     'TEAM',       11,   11,    'Association football â€” FIFA rules',                    TRUE, 3,  NOW(), NOW()),
  (gen_random_uuid(), 'Basketball',   'BASKETBALL',   'TEAM',       5,    5,     'Basket sport â€” FIBA rules',                            TRUE, 4,  NOW(), NOW()),
  (gen_random_uuid(), 'Badminton',    'BADMINTON',    'BOTH',       1,    2,     'Racket sport â€” BWF rules',                             TRUE, 5,  NOW(), NOW()),
  (gen_random_uuid(), 'Carrom',       'CARROM',       'BOTH',       1,    2,     'Strike-and-pocket board game â€” ICF rules',             TRUE, 6,  NOW(), NOW()),
  (gen_random_uuid(), 'Volleyball',   'VOLLEYBALL',   'TEAM',       6,    6,     'Net sport â€” FIVB rules',                               TRUE, 7,  NOW(), NOW()),
  (gen_random_uuid(), 'Table Tennis', 'TABLE_TENNIS', 'BOTH',       1,    2,     'Ping-pong â€” ITTF rules',                               TRUE, 8,  NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- â”€â”€â”€ Sport-specific scoring config in sport_configs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- (Stored as JSONB per sport for extensibility)

-- â”€â”€â”€ Default tournament formats available per sport â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- This would normally be in a sport_formats table, but we seed as reference

-- â”€â”€â”€ Audit log table initial check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- (already created in V1 migrations)

