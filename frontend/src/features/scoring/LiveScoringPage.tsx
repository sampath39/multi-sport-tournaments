import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, ArrowLeft, Play, Pause, RotateCcw,
  CheckCircle2, ShieldAlert, Activity, Users, Send,
  Plus, Minus, Undo2, Clock, Award, Save, Loader2
} from 'lucide-react'
import { matchesApi, tournamentsApi } from '@/lib/api'
import { getSportBadgeColor, getStatusColor } from '@/lib/utils'
import { Sport3DBadge } from '@/components/sports/Sport3DCard'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import toast from 'react-hot-toast'

import { getSportConfig } from '@/lib/sportConfig'

export function LiveScoringPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch real match details from backend
  const { data: matchData, isLoading } = useQuery({
    queryKey: ['match-live', id],
    queryFn: () => matchesApi.getById(id!),
    enabled: !!id,
  })

  const m = matchData || {}
  const sportCode = (m.sportCode || 'FOOTBALL').toUpperCase()
  const sportConfig = getSportConfig(sportCode)

  const team1Name = m.participantA?.displayName || m.participantA?.name || m.player1Name || m.team1Name || 'Competitor A'
  const team2Name = m.participantB?.displayName || m.participantB?.name || m.player2Name || m.team2Name || 'Competitor B'
  const tournamentId = m.tournamentId

  // Local Match state
  const [team1Score, setTeam1Score] = useState<number>(0)
  const [team2Score, setTeam2Score] = useState<number>(0)
  const [matchTime, setMatchTime] = useState<number>(1)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true)
  const [events, setEvents] = useState<Array<{ id: string; time: string; text: string; type: string }>>([])

  // Initialize scores once matchData is loaded
  useEffect(() => {
    if (matchData) {
      const s1 = matchData.participantA?.score ?? matchData.scoreA ?? 0
      const s2 = matchData.participantB?.score ?? matchData.scoreB ?? 0
      setTeam1Score(Number(s1))
      setTeam2Score(Number(s2))
      if (matchData.events && Array.isArray(matchData.events)) {
        setEvents(matchData.events)
      } else {
        setEvents([
          { id: '1', time: "0'", text: `Match scheduled on ${matchData.courtName || `${sportConfig.courtTerminology} 1`}`, type: 'START' }
        ])
      }
    }
  }, [matchData, sportConfig])

  // Timer effect
  useEffect(() => {
    let timer: any = null
    if (isTimerRunning) {
      timer = setInterval(() => {
        setMatchTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isTimerRunning])

  const addEvent = (text: string, type: string) => {
    const newEv = {
      id: Date.now().toString(),
      time: `${matchTime}'`,
      text,
      type
    }
    setEvents(prev => [newEv, ...prev])
  }

  // Mutation: Update Live Score
  const updateScoreMutation = useMutation({
    mutationFn: (data: { scoreA: number; scoreB: number; status?: string; winner?: string }) =>
      matchesApi.updateScore(id!, data),
    onSuccess: () => {
      toast.success('Live scores synchronized with tournament standings!')
      queryClient.invalidateQueries({ queryKey: ['match-live', id] })
      queryClient.invalidateQueries({ queryKey: ['match', id] })
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] })
        queryClient.invalidateQueries({ queryKey: ['tournament-standings', tournamentId] })
        queryClient.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] })
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update live score')
    }
  })

  // Mutation: Complete & Conclude Match
  const completeMatchMutation = useMutation({
    mutationFn: (data: { scoreA: number; scoreB: number; winner?: string; status: string }) =>
      matchesApi.complete(id!, data),
    onSuccess: (res) => {
      setIsTimerRunning(false)
      toast.success('Match officially completed & verified in tournament leaderboard!')
      queryClient.invalidateQueries({ queryKey: ['match-live', id] })
      queryClient.invalidateQueries({ queryKey: ['match', id] })
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] })
        queryClient.invalidateQueries({ queryKey: ['tournament-standings', tournamentId] })
        queryClient.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] })
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to conclude match')
    }
  })

  const handleScoreChange = (team: 1 | 2, delta: number, actionName: string) => {
    if (team === 1) {
      const next = Math.max(0, Number((team1Score + delta).toFixed(1)))
      setTeam1Score(next)
      addEvent(`${actionName} by ${team1Name} (New: ${next})`, 'SCORE')
    } else {
      const next = Math.max(0, Number((team2Score + delta).toFixed(1)))
      setTeam2Score(next)
      addEvent(`${actionName} by ${team2Name} (New: ${next})`, 'SCORE')
    }
  }

  const handleSetExactScore = (s1: number, s2: number, resultText: string) => {
    setTeam1Score(s1)
    setTeam2Score(s2)
    addEvent(`Result marked: ${resultText}`, 'RESULT')
  }

  const handleSaveLiveScore = () => {
    const winner = team1Score > team2Score ? team1Name : team2Score > team1Score ? team2Name : undefined
    updateScoreMutation.mutate({
      scoreA: team1Score,
      scoreB: team2Score,
      status: 'LIVE',
      winner
    })
  }

  const handleFinalizeMatch = () => {
    let winner: string | undefined = undefined
    if (team1Score > team2Score) winner = team1Name
    else if (team2Score > team1Score) winner = team2Name
    else winner = 'DRAW'

    completeMatchMutation.mutate({
      scoreA: team1Score,
      scoreB: team2Score,
      winner,
      status: 'COMPLETED'
    })
  }

  const renderSportActions = (teamNum: 1 | 2, name: string) => {
    switch (sportCode) {
      case 'CHESS':
        return (
          <>
            <button
              onClick={() => {
                if (teamNum === 1) handleSetExactScore(1, 0, `${name} (White) Won 1-0`)
                else handleSetExactScore(0, 1, `${name} (Black) Won 0-1`)
              }}
              className="p-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-primary/90 col-span-2"
            >
              <Trophy className="h-3.5 w-3.5" /> Mark Win (1.0 Pt)
            </button>
            <button
              onClick={() => handleSetExactScore(0.5, 0.5, 'Agreed Draw (0.5 - 0.5)')}
              className="p-3 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-amber-600"
            >
              Draw (½ - ½)
            </button>
            <button
              onClick={() => addEvent(`Check declared on ${teamNum === 1 ? team2Name : team1Name}!`, 'CHECK')}
              className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold hover:bg-slate-700"
            >
              ♚ Check
            </button>
          </>
        )
      case 'CRICKET':
        return (
          <>
            <button
              onClick={() => handleScoreChange(teamNum, 1, '+1 Run (Single)')}
              className="p-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> +1 Run
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 4, '+4 Runs (Four)')}
              className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> 4 Runs
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 6, '+6 Runs (Six)')}
              className="p-3 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-purple-700"
            >
              <Plus className="h-3.5 w-3.5" /> 6 Runs
            </button>
            <button
              onClick={() => addEvent(`Wicket fallen for ${name}!`, 'WICKET')}
              className="p-3 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-900"
            >
              Wicket ✕
            </button>
          </>
        )
      case 'BASKETBALL':
        return (
          <>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Free Throw (+1)')}
              className="p-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              +1 Free Throw
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 2, 'Field Goal (+2)')}
              className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              +2 2-Pointer
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 3, 'Three-Pointer (+3)')}
              className="p-3 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              +3 Three-Pt
            </button>
            <button
              onClick={() => addEvent(`Personal foul on ${name}`, 'FOUL')}
              className="p-3 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold text-xs hover:bg-amber-900"
            >
              Foul Call
            </button>
          </>
        )
      case 'VOLLEYBALL':
        return (
          <>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Point Won (+1)')}
              className="p-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> +1 Point
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Ace Serve (+1)')}
              className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              Ace Serve ⚡
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Block Point (+1)')}
              className="p-3 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              Block Point 🛡️
            </button>
            <button
              onClick={() => addEvent(`Net touch violation by ${name}`, 'FOUL')}
              className="p-3 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-900"
            >
              Net Touch Foul
            </button>
          </>
        )
      case 'TABLE_TENNIS':
      case 'BADMINTON':
        return (
          <>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Point (+1)')}
              className="p-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> +1 Point
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Smash Winner (+1)')}
              className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              Winner / Smash 💥
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, -1, 'Score Correction (-1)')}
              className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold hover:bg-slate-700"
            >
              <Minus className="h-3.5 w-3.5" /> Undo Point
            </button>
            <button
              onClick={() => addEvent(`Service fault against ${name}`, 'FAULT')}
              className="p-3 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-900"
            >
              Service Fault
            </button>
          </>
        )
      case 'CARROM':
        return (
          <>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Coin Pocketed (+1)')}
              className="p-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> +1 Coin
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, 3, 'Queen Pocketed & Covered (+3)')}
              className="p-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              👑 Queen (+3)
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, -1, 'Striker Penalty (-1)')}
              className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold hover:bg-slate-700"
            >
              <Minus className="h-3.5 w-3.5" /> Striker Foul (-1)
            </button>
            <button
              onClick={() => addEvent(`Due coin returned to center board by ${name}`, 'PENALTY')}
              className="p-3 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold text-xs hover:bg-amber-900"
            >
              Due Penalty
            </button>
          </>
        )
      case 'FOOTBALL':
      default:
        return (
          <>
            <button
              onClick={() => handleScoreChange(teamNum, 1, 'Goal (+1)')}
              className="p-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Goal (+1)
            </button>
            <button
              onClick={() => handleScoreChange(teamNum, -1, 'Goal Disallowed')}
              className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-700"
            >
              <Minus className="h-4 w-4" /> Disallow
            </button>
            <button
              onClick={() => addEvent(`Yellow Card issued to ${name}`, 'CARD')}
              className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-900"
            >
              Yellow Card
            </button>
            <button
              onClick={() => addEvent(`Red Card issued to ${name}`, 'CARD')}
              className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold text-xs hover:bg-rose-900"
            >
              Red Card
            </button>
          </>
        )
    }
  }

  return (
    <div className="relative min-h-screen py-8 px-4 text-slate-100 selection:bg-primary selection:text-white">
      {/* 4K Realistic Live Sport Wallpaper & Arena Ambient */}
      <SportLiveBackground sportCode={sportCode} intensity="medium" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white font-medium transition-colors px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/15 backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournament
          </button>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE AUDIT CONSOLE
            </span>
            <span className="text-xs text-slate-300 font-semibold uppercase flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/15 backdrop-blur-md">
              <span>{sportConfig.icon}</span> {sportConfig.name} OFFICIAL SCORER
            </span>
          </div>
        </div>

        {/* Main Scoreboard Banner */}
        <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{m.courtName || `${sportConfig.courtTerminology} 1`}</span>
              <span>•</span>
              <span>{m.roundName || `Round ${m.roundNumber || 1}`}</span>
              <span>•</span>
              <span className="text-slate-400 font-mono">{sportConfig.scoringUnit}</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(m.status)}`}>
              {m.status || 'LIVE'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-4">
            {/* Team 1 */}
            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                {m.sideA && m.sideA !== 'NONE' ? m.sideA : sportConfig.sideAName}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{team1Name}</h2>
            </div>

            {/* Scores & Clock */}
            <div className="flex flex-col items-center justify-center px-8 py-4 bg-slate-950/70 border border-white/15 rounded-2xl min-w-[240px] shadow-lg">
              <div className="flex items-center gap-6">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-primary drop-shadow-md">
                  {team1Score}
                </span>
                <span className="text-3xl font-light text-slate-500">:</span>
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                  {team2Score}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs font-mono font-bold text-slate-300">
                <Clock className={`h-3.5 w-3.5 ${isTimerRunning ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
                <span>{Math.floor(matchTime / 60)}m {matchTime % 60}s</span>
                <span>•</span>
                <span className={isTimerRunning ? 'text-emerald-400' : 'text-amber-400'}>
                  {isTimerRunning ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex-1 text-center sm:text-right">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                {m.sideB && m.sideB !== 'NONE' ? m.sideB : sportConfig.sideBName}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{team2Name}</h2>
            </div>
          </div>

          {/* Timer & Action Bar */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors text-white"
              >
                {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isTimerRunning ? 'Pause Clock' : 'Resume Clock'}
              </button>
              <button
                onClick={() => setMatchTime(0)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-slate-300"
              >
                Reset Clock
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveLiveScore}
                disabled={updateScoreMutation.isPending}
                className="px-5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                {updateScoreMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Live Score
              </button>
              <button
                onClick={handleFinalizeMatch}
                disabled={completeMatchMutation.isPending}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl transition-colors"
              >
                {completeMatchMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Finalize & Conclude Match
              </button>
            </div>
          </div>
        </div>

        {/* Sport-Specific Scorer Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Team 1 Scoring Actions */}
          <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              {team1Name} Actions
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {renderSportActions(1, team1Name)}
            </div>
          </div>

          {/* Middle: Live Event Audit Stream */}
          <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Live Audit Log
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 divide-y divide-white/5">
              {events.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No match events logged yet.</p>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    className="pt-2 flex items-start justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-primary mr-2">{ev.time}</span>
                      <span className="text-slate-200">{ev.text}</span>
                    </div>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 font-bold border border-white/10">
                      {ev.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Team 2 Scoring Actions */}
          <div className="backdrop-blur-xl bg-slate-900/85 border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              {team2Name} Actions
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {renderSportActions(2, team2Name)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

