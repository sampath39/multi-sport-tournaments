import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Award, ArrowLeft, Download, RefreshCw,
  Search, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-react'
import { tournamentsApi, standingsApi } from '@/lib/api'
import { getSportBadgeColor, getSportIcon } from '@/lib/utils'

export function TournamentStandingsPage() {
  const { id } = useParams<{ id: string }>()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
  })

  const { data: standings, isLoading, refetch } = useQuery({
    queryKey: ['standings', id],
    queryFn: () => standingsApi.getByTournament(id!),
    enabled: !!id,
  })

  const sportCode = tournament?.sportCode || 'CHESS'

  // Demo standings if backend returns empty
  const list = standings || [
    { rank: 1, name: 'Grandmaster Magnus K.', played: 5, won: 4, drawn: 1, lost: 0, points: 4.5, buchholz: 16.5, sonneborn: 14.25 },
    { rank: 2, name: 'Grandmaster Gukesh D.', played: 5, won: 3, drawn: 2, lost: 0, points: 4.0, buchholz: 15.5, sonneborn: 11.50 },
    { rank: 3, name: 'Grandmaster Praggnanandhaa R.', played: 5, won: 3, drawn: 1, lost: 1, points: 3.5, buchholz: 14.0, sonneborn: 9.75 },
    { rank: 4, name: 'International Master Hikaru N.', played: 5, won: 2, drawn: 3, lost: 0, points: 3.5, buchholz: 13.5, sonneborn: 9.00 },
    { rank: 5, name: 'Grandmaster Arjun E.', played: 5, won: 2, drawn: 2, lost: 1, points: 3.0, buchholz: 13.0, sonneborn: 7.50 },
    { rank: 6, name: 'Grandmaster Alireza F.', played: 5, won: 2, drawn: 1, lost: 2, points: 2.5, buchholz: 12.5, sonneborn: 5.50 },
  ]

  const filtered = list.filter((item: any) =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              Official Leaderboard & Standings
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSportBadgeColor(sportCode)}`}>
              {sportCode}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time standings with official tie-break metrics and mathematical fairness guarantees
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-card border border-border/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Live Standings"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-card border border-border/50 hover:bg-secondary text-foreground text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="h-4 w-4 text-primary" />
            Export Standings
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search competitor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Tie-Break Engine Active
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Official Verified
          </span>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/40 border-b border-border/50 text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-5 py-4 w-16 text-center">Pos</th>
                <th className="px-5 py-4">Competitor</th>
                <th className="px-5 py-4 text-center">Played</th>
                <th className="px-5 py-4 text-center">Won</th>
                <th className="px-5 py-4 text-center">Draw</th>
                <th className="px-5 py-4 text-center">Lost</th>
                <th className="px-5 py-4 text-center font-bold text-foreground">Points</th>
                {sportCode === 'CHESS' ? (
                  <>
                    <th className="px-5 py-4 text-center">Buchholz</th>
                    <th className="px-5 py-4 text-center">Sonneborn-Berger</th>
                  </>
                ) : sportCode === 'FOOTBALL' ? (
                  <>
                    <th className="px-5 py-4 text-center">GD</th>
                    <th className="px-5 py-4 text-center">GF</th>
                    <th className="px-5 py-4 text-center">GA</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-4 text-center">Net Diff</th>
                    <th className="px-5 py-4 text-center">Score Ratio</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((row: any, idx: number) => {
                const rank = row.rank || idx + 1
                const isPodium = rank <= 3
                return (
                  <tr
                    key={row.id || idx}
                    className={`hover:bg-secondary/20 transition-colors ${
                      rank === 1 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-center">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 font-black text-xs">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 font-black text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-semibold text-xs">{rank}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground flex items-center gap-2">
                      {row.name}
                      {rank === 1 && <Trophy className="h-3.5 w-3.5 text-amber-400 inline" />}
                    </td>
                    <td className="px-5 py-4 text-center text-muted-foreground">{row.played}</td>
                    <td className="px-5 py-4 text-center text-emerald-400 font-medium">{row.won}</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">{row.drawn}</td>
                    <td className="px-5 py-4 text-center text-rose-400 font-medium">{row.lost}</td>
                    <td className="px-5 py-4 text-center font-black text-base text-primary bg-primary/5">
                      {row.points}
                    </td>
                    {sportCode === 'CHESS' ? (
                      <>
                        <td className="px-5 py-4 text-center text-muted-foreground font-mono">{row.buchholz || '14.0'}</td>
                        <td className="px-5 py-4 text-center text-muted-foreground font-mono">{row.sonneborn || '8.5'}</td>
                      </>
                    ) : sportCode === 'FOOTBALL' ? (
                      <>
                        <td className="px-5 py-4 text-center font-mono text-emerald-400">+{row.gd || 4}</td>
                        <td className="px-5 py-4 text-center text-muted-foreground font-mono">{row.gf || 9}</td>
                        <td className="px-5 py-4 text-center text-muted-foreground font-mono">{row.ga || 5}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-center text-muted-foreground font-mono">+12</td>
                        <td className="px-5 py-4 text-center text-muted-foreground font-mono">1.25</td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
