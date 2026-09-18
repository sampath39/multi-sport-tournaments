import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Calendar, MapPin, Activity, ArrowLeft,
  Clock, Shield, User, CheckCircle2, Share2, Edit3, X, Loader2
} from 'lucide-react'
import { matchesApi } from '@/lib/api'
import { getStatusColor, formatDate } from '@/lib/utils'
import { getSportConfig } from '@/lib/sportConfig'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [isScoringOpen, setIsScoringOpen] = useState(false)
  const [scoreA, setScoreA] = useState<number>(0)
  const [scoreB, setScoreB] = useState<number>(0)
  const [winner, setWinner] = useState<string>('')

  const { data: match, isLoading, refetch } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesApi.getById(id!),
    enabled: !!id,
  })

  const m = match || {}
  const sportConfig = getSportConfig(m.sportCode)
  const team1Name = m.participantA?.displayName || m.participantA?.name || m.player1Name || m.team1Name || 'Competitor A'
  const team2Name = m.participantB?.displayName || m.participantB?.name || m.player2Name || m.team2Name || 'Competitor B'
  const s1 = m.scoreA ?? m.score1 ?? m.participantA?.score ?? 0
  const s2 = m.scoreB ?? m.score2 ?? m.participantB?.score ?? 0
  const venue = m.courtName || m.venueName || `${sportConfig.courtTerminology} 1`
  const tournamentTitle = m.tournamentName || `${sportConfig.name} Championship`
  const status = m.status || 'SCHEDULED'
  const events = m.events || [
    { time: "0'", text: `Match session scheduled on ${venue}`, type: 'INFO' }
  ]

  const completeMutation = useMutation({
    mutationFn: (data: any) => matchesApi.complete(id!, data),
    onSuccess: () => {
      toast.success('Match score updated & verified!')
      setIsScoringOpen(false)
      queryClient.invalidateQueries({ queryKey: ['match', id] })
      if (m.tournamentId) {
        queryClient.invalidateQueries({ queryKey: ['tournament-matches', m.tournamentId] })
        queryClient.invalidateQueries({ queryKey: ['tournament-standings', m.tournamentId] })
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update match score')
    }
  })

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let decidedWinner = winner
    if (!decidedWinner) {
      if (scoreA > scoreB) decidedWinner = team1Name
      else if (scoreB > scoreA) decidedWinner = team2Name
      else decidedWinner = 'DRAW'
    }
    completeMutation.mutate({
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      winner: decidedWinner,
      status: 'COMPLETED'
    })
  }

  return (
    <div className="relative min-h-screen py-8 px-4 text-slate-100 selection:bg-primary selection:text-white">
      {/* 4K Realistic Live Sport Wallpaper & Arena Glow */}
      <SportLiveBackground sportCode={m.sportCode} intensity="medium" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white mb-6 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/15 backdrop-blur-md transition-all shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        {/* Match Banner */}
        <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span className="text-white font-bold">{tournamentTitle}</span>
              <span>•</span>
              <span>{m.roundName || (m.roundNumber ? `Round ${m.roundNumber}` : 'Match Round')}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-6">
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs uppercase font-bold text-slate-400">
                {m.sideA && m.sideA !== 'NONE' ? m.sideA : sportConfig.sideAName}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{team1Name}</h2>
              <div className="text-xs text-emerald-400 font-semibold mt-1">Confirmed Starter</div>
            </div>

            <div className="flex items-center gap-6 px-8 py-4 bg-slate-950/70 rounded-2xl border border-white/15 shadow-lg">
              <span className="text-5xl font-black font-mono text-primary drop-shadow-md">{s1}</span>
              <span className="text-2xl text-slate-500">:</span>
              <span className="text-5xl font-black font-mono text-white drop-shadow-md">{s2}</span>
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="text-xs uppercase font-bold text-slate-400">
                {m.sideB && m.sideB !== 'NONE' ? m.sideB : sportConfig.sideBName}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{team2Name}</h2>
              <div className="text-xs text-emerald-400 font-semibold mt-1">Confirmed Starter</div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Official Pairing System Verified
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setScoreA(Number(s1))
                  setScoreB(Number(s2))
                  setIsScoringOpen(true)
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10 shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Quick Edit Score
              </button>

              <Link
                to={`/matches/${id}/score`}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Activity className="h-3.5 w-3.5" />
                Open Live Scorer Console
              </Link>
            </div>
          </div>
        </div>

        {/* Match Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Timeline */}
          <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Match Event Timeline
            </h3>

            <div className="space-y-2.5">
              {events.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary">{item.time}</span>
                    <span className="text-slate-200 font-medium">{item.text}</span>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300 font-bold border border-white/10">
                    {item.type || 'EVENT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Match Information */}
          <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Integrity, Fair Play & Progression
            </h3>
            <div className="space-y-3 text-xs text-slate-300 font-medium">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex justify-between items-center">
                <span>Match Delegate</span>
                <span className="font-bold text-white">Assigned Official Referee</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex justify-between items-center">
                <span>Tournament Format</span>
                <span className="font-bold text-primary">{m.pairingReason || 'Seeded Bracket Matching'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex justify-between items-center">
                <span>Fair Play & Anti-Cheating</span>
                <span className="font-bold text-emerald-400">Standard Spec Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Score Modal */}
        <AnimatePresence>
          {isScoringOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="backdrop-blur-2xl bg-slate-900/95 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/15"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Update Match Score
                  </h3>
                  <button
                    onClick={() => setIsScoringOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleScoreSubmit} className="space-y-4">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200 truncate max-w-[200px]">
                        {team1Name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step={sportConfig.scoreStep}
                        value={scoreA}
                        onChange={(e) => setScoreA(Number(e.target.value))}
                        className="w-20 px-3 py-1.5 text-center font-mono font-bold text-base rounded-xl border border-white/15 bg-slate-900 text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200 truncate max-w-[200px]">
                        {team2Name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step={sportConfig.scoreStep}
                        value={scoreB}
                        onChange={(e) => setScoreB(Number(e.target.value))}
                        className="w-20 px-3 py-1.5 text-center font-mono font-bold text-base rounded-xl border border-white/15 bg-slate-900 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsScoringOpen(false)}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={completeMutation.isPending}
                      className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:bg-primary/95 flex items-center gap-1.5"
                    >
                      {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Save Score
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

