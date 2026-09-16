import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, Calendar, Users, Shield, MapPin, Tv, Play,
  ChevronRight, CheckCircle2, Clock, Award, Activity,
  Settings, ArrowLeft, Share2, Sparkles, UserCheck, AlertTriangle
} from 'lucide-react'
import { tournamentsApi, matchesApi } from '@/lib/api'
import { getSportIcon, getSportBadgeColor, getStatusColor, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'participants' | 'rules'>('overview')

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
  })

  const { data: matches } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: () => tournamentsApi.getMatches(id!),
    enabled: !!id,
  })

  const generateFixturesMutation = useMutation({
    mutationFn: () => tournamentsApi.generateFixtures(id!),
    onSuccess: () => {
      toast.success('Fixtures generated successfully!')
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate fixtures')
    }
  })

  const startTournamentMutation = useMutation({
    mutationFn: () => tournamentsApi.start(id!),
    onSuccess: () => {
      toast.success('Tournament started! Live scoring is now active.')
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start tournament')
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Fallback data for demonstration if backend returns empty
  const t = tournament || {
    id: id || '1',
    name: 'National Masters Championship 2026',
    sportCode: 'CHESS',
    sportName: 'Chess',
    competitionType: 'SWISS',
    tier: 'NATIONAL',
    status: 'IN_PROGRESS',
    maxParticipants: 32,
    currentParticipants: 28,
    startDate: '2026-09-20',
    endDate: '2026-09-25',
    venueName: 'Metropolitan Convention Sports Arena, Hall B',
    description: 'Premier national championship conducted under official FIDE regulations. Swiss System 7 rounds with classical 90+30 time control.',
    participants: [
      { id: '1', name: 'Grandmaster Magnus K.', seed: 1, rating: 2840, status: 'CONFIRMED' },
      { id: '2', name: 'International Master Hikaru N.', seed: 2, rating: 2805, status: 'CONFIRMED' },
      { id: '3', name: 'Grandmaster Praggnanandhaa R.', seed: 3, rating: 2770, status: 'CONFIRMED' },
      { id: '4', name: 'Grandmaster Gukesh D.', seed: 4, rating: 2780, status: 'CONFIRMED' },
      { id: '5', name: 'Grandmaster Alireza F.', seed: 5, rating: 2765, status: 'CONFIRMED' },
      { id: '6', name: 'Grandmaster Arjun E.', seed: 6, rating: 2790, status: 'CONFIRMED' },
    ]
  }

  const isOrganizer = user?.roles?.some(r => ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'TOURNAMENT_ADMIN'].includes(r))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/tournaments')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tournaments
      </button>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-card/80 via-card/50 to-secondary/30 border border-border/50 p-6 sm:p-8 mb-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getSportBadgeColor(t.sportCode)}`}>
                <span>{getSportIcon(t.sportCode)}</span>
                {t.sportName || t.sportCode}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}>
                {t.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-muted-foreground border border-border/50">
                {t.tier} TIER
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {t.competitionType.replace(/_/g, ' ')}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {t.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formatDate(t.startDate)} - {formatDate(t.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{t.currentParticipants || t.participants?.length || 0} / {t.maxParticipants} Registered</span>
              </div>
              {t.venueName && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{t.venueName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/tv/${t.id}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Tv className="h-4 w-4 text-primary" />
              TV Display Mode
            </Link>

            <Link
              to={`/tournaments/${t.id}/standings`}
              className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Award className="h-4 w-4 text-amber-400" />
              Standings
            </Link>

            <Link
              to={`/tournaments/${t.id}/bracket`}
              className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Trophy className="h-4 w-4 text-emerald-400" />
              Bracket & Tree
            </Link>

            {isOrganizer && (
              <>
                <button
                  onClick={() => generateFixturesMutation.mutate()}
                  disabled={generateFixturesMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Fixtures
                </button>

                {t.status === 'DRAFT' || t.status === 'REGISTRATION_CLOSED' ? (
                  <button
                    onClick={() => startTournamentMutation.mutate()}
                    disabled={startTournamentMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    Start Tournament
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/50 gap-6 mb-8 text-sm font-semibold">
        {[
          { key: 'overview', label: 'Overview & Details' },
          { key: 'matches', label: 'Live & Scheduled Matches' },
          { key: 'participants', label: `Participants (${t.participants?.length || 0})` },
          { key: 'rules', label: 'Sport Rules & Tie-Breaks' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
              <h3 className="text-base font-bold text-foreground mb-3">About This Tournament</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {t.description}
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
              <h3 className="text-base font-bold text-foreground mb-4">Official Regulations & Structure</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Competition Format</div>
                  <div className="text-base font-bold text-foreground mt-1">{t.competitionType.replace(/_/g, ' ')}</div>
                  <p className="text-xs text-muted-foreground mt-1">Official FIDE/ICC/FIFA approved pairing principles.</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Tie-Break Hierarchy</div>
                  <div className="text-base font-bold text-foreground mt-1">Buchholz / Direct Encounter</div>
                  <p className="text-xs text-muted-foreground mt-1">Strict, transparent, automated calculations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
              <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Integrity & Fair Play
              </h3>
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Immutable audit trails enabled</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Official licensed scorekeepers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Real-time anti-cheat monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">Tournament Matches</h3>
            <span className="text-xs text-muted-foreground">Click any match to launch live scoring or view detailed stats</span>
          </div>

          {/* Sample matches display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'm1', round: 'Round 3 - Table 1', p1: 'Magnus K.', p2: 'Hikaru N.', s1: '1', s2: '0', status: 'COMPLETED', sport: 'CHESS' },
              { id: 'm2', round: 'Round 3 - Table 2', p1: 'Gukesh D.', p2: 'Praggnanandhaa R.', s1: '½', s2: '½', status: 'COMPLETED', sport: 'CHESS' },
              { id: 'm3', round: 'Round 4 - Table 1', p1: 'Magnus K.', p2: 'Gukesh D.', s1: '0.0', s2: '0.0', status: 'LIVE', sport: 'CHESS' },
              { id: 'm4', round: 'Round 4 - Table 2', p1: 'Hikaru N.', p2: 'Arjun E.', s1: '-', s2: '-', status: 'SCHEDULED', sport: 'CHESS' },
            ].map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="font-semibold text-primary">{m.round}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(m.status)}`}>
                    {m.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{m.p1}</span>
                    <span className="font-bold text-sm bg-secondary px-2 py-0.5 rounded">{m.s1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{m.p2}</span>
                    <span className="font-bold text-sm bg-secondary px-2 py-0.5 rounded">{m.s2}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                  <Link
                    to={`/matches/${m.id}`}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    Match Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    to={`/matches/${m.id}/score`}
                    className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Activity className="h-3 w-3" />
                    Scoreboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-bold text-sm">Official Registered Competitors</h3>
            <span className="text-xs text-muted-foreground">Ranked by Seed & Rating</span>
          </div>

          <div className="divide-y divide-border/30">
            {(t.participants || []).map((p: any, idx: number) => (
              <div key={p.id || idx} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{p.seed || idx + 1}</span>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Rating: {p.rating || 'Unrated'}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <UserCheck className="h-3.5 w-3.5" />
                  {p.status || 'Confirmed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold">Rulebook & Tie-Breaking Protocols</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <h4 className="font-bold text-foreground mb-1">Standard Swiss Pairing (FIDE Dutch System)</h4>
              <p>Participants with identical or closest scores are paired each round. No player may play the same opponent twice. Color allocation balances white and black alternation.</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <h4 className="font-bold text-foreground mb-1">Buchholz Tie-Break System</h4>
              <p>Sum of the scores of each opponent a player has faced. A player who played tougher opponents ranks higher in case of identical match points.</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <h4 className="font-bold text-foreground mb-1">Sonneborn-Berger System</h4>
              <p>Sum of scores of defeated opponents plus half the scores of drawn opponents. Rewarding victories against higher performing opponents.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
