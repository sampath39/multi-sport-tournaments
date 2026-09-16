import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Calendar, Users, Shield, MapPin, Tv, Play,
  ChevronRight, CheckCircle2, Clock, Award, Activity,
  ArrowLeft, Sparkles, UserCheck, Plus, X, Loader2,
  AlertCircle, RefreshCw, Layers
} from 'lucide-react'
import { tournamentsApi, matchesApi } from '@/lib/api'
import { getSportBadgeColor, getStatusColor, formatDate } from '@/lib/utils'
import { Sport3DBadge } from '@/components/sports/Sport3DCard'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'participants' | 'standings' | 'bracket'>('overview')
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [playerRating, setPlayerRating] = useState('')
  const [playerSeed, setPlayerSeed] = useState('')

  // Scoring Modal State
  const [scoringMatch, setScoringMatch] = useState<any | null>(null)
  const [scoreA, setScoreA] = useState<number | string>(1)
  const [scoreB, setScoreB] = useState<number | string>(0)
  const [matchWinner, setMatchWinner] = useState<'participantA' | 'participantB' | 'DRAW'>('participantA')

  // Fetch Tournament
  const {
    data: tournament,
    isLoading: tournamentLoading,
    isError: tournamentError
  } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
    retry: 1,
  })

  // Fetch Participants
  const {
    data: participants = [],
    refetch: refetchParticipants,
    isLoading: participantsLoading
  } = useQuery({
    queryKey: ['tournament-participants', id],
    queryFn: () => tournamentsApi.getParticipants(id!),
    enabled: !!id,
  })

  // Fetch Fixtures / Matches
  const {
    data: matches = [],
    refetch: refetchMatches,
    isLoading: matchesLoading
  } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: () => tournamentsApi.getMatches(id!),
    enabled: !!id,
  })

  // Fetch Standings / Leaderboard
  const {
    data: standings = [],
    refetch: refetchStandings,
    isLoading: standingsLoading
  } = useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => tournamentsApi.getStandings(id!),
    enabled: !!id,
  })

  // Mutation: Add Participant
  const addParticipantMutation = useMutation({
    mutationFn: (data: { name: string; rating?: number; seed?: number }) =>
      tournamentsApi.addParticipant(id!, data),
    onSuccess: (newP) => {
      toast.success(`Competitor "${newP.displayName || playerName}" registered successfully!`)
      setPlayerName('')
      setPlayerRating('')
      setPlayerSeed('')
      setShowAddParticipant(false)
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament-standings', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add participant')
    },
  })

  // Mutation: Generate Round Fixtures
  const generateFixturesMutation = useMutation({
    mutationFn: () => tournamentsApi.generateFixtures(id!),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Round fixtures generated successfully!')
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament-standings', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
      setActiveTab('matches')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate fixtures. Add at least 2 participants first.')
    },
  })

  // Mutation: Complete Match & Submit Score
  const completeMatchMutation = useMutation({
    mutationFn: (data: { matchId: string; scoreA: number; scoreB: number; winner: string }) =>
      matchesApi.complete(data.matchId, {
        scoreA: Number(data.scoreA),
        scoreB: Number(data.scoreB),
        winner: data.winner,
      }),
    onSuccess: () => {
      toast.success('Match score recorded & leaderboard updated!')
      setScoringMatch(null)
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament-standings', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit match score')
    },
  })

  const handleAddParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim()) {
      toast.error('Please enter a participant name')
      return
    }
    addParticipantMutation.mutate({
      name: playerName.trim(),
      rating: playerRating ? Number(playerRating) : undefined,
      seed: playerSeed ? Number(playerSeed) : undefined,
    })
  }

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoringMatch) return
    completeMatchMutation.mutate({
      matchId: scoringMatch.id,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      winner: matchWinner,
    })
  }

  if (tournamentLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-slate-500 text-sm font-medium">Loading tournament details...</p>
      </div>
    )
  }

  if (tournamentError || !tournament) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Tournament Not Found</h2>
        <p className="text-slate-500 mb-6 text-sm">
          This tournament does not exist or has been removed. You can create a new tournament or browse active events.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/tournaments"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            Browse Tournaments
          </Link>
          <Link
            to="/tournaments/create"
            className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 font-semibold text-sm shadow-md transition-colors"
          >
            Create Tournament
          </Link>
        </div>
      </div>
    )
  }

  const t = tournament
  const sportCode = t.sportCode || t.sport?.code || 'CHESS'
  const sportName = t.sportName || t.sport?.name || sportCode

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/tournaments')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tournaments
      </button>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/80 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 sm:gap-6">
            <Sport3DBadge sportCode={sportCode} size="lg" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getSportBadgeColor(sportCode)}`}>
                  {sportName}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}>
                  {t.status?.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {t.tournamentType || t.tier || 'CLUB'} TIER
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {t.formatCode?.replace(/_/g, ' ') || 'SWISS'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {t.name}
              </h1>

              <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{formatDate(t.startDate)} - {formatDate(t.endDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{participants.length} / {t.maxParticipants || 16} Competitors</span>
                </div>
                {t.venueName && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{t.venueName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setShowAddParticipant(true)
                setActiveTab('participants')
              }}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 shadow-md hover:bg-primary/95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Competitor
            </button>

            <button
              onClick={() => generateFixturesMutation.mutate()}
              disabled={generateFixturesMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {generateFixturesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Fixtures
            </button>

            <Link
              to={`/tv/${t.id}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Tv className="h-4 w-4 text-primary" />
              TV View
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 mb-8 text-sm font-semibold overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'participants', label: `Competitors (${participants.length})` },
          { key: 'matches', label: `Matches & Rounds (${matches.length})` },
          { key: 'standings', label: `Leaderboard (${standings.length})` },
          { key: 'bracket', label: 'Bracket & Tree' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">About Tournament</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t.description || 'Welcome to the official tournament championship. Complete pairings, live score updates, and automated tie-breaks are active throughout all rounds.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Official Regulations & Structure</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Competition Format</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{t.formatCode?.replace(/_/g, ' ') || 'Swiss Pairing'}</div>
                  <p className="text-xs text-slate-500 mt-1">Official round-by-round pairings with bye allocation.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Tie-Break Hierarchy</div>
                  <div className="text-base font-bold text-slate-900 mt-1">Buchholz & Direct Encounter</div>
                  <p className="text-xs text-slate-500 mt-1">Strict, transparent, automated calculations.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Tournament Quick Actions
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setShowAddParticipant(true)
                    setActiveTab('participants')
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span>1. Add Competitors / Players</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => generateFixturesMutation.mutate()}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span>2. Generate Round 1 Fixtures</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setActiveTab('standings')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span>3. View Live Leaderboard</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="space-y-6">
          {/* Header row with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registered Competitors</h3>
              <p className="text-xs text-slate-500">Official players participating in this championship</p>
            </div>
            <button
              onClick={() => setShowAddParticipant(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-primary/95 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Competitor
            </button>
          </div>

          {/* Quick Add Form / Modal */}
          {showAddParticipant && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-primary/30 rounded-2xl p-5 shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Add New Competitor
                </h4>
                <button
                  onClick={() => setShowAddParticipant(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddParticipantSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Magnus Carlsen or Arjun Erigaisi"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Rating (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2100"
                    value={playerRating}
                    onChange={(e) => setPlayerRating(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Seed #
                  </label>
                  <input
                    type="number"
                    placeholder={`e.g. ${participants.length + 1}`}
                    value={playerSeed}
                    onChange={(e) => setPlayerSeed(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white text-slate-900"
                  />
                </div>
                <div className="sm:col-span-4 flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipant(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addParticipantMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 shadow-sm flex items-center gap-1.5"
                  >
                    {addParticipantMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Register Player
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Participants List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            {participants.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base mb-1">No Competitors Registered Yet</h4>
                <p className="text-slate-500 text-xs mb-4">Add at least 2 players to generate round pairings.</p>
                <button
                  onClick={() => setShowAddParticipant(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm"
                >
                  + Add First Player
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {participants.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        #{p.seed || idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{p.displayName || p.name || 'Unnamed Player'}</div>
                        <div className="text-xs text-slate-400 font-medium">
                          Rating: <span className="text-slate-600 font-semibold">{p.rating || 'Unrated'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {p.status || 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matches & Rounds Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tournament Fixtures & Matches</h3>
              <p className="text-xs text-slate-500">Record scores and advance winners round-by-round</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetchMatches()}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Refresh fixtures"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => generateFixturesMutation.mutate()}
                disabled={generateFixturesMutation.isPending}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Round Fixtures
              </button>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl text-center py-16 px-4 shadow-sm">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base mb-1">No Fixtures Generated Yet</h4>
              <p className="text-slate-500 text-xs mb-4">
                {participants.length < 2
                  ? `You currently have ${participants.length} competitor registered. Add at least 2 competitors first.`
                  : `You have ${participants.length} competitors registered. Click below to generate official Round 1 pairings!`}
              </p>
              {participants.length < 2 ? (
                <button
                  onClick={() => {
                    setShowAddParticipant(true)
                    setActiveTab('participants')
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm"
                >
                  + Add Competitors
                </button>
              ) : (
                <button
                  onClick={() => generateFixturesMutation.mutate()}
                  disabled={generateFixturesMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm"
                >
                  Generate Round 1 Fixtures
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m: any) => {
                const p1Name = m.participantA?.displayName || m.player1Name || 'TBD'
                const p2Name = m.participantB?.displayName || m.player2Name || 'TBD'
                const s1 = m.participantA?.score ?? m.scoreA ?? 0
                const s2 = m.participantB?.score ?? m.scoreB ?? 0
                const isCompleted = m.status === 'COMPLETED'

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-primary/40 transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="font-bold text-primary">
                        Round {m.roundNumber || 1} • {m.courtName || 'Table 1'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(m.status)}`}>
                        {m.status || 'SCHEDULED'}
                      </span>
                    </div>

                    <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isCompleted && s1 > s2 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {p1Name}
                        </span>
                        <span className="font-mono font-bold text-sm bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-900">
                          {s1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isCompleted && s2 > s1 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {p2Name}
                        </span>
                        <span className="font-mono font-bold text-sm bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-900">
                          {s2}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to={`/matches/${m.id}`}
                        className="text-xs text-slate-500 hover:text-primary font-semibold flex items-center gap-1"
                      >
                        Match Center <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        onClick={() => {
                          setScoringMatch(m)
                          setScoreA(s1)
                          setScoreB(s2)
                          setMatchWinner('participantA')
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Activity className="h-3.5 w-3.5" />
                        {isCompleted ? 'Edit Score' : 'Submit Score'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Standings / Leaderboard Tab */}
      {activeTab === 'standings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tournament Leaderboard</h3>
              <p className="text-xs text-slate-500">Live rankings computed from official match results</p>
            </div>
            <button
              onClick={() => refetchStandings()}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            {standings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base mb-1">Leaderboard Not Initialized</h4>
                <p className="text-slate-500 text-xs mb-4">Add participants to generate the initial leaderboard.</p>
                <button
                  onClick={() => {
                    setShowAddParticipant(true)
                    setActiveTab('participants')
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm"
                >
                  + Add Competitor
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-center w-16">Rank</th>
                      <th className="px-5 py-3">Competitor</th>
                      <th className="px-5 py-3 text-center">Played</th>
                      <th className="px-5 py-3 text-center">Won</th>
                      <th className="px-5 py-3 text-center">Drawn</th>
                      <th className="px-5 py-3 text-center">Lost</th>
                      <th className="px-5 py-3 text-center font-black text-primary">Points</th>
                      <th className="px-5 py-3 text-center">Buchholz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {standings.map((row: any, idx: number) => {
                      const rank = row.rank || idx + 1
                      return (
                        <tr key={row.participantId || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                rank === 1
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                                  : rank === 2
                                  ? 'bg-slate-200 text-slate-800'
                                  : rank === 3
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {rank}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{row.participantName}</div>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-600">{row.played || 0}</td>
                          <td className="px-5 py-3.5 text-center text-emerald-600 font-semibold">{row.won || 0}</td>
                          <td className="px-5 py-3.5 text-center text-slate-500">{row.drawn || 0}</td>
                          <td className="px-5 py-3.5 text-center text-rose-500">{row.lost || 0}</td>
                          <td className="px-5 py-3.5 text-center font-black text-base text-primary">
                            {row.points !== undefined ? Number(row.points).toFixed(1) : '0.0'}
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-500 font-mono text-xs">
                            {row.buchholz !== undefined ? Number(row.buchholz).toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bracket Tab */}
      {activeTab === 'bracket' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tournament Tree & Elimination Bracket</h3>
              <p className="text-xs text-slate-500">Visual progression from round 1 to championship finals</p>
            </div>
            <Link
              to={`/tournaments/${t.id}/bracket`}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              Full Screen Bracket
            </Link>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Generate fixtures to visualize the tournament tree.</p>
            </div>
          ) : (
            <div className="flex items-start gap-8 overflow-x-auto pb-4">
              <div className="space-y-4 min-w-[240px]">
                <div className="text-xs font-bold uppercase text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg text-center">
                  Round 1 Matches
                </div>
                {matches.slice(0, 4).map((m: any, idx: number) => (
                  <div key={m.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>{m.participantA?.displayName || m.player1Name || 'Player 1'}</span>
                      <span className="font-mono">{m.participantA?.score ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>{m.participantB?.displayName || m.player2Name || 'Player 2'}</span>
                      <span className="font-mono">{m.participantB?.score ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score Match Modal */}
      <AnimatePresence>
        {scoringMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Scoreboard: Round {scoringMatch.roundNumber || 1}
                </h3>
                <button
                  onClick={() => setScoringMatch(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleScoreSubmit} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  {/* Player A */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 truncate max-w-[200px]">
                      {scoringMatch.participantA?.displayName || scoringMatch.player1Name || 'Player 1'}
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      className="w-20 px-3 py-1.5 text-center font-mono font-bold text-base rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  {/* Player B */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 truncate max-w-[200px]">
                      {scoringMatch.participantB?.displayName || scoringMatch.player2Name || 'Player 2'}
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      className="w-20 px-3 py-1.5 text-center font-mono font-bold text-base rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Select Winner
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMatchWinner('participantA')
                        setScoreA(1)
                        setScoreB(0)
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all truncate ${
                        matchWinner === 'participantA'
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {scoringMatch.participantA?.displayName?.split(' ')[0] || 'Player 1'} Won
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMatchWinner('DRAW')
                        setScoreA(0.5)
                        setScoreB(0.5)
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        matchWinner === 'DRAW'
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Draw (½ - ½)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMatchWinner('participantB')
                        setScoreA(0)
                        setScoreB(1)
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all truncate ${
                        matchWinner === 'participantB'
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {scoringMatch.participantB?.displayName?.split(' ')[0] || 'Player 2'} Won
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setScoringMatch(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={completeMatchMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:bg-primary/95 flex items-center gap-1.5"
                  >
                    {completeMatchMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Save & Update Leaderboard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
