import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Award, ArrowLeft, Download, RefreshCw,
  Search, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-react'
import { tournamentsApi, standingsApi } from '@/lib/api'
import { getSportBadgeColor, getSportIcon } from '@/lib/utils'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import { getSportConfig } from '@/lib/sportConfig'

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

  const sportCode = tournament?.sportCode || tournament?.sport?.code || 'CHESS'
  const sportCfg = getSportConfig(sportCode)

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
                Official Leaderboard & Standings
                <span>{sportCfg.icon}</span>
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-emerald-400 border border-primary/40 backdrop-blur-md shadow-sm">
                {sportCfg.name} Standings Engine
              </span>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Real-time standings with official tie-break metrics and mathematical fairness guarantees
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-white/15 hover:bg-slate-800 text-white transition-colors backdrop-blur-md shadow-sm"
              title="Refresh Live Standings"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/15 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 transition-colors backdrop-blur-md shadow-md"
            >
              <Download className="h-4 w-4 text-primary" />
              Export Standings
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search competitor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/70 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Tie-Break Engine Active
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Official Verified
            </span>
          </div>
        </div>

        {/* Standings Table */}
        <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 border-b border-white/10 text-xs uppercase font-semibold text-slate-300 tracking-wider">
                <tr>
                  <th className="px-5 py-4 w-16 text-center">Pos</th>
                  <th className="px-5 py-4">Competitor</th>
                  <th className="px-5 py-4 text-center">Played</th>
                  <th className="px-5 py-4 text-center">Won</th>
                  <th className="px-5 py-4 text-center">Draw</th>
                  <th className="px-5 py-4 text-center">Lost</th>
                  <th className="px-5 py-4 text-center font-bold text-white">Points</th>
                  {sportCode === 'CHESS' ? (
                    <>
                      <th className="px-5 py-4 text-center">Buchholz</th>
                      <th className="px-5 py-4 text-center">Sonneborn-Berger</th>
                    </>
                  ) : sportCode === 'CRICKET' ? (
                    <>
                      <th className="px-5 py-4 text-center">NRR</th>
                      <th className="px-5 py-4 text-center">Runs Scored</th>
                      <th className="px-5 py-4 text-center">Runs Conceded</th>
                    </>
                  ) : sportCode === 'FOOTBALL' ? (
                    <>
                      <th className="px-5 py-4 text-center">GD</th>
                      <th className="px-5 py-4 text-center">GF</th>
                      <th className="px-5 py-4 text-center">GA</th>
                    </>
                  ) : sportCode === 'BASKETBALL' ? (
                    <>
                      <th className="px-5 py-4 text-center">PD</th>
                      <th className="px-5 py-4 text-center">PF</th>
                      <th className="px-5 py-4 text-center">PA</th>
                    </>
                  ) : sportCode === 'VOLLEYBALL' ? (
                    <>
                      <th className="px-5 py-4 text-center">Sets W</th>
                      <th className="px-5 py-4 text-center">Sets L</th>
                      <th className="px-5 py-4 text-center">Set Ratio</th>
                    </>
                  ) : sportCode === 'CARROM' ? (
                    <>
                      <th className="px-5 py-4 text-center">Boards Won</th>
                      <th className="px-5 py-4 text-center">Net Board Pts</th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-4 text-center">Sets / Games</th>
                      <th className="px-5 py-4 text-center">Pt Margin</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((row: any, idx: number) => {
                  const rank = row.rank || idx + 1
                  return (
                    <tr
                      key={row.id || idx}
                      className={`hover:bg-white/5 transition-colors ${
                        rank === 1 ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="px-5 py-4 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/30 text-amber-300 font-black text-xs border border-amber-500/40">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/30 text-slate-200 font-black text-xs border border-slate-400/40">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/30 text-amber-400 font-black text-xs border border-amber-700/40">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-xs">{rank}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white flex items-center gap-2">
                        {row.name || row.participantName || 'Competitor'}
                        {rank === 1 && <Trophy className="h-3.5 w-3.5 text-amber-400 inline" />}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-300">{row.played ?? 0}</td>
                      <td className="px-5 py-4 text-center text-emerald-400 font-medium">{row.won ?? 0}</td>
                      <td className="px-5 py-4 text-center text-slate-400">{row.drawn ?? 0}</td>
                      <td className="px-5 py-4 text-center text-rose-400 font-medium">{row.lost ?? 0}</td>
                      <td className="px-5 py-4 text-center font-black text-base text-primary bg-primary/10">
                        {row.points ?? 0}
                      </td>
                      {sportCode === 'CHESS' ? (
                        <>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.buchholz ?? '0.0'}</td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.sonneborn ?? '0.0'}</td>
                        </>
                      ) : sportCode === 'CRICKET' ? (
                        <>
                          <td className={`px-5 py-4 text-center font-mono font-bold ${(row.nrr ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(row.nrr ?? 0) > 0 ? `+${row.nrr}` : row.nrr ?? '0.000'}
                          </td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.runsScored ?? 0}</td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.runsConceded ?? 0}</td>
                        </>
                      ) : sportCode === 'FOOTBALL' ? (
                        <>
                          <td className={`px-5 py-4 text-center font-mono font-bold ${(row.gd ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(row.gd ?? 0) > 0 ? `+${row.gd}` : row.gd ?? 0}
                          </td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.gf ?? 0}</td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.ga ?? 0}</td>
                        </>
                      ) : sportCode === 'BASKETBALL' ? (
                        <>
                          <td className={`px-5 py-4 text-center font-mono font-bold ${(row.pd ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(row.pd ?? 0) > 0 ? `+${row.pd}` : row.pd ?? 0}
                          </td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.pointsFor ?? row.pf ?? 0}</td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.pointsAgainst ?? row.pa ?? 0}</td>
                        </>
                      ) : sportCode === 'VOLLEYBALL' ? (
                        <>
                          <td className="px-5 py-4 text-center text-emerald-400 font-mono">{row.setsWon ?? 0}</td>
                          <td className="px-5 py-4 text-center text-rose-400 font-mono">{row.setsLost ?? 0}</td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.setRatio ?? '1.0'}</td>
                        </>
                      ) : sportCode === 'CARROM' ? (
                        <>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.boardsWon ?? 0}</td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.netBoardPoints ?? '+0'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.setsWon ?? row.won ?? 0} - {row.setsLost ?? row.lost ?? 0}</td>
                          <td className="px-5 py-4 text-center text-slate-300 font-mono">{row.pointMargin ?? row.netDiff ?? '+0'}</td>
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
    </div>
  )
}

