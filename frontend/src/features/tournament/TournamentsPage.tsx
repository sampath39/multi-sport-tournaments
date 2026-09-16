import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Filter, Plus, Trophy, Calendar, Users, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { tournamentsApi } from '@/lib/api'
import { formatDate, getSportBadgeColor, getStatusColor } from '@/lib/utils'
import { Sport3DBadge } from '@/components/sports/Sport3DCard'

const STATUS_FILTERS = ['All', 'LIVE', 'REGISTRATION_OPEN', 'SCHEDULED', 'COMPLETED']
const SPORT_FILTERS = ['All', 'Chess', 'Cricket', 'Football', 'Basketball', 'Badminton', 'Carrom', 'Volleyball', 'Table Tennis']

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
      sport: sportFilter !== 'All' ? sportFilter.toUpperCase().replace(' ', '_') : undefined,
      page,
      size: 12,
    }),
  })

  const tournaments = data?.content || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Official Tournaments</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data?.totalElements || 0} active tournament{(data?.totalElements || 0) !== 1 ? 's' : ''} listed
          </p>
        </div>
        <Link
          to="/tournaments/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary/95 transition-all w-fit"
        >
          <Plus className="w-4 h-4" /> Create Tournament
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tournament title or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-primary shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-primary shadow-sm"
        >
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-primary shadow-sm"
        >
          {SPORT_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sports' : s}</option>)}
        </select>
      </div>

      {/* Tournament Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl text-center py-20 px-4 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-primary flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Tournaments Found</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            There are no dummy tournaments. Click below to create your official tournament with 3D sports matching and live scoring!
          </p>
          <Link
            to="/tournaments/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Your First Tournament
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
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/tournaments/${t.id}`}>
                  <div className="bg-white border border-slate-200/80 hover:border-primary/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between group">
                    <div>
                      {/* Top Sport & Status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <Sport3DBadge sportCode={sCode} size="md" />
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(t.status)}`}>
                          {t.status?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${getSportBadgeColor(sCode)}`}>
                            {sName}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {t.tournamentType || 'CLUB'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                          {t.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {t.description || 'Championship tournament conducted with official matching rules and live scoring.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{formatDate(t.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{t.currentParticipants || 0} players</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
