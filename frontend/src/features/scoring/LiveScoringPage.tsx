import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, ArrowLeft, Play, Pause, RotateCcw,
  CheckCircle2, ShieldAlert, Activity, Users, Send,
  Plus, Minus, Undo2, Clock, Award
} from 'lucide-react'
import { matchesApi } from '@/lib/api'
import { getSportIcon, getSportColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export function LiveScoringPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Match state
  const [sport, setSport] = useState<string>('FOOTBALL')
  const [team1Score, setTeam1Score] = useState<number>(2)
  const [team2Score, setTeam2Score] = useState<number>(1)
  const [matchTime, setMatchTime] = useState<number>(67)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true)
  const [events, setEvents] = useState<Array<{ id: string; time: string; text: string; type: string }>>([
    { id: '1', time: "14'", text: 'Goal scored by Marcus V. (Arsenal)', type: 'GOAL' },
    { id: '2', time: "38'", text: 'Yellow card issued to David S. (Spartans)', type: 'CARD' },
    { id: '3', time: "45+2'", text: 'Half time concluded (1 - 0)', type: 'PERIOD' },
    { id: '4', time: "52'", text: 'Goal scored by Liam T. (Spartans)', type: 'GOAL' },
    { id: '5', time: "64'", text: 'Goal scored by Marcus V. (Arsenal)', type: 'GOAL' },
  ])

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
    setEvents([newEv, ...events])
    toast.success(text)
  }

  const handleGoal = (team: 1 | 2) => {
    if (team === 1) {
      setTeam1Score(prev => prev + 1)
      addEvent('Goal scored for Arsenal Academy!', 'GOAL')
    } else {
      setTeam2Score(prev => prev + 1)
      addEvent('Goal scored for Spartans United!', 'GOAL')
    }
  }

  const handleCard = (team: 1 | 2, cardType: 'Yellow' | 'Red') => {
    addEvent(`${cardType} Card shown to Team ${team}`, 'CARD')
  }

  const handleEndMatch = () => {
    setIsTimerRunning(false)
    toast.success('Match officially ended and verified in audit ledger!')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Match
        </button>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE AUDIT CONSOLE
          </span>
          <span className="text-xs text-muted-foreground">Official Scorer Mode</span>
        </div>
      </div>

      {/* Main Scoreboard Banner */}
      <div className="bg-gradient-to-b from-card to-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Team 1 */}
          <div className="flex-1 text-center sm:text-left">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Home</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">Arsenal Academy</h2>
            <div className="text-xs text-muted-foreground mt-1">Seed #1</div>
          </div>

          {/* Scores & Clock */}
          <div className="flex flex-col items-center justify-center px-8 py-4 bg-secondary/40 border border-border/50 rounded-2xl min-w-[220px]">
            <div className="flex items-center gap-6">
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-primary">
                {team1Score}
              </span>
              <span className="text-3xl font-light text-muted-foreground">:</span>
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-foreground">
                {team2Score}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs font-mono font-bold text-emerald-400">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              <span>{matchTime}:00</span>
              <span className="text-muted-foreground">• 2nd Half</span>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center sm:text-right">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Away</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">Spartans United</h2>
            <div className="text-xs text-muted-foreground mt-1">Seed #3</div>
          </div>
        </div>

        {/* Timer Control Bar */}
        <div className="mt-8 pt-6 border-t border-border/40 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isTimerRunning ? 'Pause Clock' : 'Resume Clock'}
          </button>
          <button
            onClick={() => setMatchTime(prev => Math.max(0, prev - 1))}
            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-xs font-bold"
          >
            -1 Min
          </button>
          <button
            onClick={() => setMatchTime(prev => prev + 1)}
            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-xs font-bold"
          >
            +1 Min
          </button>
          <button
            onClick={handleEndMatch}
            className="px-5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Finalize & Conclude Match
          </button>
        </div>
      </div>

      {/* Sport-Specific Scorer Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Team 1 Scoring Actions */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            Arsenal Academy Actions
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleGoal(1)}
              className="p-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="h-4 w-4" /> Goal (+1)
            </button>
            <button
              onClick={() => setTeam1Score(prev => Math.max(0, prev - 1))}
              className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-muted-foreground text-xs font-bold flex items-center justify-center gap-1"
            >
              <Minus className="h-4 w-4" /> Disallow
            </button>
            <button
              onClick={() => handleCard(1, 'Yellow')}
              className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs"
            >
              Yellow Card
            </button>
            <button
              onClick={() => handleCard(1, 'Red')}
              className="p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs"
            >
              Red Card
            </button>
          </div>
        </div>

        {/* Middle: Live Event Audit Stream */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Live Audit Timeline
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Immutable</span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-xl bg-secondary/30 border border-border/30 flex items-start justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-mono font-bold text-primary mr-2">{ev.time}</span>
                  <span className="text-foreground">{ev.text}</span>
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-secondary font-mono text-muted-foreground">
                  {ev.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Team 2 Scoring Actions */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            Spartans United Actions
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleGoal(2)}
              className="p-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="h-4 w-4" /> Goal (+1)
            </button>
            <button
              onClick={() => setTeam2Score(prev => Math.max(0, prev - 1))}
              className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 text-muted-foreground text-xs font-bold flex items-center justify-center gap-1"
            >
              <Minus className="h-4 w-4" /> Disallow
            </button>
            <button
              onClick={() => handleCard(2, 'Yellow')}
              className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs"
            >
              Yellow Card
            </button>
            <button
              onClick={() => handleCard(2, 'Red')}
              className="p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs"
            >
              Red Card
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
