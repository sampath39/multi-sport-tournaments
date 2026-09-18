export interface PlayerRole {
  role: string
  desc: string
  isDefault?: boolean
}

export interface SportTheme {
  primaryHex: string
  accentHex: string
  badgeClass: string
  pageGlow: string
  bannerGradient: string
  bannerBorder: string
  accentBorder: string
  fixtureCardBg: string
  arenaPattern: string
  ambientAtmosphere: string
  wallpaper: string
}

export interface SportConfig {
  code: string
  name: string
  icon: string
  type: 'INDIVIDUAL' | 'TEAM'
  competitorTerm: string
  competitorsTerm: string
  courtTerminology: string
  courtTerminologyPlural: string
  squadSizeDesc: string
  defaultSquadSize: number
  isTeamSport: boolean
  minSquad: number
  maxSquad: number
  lineupSize: number
  playerRoles: PlayerRole[]
  ratingLabel: string
  ratingPlaceholder: string
  scoringUnit: string
  scoreStep: string
  scorePlaceholderA: string
  scorePlaceholderB: string
  defaultScoreA: number
  defaultScoreB: number
  isDrawAllowed: boolean
  defaultFormat: string
  recommendedFormats: Array<{ id: string; label: string; desc: string }>
  tournamentTitlePlaceholder: string
  tournamentDescPlaceholder: string
  venuePlaceholder: string
  competitorNamePlaceholder: string
  sideAName: string
  sideBName: string
  sideABadge: string
  sideBBadge: string
  tiebreakDescription: string
  tiebreakOptions: Array<{ id: string; label: string; desc: string }>
  standingsColumns: Array<{ key: string; label: string; tooltip: string; align?: 'left' | 'center' | 'right' }>
  rulesOverview: {
    duration: string
    scoring: string
    tiebreak: string
    foulsPenalties: string
  }
  theme: SportTheme
}

export const SPORT_CONFIGS: Record<string, SportConfig> = {
  CHESS: {
    code: 'CHESS',
    name: 'Chess',
    icon: '♟️',
    type: 'INDIVIDUAL',
    competitorTerm: 'Player',
    competitorsTerm: 'Players',
    courtTerminology: 'Board',
    courtTerminologyPlural: 'Boards',
    squadSizeDesc: '1 Player (Individual)',
    defaultSquadSize: 1,
    isTeamSport: false,
    minSquad: 1,
    maxSquad: 1,
    lineupSize: 1,
    playerRoles: [
      { role: 'Grandmaster / Player', desc: 'Active registered player' }
    ],
    ratingLabel: 'FIDE Elo Rating',
    ratingPlaceholder: 'e.g. 2450',
    scoringUnit: 'Points',
    scoreStep: '0.5',
    scorePlaceholderA: '1.0',
    scorePlaceholderB: '0.0',
    defaultScoreA: 1,
    defaultScoreB: 0,
    isDrawAllowed: true,
    defaultFormat: 'SWISS',
    recommendedFormats: [
      { id: 'SWISS', label: 'FIDE Swiss System', desc: 'Official Dutch Swiss pairing engine with score group brackets' },
      { id: 'SINGLE_ELIMINATION', label: 'Knockout', desc: 'Direct single-elimination bracket with Armageddon tiebreak' },
      { id: 'ROUND_ROBIN', label: 'Round Robin', desc: 'All players play against each other with alternating colors' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 Grandmaster Classical & Rapid Invitational',
    tournamentDescPlaceholder: 'FIDE classical time control (90 min + 30 sec increment), touch-move rules apply...',
    venuePlaceholder: 'e.g. Main Hall - Board 1',
    competitorNamePlaceholder: 'e.g. Magnus Carlsen, Hikaru Nakamura, or Gukesh D',
    sideAName: 'White ♔',
    sideBName: 'Black ♚',
    sideABadge: 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold',
    sideBBadge: 'bg-stone-900 text-amber-100 shadow-xs border border-stone-700 font-semibold',
    tiebreakDescription: 'Armageddon match (White 5 min, Black 4 min with draw odds) or Blitz Playoff',
    tiebreakOptions: [
      { id: 'ARMAGEDDON', label: 'Armageddon Playoff', desc: '5 min White vs 4 min Black (Black wins on draw)' },
      { id: 'BLITZ', label: 'Blitz 3+2 Playoff', desc: '2 Blitz games to break the deadlock' },
      { id: 'ADMIN_DECISION', label: 'Admin / Arbiter Decision', desc: 'Arbiter ruling or higher seed advancement' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'Official Standing Rank', align: 'center' },
      { key: 'participantName', label: 'Player', tooltip: 'Competitor Name', align: 'left' },
      { key: 'played', label: 'P', tooltip: 'Games Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Games Won', align: 'center' },
      { key: 'drawn', label: 'D', tooltip: 'Games Drawn', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Games Lost', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'Total Score Points (1 for Win, 0.5 for Draw)', align: 'center' },
      { key: 'buchholz', label: 'BH', tooltip: 'Buchholz Tiebreak (Sum of Opponents Scores)', align: 'center' },
      { key: 'sonnebornBerger', label: 'SB', tooltip: 'Sonneborn-Berger Tiebreak', align: 'center' },
    ],
    rulesOverview: {
      duration: 'Standard Classical: 90 min + 30s increment | Rapid: 15 min + 10s | Blitz: 3 min + 2s',
      scoring: 'Win = 1.0 pt, Draw = 0.5 pt, Loss = 0.0 pt',
      tiebreak: 'Buchholz, Sonneborn-Berger, Direct Encounter, Armageddon decider for knockouts',
      foulsPenalties: 'Touch-move rule strictly enforced, 2 illegal moves result in match forfeiture',
    },
    theme: {
      primaryHex: '#d97706',
      accentHex: '#78350f',
      badgeClass: 'bg-amber-500/15 text-amber-900 border-amber-300 dark:text-amber-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245, 158, 11, 0.15), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(28, 25, 23, 0.45) 0%, rgba(41, 37, 36, 0.35) 40%, rgba(69, 26, 3, 0.4) 100%)',
      bannerBorder: 'border-amber-500/40',
      accentBorder: 'border-amber-400',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-amber-400/60',
      arenaPattern: 'radial-gradient(#d97706 1px, transparent 1px)',
      ambientAtmosphere: 'from-amber-950/20 via-transparent to-amber-900/10',
      wallpaper: '/sports/chess_bg.jpg'
    }
  },

  CRICKET: {
    code: 'CRICKET',
    name: 'Cricket',
    icon: '🏏',
    type: 'TEAM',
    competitorTerm: 'Team',
    competitorsTerm: 'Teams',
    courtTerminology: 'Pitch',
    courtTerminologyPlural: 'Pitches / Grounds',
    squadSizeDesc: '11 Players + 4 Substitutes',
    defaultSquadSize: 11,
    isTeamSport: true,
    minSquad: 11,
    maxSquad: 16,
    lineupSize: 11,
    playerRoles: [
      { role: 'Captain & Batsman', desc: 'Team Leader & Top Order Batsman', isDefault: true },
      { role: 'Opening Batsman', desc: 'Top Order Specialist Batsman' },
      { role: 'Middle Order Batsman', desc: 'Anchor / Middle Order Specialist' },
      { role: 'Wicket-Keeper Batsman', desc: 'Gloveman & Middle Order' },
      { role: 'All-Rounder (Bat/Bowl)', desc: 'Pace or Spin All-Rounder' },
      { role: 'Fast Bowler', desc: 'Opening / Death Over Specialist' },
      { role: 'Spin Bowler', desc: 'Off-Spin / Leg-Spin Specialist' },
      { role: 'Substitute / Bench', desc: 'Impact / Reserve Player' },
    ],
    ratingLabel: 'Club / Seed Rating',
    ratingPlaceholder: 'e.g. 1800',
    scoringUnit: 'Runs (or Runs/Wkts)',
    scoreStep: '1',
    scorePlaceholderA: '185',
    scorePlaceholderB: '172',
    defaultScoreA: 180,
    defaultScoreB: 165,
    isDrawAllowed: false,
    defaultFormat: 'SINGLE_ELIMINATION',
    recommendedFormats: [
      { id: 'SINGLE_ELIMINATION', label: 'Knockout Tournament', desc: 'Direct elimination bracket with Super Over tiebreaker' },
      { id: 'ROUND_ROBIN', label: 'League Stage', desc: 'All teams play each other; top teams qualify on points & NRR' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 Premier T20 Cricket Championship',
    tournamentDescPlaceholder: 'ICC T20 match rules apply. 20 overs per innings, powerplay 1-6 overs, 1 Super Over for ties...',
    venuePlaceholder: 'e.g. Stadium Oval - Pitch 1',
    competitorNamePlaceholder: 'e.g. Mumbai Titans, Chennai Kings, or Royal Challengers',
    sideAName: 'Batting First 🏏',
    sideBName: 'Bowling First ⚾',
    sideABadge: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold',
    sideBBadge: 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold',
    tiebreakDescription: 'Super Over (1 Over per team, 2 wickets max) or Boundary Countback',
    tiebreakOptions: [
      { id: 'SUPER_OVER', label: 'Super Over Playoff', desc: '1 over eliminator per team (2 wickets max)' },
      { id: 'HIGHER_RUN_RATE', label: 'Net Run Rate Advantage', desc: 'Higher tournament Net Run Rate (NRR)' },
      { id: 'ADMIN_DECISION', label: 'Match Referee Decision', desc: 'Official referee or coin toss resolution' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'League Position', align: 'center' },
      { key: 'participantName', label: 'Team', tooltip: 'Cricket Team Name', align: 'left' },
      { key: 'played', label: 'Mat', tooltip: 'Matches Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Matches Won', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Matches Lost', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'Points Awarded (2 for Win)', align: 'center' },
      { key: 'netRunRate', label: 'NRR', tooltip: 'Net Run Rate = (Runs Scored / Overs) - (Runs Conceded / Overs)', align: 'center' },
    ],
    rulesOverview: {
      duration: 'T20: 20 Overs per side (approx. 3.5 hrs) | T10 / 100-ball: Fast format',
      scoring: '1 Run (Single), 4 Runs (Boundary), 6 Runs (Maximum), Extras (Wides/No-Balls)',
      tiebreak: 'Super Over eliminator played immediately upon equal scores',
      foulsPenalties: 'Free hit on front-foot no-ball, fielding restrictions (max 2 fielders outside 30-yd circle in PP)',
    },
    theme: {
      primaryHex: '#15803d',
      accentHex: '#ca8a04',
      badgeClass: 'bg-emerald-500/15 text-emerald-900 border-emerald-300 dark:text-emerald-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(22, 163, 74, 0.18), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(5, 46, 22, 0.45) 0%, rgba(20, 83, 45, 0.35) 45%, rgba(113, 63, 18, 0.4) 100%)',
      bannerBorder: 'border-emerald-500/40',
      accentBorder: 'border-emerald-500',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-emerald-400/60',
      arenaPattern: 'radial-gradient(#15803d 1px, transparent 1px)',
      ambientAtmosphere: 'from-emerald-950/20 via-transparent to-amber-950/10',
      wallpaper: '/sports/cricket_bg.jpg'
    }
  },

  FOOTBALL: {
    code: 'FOOTBALL',
    name: 'Football',
    icon: '⚽',
    type: 'TEAM',
    competitorTerm: 'Team',
    competitorsTerm: 'Teams',
    courtTerminology: 'Pitch / Stadium',
    courtTerminologyPlural: 'Pitches / Stadiums',
    squadSizeDesc: '11 Players + 7 Substitutes',
    defaultSquadSize: 11,
    isTeamSport: true,
    minSquad: 11,
    maxSquad: 18,
    lineupSize: 11,
    playerRoles: [
      { role: 'Captain & Striker', desc: 'Team Captain & Main Forward', isDefault: true },
      { role: 'Centre Forward / Striker', desc: 'Goal Scorer' },
      { role: 'Left / Right Winger', desc: 'Wide Attacking Forward' },
      { role: 'Attacking Midfielder', desc: 'Playmaker (#10)' },
      { role: 'Central Midfielder', desc: 'Box-to-Box Midfielder' },
      { role: 'Defensive Midfielder', desc: 'Holding Shield Midfielder' },
      { role: 'Centre-Back Defender', desc: 'Central Defense Pillar' },
      { role: 'Full-Back / Wing-Back', desc: 'Left/Right Defensive Flank' },
      { role: 'Goalkeeper', desc: 'Shot Stopper & Custodian' },
      { role: 'Bench Substitute', desc: 'Tactical Reserve' },
    ],
    ratingLabel: 'Club / Seed Rating',
    ratingPlaceholder: 'e.g. 1950',
    scoringUnit: 'Goals',
    scoreStep: '1',
    scorePlaceholderA: '3',
    scorePlaceholderB: '1',
    defaultScoreA: 2,
    defaultScoreB: 1,
    isDrawAllowed: true,
    defaultFormat: 'SINGLE_ELIMINATION',
    recommendedFormats: [
      { id: 'SINGLE_ELIMINATION', label: 'Knockout Cup', desc: 'Single elimination cup with Extra Time & Penalty Shootout' },
      { id: 'ROUND_ROBIN', label: 'League Season', desc: '3 pts for win, 1 pt for draw, Goal Difference standings' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 Continental Super Cup & Champions League',
    tournamentDescPlaceholder: 'FIFA standard 90 min (2 x 45 min halves). 5 substitutions allowed, VAR protocols in place...',
    venuePlaceholder: 'e.g. Main Stadium - Pitch 1',
    competitorNamePlaceholder: 'e.g. Real Madrid, Arsenal FC, Bayern Munich, or Inter',
    sideAName: 'Home Team 🏠',
    sideBName: 'Away Team ✈️',
    sideABadge: 'bg-blue-100 text-blue-950 border border-blue-300 font-semibold',
    sideBBadge: 'bg-rose-100 text-rose-950 border border-rose-300 font-semibold',
    tiebreakDescription: 'Extra Time (2 x 15 min) followed by Penalty Shootout (5 kicks each)',
    tiebreakOptions: [
      { id: 'PENALTIES', label: 'Penalty Shootout', desc: 'Best-of-5 penalties followed by sudden death penalties' },
      { id: 'EXTRA_TIME', label: 'Extra Time (30 Min)', desc: 'Two 15-minute extra periods' },
      { id: 'ADMIN_DECISION', label: 'Referee Ruling', desc: 'Official match delegate determination' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'Table Position', align: 'center' },
      { key: 'participantName', label: 'Club / Team', tooltip: 'Football Club Name', align: 'left' },
      { key: 'played', label: 'P', tooltip: 'Matches Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Wins (3 pts)', align: 'center' },
      { key: 'drawn', label: 'D', tooltip: 'Draws (1 pt)', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Losses (0 pts)', align: 'center' },
      { key: 'goalsFor', label: 'GF', tooltip: 'Goals Scored', align: 'center' },
      { key: 'goalsAgainst', label: 'GA', tooltip: 'Goals Conceded', align: 'center' },
      { key: 'goalDiff', label: 'GD', tooltip: 'Goal Difference (GF - GA)', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'Total Points', align: 'center' },
    ],
    rulesOverview: {
      duration: '90 Minutes (Two 45-minute halves + stoppage time)',
      scoring: '1 Goal per legal ball crossing goal line. Win = 3 pts, Draw = 1 pt, Loss = 0 pts',
      tiebreak: 'Goal Difference (GD), Goals Scored (GF), Head-to-Head, Penalty Shootout in knockouts',
      foulsPenalties: 'Yellow card (caution), Red card (expulsion), Penalty kick awarded for box fouls',
    },
    theme: {
      primaryHex: '#059669',
      accentHex: '#2563eb',
      badgeClass: 'bg-emerald-500/15 text-emerald-900 border-emerald-300 dark:text-emerald-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.18), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(2, 44, 34, 0.45) 0%, rgba(6, 78, 59, 0.35) 40%, rgba(30, 27, 75, 0.4) 100%)',
      bannerBorder: 'border-emerald-400/40',
      accentBorder: 'border-emerald-500',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-emerald-400/60',
      arenaPattern: 'radial-gradient(#059669 1px, transparent 1px)',
      ambientAtmosphere: 'from-emerald-950/20 via-transparent to-blue-950/10',
      wallpaper: '/sports/football_bg.jpg'
    }
  },

  BASKETBALL: {
    code: 'BASKETBALL',
    name: 'Basketball',
    icon: '🏀',
    type: 'TEAM',
    competitorTerm: 'Team',
    competitorsTerm: 'Teams',
    courtTerminology: 'Court',
    courtTerminologyPlural: 'Courts',
    squadSizeDesc: '5 Active + 7 Bench Players',
    defaultSquadSize: 5,
    isTeamSport: true,
    minSquad: 5,
    maxSquad: 12,
    lineupSize: 5,
    playerRoles: [
      { role: 'Captain & Point Guard (PG)', desc: 'Floor General & Primary Ball Handler', isDefault: true },
      { role: 'Shooting Guard (SG)', desc: 'Perimeter Shooter & Wing Scorer' },
      { role: 'Small Forward (SF)', desc: 'Versatile Inside-Outside Wing' },
      { role: 'Power Forward (PF)', desc: 'Rebounder & Mid-Range Scorer' },
      { role: 'Center (C)', desc: 'Rim Protector & Paint Anchor' },
      { role: 'Sixth Man / Reserve', desc: 'Key Bench Contributor' },
    ],
    ratingLabel: 'Team Elo / Seed',
    ratingPlaceholder: 'e.g. 1750',
    scoringUnit: 'Points',
    scoreStep: '1',
    scorePlaceholderA: '98',
    scorePlaceholderB: '92',
    defaultScoreA: 95,
    defaultScoreB: 88,
    isDrawAllowed: false,
    defaultFormat: 'SINGLE_ELIMINATION',
    recommendedFormats: [
      { id: 'SINGLE_ELIMINATION', label: 'Championship Playoff', desc: 'Knockout bracket with 5-minute overtime periods' },
      { id: 'ROUND_ROBIN', label: 'League Conference', desc: 'Conference round robin with points difference ranking' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 National Basketball Championship & Final Four',
    tournamentDescPlaceholder: 'FIBA rules (4 quarters x 10 min), 24-second shot clock, 5 fouls limit per player...',
    venuePlaceholder: 'e.g. Arena Hardwood - Court 1',
    competitorNamePlaceholder: 'e.g. Boston Celtics, LA Lakers, or Golden State',
    sideAName: 'Home Team 🏀',
    sideBName: 'Visiting Team 🛡️',
    sideABadge: 'bg-orange-100 text-orange-950 border border-orange-300 font-semibold',
    sideBBadge: 'bg-slate-900 text-orange-100 border border-slate-700 font-semibold',
    tiebreakDescription: '5-Minute Overtime (OT) periods until a winner is determined',
    tiebreakOptions: [
      { id: 'OVERTIME', label: '5-Minute Overtime (OT)', desc: 'Full 5-minute extra period with 1 additional timeout' },
      { id: 'SUDDEN_DEATH', label: 'First to 5 Points', desc: 'Target score sudden death finish' },
      { id: 'ADMIN_DECISION', label: 'Official Table Ruling', desc: 'Chief referee / technical commissioner call' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'Conference Standing', align: 'center' },
      { key: 'participantName', label: 'Basketball Team', tooltip: 'Team Name', align: 'left' },
      { key: 'played', label: 'GP', tooltip: 'Games Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Games Won', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Games Lost', align: 'center' },
      { key: 'pointsFor', label: 'PF', tooltip: 'Points For (Scored)', align: 'center' },
      { key: 'pointsAgainst', label: 'PA', tooltip: 'Points Against (Conceded)', align: 'center' },
      { key: 'pointsDiff', label: 'DIFF', tooltip: 'Point Differential (+/-)', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'Standings Points', align: 'center' },
    ],
    rulesOverview: {
      duration: '4 Quarters x 10 Minutes (FIBA) / 12 Minutes (NBA)',
      scoring: 'Free Throw = 1 pt, Inside Arc = 2 pts, Beyond Arc = 3 pts',
      tiebreak: 'No drawn games; 5-minute overtime periods played until a winner emerges',
      foulsPenalties: '5 personal fouls = disqualification; bonus free throws on 5th team foul per quarter',
    },
    theme: {
      primaryHex: '#ea580c',
      accentHex: '#c2410c',
      badgeClass: 'bg-orange-500/15 text-orange-900 border-orange-300 dark:text-orange-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(234, 88, 12, 0.18), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(67, 20, 7, 0.45) 0%, rgba(124, 45, 18, 0.35) 45%, rgba(24, 24, 27, 0.4) 100%)',
      bannerBorder: 'border-orange-500/40',
      accentBorder: 'border-orange-500',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-orange-400/60',
      arenaPattern: 'radial-gradient(#ea580c 1px, transparent 1px)',
      ambientAtmosphere: 'from-orange-950/20 via-transparent to-stone-950/10',
      wallpaper: '/sports/basketball_bg.jpg'
    }
  },

  VOLLEYBALL: {
    code: 'VOLLEYBALL',
    name: 'Volleyball',
    icon: '🏐',
    type: 'TEAM',
    competitorTerm: 'Team',
    competitorsTerm: 'Teams',
    courtTerminology: 'Court',
    courtTerminologyPlural: 'Courts',
    squadSizeDesc: '6 On-Court + 6 Bench / Libero',
    defaultSquadSize: 6,
    isTeamSport: true,
    minSquad: 6,
    maxSquad: 12,
    lineupSize: 6,
    playerRoles: [
      { role: 'Captain & Setter', desc: 'Team Captain & Offense Conductor', isDefault: true },
      { role: 'Outside Hitter (Left Wing)', desc: 'Primary Attack & Pass Receiver' },
      { role: 'Opposite Hitter (Right Wing)', desc: 'Power Spike Specialist' },
      { role: 'Middle Blocker', desc: 'Quick Attack & Wall Defense' },
      { role: 'Libero', desc: 'Defensive Specialist (Distinct Jersey)' },
      { role: 'Serving Specialist / Sub', desc: 'Impact Server / Reserve' },
    ],
    ratingLabel: 'Club / Team Seed',
    ratingPlaceholder: 'e.g. 1600',
    scoringUnit: 'Sets Won (Points)',
    scoreStep: '1',
    scorePlaceholderA: '3',
    scorePlaceholderB: '1',
    defaultScoreA: 3,
    defaultScoreB: 1,
    isDrawAllowed: false,
    defaultFormat: 'SINGLE_ELIMINATION',
    recommendedFormats: [
      { id: 'SINGLE_ELIMINATION', label: 'Knockout Championship', desc: 'Best-of-5 sets with 15-pt deciding set' },
      { id: 'ROUND_ROBIN', label: 'League Round Robin', desc: '3-2-1 Points System (3 pts for 3-0/3-1 win, 2 pts for 3-2)' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 Inter-State Volleyball Gold Cup',
    tournamentDescPlaceholder: 'FIVB rules, Best of 5 sets to 25 pts (deuce +2), 5th set to 15 pts, Libero substitution rules...',
    venuePlaceholder: 'e.g. Indoor Stadium - Court 1',
    competitorNamePlaceholder: 'e.g. Calicut Heroes, Thunderbolts, or Spikers Club',
    sideAName: 'Team A (Court 1) 🏐',
    sideBName: 'Team B (Court 2) 🛡️',
    sideABadge: 'bg-sky-100 text-sky-950 border border-sky-300 font-semibold',
    sideBBadge: 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold',
    tiebreakDescription: 'Deciding 5th Set to 15 Points (must win by 2 points)',
    tiebreakOptions: [
      { id: 'GOLDEN_SET', label: 'Golden Set (15 Pts)', desc: 'First to 15 points with 2-point clear margin' },
      { id: 'POINT_RATIO', label: 'Points Ratio Decision', desc: 'Total points won / total points lost ratio' },
      { id: 'ADMIN_DECISION', label: 'Referee Ruling', desc: 'Head referee determination' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'Standing Rank', align: 'center' },
      { key: 'participantName', label: 'Volleyball Team', tooltip: 'Team Name', align: 'left' },
      { key: 'played', label: 'P', tooltip: 'Matches Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Matches Won', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Matches Lost', align: 'center' },
      { key: 'setsWon', label: 'SW', tooltip: 'Sets Won', align: 'center' },
      { key: 'setsLost', label: 'SL', tooltip: 'Sets Lost', align: 'center' },
      { key: 'setRatio', label: 'Ratio', tooltip: 'Sets Won / Sets Lost', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'League Points', align: 'center' },
    ],
    rulesOverview: {
      duration: 'Best of 5 sets (Sets 1-4 to 25 points, deciding 5th set to 15 points)',
      scoring: 'Rally point system (point scored on every serve); must win by 2 points',
      tiebreak: '5th set tiebreaker to 15 points with continuous side-switch at 8 points',
      foulsPenalties: 'Net touch violation, 4 hits violation, back-row attack fault',
    },
    theme: {
      primaryHex: '#0284c7',
      accentHex: '#d97706',
      badgeClass: 'bg-sky-500/15 text-sky-900 border-sky-300 dark:text-sky-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(2, 132, 199, 0.18), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(8, 47, 73, 0.45) 0%, rgba(3, 105, 161, 0.35) 45%, rgba(120, 53, 15, 0.4) 100%)',
      bannerBorder: 'border-sky-500/40',
      accentBorder: 'border-sky-500',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-sky-400/60',
      arenaPattern: 'radial-gradient(#0284c7 1px, transparent 1px)',
      ambientAtmosphere: 'from-sky-950/20 via-transparent to-amber-950/10',
      wallpaper: '/sports/volleyball_bg.jpg'
    }
  },

  TABLE_TENNIS: {
    code: 'TABLE_TENNIS',
    name: 'Table Tennis',
    icon: '🏓',
    type: 'INDIVIDUAL',
    competitorTerm: 'Player',
    competitorsTerm: 'Players',
    courtTerminology: 'Table',
    courtTerminologyPlural: 'Tables',
    squadSizeDesc: '1 (Singles) or 2 (Doubles)',
    defaultSquadSize: 1,
    isTeamSport: false,
    minSquad: 1,
    maxSquad: 2,
    lineupSize: 1,
    playerRoles: [
      { role: 'Singles Seed Player', desc: 'Main Competition Entrant' }
    ],
    ratingLabel: 'ITTF / National Rank',
    ratingPlaceholder: 'e.g. National #12',
    scoringUnit: 'Games (e.g. 3-1)',
    scoreStep: '1',
    scorePlaceholderA: '3',
    scorePlaceholderB: '2',
    defaultScoreA: 3,
    defaultScoreB: 1,
    isDrawAllowed: false,
    defaultFormat: 'SINGLE_ELIMINATION',
    recommendedFormats: [
      { id: 'SINGLE_ELIMINATION', label: 'Knockout Bracket', desc: 'Best-of-5 or Best-of-7 games to 11 points' },
      { id: 'ROUND_ROBIN', label: 'Group Stage Pools', desc: 'Pool round robin advancing to knockout bracket' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 National Table Tennis Ranking Cup',
    tournamentDescPlaceholder: 'ITTF regulations, Best of 5 games to 11 points (2 points clear lead on deuce), 2 serves per turn...',
    venuePlaceholder: 'e.g. Arena Hall - Table 1',
    competitorNamePlaceholder: 'e.g. Ma Long, Fan Zhendong, or Sharath Kamal',
    sideAName: 'Server (Side A) 🏓',
    sideBName: 'Receiver (Side B) 🔴',
    sideABadge: 'bg-blue-100 text-blue-950 border border-blue-300 font-semibold',
    sideBBadge: 'bg-rose-100 text-rose-950 border border-rose-300 font-semibold',
    tiebreakDescription: 'Deuce play (alternating 1 serve each until a 2-point lead is achieved)',
    tiebreakOptions: [
      { id: 'DEUCE', label: 'Deuce (+2 Pts Lead)', desc: 'Continuous 1-serve rotation until 2-point difference' },
      { id: 'DECIDING_GAME', label: 'Deciding 7th Game', desc: 'Final deciding game with side change at 5 points' },
      { id: 'ADMIN_DECISION', label: 'Umpire Call', desc: 'Chief umpire / referee ruling' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'Standing Rank', align: 'center' },
      { key: 'participantName', label: 'Player', tooltip: 'Competitor Name', align: 'left' },
      { key: 'played', label: 'P', tooltip: 'Matches Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Matches Won', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Matches Lost', align: 'center' },
      { key: 'gamesWon', label: 'GW', tooltip: 'Games Won', align: 'center' },
      { key: 'gamesLost', label: 'GL', tooltip: 'Games Lost', align: 'center' },
      { key: 'gameDiff', label: 'DIFF', tooltip: 'Game Difference (+/-)', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'Standing Points', align: 'center' },
    ],
    rulesOverview: {
      duration: 'Best of 5 games (preliminaries) / Best of 7 games (finals), each game to 11 points',
      scoring: '1 point per rally won; serve changes every 2 points; deuce at 10-10 requires 2-point lead',
      tiebreak: 'Deciding game played with side switch when first player reaches 5 points',
      foulsPenalties: 'Service toss must rise at least 16cm vertically without spin; non-racket hand cannot touch table',
    },
    theme: {
      primaryHex: '#2563eb',
      accentHex: '#dc2626',
      badgeClass: 'bg-blue-500/15 text-blue-900 border-blue-300 dark:text-blue-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.18), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(23, 37, 84, 0.45) 0%, rgba(30, 64, 175, 0.35) 45%, rgba(136, 19, 55, 0.4) 100%)',
      bannerBorder: 'border-blue-500/40',
      accentBorder: 'border-blue-500',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-blue-400/60',
      arenaPattern: 'radial-gradient(#2563eb 1px, transparent 1px)',
      ambientAtmosphere: 'from-blue-950/20 via-transparent to-rose-950/10',
      wallpaper: '/sports/tabletennis_bg.jpg'
    }
  },

  BADMINTON: {
    code: 'BADMINTON',
    name: 'Badminton',
    icon: '🏸',
    type: 'INDIVIDUAL',
    competitorTerm: 'Player',
    competitorsTerm: 'Players',
    courtTerminology: 'Court',
    courtTerminologyPlural: 'Courts',
    squadSizeDesc: '1 (Singles) or 2 (Doubles)',
    defaultSquadSize: 1,
    isTeamSport: false,
    minSquad: 1,
    maxSquad: 2,
    lineupSize: 1,
    playerRoles: [
      { role: 'Singles Competitor', desc: 'Registered Singles Player' }
    ],
    ratingLabel: 'BWF / National Ranking',
    ratingPlaceholder: 'e.g. World #8',
    scoringUnit: 'Games (e.g. 2-0)',
    scoreStep: '1',
    scorePlaceholderA: '2',
    scorePlaceholderB: '1',
    defaultScoreA: 2,
    defaultScoreB: 0,
    isDrawAllowed: false,
    defaultFormat: 'SINGLE_ELIMINATION',
    recommendedFormats: [
      { id: 'SINGLE_ELIMINATION', label: 'BWF Knockout Draw', desc: 'Direct elimination bracket (best-of-3 games to 21 pts)' },
      { id: 'ROUND_ROBIN', label: 'Group Pools', desc: 'Pool matches with game difference calculation' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 World Tour Badminton Open Championship',
    tournamentDescPlaceholder: 'BWF standard rules: Best of 3 games to 21 points (rally scoring). Golden point at 29-29...',
    venuePlaceholder: 'e.g. Court Hall - Court 1',
    competitorNamePlaceholder: 'e.g. Viktor Axelsen, PV Sindhu, Lakshya Sen, or Tai Tzu-ying',
    sideAName: 'Server Side 🏸',
    sideBName: 'Receiver Side 🛡️',
    sideABadge: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold',
    sideBBadge: 'bg-teal-100 text-teal-950 border border-teal-300 font-semibold',
    tiebreakDescription: 'Deuce at 20-20 (must lead by 2 pts; capped strictly at 30 points)',
    tiebreakOptions: [
      { id: 'DEUCE', label: 'Deuce (+2 Pts)', desc: 'First to gain 2-point lead or first to 30 points at 29-29' },
      { id: 'DECIDING_GAME', label: 'Deciding 3rd Game', desc: '3rd game with court switch when a player reaches 11 pts' },
      { id: 'ADMIN_DECISION', label: 'Umpire Decision', desc: 'BWF tournament referee call' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'Standing Rank', align: 'center' },
      { key: 'participantName', label: 'Badminton Player', tooltip: 'Player Name', align: 'left' },
      { key: 'played', label: 'P', tooltip: 'Matches Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Matches Won', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Matches Lost', align: 'center' },
      { key: 'gamesWon', label: 'GW', tooltip: 'Games Won', align: 'center' },
      { key: 'gamesLost', label: 'GL', tooltip: 'Games Lost', align: 'center' },
      { key: 'gameDiff', label: 'DIFF', tooltip: 'Game Difference (+/-)', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'Match Points', align: 'center' },
    ],
    rulesOverview: {
      duration: 'Best of 3 games to 21 points (rally point scoring system)',
      scoring: 'Rally point scoring; receiver wins point to gain serve; deuce at 20-20',
      tiebreak: 'First to 30 points wins if game reaches 29-29; no drawn matches',
      foulsPenalties: 'Service above 1.15m height, shuttle hitting ceiling/body, net touch',
    },
    theme: {
      primaryHex: '#059669',
      accentHex: '#0d9488',
      badgeClass: 'bg-emerald-500/15 text-emerald-900 border-emerald-300 dark:text-emerald-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(5, 150, 105, 0.18), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.45) 0%, rgba(15, 118, 110, 0.35) 50%, rgba(19, 78, 74, 0.4) 100%)',
      bannerBorder: 'border-emerald-400/40',
      accentBorder: 'border-emerald-500',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-emerald-400/60',
      arenaPattern: 'radial-gradient(#059669 1px, transparent 1px)',
      ambientAtmosphere: 'from-emerald-950/20 via-transparent to-green-950/10',
      wallpaper: '/sports/badminton_bg.jpg'
    }
  },

  CARROM: {
    code: 'CARROM',
    name: 'Carrom',
    icon: '🎯',
    type: 'INDIVIDUAL',
    competitorTerm: 'Player',
    competitorsTerm: 'Players',
    courtTerminology: 'Carrom Board',
    courtTerminologyPlural: 'Carrom Boards',
    squadSizeDesc: '1 (Singles) or 2 (Doubles)',
    defaultSquadSize: 1,
    isTeamSport: false,
    minSquad: 1,
    maxSquad: 2,
    lineupSize: 1,
    playerRoles: [
      { role: 'Carrom Striker Player', desc: 'Registered Singles Player' }
    ],
    ratingLabel: 'Carrom Federation Rank',
    ratingPlaceholder: 'e.g. State #4',
    scoringUnit: 'Board Points (e.g. 25-14)',
    scoreStep: '1',
    scorePlaceholderA: '25',
    scorePlaceholderB: '14',
    defaultScoreA: 25,
    defaultScoreB: 12,
    isDrawAllowed: false,
    defaultFormat: 'SINGLE_ELIMINATION',
    recommendedFormats: [
      { id: 'SINGLE_ELIMINATION', label: 'Knockout Championship', desc: 'Direct knockout bracket (first to 25 pts or 8 boards)' },
      { id: 'SWISS', label: 'Swiss Carrom Tour', desc: 'Official ICF Swiss pairing for multi-round ranking' },
      { id: 'ROUND_ROBIN', label: 'Round Robin Board', desc: 'All players play full boards against each competitor' },
    ],
    tournamentTitlePlaceholder: 'e.g. 2026 State Carrom Ranking & Gold Cup Championship',
    tournamentDescPlaceholder: 'ICF rules, White coin = 1 pt, Black coin = 1 pt, Red Queen = 3 pts (must be covered), 8 boards or 25 pts...',
    venuePlaceholder: 'e.g. Carrom Boardroom - Board 1',
    competitorNamePlaceholder: 'e.g. Prashant More, Rashmi Kumari, or K. Srinivas',
    sideAName: 'White Coins ⚪',
    sideBName: 'Black Coins ⚫',
    sideABadge: 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold',
    sideBBadge: 'bg-stone-800 text-white shadow-xs border border-stone-600 font-semibold',
    tiebreakDescription: 'Sudden Death Board or White Queen Pocketing Shootout',
    tiebreakOptions: [
      { id: 'EXTRA_BOARD', label: 'Sudden Death Board', desc: '1 extra board played to break the tie' },
      { id: 'QUEEN_SHOOTOUT', label: 'Red Queen Shootout', desc: 'Alternating direct Queen pocketing attempts' },
      { id: 'ADMIN_DECISION', label: 'Higher Seed Decision', desc: 'Chief referee / arbiter ruling' },
    ],
    standingsColumns: [
      { key: 'rank', label: 'Rank', tooltip: 'Standing Rank', align: 'center' },
      { key: 'participantName', label: 'Carrom Player', tooltip: 'Player Name', align: 'left' },
      { key: 'played', label: 'P', tooltip: 'Matches Played', align: 'center' },
      { key: 'won', label: 'W', tooltip: 'Matches Won', align: 'center' },
      { key: 'lost', label: 'L', tooltip: 'Matches Lost', align: 'center' },
      { key: 'boardsWon', label: 'BW', tooltip: 'Boards Won', align: 'center' },
      { key: 'boardsLost', label: 'BL', tooltip: 'Boards Lost', align: 'center' },
      { key: 'netPoints', label: 'Net Pts', tooltip: 'Net Cumulative Board Points (+/-)', align: 'center' },
      { key: 'points', label: 'PTS', tooltip: 'Match Points', align: 'center' },
    ],
    rulesOverview: {
      duration: 'Match ends when player reaches 25 points or after 8 boards',
      scoring: 'White/Black coins = 1 pt each; Queen = 3 pts (must pocket a cover coin immediately)',
      tiebreak: '1 sudden-death board if tied at end of 8 boards',
      foulsPenalties: 'Pocketing striker = 1 penalty coin returned to center board',
    },
    theme: {
      primaryHex: '#c2410c',
      accentHex: '#78350f',
      badgeClass: 'bg-amber-600/15 text-amber-950 border-amber-300 dark:text-amber-200',
      pageGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(194, 65, 12, 0.18), rgba(255, 255, 255, 0))',
      bannerGradient: 'linear-gradient(135deg, rgba(69, 26, 3, 0.45) 0%, rgba(120, 53, 15, 0.35) 45%, rgba(41, 37, 36, 0.4) 100%)',
      bannerBorder: 'border-amber-500/40',
      accentBorder: 'border-amber-500',
      fixtureCardBg: 'bg-slate-950/35 border-white/20 shadow-xl hover:border-amber-400/60',
      arenaPattern: 'radial-gradient(#c2410c 1px, transparent 1px)',
      ambientAtmosphere: 'from-amber-950/20 via-transparent to-orange-950/10',
      wallpaper: '/sports/carrom_bg.jpg'
    }
  },
}

export function getSportConfig(sportCode?: string | null): SportConfig {
  if (!sportCode) return SPORT_CONFIGS.CHESS
  const normalized = sportCode.trim().toUpperCase()
  return SPORT_CONFIGS[normalized] || SPORT_CONFIGS.CHESS
}
