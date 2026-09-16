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
