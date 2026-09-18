import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Calendar, Users, Shield, MapPin, Tv, Play,
  ChevronRight, CheckCircle2, Clock, Award, Activity,
  ArrowLeft, Sparkles, UserCheck, Plus, X, Loader2,
  AlertCircle, RefreshCw, Layers, BookOpen, Crown,
  UserPlus, ChevronDown, Trash2, Shirt, Flame, Share2, QrCode
} from 'lucide-react'
import { tournamentsApi, matchesApi } from '@/lib/api'
import { getSportBadgeColor, getStatusColor, formatDate, getFormatLabel } from '@/lib/utils'
import { getSportConfig } from '@/lib/sportConfig'
import { Sport3DBadge, Sport3DObject } from '@/components/sports/Sport3DCard'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import { ShareTournamentModal } from '@/components/tournament/ShareTournamentModal'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'participants' | 'standings' | 'bracket' | 'rules'>('overview')
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [captainName, setCaptainName] = useState('')
  const [playerRating, setPlayerRating] = useState('')
  const [playerSeed, setPlayerSeed] = useState('')

  // Team Squad Roster Management State
  const [addingSquadForTeamId, setAddingSquadForTeamId] = useState<string | null>(null)
  const [squadPlayerName, setSquadPlayerName] = useState('')
  const [squadPlayerRole, setSquadPlayerRole] = useState('')
  const [squadPlayerJersey, setSquadPlayerJersey] = useState('')
  const [squadPlayerIsCaptain, setSquadPlayerIsCaptain] = useState(false)
  const [expandedSquadTeams, setExpandedSquadTeams] = useState<Record<string, boolean>>({})

  // Scoring Modal State
  const [scoringMatch, setScoringMatch] = useState<any | null>(null)
  const [scoreA, setScoreA] = useState<number | string>(1)
  const [scoreB, setScoreB] = useState<number | string>(0)
  const [matchWinner, setMatchWinner] = useState<'participantA' | 'participantB' | 'DRAW'>('participantA')
  const [knockoutDrawAction, setKnockoutDrawAction] = useState<'ADVANCE' | 'REPLAY'>('ADVANCE')
  const [advancingParticipant, setAdvancingParticipant] = useState<'participantA' | 'participantB'>('participantA')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

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

  // Sport Configuration Helper
  const sportCode = tournament?.sportCode || tournament?.sport?.code || 'CHESS'
  const sportCfg = getSportConfig(sportCode)
  const isKnockout = tournament?.formatCode === 'SINGLE_ELIMINATION' || tournament?.formatCode === 'KNOCKOUT' || tournament?.formatCode === 'DOUBLE_ELIMINATION'

  // Group matches by round for separate box presentation
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

  const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0
  const latestRoundMatches = maxRound > 0 ? (roundsMap[maxRound] || []) : []
  const hasPendingMatchesInLatestRound = latestRoundMatches.some((m: any) => m.status !== 'COMPLETED')
  const pendingCountInLatestRound = latestRoundMatches.filter((m: any) => m.status !== 'COMPLETED').length
  const nextRoundNumber = maxRound + 1

  const getRoundTheme = (r: number) => {
    const themes = [
      {
        borderTop: 'border-t-indigo-500',
        badgeBg: 'bg-indigo-600',
        badgeText: 'text-white',
        borderBox: 'border-white/10',
        accentBg: 'bg-slate-900/60',
        headerText: 'text-indigo-300',
        chipColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      },
      {
        borderTop: 'border-t-emerald-500',
        badgeBg: 'bg-emerald-600',
        badgeText: 'text-white',
        borderBox: 'border-white/10',
        accentBg: 'bg-slate-900/60',
        headerText: 'text-emerald-300',
        chipColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      },
      {
        borderTop: 'border-t-amber-500',
        badgeBg: 'bg-amber-600',
        badgeText: 'text-white',
        borderBox: 'border-white/10',
        accentBg: 'bg-slate-900/60',
        headerText: 'text-amber-300',
        chipColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      },
      {
        borderTop: 'border-t-purple-500',
        badgeBg: 'bg-purple-600',
        badgeText: 'text-white',
        borderBox: 'border-white/10',
        accentBg: 'bg-slate-900/60',
        headerText: 'text-purple-300',
        chipColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      },
      {
        borderTop: 'border-t-cyan-500',
        badgeBg: 'bg-cyan-600',
        badgeText: 'text-white',
        borderBox: 'border-white/10',
        accentBg: 'bg-slate-900/60',
        headerText: 'text-cyan-300',
        chipColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      },
      {
        borderTop: 'border-t-rose-500',
        badgeBg: 'bg-rose-600',
        badgeText: 'text-white',
        borderBox: 'border-white/10',
        accentBg: 'bg-slate-900/60',
        headerText: 'text-rose-300',
        chipColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      },
    ]
    return themes[(r - 1) % themes.length]
  }

  // Mutation: Add Participant
  const addParticipantMutation = useMutation({
    mutationFn: (data: { name: string; captainName?: string; rating?: number; seed?: number }) =>
      tournamentsApi.addParticipant(id!, data),
    onSuccess: (newP) => {
      toast.success(`${sportCfg.competitorTerm} "${newP.displayName || playerName}" registered successfully!`)
      setPlayerName('')
      setPlayerRating('')
      setPlayerSeed('')
      setShowAddParticipant(false)
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament-standings', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || `Failed to add ${sportCfg.competitorTerm.toLowerCase()}`)
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
      setIsShareModalOpen(true)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || `Failed to generate fixtures. Add at least 2 ${sportCfg.competitorsTerm.toLowerCase()} first.`)
    },
  })

  // Mutation: Complete Match & Submit Score
  const completeMatchMutation = useMutation({
    mutationFn: (data: { matchId: string; scoreA: number; scoreB: number; winner: string; status?: string }) =>
      matchesApi.complete(data.matchId, {
        scoreA: Number(data.scoreA),
        scoreB: Number(data.scoreB),
        winner: data.winner,
        status: data.status || 'COMPLETED',
      }),
    onSuccess: (res, vars) => {
      if (vars.status === 'SCHEDULED') {
        toast.success('Match reset for replay!')
      } else {
        toast.success('Match score recorded & tournament progression updated!')
      }
      setScoringMatch(null)
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament-standings', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament-bracket', id] })
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit match score')
    },
  })

  // Mutation: Add Squad Member (Player inside a Team)
  const addTeamMemberMutation = useMutation({
    mutationFn: (vars: { participantId: string; data: any }) =>
      tournamentsApi.addTeamMember(id!, vars.participantId, vars.data),
    onSuccess: () => {
      toast.success('Player registered into squad successfully!')
      setSquadPlayerName('')
      setSquadPlayerJersey('')
      setSquadPlayerIsCaptain(false)
      setAddingSquadForTeamId(null)
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add player to squad')
    }
  })

  // Mutation: Remove Squad Member
  const removeTeamMemberMutation = useMutation({
    mutationFn: (vars: { participantId: string; memberId: string }) =>
      tournamentsApi.removeTeamMember(id!, vars.participantId, vars.memberId),
    onSuccess: () => {
      toast.success('Player removed from squad')
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove player')
    }
  })

  const handleAddParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim()) {
      toast.error(`Please enter a ${sportCfg.competitorTerm.toLowerCase()} name`)
      return
    }
    addParticipantMutation.mutate({
      name: playerName.trim(),
      captainName: captainName.trim() || undefined,
      rating: playerRating ? Number(playerRating) : undefined,
      seed: playerSeed ? Number(playerSeed) : undefined,
    })
  }

  const handleAddSquadMemberSubmit = (participantId: string, e: React.FormEvent) => {
    e.preventDefault()
    if (!squadPlayerName.trim()) {
      toast.error('Please enter player name')
      return
    }
    addTeamMemberMutation.mutate({
      participantId,
      data: {
        name: squadPlayerName.trim(),
        role: squadPlayerRole.trim() || sportCfg.playerRoles[0]?.role || 'Player',
        jerseyNumber: squadPlayerJersey.trim() || undefined,
        isCaptain: squadPlayerIsCaptain,
      }
    })
  }

  const toggleExpandTeamSquad = (teamId: string) => {
    setExpandedSquadTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }))
  }

  const openScoringModal = (m: any) => {
    const p1 = m.participantA?.displayName || m.participantA?.name || m.player1Name || `${sportCfg.competitorTerm} 1`
    const p2 = m.participantB?.displayName || m.participantB?.name || m.player2Name || `${sportCfg.competitorTerm} 2`
    const s1 = m.participantA?.score ?? m.scoreA ?? sportCfg.defaultScoreA
    const s2 = m.participantB?.score ?? m.scoreB ?? sportCfg.defaultScoreB

    setScoringMatch(m)
    setScoreA(s1)
    setScoreB(s2)
    setKnockoutDrawAction('ADVANCE')

    if (m.winner === p1 || m.winner === 'participantA' || (s1 > s2 && (!m.winner || m.winner !== 'DRAW'))) {
      setMatchWinner('participantA')
      setAdvancingParticipant('participantA')
    } else if (m.winner === p2 || m.winner === 'participantB' || (s2 > s1 && (!m.winner || m.winner !== 'DRAW'))) {
      setMatchWinner('participantB')
      setAdvancingParticipant('participantB')
    } else if (m.winner === 'DRAW' || s1 === s2) {
      setMatchWinner('DRAW')
      setAdvancingParticipant('participantA')
    } else {
      setMatchWinner('participantA')
      setAdvancingParticipant('participantA')
    }
  }

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoringMatch) return

    const p1 = scoringMatch.participantA?.displayName || scoringMatch.participantA?.name || scoringMatch.player1Name || `${sportCfg.competitorTerm} 1`
    const p2 = scoringMatch.participantB?.displayName || scoringMatch.participantB?.name || scoringMatch.player2Name || `${sportCfg.competitorTerm} 2`

    if (matchWinner === 'DRAW' && isKnockout) {
      if (knockoutDrawAction === 'REPLAY') {
        completeMatchMutation.mutate({
          matchId: scoringMatch.id,
          scoreA: 0,
          scoreB: 0,
          winner: '',
          status: 'SCHEDULED',
        })
        return
      } else {
        const advancingWinnerName = advancingParticipant === 'participantB' ? p2 : p1
        completeMatchMutation.mutate({
          matchId: scoringMatch.id,
          scoreA: Number(scoreA),
          scoreB: Number(scoreB),
          winner: advancingWinnerName,
          status: 'COMPLETED',
        })
        return
      }
    }

    let decidedWinner = ''
    if (matchWinner === 'participantA') {
      decidedWinner = p1
    } else if (matchWinner === 'participantB') {
      decidedWinner = p2
    } else {
      decidedWinner = 'DRAW'
    }

    completeMatchMutation.mutate({
      matchId: scoringMatch.id,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      winner: decidedWinner,
      status: 'COMPLETED',
    })
  }

  if (tournamentLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-slate-500 text-sm font-medium">Loading {sportCfg.name} tournament details...</p>
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
  const sportName = t.sportName || t.sport?.name || sportCfg.name

  return (
    <div className="relative min-h-screen py-8 px-4 text-slate-100 selection:bg-primary selection:text-white">
      {/* 4K Realistic Live Sport Wallpaper & Arena Glow */}
      <SportLiveBackground sportCode={sportCode} intensity="medium" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/tournaments')}
          className="inline-flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white mb-6 px-4 py-2 rounded-xl bg-slate-900/70 hover:bg-slate-900/90 backdrop-blur-md border border-white/15 transition-all shadow-md"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Tournaments
        </button>

        {/* Hero Header with Dynamic Sport Theme */}
        <div
          className="relative rounded-3xl overflow-hidden p-6 sm:p-8 mb-8 shadow-2xl text-white border transition-all duration-300"
          style={{
            background: sportCfg.theme.bannerGradient,
            borderColor: sportCfg.theme.primaryHex + '55',
          }}
        >
          {/* Ambient Glow */}
          <div
            className="absolute -right-16 -top-16 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: sportCfg.theme.primaryHex }}
          />
          <div className="absolute right-8 -bottom-4 text-[130px] opacity-10 pointer-events-none select-none">
            {sportCfg.icon}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-6">
              <Sport3DObject sportCode={sportCode} size="lg" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/25 shadow-xs">
                    <span>{sportCfg.icon}</span>
                    {sportName} ({sportCfg.type})
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(t.status)}`}>
                    {t.status?.replace('_', ' ')}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90 border border-white/20">
                    {t.tournamentType || t.tier || 'CLUB'} TIER
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow-xs">
                    {getFormatLabel(t.formatCode)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                  {t.name}
                </h1>

                <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-white/80 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-white/90" />
                    <span>{formatDate(t.startDate)} - {formatDate(t.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-white/90" />
                    <span>{participants.length} / {t.maxParticipants || 16} {sportCfg.competitorsTerm}</span>
                  </div>
                  {t.venueName && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-white/90" />
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
                className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4 text-primary" />
                Register {sportCfg.competitorTerm}
              </button>

              <button
                onClick={() => generateFixturesMutation.mutate()}
                disabled={generateFixturesMutation.isPending || (matches.length > 0 && hasPendingMatchesInLatestRound)}
                title={hasPendingMatchesInLatestRound ? `Complete all Round ${maxRound} matches before generating Round ${nextRoundNumber}` : undefined}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${
                  matches.length > 0 && hasPendingMatchesInLatestRound
                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200 opacity-85 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white shadow-md'
                }`}
              >
                {generateFixturesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {matches.length === 0
                  ? 'Generate Round 1 Fixtures'
                  : hasPendingMatchesInLatestRound
                  ? `Round ${maxRound} Incomplete (${pendingCountInLatestRound} Pending)`
                  : `Generate Round ${nextRoundNumber} Fixtures`}
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur-md border border-indigo-400/40 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Share 1-click live round pairings link & QR code with players"
              >
                <Share2 className="h-4 w-4 text-amber-300" />
                <span>Share with Players</span>
              </button>

              <Link
                to={`/tv/${t.id}`}
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <Tv className="h-4 w-4" />
                TV View
              </Link>
            </div>
          </div>
        </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/80 backdrop-blur-xl border border-white/15 p-1.5 rounded-2xl gap-2 mb-8 text-sm font-semibold overflow-x-auto shadow-2xl">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'participants', label: `${sportCfg.competitorsTerm} (${participants.length})` },
          { key: 'matches', label: `Matches & Rounds (${matches.length})` },
          { key: 'standings', label: `Leaderboard (${standings.length})` },
          { key: 'bracket', label: 'Bracket & Tree' },
          { key: 'rules', label: `${sportCfg.name} Rules & Protocols` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 border border-white/25 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
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
            <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
              <h3 className="text-lg font-black text-white mb-2">About Tournament</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {t.description || `Official ${sportCfg.name} championship event. Official ${sportCfg.name} rules, automated scorekeeper validation, and tiebreak engines are active.`}
              </p>
            </div>

            <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
              <h3 className="text-lg font-black text-white mb-4">{sportCfg.name} Structure & Official Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Discipline & Category</div>
                  <div className="text-base font-bold text-white mt-1">{sportCfg.name} ({sportCfg.squadSizeDesc})</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Played on {sportCfg.courtTerminologyPlural} with official {sportCfg.name} scoring protocols.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tie-Break System</div>
                  <div className="text-base font-bold text-white mt-1">
                    {isKnockout ? 'Direct Winner Progression' : sportCfg.tiebreakDescription}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isKnockout ? `${sportCfg.tiebreakDescription} or Replay Match for drawn fixtures.` : 'Automated statistical standings ranking.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Tournament Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowAddParticipant(true)
                    setActiveTab('participants')
                  }}
                  className="w-full text-left px-4 py-3 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-white/10 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-between transition-all"
                >
                  <span>1. Register {sportCfg.competitorsTerm}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => generateFixturesMutation.mutate()}
                  disabled={generateFixturesMutation.isPending || (matches.length > 0 && hasPendingMatchesInLatestRound)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                    matches.length > 0 && hasPendingMatchesInLatestRound
                      ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                      : 'bg-slate-950/60 hover:bg-slate-950/90 border-white/10 text-slate-200 hover:text-white'
                  }`}
                >
                  <span>
                    {matches.length === 0
                      ? '2. Generate Round 1 Fixtures'
                      : hasPendingMatchesInLatestRound
                      ? `2. Complete Round ${maxRound} to unlock Round ${nextRoundNumber}`
                      : `2. Generate Round ${nextRoundNumber} Fixtures`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setActiveTab('standings')}
                  className="w-full text-left px-4 py-3 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-white/10 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-between transition-all"
                >
                  <span>3. View Official Standings</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl bg-slate-950/40 border border-white/20 p-6 rounded-3xl shadow-2xl text-white">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Registered {sportCfg.competitorsTerm} & Squads
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {sportCfg.isTeamSport
                  ? `Official teams registered for ${sportCfg.name}. Manage team squads and player rosters below (${sportCfg.squadSizeDesc}).`
                  : `Official individual players registered for this ${sportCfg.name} championship.`}
              </p>
            </div>
            <button
              onClick={() => setShowAddParticipant(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-primary/90 transition-all self-start sm:self-auto hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Register New {sportCfg.competitorTerm}
            </button>
          </div>

          {/* Quick Add Form / Modal */}
          {showAddParticipant && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-2xl bg-slate-900/95 border-2 border-primary/60 rounded-3xl p-6 sm:p-7 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Register New {sportCfg.competitorTerm} ({sportCfg.isTeamSport ? 'Team & Captain' : 'Individual Player'})
                </h4>
                <button
                  onClick={() => setShowAddParticipant(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddParticipantSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className={sportCfg.isTeamSport ? "sm:col-span-2" : "sm:col-span-2"}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {sportCfg.competitorTerm} Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={sportCfg.competitorNamePlaceholder}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 text-sm focus:outline-none focus:border-primary focus:bg-slate-900 text-white placeholder-slate-400 font-medium shadow-inner"
                  />
                </div>

                {sportCfg.isTeamSport && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Captain Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Team Captain"
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 text-sm focus:outline-none focus:border-primary focus:bg-slate-900 text-white placeholder-slate-400 font-medium shadow-inner"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {sportCfg.ratingLabel} (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder={sportCfg.ratingPlaceholder}
                    value={playerRating}
                    onChange={(e) => setPlayerRating(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 text-sm focus:outline-none focus:border-primary focus:bg-slate-900 text-white placeholder-slate-400 font-medium shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Seed #
                  </label>
                  <input
                    type="number"
                    placeholder={`e.g. ${participants.length + 1}`}
                    value={playerSeed}
                    onChange={(e) => setPlayerSeed(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 text-sm focus:outline-none focus:border-primary focus:bg-slate-900 text-white placeholder-slate-400 font-medium shadow-inner"
                  />
                </div>

                <div className="sm:col-span-4 flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipant(false)}
                    className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 text-xs font-semibold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addParticipantMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-md flex items-center gap-1.5"
                  >
                    {addParticipantMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Register {sportCfg.competitorTerm}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Participants & Squads List */}
          {participants.length === 0 ? (
            <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl text-center py-16 px-4 shadow-2xl text-white">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h4 className="font-black text-white text-lg mb-1">No {sportCfg.competitorsTerm} Registered Yet</h4>
              <p className="text-slate-300 text-xs mb-4">Add at least 2 {sportCfg.competitorsTerm.toLowerCase()} to generate round pairings.</p>
              <button
                onClick={() => setShowAddParticipant(true)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90"
              >
                + Register First {sportCfg.competitorTerm}
              </button>
            </div>
          ) : sportCfg.isTeamSport ? (
            /* TEAM SPORT: Expandable Team Cards with Player Squad Rosters */
            <div className="space-y-4">
              {participants.map((p: any, idx: number) => {
                const teamName = p.displayName || p.name || `Team #${idx + 1}`
                const squad = p.squadMembers || []
                const isExpanded = expandedSquadTeams[p.id] || addingSquadForTeamId === p.id
                const isAddingPlayer = addingSquadForTeamId === p.id
                const captain = p.captainName || squad.find((m: any) => m.isCaptain)?.name

                return (
                  <div
                    key={p.id || idx}
                    className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl hover:border-white/25 transition-all space-y-4 text-white"
                  >
                    {/* Team Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="w-9 h-9 rounded-2xl bg-primary/20 border border-primary/40 text-primary font-black text-sm flex items-center justify-center shadow-xs">
                          #{p.seed || idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="font-black text-white text-base sm:text-lg">{teamName}</h4>
                            {captain && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-2xs">
                                <Crown className="w-3 h-3 text-amber-400" />
                                Capt: {captain}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-950/60 text-slate-300 border border-white/10">
                              <Users className="w-3 h-3 text-slate-400" />
                              {squad.length} / {sportCfg.minSquad} Squad Members
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {sportCfg.ratingLabel}: <span className="text-slate-200 font-semibold">{p.rating || 'Unrated'}</span>
                            <span className="mx-2">•</span>
                            <span>Status: <span className="text-emerald-400 font-semibold">{p.status || 'Active'}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => {
                            if (isAddingPlayer) {
                              setAddingSquadForTeamId(null)
                            } else {
                              setAddingSquadForTeamId(p.id)
                              setSquadPlayerRole(sportCfg.playerRoles[0]?.role || 'Player')
                              setExpandedSquadTeams(prev => ({ ...prev, [p.id]: true }))
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {isAddingPlayer ? 'Cancel' : '+ Add Player to Squad'}
                        </button>
                        <button
                          onClick={() => toggleExpandTeamSquad(p.id)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                          title={isExpanded ? 'Collapse Squad Roster' : 'Expand Squad Roster'}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Form to Add Player into this Team's Squad */}
                    {isAddingPlayer && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onSubmit={(e) => handleAddSquadMemberSubmit(p.id, e)}
                        className="p-5 rounded-2xl bg-slate-950/80 border border-primary/40 space-y-3"
                      >
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-primary" />
                          Add Player to {teamName} Squad
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                              Player Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Player Full Name"
                              value={squadPlayerName}
                              onChange={(e) => setSquadPlayerName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-xs focus:outline-none focus:border-primary text-white font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                              Position / Role *
                            </label>
                            <select
                              value={squadPlayerRole}
                              onChange={(e) => setSquadPlayerRole(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-xs focus:outline-none focus:border-primary text-white font-medium"
                            >
                              {sportCfg.playerRoles.map((r, rIdx) => (
                                <option key={rIdx} value={r.role}>
                                  {r.role}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                              Jersey # (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 7"
                              value={squadPlayerJersey}
                              onChange={(e) => setSquadPlayerJersey(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-xs focus:outline-none focus:border-primary text-white font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={squadPlayerIsCaptain}
                              onChange={(e) => setSquadPlayerIsCaptain(e.target.checked)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary"
                            />
                            <span>Designate as Team Captain 👑</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAddingSquadForTeamId(null)}
                              className="px-3 py-1.5 rounded-xl border border-white/20 text-slate-300 text-xs font-semibold hover:bg-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={addTeamMemberMutation.isPending}
                              className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-md flex items-center gap-1"
                            >
                              {addTeamMemberMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              Save Player to Squad
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}

                    {/* Squad Members List */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-white/10">
                        {squad.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-950/50 text-center text-xs text-slate-400">
                            No players added to this squad yet. Click "+ Add Player to Squad" above to register the starting lineup.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {squad.map((member: any, mIdx: number) => (
                              <div
                                key={member.id || mIdx}
                                className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-between hover:bg-slate-950/80 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-slate-200 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {member.jerseyNumber ? `#${member.jerseyNumber}` : mIdx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                                      <span>{member.name}</span>
                                      {member.isCaptain && (
                                        <span title="Captain" className="inline-flex items-center">
                                          <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium truncate">
                                      {member.role || 'Player'}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => removeTeamMemberMutation.mutate({ participantId: p.id, memberId: member.id })}
                                  className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                                  title="Remove Player from Squad"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* INDIVIDUAL SPORT: Streamlined Player Cards */
            <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl overflow-hidden shadow-2xl divide-y divide-white/10 text-white">
              {participants.map((p: any, idx: number) => (
                <div key={p.id || idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-slate-200 font-bold text-xs flex items-center justify-center">
                      #{p.seed || idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-white">{p.displayName || p.name || `Player #${idx + 1}`}</div>
                      <div className="text-xs text-slate-400 font-medium">
                        {sportCfg.ratingLabel}: <span className="text-slate-200 font-semibold">{p.rating || 'Unrated'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    {p.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matches & Rounds Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-8">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl bg-slate-950/40 border border-white/20 p-6 rounded-3xl shadow-2xl text-white">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Tournament Fixtures & Rounds
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Record scores round-by-round with official {sportCfg.name} pairing & progression algorithms
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetchMatches()}
                className="p-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Refresh fixtures"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {matches.length > 0 && (
                <button
                  onClick={() => {
                    if (hasPendingMatchesInLatestRound) {
                      toast.error(`Cannot generate Round ${nextRoundNumber} yet! Please submit all scores for Round ${maxRound} first.`)
                      return
                    }
                    generateFixturesMutation.mutate()
                  }}
                  disabled={generateFixturesMutation.isPending || hasPendingMatchesInLatestRound}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                    hasPendingMatchesInLatestRound
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                  }`}
                  title={
                    hasPendingMatchesInLatestRound
                      ? `Submit all scores for Round ${maxRound} before generating Round ${nextRoundNumber}`
                      : `Generate pairings for Round ${nextRoundNumber}`
                  }
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generateFixturesMutation.isPending ? (
                    'Generating...'
                  ) : hasPendingMatchesInLatestRound ? (
                    `Complete R${maxRound} Scores to Unlock R${nextRoundNumber}`
                  ) : (
                    `Generate Round ${nextRoundNumber} Fixtures`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Warning Banner if Previous Round Incomplete */}
          {hasPendingMatchesInLatestRound && maxRound > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-start sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="font-bold text-amber-100">Round {maxRound} Score Submission Required: </span>
                  <span>
                    There {pendingCountInLatestRound === 1 ? 'is 1 match' : `are ${pendingCountInLatestRound} matches`} in Round {maxRound} awaiting score results.
                    Round {nextRoundNumber} pairings will be unlocked once all Round {maxRound} scores are finalized.
                  </span>
                </div>
              </div>
            </div>
          )}

          {matches.length === 0 ? (
            <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl text-center py-16 px-4 shadow-2xl text-white">
              <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h4 className="font-black text-white text-lg mb-1">No Fixtures Generated Yet</h4>
              <p className="text-slate-300 text-xs mb-5">
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
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-md"
                >
                  + Add Competitors
                </button>
              ) : (
                <button
                  onClick={() => generateFixturesMutation.mutate()}
                  disabled={generateFixturesMutation.isPending}
                  className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg hover:bg-primary/95 transition-colors"
                >
                  Generate Round 1 Fixtures
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {roundNumbers.map((r) => {
                const roundMatches = roundsMap[r] || []
                const theme = getRoundTheme(r)
                const pendingRoundCount = roundMatches.filter((m: any) => m.status !== 'COMPLETED').length
                const isRoundComplete = pendingRoundCount === 0

                return (
                  <div
                    key={r}
                    className="backdrop-blur-xl bg-slate-900/85 rounded-3xl border border-white/15 border-t-4 p-6 shadow-2xl text-white"
                    style={{ borderTopColor: sportCfg.theme.primaryHex }}
                  >
                    {/* Round Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md bg-primary/25 border border-primary/40 text-primary">
                          R{r}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-white text-lg tracking-tight">Round {r} Pairings</h4>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-950/60 text-slate-300 font-semibold border border-white/10">
                              {roundMatches.length} {roundMatches.length === 1 ? 'fixture' : 'fixtures'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {isRoundComplete ? 'All fixtures concluded and results verified' : `${pendingRoundCount} match score(s) remaining`}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isRoundComplete ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Round Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs">
                            <Clock className="w-3.5 h-3.5" />
                            Scores Pending ({pendingRoundCount})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Cards inside this Round Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roundMatches.map((m: any) => {
                        const p1Name = m.participantA?.displayName || m.participantA?.name || m.player1Name || m.team1Name || `${sportCfg.competitorTerm} A`
                        const p2Name = m.participantB?.displayName || m.participantB?.name || m.player2Name || m.team2Name || `${sportCfg.competitorTerm} B`
                        const s1 = m.participantA?.score ?? m.scoreA ?? 0
                        const s2 = m.participantB?.score ?? m.scoreB ?? 0
                        const isCompleted = m.status === 'COMPLETED'
                        const isBye = m.resultType === 'BYE' || p2Name === 'BYE' || m.sideB === 'BYE'
                        const isFinal = m.roundName === 'Final' || (tournament?.totalRounds && m.roundNumber === tournament.totalRounds)

                        const isWinner1 = isCompleted && (
                          m.winner === p1Name ||
                          m.winner === m.participantA?.id ||
                          m.winner === 'participantA' ||
                          (s1 > s2 && (!m.winner || m.winner === 'DRAW'))
                        )

                        const isWinner2 = isCompleted && !isBye && (
                          m.winner === p2Name ||
                          m.winner === m.participantB?.id ||
                          m.winner === 'participantB' ||
                          (s2 > s1 && (!m.winner || m.winner === 'DRAW'))
                        )

                        return (
                          <div
                            key={m.id}
                            className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-primary/50 transition-all shadow-xl hover:shadow-2xl group flex flex-col justify-between text-white"
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary">
                                    {m.courtName || `${sportCfg.courtTerminology} ${m.boardNumber || 1}`}
                                  </span>
                                  {m.pairingReason && (
                                    <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-md font-medium border border-white/10">
                                      {m.pairingReason}
                                    </span>
                                  )}
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(m.status)}`}>
                                  {m.status || 'SCHEDULED'}
                                </span>
                              </div>

                              <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {m.sideA && m.sideA !== 'NONE' && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        m.sideA === 'WHITE'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                          : m.sideA.includes('Bat') || m.sideA.includes('Home')
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                          : 'bg-white/10 text-slate-200'
                                      }`}>
                                        {m.sideA === 'WHITE' ? 'WHITE ♔' : m.sideA}
                                      </span>
                                    )}
                                    <span className={`text-sm font-bold ${isCompleted && isWinner1 ? 'text-emerald-400 font-black' : 'text-white'}`}>
                                      {p1Name}
                                    </span>

                                    {/* Knockout Elimination / Advance Badges */}
                                    {isKnockout && isCompleted && (
                                      isBye ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                          1st Round Bye (Advances ↗)
                                        </span>
                                      ) : isWinner1 ? (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                          {isFinal ? '🏆 CHAMPION' : 'ADVANCES ↗'}
                                        </span>
                                      ) : isWinner2 ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40">
                                          {isFinal ? '🥈 RUNNER-UP' : 'ELIMINATED ✕'}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                                          ⚖️ TIED ({sportCfg.tiebreakOptions[0]?.label || 'Tiebreak Required'})
                                        </span>
                                      )
                                    )}
                                  </div>
                                  <span className="font-mono font-bold text-sm bg-slate-950 border border-white/20 px-2.5 py-0.5 rounded text-white shadow-inner">
                                    {s1}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {m.sideB && m.sideB !== 'NONE' && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        m.sideB === 'BLACK'
                                          ? 'bg-slate-950 text-slate-200 border border-white/20'
                                          : m.sideB === 'BYE'
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                          : m.sideB.includes('Bowl') || m.sideB.includes('Away')
                                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                                          : 'bg-white/10 text-slate-200'
                                      }`}>
                                        {m.sideB === 'BLACK' ? 'BLACK ♚' : m.sideB}
                                      </span>
                                    )}
                                    <span className={`text-sm font-bold ${isCompleted && isWinner2 ? 'text-emerald-400 font-black' : 'text-white'}`}>
                                      {p2Name}
                                    </span>

                                    {/* Knockout Elimination / Advance Badges */}
                                    {isKnockout && isCompleted && !isBye && (
                                      isWinner2 ? (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                          {isFinal ? '🏆 CHAMPION' : 'ADVANCES ↗'}
                                        </span>
                                      ) : isWinner1 ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40">
                                          {isFinal ? '🥈 RUNNER-UP' : 'ELIMINATED ✕'}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                                          ⚖️ TIED ({sportCfg.tiebreakOptions[0]?.label || 'Tiebreak Required'})
                                        </span>
                                      )
                                    )}
                                  </div>
                                  <span className="font-mono font-bold text-sm bg-slate-950 border border-white/20 px-2.5 py-0.5 rounded text-white shadow-inner">
                                    {s2}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                              <Link
                                to={`/matches/${m.id}`}
                                className="text-xs text-slate-400 hover:text-primary font-semibold flex items-center gap-1"
                              >
                                Match Center <ChevronRight className="h-3.5 w-3.5" />
                              </Link>

                              <button
                                onClick={() => openScoringModal(m)}
                                className="px-3.5 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                              >
                                <Activity className="h-3.5 w-3.5" />
                                {isCompleted ? 'Edit Score' : 'Submit Score'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
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
              <h3 className="text-lg font-black text-white">Official {sportCfg.name} Leaderboard</h3>
              <p className="text-xs text-slate-300">Live rankings computed from official {sportCfg.name} match results & {sportCfg.scoringUnit.toLowerCase()}</p>
            </div>
            <button
              onClick={() => refetchStandings()}
              className="p-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-white">
            {standings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Award className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                <h4 className="font-black text-white text-lg mb-1">Leaderboard Not Initialized</h4>
                <p className="text-slate-300 text-xs mb-4">Register {sportCfg.competitorsTerm.toLowerCase()} to generate the initial leaderboard.</p>
                <button
                  onClick={() => {
                    setShowAddParticipant(true)
                    setActiveTab('participants')
                  }}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md"
                >
                  + Add {sportCfg.competitorTerm}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-950/80 text-slate-300 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
                    {isKnockout ? (
                      <tr>
                        <th className="px-5 py-3.5 text-center w-16">Rank</th>
                        <th className="px-5 py-3.5">{sportCfg.competitorTerm}</th>
                        <th className="px-5 py-3.5">Tournament Stage / Status</th>
                        <th className="px-5 py-3.5 text-center">Matches Won</th>
                        <th className="px-5 py-3.5 text-center">Matches Lost</th>
                        <th className="px-5 py-3.5 text-center font-black text-primary">Points</th>
                      </tr>
                    ) : (
                      <tr>
                        {sportCfg.standingsColumns.map((col) => (
                          <th
                            key={col.key}
                            className={`px-5 py-3.5 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${col.key === 'points' ? 'font-black text-primary' : ''}`}
                            title={col.tooltip}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-white/10 font-medium">
                    {standings.map((row: any, idx: number) => {
                      const rank = row.rank || idx + 1
                      const isChamp = row.isChampion || row.medal === 'Champion' || row.resultStage === 'CHAMPION'
                      const isRunnerUp = row.medal === 'Runner-up' || row.resultStage === 'Finalist (Runner-Up)'

                      if (isKnockout) {
                        return (
                          <tr key={row.participantId || idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3.5 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                  rank === 1
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                                    : rank === 2
                                    ? 'bg-slate-700 text-slate-200 border border-slate-600'
                                    : rank === 3
                                    ? 'bg-amber-800/30 text-amber-300'
                                    : 'text-slate-400'
                                }`}
                              >
                                {rank}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-white">{row.participantName}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              {isChamp ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs">
                                  🏆 CHAMPION
                                </span>
                              ) : isRunnerUp ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-200 border border-slate-600">
                                  🥈 RUNNER-UP
                                </span>
                              ) : row.resultStage ? (
                                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/40">
                                  {row.resultStage}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                  In Contention ↗
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-center text-emerald-400 font-bold">{row.wins || row.won || 0}</td>
                            <td className="px-5 py-3.5 text-center text-rose-400 font-medium">{row.lost || 0}</td>
                            <td className="px-5 py-3.5 text-center font-black text-base text-primary">
                              {row.points !== undefined ? Number(row.points).toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={row.participantId || idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                rank === 1
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                                  : rank === 2
                                  ? 'bg-slate-700 text-slate-200 border border-slate-600'
                                  : rank === 3
                                  ? 'bg-amber-800/30 text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {rank}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-white">{row.participantName}</div>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-300">{row.played || 0}</td>
                          <td className="px-5 py-3.5 text-center text-emerald-400 font-semibold">{row.won || 0}</td>
                          {sportCode === 'CRICKET' ? (
                            <>
                              <td className="px-5 py-3.5 text-center text-rose-400">{row.lost || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-400">{row.drawn || row.tied || 0}</td>
                              <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-200">{row.nrr !== undefined ? Number(row.nrr).toFixed(3) : '0.000'}</td>
                            </>
                          ) : sportCode === 'FOOTBALL' ? (
                            <>
                              <td className="px-5 py-3.5 text-center text-slate-400">{row.drawn || 0}</td>
                              <td className="px-5 py-3.5 text-center text-rose-400">{row.lost || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.goalsFor || row.gf || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.goalsAgainst || row.ga || 0}</td>
                              <td className="px-5 py-3.5 text-center font-bold text-slate-100">{row.goalDifference || row.gd || 0}</td>
                            </>
                          ) : sportCode === 'BASKETBALL' ? (
                            <>
                              <td className="px-5 py-3.5 text-center text-rose-400">{row.lost || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.pointsFor || row.pf || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.pointsAgainst || row.pa || 0}</td>
                              <td className="px-5 py-3.5 text-center font-bold text-slate-100">{row.pointDiff || row.pd || 0}</td>
                            </>
                          ) : sportCode === 'VOLLEYBALL' ? (
                            <>
                              <td className="px-5 py-3.5 text-center text-rose-400">{row.lost || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.setsWon || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.setsLost || 0}</td>
                              <td className="px-5 py-3.5 text-center font-bold text-slate-100">{row.setRatio || '1.0'}</td>
                            </>
                          ) : sportCode === 'TABLE_TENNIS' || sportCode === 'BADMINTON' ? (
                            <>
                              <td className="px-5 py-3.5 text-center text-rose-400">{row.lost || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.gamesWon || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.gamesLost || 0}</td>
                              <td className="px-5 py-3.5 text-center font-bold text-slate-100">{row.gameDiff || 0}</td>
                            </>
                          ) : sportCode === 'CARROM' ? (
                            <>
                              <td className="px-5 py-3.5 text-center text-rose-400">{row.lost || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.boardsWon || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-300">{row.boardsLost || 0}</td>
                              <td className="px-5 py-3.5 text-center font-bold text-slate-100">{row.netPoints || row.netBoardPoints || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-5 py-3.5 text-center text-slate-400">{row.drawn || 0}</td>
                              <td className="px-5 py-3.5 text-center text-rose-400">{row.lost || 0}</td>
                              <td className="px-5 py-3.5 text-center text-slate-400 font-mono text-xs">
                                {row.buchholz !== undefined ? Number(row.buchholz).toFixed(1) : '0.0'}
                              </td>
                              <td className="px-5 py-3.5 text-center text-slate-400 font-mono text-xs">
                                {row.sonnebornBerger !== undefined ? Number(row.sonnebornBerger).toFixed(2) : '0.00'}
                              </td>
                            </>
                          )}
                          <td className="px-5 py-3.5 text-center font-black text-base text-primary">
                            {row.points !== undefined ? Number(row.points).toFixed(1) : '0.0'}
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
        <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white">{sportCfg.name} Elimination Bracket & Tree</h3>
              <p className="text-xs text-slate-300">Visual progression from round 1 to championship finals with bye management</p>
            </div>
            <Link
              to={`/tournaments/${t.id}/bracket`}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-colors"
            >
              Full Screen Bracket
            </Link>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <p className="text-slate-300 text-sm">Generate fixtures to visualize the {sportCfg.name} tournament tree.</p>
            </div>
          ) : (
            <div className="flex items-start gap-8 overflow-x-auto pb-4">
              {roundNumbers.map((r) => {
                const rMatches = roundsMap[r] || []
                const slots = Math.pow(2, maxRound - r + 1)
                const roundTitle = r === maxRound ? 'Final' : r === maxRound - 1 ? 'Semifinals' : r === maxRound - 2 ? 'Quarterfinals' : `Round of ${slots}`
                return (
                  <div key={r} className="space-y-4 min-w-[260px]">
                    <div className="text-xs font-bold uppercase text-white bg-slate-950/80 px-3 py-2 rounded-xl text-center border border-white/15">
                      Round {r} ({roundTitle})
                    </div>
                    {rMatches.map((m: any, idx: number) => {
                      const isComplete = m.status === 'COMPLETED'
                      const wName = m.winner
                      return (
                        <div key={m.id || idx} className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 shadow-lg space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-white/10 pb-1">
                            <span>{m.courtName || `${sportCfg.courtTerminology} ${idx + 1}`}</span>
                            {isComplete && <span className="text-emerald-400 font-bold">Finished</span>}
                          </div>
                          <div className={`flex items-center justify-between text-xs font-semibold ${wName === m.participantA?.displayName ? 'text-primary font-bold' : 'text-slate-200'}`}>
                            <span className="truncate pr-2">{m.participantA?.displayName || `${sportCfg.competitorTerm} 1`}</span>
                            <span className="font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-white/15 text-white">{m.participantA?.score ?? 0}</span>
                          </div>
                          <div className={`flex items-center justify-between text-xs font-semibold ${wName === m.participantB?.displayName ? 'text-primary font-bold' : 'text-slate-200'}`}>
                            <span className="truncate pr-2">{m.participantB?.displayName || `${sportCfg.competitorTerm} 2`}</span>
                            <span className="font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-white/15 text-white">{m.participantB?.score ?? 0}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Rules & Protocols Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-slate-950/40 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-3xl shadow-md">
                {sportCfg.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Official {sportCfg.name} Rules & Match Protocols
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Standard rules, scoring metrics, foul penalties, and tiebreak specifications
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  Match Duration & Formats
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {sportCfg.rulesOverview.duration}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Trophy className="w-4 h-4" />
                  Scoring & Points System
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {sportCfg.rulesOverview.scoring}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  Tiebreak & Decider Rules
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {sportCfg.rulesOverview.tiebreak}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Fouls, Penalties & Sanctions
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {sportCfg.rulesOverview.foulsPenalties}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <span className="font-bold text-white block">Court / Field Terminology</span>
                  <span className="text-slate-300">Played on official <strong>{sportCfg.courtTerminologyPlural}</strong> ({sportCfg.sideAName} vs {sportCfg.sideBName})</span>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-primary/30 font-bold text-primary shadow-xs">
                {sportCfg.squadSizeDesc}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Score Match Modal */}
      <AnimatePresence>
        {scoringMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="backdrop-blur-2xl bg-slate-900/95 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto text-white"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    {sportCfg.name} Scoreboard: Round {scoringMatch.roundNumber || 1}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {scoringMatch.courtName || `${sportCfg.courtTerminology} 1`} • {scoringMatch.pairingReason || 'Match Session'}
                  </p>
                </div>
                <button
                  onClick={() => setScoringMatch(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleScoreSubmit} className="space-y-4">
                {isKnockout && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 inline" />
                      Knockout Elimination Rules
                    </div>
                    <p className="text-amber-200/90 leading-relaxed">
                      The defeated {sportCfg.competitorTerm.toLowerCase()} is eliminated immediately. If regular scores are tied, choose an advancing winner ({sportCfg.tiebreakDescription}) or schedule a replay.
                    </p>
                  </div>
                )}

                {/* Score Input Card */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                  {/* Side A */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      {scoringMatch.sideA && scoringMatch.sideA !== 'NONE' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          {scoringMatch.sideA}
                        </span>
                      )}
                      <span className="font-bold text-sm text-white truncate">
                        {scoringMatch.participantA?.displayName || scoringMatch.participantA?.name || scoringMatch.player1Name || `${sportCfg.competitorTerm} 1`}
                      </span>
                    </div>
                    <input
                      type="number"
                      step={sportCfg.scoreStep}
                      min="0"
                      placeholder={sportCfg.scorePlaceholderA}
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      className="w-24 px-3 py-1.5 text-center font-mono font-bold text-base rounded-xl border border-white/20 bg-slate-900 focus:outline-none focus:border-primary shadow-inner text-white"
                    />
                  </div>

                  {/* Side B */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      {scoringMatch.sideB && scoringMatch.sideB !== 'NONE' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20">
                          {scoringMatch.sideB}
                        </span>
                      )}
                      <span className="font-bold text-sm text-white truncate">
                        {scoringMatch.participantB?.displayName || scoringMatch.participantB?.name || scoringMatch.player2Name || `${sportCfg.competitorTerm} 2`}
                      </span>
                    </div>
                    <input
                      type="number"
                      step={sportCfg.scoreStep}
                      min="0"
                      placeholder={sportCfg.scorePlaceholderB}
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      className="w-24 px-3 py-1.5 text-center font-mono font-bold text-base rounded-xl border border-white/20 bg-slate-900 focus:outline-none focus:border-primary shadow-inner text-white"
                    />
                  </div>
                </div>

                {/* Winner Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Match Result / Outcome
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMatchWinner('participantA')
                        if (Number(scoreA) === 0 && Number(scoreB) === 0) {
                          setScoreA(sportCfg.defaultScoreA)
                          setScoreB(sportCfg.defaultScoreB)
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all truncate text-center ${
                        matchWinner === 'participantA'
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-md font-bold'
                          : 'border-white/15 bg-slate-950/60 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {(scoringMatch.participantA?.displayName || scoringMatch.participantA?.name || `${sportCfg.competitorTerm} 1`).split(' ')[0]} Won
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMatchWinner('DRAW')
                        if (sportCode === 'CHESS') {
                          setScoreA(0.5)
                          setScoreB(0.5)
                        } else if (Number(scoreA) !== Number(scoreB)) {
                          setScoreA(sportCfg.defaultScoreA)
                          setScoreB(sportCfg.defaultScoreA)
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        matchWinner === 'DRAW'
                          ? 'border-amber-500 bg-amber-500 text-white shadow-md font-bold'
                          : 'border-white/15 bg-slate-950/60 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Drawn / Tied
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMatchWinner('participantB')
                        if (Number(scoreA) === 0 && Number(scoreB) === 0) {
                          setScoreA(sportCfg.defaultScoreB)
                          setScoreB(sportCfg.defaultScoreA)
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all truncate text-center ${
                        matchWinner === 'participantB'
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-md font-bold'
                          : 'border-white/15 bg-slate-950/60 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {(scoringMatch.participantB?.displayName || scoringMatch.participantB?.name || `${sportCfg.competitorTerm} 2`).split(' ')[0]} Won
                    </button>
                  </div>
                </div>

                {/* Knockout Tiebreak / Replay Decision Box */}
                {isKnockout && matchWinner === 'DRAW' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        Knockout Draw Resolution ({sportCfg.name})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setKnockoutDrawAction('ADVANCE')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                          knockoutDrawAction === 'ADVANCE'
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-white/15 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">⚖️ {sportCfg.tiebreakOptions[0]?.label || 'Tiebreak Winner'}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{sportCfg.tiebreakOptions[0]?.desc || 'Advance winner via tiebreak'}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setKnockoutDrawAction('REPLAY')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                          knockoutDrawAction === 'REPLAY'
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-white/15 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">🔄 Replay Match</div>
                        <div className="text-[10px] opacity-80 mt-0.5">Reset match to 0-0 for rematch</div>
                      </button>
                    </div>

                    {knockoutDrawAction === 'ADVANCE' && (
                      <div className="pt-2 border-t border-indigo-800/60">
                        <label className="block text-[11px] font-bold text-indigo-200 mb-1.5">
                          Select Advancing {sportCfg.competitorTerm} ({sportCfg.tiebreakDescription}):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAdvancingParticipant('participantA')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all truncate text-center ${
                              advancingParticipant === 'participantA'
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                                : 'bg-slate-900 text-slate-300 border-white/15 hover:bg-white/10'
                            }`}
                          >
                            Advance {scoringMatch.participantA?.displayName || scoringMatch.participantA?.name || sportCfg.competitorTerm + ' 1'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdvancingParticipant('participantB')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all truncate text-center ${
                              advancingParticipant === 'participantB'
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                                : 'bg-slate-900 text-slate-300 border-white/15 hover:bg-white/10'
                            }`}
                          >
                            Advance {scoringMatch.participantB?.displayName || scoringMatch.participantB?.name || sportCfg.competitorTerm + ' 2'}
                          </button>
                        </div>
                      </div>
                    )}

                    {knockoutDrawAction === 'REPLAY' && (
                      <div className="text-[11px] text-indigo-300 bg-indigo-900/30 p-2.5 rounded-xl border border-indigo-700/40">
                        🔄 This match will be reset to 0-0 and left in <strong>SCHEDULED</strong> status for an official rematch.
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setScoringMatch(null)}
                    className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 text-xs font-semibold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={completeMatchMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-lg hover:bg-primary/95 flex items-center gap-1.5"
                  >
                    {completeMatchMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Save & Update Progression
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Tournament Modal */}
      <ShareTournamentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tournamentId={id!}
        tournamentName={t?.name || 'Tournament'}
        sportName={sportCfg.name}
        sportIcon={sportCfg.icon}
        roundNumber={maxRound > 0 ? maxRound : 1}
        totalRounds={t?.totalRounds || roundNumbers.length}
        isCompleted={t?.status === 'COMPLETED'}
      />
      </div>
    </div>
  )
}
