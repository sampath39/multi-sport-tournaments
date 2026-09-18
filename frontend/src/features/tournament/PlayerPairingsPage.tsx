import { useState, useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Search, Calendar, Users, MapPin, Activity,
  Clock, Award, Shield, CheckCircle2, ChevronRight,
  Share2, Radio, AlertCircle, ArrowLeft, RefreshCw, QrCode, Lock
} from 'lucide-react'
import { tournamentsApi } from '@/lib/api'
import { getSportBadgeColor, getStatusColor, formatDate } from '@/lib/utils'
import { getSportConfig } from '@/lib/sportConfig'
import { Sport3DBadge, Sport3DObject } from '@/components/sports/Sport3DCard'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import { ShareTournamentModal } from '@/components/tournament/ShareTournamentModal'
import toast from 'react-hot-toast'

export function PlayerPairingsPage() {
  const { id } = useParams<{ id: string }>()
  const [searchPlayer, setSearchPlayer] = useState('')
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [activeView, setActiveView] = useState<'pairings' | 'standings' | 'bracket'>('pairings')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Fetch Tournament Details
  const { data: tournament, isLoading: tournamentLoading, refetch: refetchTournament } = useQuery({
    queryKey: ['player-hub-tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
    refetchInterval: 10000,
  })

  // Fetch Matches / Pairings
  const { data: matches = [], isLoading: matchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['player-hub-matches', id],
    queryFn: () => tournamentsApi.getMatches(id!),
    enabled: !!id,
    refetchInterval: 5000,
  })

  // Fetch Standings
  const { data: standings = [], isLoading: standingsLoading } = useQuery({
    queryKey: ['player-hub-standings', id],
    queryFn: () => tournamentsApi.getStandings(id!),
    enabled: !!id,
  })

  const sportCode = tournament?.sportCode || tournament?.sport?.code || 'CHESS'
  const sportCfg = getSportConfig(sportCode)

  // Group matches by round
  const roundsMap = useMemo(() => {
    return matches.reduce((acc: Record<number, any[]>, m: any) => {
      const r = m.roundNumber || 1
      if (!acc[r]) acc[r] = []
      acc[r].push(m)
      return acc
    }, {})
  }, [matches])

  const roundNumbers = useMemo(() => {
    return Object.keys(roundsMap).map(Number).sort((a, b) => a - b)
  }, [roundsMap])

  const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 1

  // Set default selected round to the latest round available
  useEffect(() => {
    if (roundNumbers.length > 0 && !roundNumbers.includes(selectedRound)) {
      setSelectedRound(maxRound)
    }
  }, [roundNumbers, maxRound])

  // Current Round Matches
  const currentRoundMatches = roundsMap[selectedRound] || []

  // Check 24-Hour Post-Tournament Expiration Logic
  const expirationState = useMemo(() => {
    if (!tournament) return { isExpired: false, hoursLeft: 24 }

    // If tournament is not completed, it's always active
    if (tournament.status !== 'COMPLETED') {
      return { isExpired: false, hoursLeft: 24, status: tournament.status }
    }

    // If completed, calculate 24h grace period from updatedAt / endDate
    const completedTimestamp = tournament.updatedAt ? new Date(tournament.updatedAt).getTime() : new Date(tournament.endDate || Date.now()).getTime()
    const now = Date.now()
    const diffHours = (now - completedTimestamp) / (1000 * 60 * 60)

    if (diffHours > 24) {
      return { isExpired: true, hoursLeft: 0, status: 'ARCHIVED' }
    }

    const hoursLeft = Math.max(0, Math.round(24 - diffHours))
    return { isExpired: false, hoursLeft, status: 'COMPLETED_GRACE_PERIOD' }
  }, [tournament])

  // Filter player match if searching
  const searchedMatch = useMemo(() => {
    if (!searchPlayer.trim() || matches.length === 0) return null
    const query = searchPlayer.trim().toLowerCase()

    // Find the latest match for this player
    return matches.find((m: any) => {
      const t1 = (m.participantA?.displayName || m.participantA?.name || m.player1Name || '').toLowerCase()
      const t2 = (m.participantB?.displayName || m.participantB?.name || m.player2Name || '').toLowerCase()
      return t1.includes(query) || t2.includes(query)
    })
  }, [searchPlayer, matches])

  // If link expired beyond 24h grace period after tournament ends
  if (expirationState.isExpired) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <SportLiveBackground sportCode={sportCode} intensity="subtle" />
        <div className="relative z-10 max-w-md w-full backdrop-blur-2xl bg-slate-900/80 border border-white/15 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Tournament Archive Closed</h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            The public player pairing link for <strong>{tournament?.name || 'this tournament'}</strong> was active for the entire tournament and the 24-hour post-event grace period.
          </p>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-400">
            Official results are archived in the organization registry. Contact the tournament organizer if you need official score reports.
          </div>
          <Link
            to="/tournaments"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Trophy className="w-4 h-4" />
            <span>Browse Active Tournaments</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen py-6 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-500 selection:text-white bg-slate-950">
      {/* Live Stadium Wallpaper & Ambient Glow */}
      <SportLiveBackground sportCode={sportCode} intensity="medium" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="backdrop-blur-2xl bg-slate-900/80 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Accent Rim */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background: `linear-gradient(90deg, ${sportCfg.theme.primaryHex}, #818cf8, #ffffff00)`,
            }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Sport3DBadge sportCode={sportCode} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-xs">
                    {sportCfg.icon} {sportCfg.name}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(tournament?.status || 'LIVE')}`}>
                    {tournament?.status?.replace('_', ' ') || 'LIVE'}
                  </span>
                  {expirationState.hoursLeft < 24 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Clock className="w-3 h-3" />
                      Link closes in {expirationState.hoursLeft}h
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {tournament?.name || 'Championship Tournament'}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                  {tournament?.tier || 'CLUB'} Tier · {tournament?.formatCode || 'SWISS'} Engine · {tournament?.venueName || sportCfg.courtTerminologyPlural}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => {
                  refetchMatches()
                  refetchTournament()
                  toast.success('Scores and pairings refreshed!')
                }}
                className="p-2.5 rounded-2xl bg-slate-950/80 border border-white/15 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-sm"
                title="Refresh Live Fixtures"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all border border-indigo-400/30 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Link</span>
              </button>
            </div>
          </div>

          {/* Quick Player Match Finder Search */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              🔍 Find Your Board / Court & Opponent
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Type your name or team name (e.g. ${sportCfg.competitorNamePlaceholder})...`}
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 shadow-inner font-medium"
              />
              {searchPlayer && (
                <button
                  onClick={() => setSearchPlayer('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Highlighted Match Box if Player is Found */}
        {searchedMatch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-violet-950/90 border-2 border-indigo-500 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-500 text-white shadow-md">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                <span>YOUR MATCH SCHEDULED (Round {searchedMatch.roundNumber || selectedRound})</span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {searchedMatch.courtName || `${sportCfg.courtTerminology} ${searchedMatch.boardNumber || 1}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-4 py-2">
              <div className="sm:col-span-5 p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {searchedMatch.sideA || sportCfg.sideAName}
                </span>
                <span className="font-black text-lg text-white">
                  {searchedMatch.participantA?.displayName || searchedMatch.participantA?.name || 'Competitor A'}
                </span>
                <div className="text-2xl font-mono font-black text-indigo-400 mt-1">
                  {searchedMatch.participantA?.score ?? searchedMatch.scoreA ?? '-'}
                </div>
              </div>

              <div className="sm:col-span-1 flex items-center justify-center font-black text-sm text-slate-400">
                VS
              </div>

              <div className="sm:col-span-5 p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-center sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {searchedMatch.sideB || sportCfg.sideBName}
                </span>
                <span className="font-black text-lg text-white">
                  {searchedMatch.participantB?.displayName || searchedMatch.participantB?.name || 'Competitor B'}
                </span>
                <div className="text-2xl font-mono font-black text-white mt-1">
                  {searchedMatch.participantB?.score ?? searchedMatch.scoreB ?? '-'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Venue: {tournament?.venueName || 'Main Arena'} • {searchedMatch.courtName || `${sportCfg.courtTerminology} ${searchedMatch.boardNumber || 1}`}</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${getStatusColor(searchedMatch.status)}`}>
                {searchedMatch.status || 'SCHEDULED'}
              </span>
            </div>
          </motion.div>
        )}

        {/* View Switcher: Pairings | Standings | Bracket */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-white/15 p-1.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveView('pairings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeView === 'pairings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Pairings & Fixtures ({matches.length})
            </button>
            <button
              onClick={() => setActiveView('standings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeView === 'standings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Leaderboard / Standings ({standings.length})
            </button>
          </div>

          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 pr-2 font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>

        {/* VIEW 1: PAIRINGS & FIXTURES */}
        {activeView === 'pairings' && (
          <div className="space-y-5">
            {/* Round Selector Tabs */}
            {roundNumbers.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0">
                  Select Round:
                </span>
                {roundNumbers.map((rNum) => {
                  const isSelected = selectedRound === rNum
                  const roundMatches = roundsMap[rNum] || []
                  const isRoundDone = roundMatches.every((m: any) => m.status === 'COMPLETED')

                  return (
                    <button
                      key={rNum}
                      onClick={() => setSelectedRound(rNum)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-[1.02]'
                          : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border-white/10'
                      }`}
                    >
                      <span>Round {rNum}</span>
                      {isRoundDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Match Cards for Selected Round */}
            {currentRoundMatches.length === 0 ? (
              <div className="backdrop-blur-xl bg-slate-900/60 border border-white/15 rounded-3xl p-10 text-center space-y-3 shadow-2xl">
                <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="font-bold text-base text-white">No Pairings Generated Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  The organizer is currently setting up the tournament participants and will generate Round 1 pairings shortly. Check back in a moment!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRoundMatches.map((m: any, idx: number) => {
                  const t1 = m.participantA?.displayName || m.participantA?.name || m.player1Name || 'Competitor A'
                  const t2 = m.participantB?.displayName || m.participantB?.name || m.player2Name || 'Competitor B'
                  const s1 = m.participantA?.score ?? m.scoreA ?? '-'
                  const s2 = m.participantB?.score ?? m.scoreB ?? '-'
                  const court = m.courtName || `${sportCfg.courtTerminology} ${m.boardNumber || idx + 1}`

                  return (
                    <motion.div
                      key={m.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="backdrop-blur-xl bg-slate-900/70 border border-white/15 hover:border-indigo-500/40 rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Top Match Bar */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="font-mono font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{court}</span>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(m.status)}`}>
                          {m.status?.replace('_', ' ') || 'SCHEDULED'}
                        </span>
                      </div>

                      {/* Competitor Matchup */}
                      <div className="space-y-3">
                        {/* Competitor A */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                              {m.sideA || sportCfg.sideAName}
                            </span>
                            <span className="font-bold text-sm text-white truncate">{t1}</span>
                          </div>
                          <span className="text-base font-mono font-black text-indigo-300 px-2">{s1}</span>
                        </div>

                        {/* Competitor B */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                              {m.sideB || sportCfg.sideBName}
                            </span>
                            <span className="font-bold text-sm text-white truncate">{t2}</span>
                          </div>
                          <span className="text-base font-mono font-black text-white px-2">{s2}</span>
                        </div>
                      </div>

                      {/* Winner highlight if completed */}
                      {m.winner && (
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-300" />
                          <span>Winner: {m.winner === 'DRAW' ? 'Match Drawn' : m.winner}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: STANDINGS TABLE */}
        {activeView === 'standings' && (
          <div className="backdrop-blur-2xl bg-slate-900/80 border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <h3 className="font-display font-black text-lg text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-300" />
              <span>Current Tournament Leaderboard</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Competitor</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s: any, idx: number) => (
                    <tr key={s.id || idx} className={idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}>
                      <td>
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                      </td>
                      <td className="font-bold text-white">
                        {s.participantName || s.displayName || s.name || `Player #${idx + 1}`}
                      </td>
                      <td>{s.played ?? s.gamesPlayed ?? 0}</td>
                      <td>{s.won ?? s.matchesWon ?? 0}</td>
                      <td>{s.drawn ?? s.matchesDrawn ?? 0}</td>
                      <td>{s.lost ?? s.matchesLost ?? 0}</td>
                      <td className="font-bold text-indigo-300 text-base">{s.points ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Share Tournament Modal */}
      <ShareTournamentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tournamentId={id!}
        tournamentName={tournament?.name || 'Tournament'}
        sportName={sportCfg.name}
        sportIcon={sportCfg.icon}
        roundNumber={selectedRound}
        totalRounds={tournament?.totalRounds || roundNumbers.length}
      />
    </div>
  )
}
