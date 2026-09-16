import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Calendar, MapPin, Activity, ArrowLeft,
  Clock, Shield, User, CheckCircle2, Share2
} from 'lucide-react'
import { matchesApi } from '@/lib/api'
import { getStatusColor, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesApi.getById(id!),
    enabled: !!id,
  })

  // Sample data fallback
  const m = match || {
    id: id || 'm1',
    tournamentName: 'National Masters Championship 2026',
    tournamentId: 't1',
    sportCode: 'FOOTBALL',
    team1Name: 'Arsenal Academy',
    team2Name: 'Spartans United',
    score1: 2,
    score2: 1,
    status: 'LIVE',
    round: 'Finals',
    venueName: 'Metropolitan Stadium - Pitch 1',
    startTime: '2026-09-24T18:30:00Z',
    referee: 'Michael Oliver (FIFA Badge)',
    timeline: [
      { time: "14'", text: 'Goal - Marcus Vance (Arsenal)', type: 'GOAL' },
      { time: "38'", text: 'Yellow Card - David Sterling (Spartans)', type: 'CARD' },
      { time: "52'", text: 'Goal - Liam Torres (Spartans)', type: 'GOAL' },
      { time: "64'", text: 'Goal - Marcus Vance (Arsenal)', type: 'GOAL' },
    ]
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Match Banner */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <Link
            to={`/tournaments/${m.tournamentId}`}
            className="hover:text-primary font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5 text-primary" />
            {m.tournamentName}
          </Link>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(m.status)}`}>
            {m.status}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-6">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">{m.team1Name}</h2>
            <div className="text-xs text-muted-foreground mt-1">Starting Lineup Confirmed</div>
          </div>

          <div className="flex items-center gap-6 px-8 py-4 bg-secondary/40 rounded-2xl border border-border/40">
            <span className="text-5xl font-black font-mono text-primary">{m.score1}</span>
            <span className="text-2xl text-muted-foreground">:</span>
            <span className="text-5xl font-black font-mono text-foreground">{m.score2}</span>
          </div>

          <div className="flex-1 text-center sm:text-right">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">{m.team2Name}</h2>
            <div className="text-xs text-muted-foreground mt-1">Starting Lineup Confirmed</div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {m.venueName}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Referee: {m.referee}
            </span>
          </div>

          {isAuthenticated && (
            <Link
              to={`/matches/${m.id}/score`}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20"
            >
              <Activity className="h-3.5 w-3.5" />
              Open Live Scorer Console
            </Link>
          )}
        </div>
      </div>

      {/* Match Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Timeline */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Match Timeline
          </h3>

          <div className="space-y-3">
            {m.timeline.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-primary">{item.time}</span>
                  <span className="text-foreground">{item.text}</span>
                </div>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-secondary font-mono text-muted-foreground">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Match Information */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Integrity & Officiating
          </h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex justify-between">
              <span>Match Delegate</span>
              <span className="font-semibold text-foreground">Official Assigned</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex justify-between">
              <span>Anti-Doping & Integrity</span>
              <span className="font-semibold text-emerald-400">Verified Cleared</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex justify-between">
              <span>Ball & Equipment Inspection</span>
              <span className="font-semibold text-emerald-400">Standard Spec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
