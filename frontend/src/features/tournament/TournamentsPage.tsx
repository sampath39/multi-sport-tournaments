import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Filter, Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { tournamentsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDate, getSportIcon, getStatusColor, getFormatLabel, cn } from '@/lib/utils'

const STATUS_FILTERS = ['All', 'LIVE', 'REGISTRATION_OPEN', 'SCHEDULED', 'COMPLETED']
const SPORT_FILTERS = ['All', 'Chess', 'Cricket', 'Football', 'Basketball', 'Badminton', 'Carrom', 'Volleyball', 'Table Tennis']

export function TournamentsPage() {
  const { isAdmin } = useAuthStore()
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground mt-1">
            {data?.totalElements || 0} tournament{(data?.totalElements || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin() && (
          <Link
            to="/tournaments/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm shadow-glow-sm hover:shadow-glow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Create Tournament
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-card border border-border text-sm outline-none focus:border-violet-500"
        >
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-card border border-border text-sm outline-none focus:border-violet-500"
        >
          {SPORT_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sports' : s}</option>)}
        </select>
      </div>

      {/* Tournament Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
              <div className="h-3 bg-white/5 rounded mb-2 w-1/2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-24">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">No tournaments found</h2>
          <p className="text-muted-foreground mb-6">Try adjusting your filters or create the first tournament.</p>
          {isAdmin() && (
            <Link to="/tournaments/create" className="px-6 py-3 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
              Create Tournament
            </Link>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {tournaments.map((t: any, i: number) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/tournaments/${t.id}`}>
                <div className="glass-card p-5 hover:border-white/20 hover:shadow-card-hover transition-all cursor-pointer h-full group">
                  {/* Sport icon + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl group-hover:scale-110 transition-transform">
                      {getSportIcon(t.sport?.code)}
                    </div>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium', getStatusColor(t.status))}>
                      {t.status === 'LIVE' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-1" />}
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-display font-bold text-base mb-1 line-clamp-2 group-hover:text-violet-300 transition-colors">
                    {t.name}
                  </h3>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">{t.sport?.name}</span>
                    <span>·</span>
                    <span>{getFormatLabel(t.formatCode)}</span>
                    {t.startDate && <><span>·</span><span>{formatDate(t.startDate)}</span></>}
                  </div>

                  {t.locationText || t.city ? (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      📍 {t.city || t.locationText}
                    </p>
                  ) : null}

                  {/* Participants */}
                  {t.participantCount != null && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t.participantCount} participants</span>
                      {t.totalRounds && <span className="text-muted-foreground">{t.totalRounds} rounds</span>}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 rounded-lg glass text-sm disabled:opacity-40 hover:bg-white/10 transition-colors">
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {data.totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1}
            className="px-4 py-2 rounded-lg glass text-sm disabled:opacity-40 hover:bg-white/10 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
