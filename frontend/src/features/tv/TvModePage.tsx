import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Maximize, Minimize, Tv, Activity,
  Clock, Award, QrCode, ArrowLeft
} from 'lucide-react'
import { tournamentsApi } from '@/lib/api'
import { QRCodeSVG } from 'qrcode.react'

export function TvModePage() {
  const { id } = useParams<{ id: string }>()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
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

  const liveMatches = [
    { id: '1', court: 'Center Court / Board 1', p1: 'Magnus K.', s1: '1', p2: 'Hikaru N.', s2: '0', sport: 'CHESS', status: 'FINAL' },
    { id: '2', court: 'Pitch 1 - Championship', p1: 'Arsenal Academy', s1: '2', p2: 'Spartans United', s2: '1', sport: 'FOOTBALL', status: 'LIVE 68\'' },
    { id: '3', court: 'Arena 2 - Table 4', p1: 'Golden Hawks', s1: '18', p2: 'Thunderbolts', s2: '16', sport: 'BADMINTON', status: 'SET 3' },
  ]

  const publicUrl = window.location.origin + `/tournaments/${id || 'demo'}`

  return (
    <div className="min-h-screen bg-[#070709] text-white p-6 sm:p-10 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/tournaments/${id}`}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Exit TV Mode"
          >
            <ArrowLeft className="h-6 w-6 text-white/70 hover:text-white" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                STADIUM TV BROADCAST
              </span>
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                Official Scoreboard
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
              {tournament?.name || 'Grand Championship 2026'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-xs text-white/50 font-medium uppercase tracking-wider">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
          >
            {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Main Stage: Live Matches Big Cards */}
      <div className="my-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {liveMatches.map((m) => (
          <div
            key={m.id}
            className="relative bg-gradient-to-b from-white/10 to-white/5 border border-white/15 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/60 mb-6">
                <span>{m.court}</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {m.status}
                </span>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-white">{m.p1}</span>
                  <span className="text-4xl sm:text-5xl font-mono font-black text-primary">
                    {m.s1}
                  </span>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-white">{m.p2}</span>
                  <span className="text-4xl sm:text-5xl font-mono font-black text-white">
                    {m.s2}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40 font-semibold">
              <span>{m.sport} DIVISION</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Activity className="h-3.5 w-3.5" /> LIVE FEED
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Spectator Bar with QR Code */}
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-white p-2 rounded-2xl shadow-lg">
            <QRCodeSVG value={publicUrl} size={64} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-primary">
              Spectator Companion
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              Scan with your phone camera for live mobile scores & brackets
            </div>
            <div className="text-xs text-white/40 font-mono mt-0.5">
              {publicUrl}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>Powered by Production Tournament Engine</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">FIDE / FIFA / ICC Aligned</span>
        </div>
      </div>
    </div>
  )
}
