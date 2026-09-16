import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, ArrowLeft, ZoomIn, ZoomOut, Maximize2,
  ChevronRight, Calendar, Activity, CheckCircle2
} from 'lucide-react'
import { tournamentsApi } from '@/lib/api'
import { getSportColor, getStatusColor } from '@/lib/utils'

export function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>()
  const [bracketView, setBracketView] = useState<'winners' | 'losers' | 'all'>('all')

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
  })

  // Sample structured bracket nodes
  const rounds = [
    {
      name: 'Quarter-Finals',
      matches: [
        { id: 'qf1', t1: 'Arsenal Academy', s1: 3, t2: 'Blue Stars FC', s2: 1, status: 'COMPLETED', winner: 'Arsenal Academy' },
        { id: 'qf2', t1: 'Red Dragons', s1: 2, t2: 'Thunderbolts', s2: 0, status: 'COMPLETED', winner: 'Red Dragons' },
        { id: 'qf3', t1: 'Phoenix Strikers', s1: 1, t2: 'Golden Hawks', s2: 2, status: 'COMPLETED', winner: 'Golden Hawks' },
        { id: 'qf4', t1: 'Spartans United', s1: 4, t2: 'Vanguard FC', s2: 2, status: 'COMPLETED', winner: 'Spartans United' },
      ]
    },
    {
      name: 'Semi-Finals',
      matches: [
        { id: 'sf1', t1: 'Arsenal Academy', s1: 2, t2: 'Red Dragons', s2: 1, status: 'COMPLETED', winner: 'Arsenal Academy' },
        { id: 'sf2', t1: 'Golden Hawks', s1: 0, t2: 'Spartans United', s2: 3, status: 'COMPLETED', winner: 'Spartans United' },
      ]
    },
    {
      name: 'Championship Final',
      matches: [
        { id: 'fn1', t1: 'Arsenal Academy', s1: 1, t2: 'Spartans United', s2: 2, status: 'LIVE', winner: null },
      ]
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to={`/tournaments/${id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournament
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Elimination Bracket & Playoff Tree
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Interactive View
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Seeded knockout tournament tree with real-time progression, live scores, and bye management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-card border border-border/50 hover:bg-secondary text-foreground text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-primary" />
            Print / Fullscreen
          </button>
        </div>
      </div>

      {/* Bracket Tree Container */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 overflow-x-auto shadow-2xl">
        <div className="flex items-center justify-between min-w-[850px] gap-8">
          {rounds.map((round, rIndex) => (
            <div key={round.name} className="flex-1 flex flex-col justify-around min-h-[500px]">
              <div className="text-center mb-6">
                <span className="px-3.5 py-1.5 rounded-xl bg-secondary/80 border border-border/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {round.name}
                </span>
              </div>

              <div className="space-y-8 flex flex-col justify-around flex-grow">
                {round.matches.map((m) => {
                  const isLive = m.status === 'LIVE'
                  return (
                    <div
                      key={m.id}
                      className={`relative rounded-2xl p-4 border transition-all duration-200 group backdrop-blur-md ${
                        isLive
                          ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                          : 'border-border/60 bg-secondary/30 hover:border-primary/50'
                      }`}
                    >
                      {isLive && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-black font-black text-[10px] tracking-wide flex items-center gap-1 animate-pulse">
                          <Activity className="h-3 w-3" /> LIVE NOW
                        </span>
                      )}

                      <div className="space-y-2">
                        {/* Team 1 */}
                        <div className={`flex items-center justify-between text-sm ${m.winner === m.t1 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                          <span className="truncate pr-2">{m.t1}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${m.winner === m.t1 ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>
                            {m.s1}
                          </span>
                        </div>

                        <div className="h-px bg-border/40" />

                        {/* Team 2 */}
                        <div className={`flex items-center justify-between text-sm ${m.winner === m.t2 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                          <span className="truncate pr-2">{m.t2}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${m.winner === m.t2 ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>
                            {m.s2}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/20 flex items-center justify-between">
                        <Link
                          to={`/matches/${m.id}`}
                          className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 font-semibold"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </Link>
                        {isLive && (
                          <Link
                            to={`/matches/${m.id}/score`}
                            className="text-[11px] text-emerald-400 font-bold hover:underline"
                          >
                            Score Live
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
