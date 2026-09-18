import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Search, Plus, Trophy, Calendar, Users, ChevronRight,
  Activity, Flame, Zap, Shield, Sparkles, Radio
} from 'lucide-react'
import { useState } from 'react'
import { tournamentsApi } from '@/lib/api'
import { formatDate, getSportBadgeColor, getStatusColor } from '@/lib/utils'
import { Sport3DObject } from '@/components/sports/Sport3DCard'

const STATUS_FILTERS = ['All', 'LIVE', 'REGISTRATION_OPEN', 'SCHEDULED', 'COMPLETED']
const SPORT_PILLS = [
  { label: 'All Sports', code: 'All', icon: '🌐' },
  { label: 'Chess', code: 'CHESS', icon: '♟️' },
  { label: 'Cricket', code: 'CRICKET', icon: '🏏' },
  { label: 'Football', code: 'FOOTBALL', icon: '⚽' },
  { label: 'Basketball', code: 'BASKETBALL', icon: '🏀' },
  { label: 'Badminton', code: 'BADMINTON', icon: '🏸' },
  { label: 'Table Tennis', code: 'TABLE_TENNIS', icon: '🏓' },
  { label: 'Volleyball', code: 'VOLLEYBALL', icon: '🏐' },
  { label: 'Carrom', code: 'CARROM', icon: '🎯' },
]

export function TournamentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sportFilter, setSportFilter] = useState('All')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', { search, statusFilter, sportFilter, page }],
    queryFn: () => tournamentsApi.list({
      search: search || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      sport: sportFilter !== 'All' ? sportFilter : undefined,
      page,
      size: 18,
    }),
  })

  const tournaments = data?.content || []
  const liveCount = tournaments.filter((t: any) => t.status === 'LIVE').length
  const regOpenCount = tournaments.filter((t: any) => t.status === 'REGISTRATION_OPEN').length

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-500 selection:text-white bg-slate-950">
      {/* ─── Ambient Glow Background ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute -top-40 left-1/4 w-[650px] h-[650px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-emerald-600/08 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* ─── Hero Header & Stats ──────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm backdrop-blur-md">
                <Trophy className="w-3.5 h-3.5" /> Multi-Sport Championship Directory
              </span>
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  {liveCount} Live Now
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              Official Tournaments
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Browse, enroll, and track live fixtures, standings, and automated pairing brackets across 8 official sports disciplines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/tournaments/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all border border-indigo-400/40"
            >
              <Plus className="w-4 h-4" /> Create Tournament
            </Link>
          </div>
        </div>

        {/* ─── Quick KPI Stat Badges ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{data?.totalElements || tournaments.length}</div>
              <div className="text-xs text-slate-400 font-semibold">Total Tournaments</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{regOpenCount}</div>
              <div className="text-xs text-slate-400 font-semibold">Open Registration</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{liveCount}</div>
              <div className="text-xs text-slate-400 font-semibold">Live in Progress</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">8 Disciplines</div>
              <div className="text-xs text-slate-400 font-semibold">Official Rules Engine</div>
            </div>
          </div>
        </div>

        {/* ─── Sport Category Pills Filter ──────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter by Sport Discipline</span>
            {sportFilter !== 'All' && (
              <button
                onClick={() => setSportFilter('All')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
              >
                Reset to All Sports
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SPORT_PILLS.map((pill) => {
              const isSelected = sportFilter === pill.code
              return (
                <button
                  key={pill.code}
                  onClick={() => setSportFilter(pill.code)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-600/30 scale-[1.02]'
                      : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border-white/10 backdrop-blur-md'
                  }`}
                >
                  <span className="text-base select-none">{pill.icon}</span>
                  <span>{pill.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Search & Status Controls ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 backdrop-blur-xl bg-slate-900/60 p-3 rounded-2xl border border-white/10 shadow-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tournament title, organizer, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
            >
              {STATUS_FILTERS.map(s => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s === 'All' ? 'All Statuses' : s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Tournament Grid ──────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="backdrop-blur-xl bg-slate-900/50 border border-white/10 rounded-3xl p-6 shadow-xl animate-pulse space-y-4">
                <div className="h-6 bg-white/10 rounded-lg w-1/2" />
                <div className="h-4 bg-white/10 rounded-lg w-3/4" />
                <div className="h-4 bg-white/10 rounded-lg w-1/3" />
              </div>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl text-center py-20 px-4 shadow-2xl max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Tournaments Found</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {sportFilter !== 'All' || statusFilter !== 'All' || search
                ? 'No tournaments match your filter criteria. Try adjusting your search or filters.'
                : 'Get started by creating your first official multi-sport tournament.'}
            </p>
            <Link
              to="/tournaments/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Create Tournament
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tournaments.map((t: any, i: number) => {
              const sCode = t.sportCode || t.sport?.code || 'CHESS'
              const sName = t.sportName || t.sport?.name || sCode

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link to={`/tournaments/${t.id}`}>
                    <div className="relative group backdrop-blur-xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between transform hover:-translate-y-1 overflow-hidden">
                      {/* Top Specular Rim */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div>
                        {/* Top Sport & Status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <Sport3DObject sportCode={sCode} size="md" />
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(t.status)}`}>
                            {t.status?.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${getSportBadgeColor(sCode)}`}>
                              {sName}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                              {t.tier || t.tournamentType || 'CLUB'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                            {t.name}
                          </h3>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {t.description || 'Championship event conducted with official matching rules, scoring protocols, and live standings.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{formatDate(t.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{t.currentParticipants || 0} enrolled</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
