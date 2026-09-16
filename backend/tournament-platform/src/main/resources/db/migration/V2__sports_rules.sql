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
       'FIDE Laws of Chess 2023 — used as baseline for Swiss pairing and competition rules.'
FROM sports WHERE code = 'CHESS';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2022', 'ICC', 'https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions', '2022-10-01', 'ACTIVE',
       'ICC Playing Conditions 2022 — used as baseline for match play, scoring and competition rules.'
FROM sports WHERE code = 'CRICKET';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'FIFA', 'https://www.fifa.com/about-fifa/official-documents/laws-of-the-game', '2024-07-01', 'ACTIVE',
       'FIFA Laws of the Game 2024/25 — used as baseline. Tournament regulations may supplement.'
FROM sports WHERE code = 'FOOTBALL';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'FIBA', 'https://www.fiba.basketball/documents/fiba-official-basketball-rules.pdf', '2024-05-01', 'ACTIVE',
       'FIBA Official Basketball Rules 2024 — used as baseline.'
FROM sports WHERE code = 'BASKETBALL';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2021', 'BWF', 'https://corporate.bwfbadminton.com/statutes/laws-of-badminton/', '2021-01-01', 'ACTIVE',
       'BWF Laws of Badminton 2021 — used as baseline.'
FROM sports WHERE code = 'BADMINTON';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'FIVB', 'https://www.fivb.com/en/volleyball/thegame_volleyball/rulesofthegame_volleyball.htm', '2024-01-01', 'ACTIVE',
       'FIVB Official Volleyball Rules 2025-2028 — used as baseline.'
FROM sports WHERE code = 'VOLLEYBALL';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2024', 'ITTF', 'https://www.ittf.com/handbook/', '2024-01-01', 'ACTIVE',
       'ITTF Regulations for International Competitions 2024 — used as baseline.'
FROM sports WHERE code = 'TABLE_TENNIS';

INSERT INTO sport_rule_versions (sport_id, version, governing_body, source_url, effective_from, status, notes)
SELECT id, '2023', 'ICF', 'https://www.carrom.org/rules', '2023-01-01', 'ACTIVE',
       'International Carrom Federation rules — used as baseline. Local tournament rules may vary significantly.'
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
