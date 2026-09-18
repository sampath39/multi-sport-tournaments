import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, ArrowLeft, ZoomIn, ZoomOut, Maximize2,
  ChevronRight, Calendar, Activity, CheckCircle2
} from 'lucide-react'
import { tournamentsApi } from '@/lib/api'
import { getSportColor, getStatusColor } from '@/lib/utils'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import { getSportConfig } from '@/lib/sportConfig'

export function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>()
  const [bracketView, setBracketView] = useState<'winners' | 'losers' | 'all'>('all')

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
  })

  const sportCode = tournament?.sportCode || tournament?.sport?.code || 'CHESS'
  const sportCfg = getSportConfig(sportCode)

  const { data: bracketData } = useQuery({
    queryKey: ['tournament-bracket', id],
    queryFn: () => tournamentsApi.getBracket(id!),
    enabled: !!id,
  })

  const { data: matches = [] } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: () => tournamentsApi.getMatches(id!),
    enabled: !!id,
  })

  // Group real matches into round columns
  const rounds = useMemo(() => {
    if (bracketData?.rounds && bracketData.rounds.length > 0) {
      return bracketData.rounds.map((r: any) => ({
        name: r.roundName || `Round ${r.roundNumber}`,
        matches: (r.matches || []).map((m: any) => ({
          id: m.id,
          t1: m.participantA?.displayName || m.participantA?.name || 'TBD',
          s1: m.participantA?.score ?? 0,
          t2: m.participantB?.displayName || m.participantB?.name || 'TBD',
          s2: m.participantB?.score ?? 0,
          status: m.status,
          winner: m.winner,
        }))
      }))
    }

    if (matches.length > 0) {
      const byRound: Record<number, any[]> = {}
      for (const m of matches) {
        const r = m.roundNumber || 1
        if (!byRound[r]) byRound[r] = []
        byRound[r].push(m)
      }
      const rNums = Object.keys(byRound).map(Number).sort((a, b) => a - b)
      const maxR = rNums.length > 0 ? Math.max(...rNums) : 1
      return rNums.map(r => {
        const name = r === maxR ? 'Championship Final' : r === maxR - 1 ? 'Semi-Finals' : r === maxR - 2 ? 'Quarter-Finals' : `Round ${r}`
        return {
          name,
          matches: byRound[r].map((m: any) => ({
            id: m.id,
            t1: m.participantA?.displayName || m.participantA?.name || 'TBD',
            s1: m.participantA?.score ?? 0,
            t2: m.participantB?.displayName || m.participantB?.name || 'TBD',
            s2: m.participantB?.score ?? 0,
            status: m.status,
            winner: m.winner,
          }))
        }
      })
    }

    return []
  }, [bracketData, matches])

  return (
    <div className="relative min-h-screen py-8 px-4 text-slate-100 selection:bg-primary selection:text-white">
      {/* 4K Realistic Live Sport Wallpaper & Arena Glow */}
      <SportLiveBackground sportCode={sportCode} intensity="medium" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              to={`/tournaments/${id}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white mb-3 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/15 backdrop-blur-md transition-all shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Tournament
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2 drop-shadow-md">
                Elimination Bracket & Playoff Tree
                <span>{sportCfg.icon}</span>
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-emerald-400 border border-primary/40 backdrop-blur-md shadow-sm">
                {sportCfg.name} Knockout Engine
              </span>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Seeded knockout tournament tree with real-time progression, live scores, and bye management
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/15 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 transition-colors backdrop-blur-md shadow-md"
            >
              <Maximize2 className="h-4 w-4 text-primary" />
              Print / Fullscreen
            </button>
          </div>
        </div>

        {/* Bracket Tree Container */}
        <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 sm:p-8 overflow-x-auto shadow-2xl">
          <div className="flex items-center justify-between min-w-[850px] gap-8">
            {rounds.map((round: any, rIndex: number) => (
              <div key={round.name || rIndex} className="flex-1 flex flex-col justify-around min-h-[500px]">
                <div className="text-center mb-6">
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/15 text-xs font-bold uppercase tracking-wider text-slate-300 shadow-md">
                    {round.name}
                  </span>
                </div>

                <div className="space-y-8 flex flex-col justify-around flex-grow">
                  {round.matches.map((m: any) => {
                    const isLive = m.status === 'LIVE'
                    return (
                      <div
                        key={m.id}
                        className={`relative rounded-2xl p-4 border transition-all duration-200 group backdrop-blur-md shadow-lg ${
                          isLive
                            ? 'border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/40'
                            : 'border-white/15 bg-slate-950/60 hover:border-primary/50 hover:bg-slate-950/80'
                        }`}
                      >
                        {isLive && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-black font-black text-[10px] tracking-wide flex items-center gap-1 animate-pulse shadow-md">
                            <Activity className="h-3 w-3" /> LIVE NOW
                          </span>
                        )}

                        <div className="space-y-2">
                          {/* Team 1 */}
                          <div className={`flex items-center justify-between text-sm ${m.winner === m.t1 ? 'font-bold text-white' : 'text-slate-300'}`}>
                            <span className="truncate pr-2">{m.t1}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${m.winner === m.t1 ? 'bg-primary/30 text-emerald-400 border border-primary/40' : 'bg-slate-800 text-slate-400'}`}>
                              {m.s1}
                            </span>
                          </div>

                          <div className="h-px bg-white/10" />

                          {/* Team 2 */}
                          <div className={`flex items-center justify-between text-sm ${m.winner === m.t2 ? 'font-bold text-white' : 'text-slate-300'}`}>
                            <span className="truncate pr-2">{m.t2}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${m.winner === m.t2 ? 'bg-primary/30 text-emerald-400 border border-primary/40' : 'bg-slate-800 text-slate-400'}`}>
                              {m.s2}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                          <Link
                            to={`/matches/${m.id}`}
                            className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
                          >
                            Details <ChevronRight className="h-3 w-3" />
                          </Link>
                          <Link
                            to={`/matches/${m.id}/score`}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors shadow-sm ${
                              m.status === 'COMPLETED'
                                ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10'
                                : 'text-white hover:bg-primary/90 bg-primary shadow-md'
                            }`}
                          >
                            {m.status === 'COMPLETED' ? 'Edit Score' : 'Score Match'}
                          </Link>
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
    </div>
  )
}

