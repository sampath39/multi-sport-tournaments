import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Maximize, Minimize, Tv, Activity,
  Clock, Award, QrCode, ArrowLeft
} from 'lucide-react'
import { tournamentsApi } from '@/lib/api'
import { QRCodeSVG } from 'qrcode.react'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import { getSportConfig } from '@/lib/sportConfig'

export function TvModePage() {
  const { id } = useParams<{ id: string }>()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
  })

  const sportCode = tournament?.sportCode || tournament?.sport?.code || 'CHESS'
  const sportConfig = getSportConfig(sportCode)

  const { data: realMatches = [] } = useQuery({
    queryKey: ['tournament-matches-tv', id],
    queryFn: () => tournamentsApi.getMatches(id!),
    enabled: !!id,
    refetchInterval: 5000,
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const liveMatches = (realMatches && realMatches.length > 0)
    ? realMatches.slice(0, 6).map((m: any) => {
        const mSport = getSportConfig(m.sportCode || tournament?.sportCode)
        return {
          id: m.id,
          court: m.courtName || `${mSport.courtTerminology} ${m.boardNumber || 1}`,
          p1: m.participantA?.displayName || m.participantA?.name || m.player1Name || 'TBD',
          s1: String(m.participantA?.score ?? m.scoreA ?? 0),
          p2: m.participantB?.displayName || m.participantB?.name || m.player2Name || 'TBD',
          s2: String(m.participantB?.score ?? m.scoreB ?? 0),
          sport: mSport.name,
          sportIcon: mSport.icon,
          status: m.status || 'SCHEDULED'
        }
      })
    : [
        { id: '1', court: `${sportConfig.courtTerminology} 1`, p1: 'Competitor Alpha', s1: '2', p2: 'Competitor Bravo', s2: '1', sport: sportConfig.name, sportIcon: sportConfig.icon, status: 'LIVE' },
        { id: '2', court: `${sportConfig.courtTerminology} 2`, p1: 'Lions Team', s1: '180', p2: 'Warriors Club', s2: '165', sport: sportConfig.name, sportIcon: sportConfig.icon, status: 'FINAL' },
        { id: '3', court: `${sportConfig.courtTerminology} 3`, p1: 'Challenger A', s1: '3', p2: 'Challenger B', s2: '2', sport: sportConfig.name, sportIcon: sportConfig.icon, status: 'SET 5' },
      ]

  const publicUrl = window.location.origin + `/tournaments/${id || 'demo'}`

  return (
    <div className="relative min-h-screen text-white p-6 sm:p-10 flex flex-col justify-between select-none">
      {/* 4K Realistic Live Sport Wallpaper */}
      <SportLiveBackground sportCode={sportCode} intensity="vivid" />

      <div className="relative z-10 flex flex-col justify-between min-h-[calc(100vh-5rem)]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-6">
          <div className="flex items-center gap-4">
            <Link
              to={`/tournaments/${id}`}
              className="p-3 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/20 transition-colors backdrop-blur-md shadow-md"
              title="Exit TV Mode"
            >
              <ArrowLeft className="h-6 w-6 text-white/70 hover:text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-black tracking-widest uppercase backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  STADIUM TV BROADCAST
                </span>
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                  {sportConfig.icon} {sportConfig.name} Scoreboard
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1 drop-shadow-md">
                {tournament?.name || 'Grand Championship 2026'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-mono font-black text-white drop-shadow-md">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-300 font-medium uppercase tracking-wider">
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/20 text-white transition-colors backdrop-blur-md shadow-md"
            >
              {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Main Stage: Live Matches Big Cards */}
        <div className="my-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {liveMatches.map((m: any) => (
            <div
              key={m.id}
              className="relative backdrop-blur-xl bg-slate-950/35 border border-white/20 rounded-3xl p-8 shadow-2xl flex flex-col justify-between group hover:border-primary/60 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-300 mb-6">
                  <span>{m.court}</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono shadow-sm">
                    {m.status}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-white">{m.p1}</span>
                    <span className="text-4xl sm:text-5xl font-mono font-black text-primary drop-shadow-md">
                      {m.s1}
                    </span>
                  </div>

                  <div className="h-px bg-white/15" />

                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-white">{m.p2}</span>
                    <span className="text-4xl sm:text-5xl font-mono font-black text-white drop-shadow-md">
                      {m.s2}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>{m.sport} DIVISION</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Activity className="h-3.5 w-3.5" /> LIVE FEED
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Spectator Bar with QR Code */}
        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white p-2 rounded-2xl shadow-xl">
              <QRCodeSVG value={publicUrl} size={64} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-primary">
                Spectator Companion
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                Scan with your phone camera for live mobile scores & brackets
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {publicUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Powered by Production Tournament Engine</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">FIDE / FIFA / ICC Aligned</span>
          </div>
        </div>
      </div>
    </div>
  )
}

