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
