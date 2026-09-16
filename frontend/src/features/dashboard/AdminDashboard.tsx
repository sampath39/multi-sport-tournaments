import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Trophy, Users, Calendar, Play, TrendingUp, Plus,
  Clock, CheckCircle, AlertCircle, Activity
} from 'lucide-react'
import { tournamentsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDate, getSportIcon, getStatusColor, cn } from '@/lib/utils'

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
    { label: 'Active Tournaments', value: liveTournaments.length, icon: Play, color: 'from-green-500 to-emerald-600', bg: 'bg-green-500/10' },
    { label: 'Upcoming', value: upcomingTournaments.length, icon: Calendar, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/10' },
    { label: 'Total Tournaments', value: tournamentData?.totalElements || 0, icon: Trophy, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10' },
    { label: 'Completed', value: tournaments.filter((t: any) => t.status === 'COMPLETED').length, icon: CheckCircle, color: 'from-gray-500 to-slate-600', bg: 'bg-gray-500/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.displayName || user?.fullName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your tournaments.</p>
        </div>
        <Link
          to="/tournaments/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm shadow-glow-sm hover:shadow-glow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          New Tournament
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card p-5 hover:border-white/20 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-display font-black">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
              <div className={`${stat.bg} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text`} style={{ color: 'transparent' }} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Tournaments */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <div className="live-dot">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </div>
              Live Tournaments
            </h2>
          </div>

          {liveTournaments.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No live tournaments right now</p>
              <Link to="/tournaments/create" className="text-violet-400 text-sm mt-2 inline-block hover:underline">
                Create one →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {liveTournaments.map((t: any) => (
                <Link key={t.id} to={`/tournaments/${t.id}`}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="glass-card p-4 flex items-center justify-between hover:border-green-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getSportIcon(t.sport?.code)}</div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.sport?.name} · {t.formatCode}</p>
                      </div>
                    </div>
                    <span className="badge-live">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}

          {/* Upcoming */}
          <div className="flex items-center justify-between mt-6 mb-4">
            <h2 className="font-display font-bold text-lg">Upcoming Tournaments</h2>
          </div>
          <div className="space-y-3">
            {upcomingTournaments.slice(0, 5).map((t: any) => (
              <Link key={t.id} to={`/tournaments/${t.id}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="glass-card p-4 flex items-center justify-between hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{getSportIcon(t.sport?.code)}</div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(t.startDate)} · {t.city || t.locationText}
                      </p>
                    </div>
                  </div>
                  <span className={cn('badge', 'inline-flex items-center px-2 py-0.5 rounded-full text-xs border', getStatusColor(t.status))}>
                    {t.status.replace('_', ' ')}
                  </span>
                </motion.div>
              </Link>
            ))}
            {upcomingTournaments.length === 0 && (
              <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                No upcoming tournaments
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-display font-bold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Create Tournament', href: '/tournaments/create', icon: Plus, color: 'from-violet-500 to-fuchsia-600' },
              { label: 'View All Tournaments', href: '/tournaments', icon: Trophy, color: 'from-blue-500 to-cyan-600' },
              { label: 'Manage Venues', href: '/venues', icon: Users, color: 'from-green-500 to-emerald-600' },
              { label: 'Analytics', href: '/analytics', icon: TrendingUp, color: 'from-orange-500 to-red-600' },
            ].map((action) => (
              <Link key={action.href} to={action.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="glass-card p-4 flex items-center gap-3 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Recent activity placeholder */}
          <h2 className="font-display font-bold text-lg mt-6 mb-4">Recent Activity</h2>
          <div className="glass-card p-4 space-y-3">
            {[
              { icon: '♟️', text: 'Round 3 generated', sub: 'Hyderabad Chess Open · 2m ago' },
              { icon: '🏏', text: 'Match result entered', sub: 'Corporate Cricket Cup · 15m ago' },
              { icon: '⚽', text: 'Registration opened', sub: 'Football Championship · 1h ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
