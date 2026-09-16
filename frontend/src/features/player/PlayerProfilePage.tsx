import { useParams, Link } from 'react-router-dom'
import {
  User, Trophy, Award, Activity, TrendingUp,
  ArrowLeft, CheckCircle2, Calendar, MapPin
} from 'lucide-react'

export function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>()

  const player = {
    name: 'Marcus Vance',
    role: 'Forward / Striker',
    team: 'Arsenal Academy',
    country: 'United States',
    rating: 2180,
    matchesPlayed: 42,
    wins: 34,
    draws: 5,
    losses: 3,
    winRate: '81%',
    recentForm: ['W', 'W', 'W', 'D', 'W'],
    trophies: [
      'Gold - National Youth Cup 2025',
      'MVP - Spring Invitational 2026',
      'Golden Boot - Regional League 2025'
    ],
    history: [
      { id: 'm1', opp: 'Spartans United', score: '2 - 1', result: 'W', event: 'National Masters 2026', date: '2026-09-24' },
      { id: 'm2', opp: 'Red Dragons', score: '3 - 1', result: 'W', event: 'National Masters 2026', date: '2026-09-22' },
      { id: 'm3', opp: 'Blue Stars FC', score: '1 - 1', result: 'D', event: 'Spring Invitational', date: '2026-08-15' },
    ]
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        to="/tournaments"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Profile Card */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20">
            {player.name.charAt(0)}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-3xl font-black text-foreground">{player.name}</h1>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified Athlete
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {player.role} • {player.team} • {player.country}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <div className="text-xs text-muted-foreground">Recent Form:</div>
              <div className="flex items-center gap-1">
                {player.recentForm.map((res, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center ${
                      res === 'W'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : res === 'D'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 text-center min-w-[140px]">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Performance ELO</div>
            <div className="text-3xl font-black font-mono text-primary mt-1">{player.rating}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">Top 2% Globally</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Matches', val: player.matchesPlayed },
          { label: 'Victories', val: player.wins, color: 'text-emerald-400' },
          { label: 'Draws / Ties', val: player.draws },
          { label: 'Win Ratio', val: player.winRate, color: 'text-primary font-black' },
        ].map((stat, sIdx) => (
          <div key={sIdx} className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-4 text-center">
            <div className="text-xs text-muted-foreground font-semibold uppercase">{stat.label}</div>
            <div className={`text-2xl font-black font-mono mt-1 ${stat.color || 'text-foreground'}`}>
              {stat.val}
            </div>
          </div>
        ))}
      </div>

      {/* Recent History */}
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Recent Match History
        </h3>

        <div className="space-y-3">
          {player.history.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-foreground text-sm">vs {h.opp}</div>
                <div className="text-muted-foreground mt-0.5">{h.event} • {h.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-foreground text-sm">{h.score}</span>
                <span className={`px-2.5 py-0.5 rounded-md font-black text-xs ${
                  h.result === 'W' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {h.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
