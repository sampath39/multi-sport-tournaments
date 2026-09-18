import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Trophy, Users, Calendar, Play, TrendingUp, Plus,
  Clock, CheckCircle, AlertCircle, Activity, Radio, ArrowRight,
  Shield, Flame, Sparkles
} from 'lucide-react'
import { tournamentsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDate, getSportIcon, getStatusColor, cn } from '@/lib/utils'
import { Sport3DObject } from '@/components/sports/Sport3DCard'

export function AdminDashboard() {
  const { user } = useAuthStore()

  const { data: tournamentData } = useQuery({
    queryKey: ['tournaments', 'dashboard'],
    queryFn: () => tournamentsApi.list({ page: 0, size: 20 }),
  })

  const tournaments = tournamentData?.content || []
  const liveTournaments = tournaments.filter((t: any) => t.status === 'LIVE')
  const upcomingTournaments = tournaments.filter((t: any) =>
    ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'SCHEDULED'].includes(t.status))

  const stats = [
    { label: 'Active Live Tournaments', value: liveTournaments.length, icon: Radio, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
    { label: 'Upcoming Fixtures', value: upcomingTournaments.length, icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/30' },
    { label: 'Total Tournaments', value: tournamentData?.totalElements || tournaments.length, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
    { label: 'Completed Championships', value: tournaments.filter((t: any) => t.status === 'COMPLETED').length, icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' },
  ]

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-500 selection:text-white bg-slate-950">
      {/* ─── Ambient Glow ───────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-emerald-600/08 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Organizer Command Center
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-white">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{user?.displayName || user?.fullName || 'Organizer'}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Monitor real-time matches, scheduled events, and regulatory engines.</p>
          </div>
          <Link
            to="/tournaments/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>New Tournament</span>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all shadow-xl group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-display font-black text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">{stat.label}</p>
                </div>
                <div className={`${stat.bg} p-2.5 rounded-xl border flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Tournaments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <div className="live-dot">
                    <span className="live-dot-inner" />
                  </div>
                  <span>Live Tournaments in Progress</span>
                </h2>
                <span className="text-xs font-bold text-slate-400">{liveTournaments.length} Active</span>
              </div>

              {liveTournaments.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-white/5">
                  <Activity className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No live tournaments right now</p>
                  <Link to="/tournaments/create" className="text-indigo-400 text-xs font-bold mt-2 inline-flex items-center gap-1 hover:underline">
                    <span>Create and launch one</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveTournaments.map((t: any) => (
                    <Link key={t.id} to={`/tournaments/${t.id}`}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-md"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="text-2xl">{getSportIcon(t.sport?.code || t.sportCode)}</div>
                          <div>
                            <p className="font-bold text-sm text-white">{t.name}</p>
                            <p className="text-xs text-slate-400">{t.sport?.name || t.sportCode} · {t.formatCode || t.competitionType}</p>
                          </div>
                        </div>
                        <span className="badge-live">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          LIVE
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Tournaments */}
            <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <span>Upcoming & Scheduled Tournaments</span>
                </h2>
                <Link to="/tournaments" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
                  View All →
                </Link>
              </div>

              {upcomingTournaments.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-white/5">
                  <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No upcoming tournaments scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTournaments.slice(0, 5).map((t: any) => (
                    <Link key={t.id} to={`/tournaments/${t.id}`}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-indigo-500/40 transition-all flex items-center justify-between shadow-md"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="text-2xl">{getSportIcon(t.sport?.code || t.sportCode)}</div>
                          <div>
                            <p className="font-bold text-sm text-white">{t.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              <span>{formatDate(t.startDate)}</span>
                              <span>•</span>
                              <span>{t.tier || 'CLUB'}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(t.status)}`}>
                          {t.status?.replace('_', ' ')}
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts & Sports Overview */}
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-2.5">
                <Link
                  to="/tournaments/create"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 hover:bg-slate-950 hover:border-indigo-500/40 transition-all text-xs font-bold text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Create New Tournament</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </Link>
                <Link
                  to="/venues"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 hover:bg-slate-950 hover:border-indigo-500/40 transition-all text-xs font-bold text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-indigo-400" />
                    <span>Manage Venues & Courts</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 hover:bg-slate-950 hover:border-indigo-500/40 transition-all text-xs font-bold text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>View Analytics & Metrics</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
