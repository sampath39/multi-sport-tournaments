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

    -- Scores (generic — interpreted per sport)
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
