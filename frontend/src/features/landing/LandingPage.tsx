import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Trophy, Zap, Users, Shield, BarChart3, ChevronRight,
  ArrowRight, Star, Globe, Clock, Award, Sparkles, CheckCircle2,
  Flame, Compass, Play, Target, Layers, Activity, Radio
} from 'lucide-react'
import { SPORT_3D_DATA, Sport3DObject, Sport3DCard, Sport3DBadge } from '@/components/sports/Sport3DCard'

const FEATURES = [
  {
    icon: Zap,
    title: 'Smart Pairing Engine',
    desc: 'Official Swiss (Dutch FIDE), Round Robin, and Single/Double Knockout engines with automated bye distribution and color balancing.',
    gradient: 'from-indigo-500 to-violet-600',
    accent: 'border-indigo-500/30',
  },
  {
    icon: Trophy,
    title: 'Live Scoring & Scoreboards',
    desc: 'Point-by-point real-time score entry with instant match completion, spectator TV mode, and live broadcast screens.',
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'border-emerald-500/30',
  },
  {
    icon: BarChart3,
    title: 'Automated Leaderboards',
    desc: 'Dynamic standings with Buchholz, Sonneborn-Berger, Goal Difference, Net Run Rate, and head-to-head tie-breakers calculated instantly.',
    gradient: 'from-blue-500 to-cyan-600',
    accent: 'border-blue-500/30',
  },
  {
    icon: Shield,
    title: 'Fair Play & Audit Logs',
    desc: 'Immutable match audit logs, certified arbiter/referee controls, and international federation regulation compliance.',
    gradient: 'from-amber-500 to-orange-600',
    accent: 'border-amber-500/30',
  },
  {
    icon: Users,
    title: 'Multi-Role Access',
    desc: 'Dedicated views for Organizers, Referees, Scorers, Players, and Spectators tailored for maximum ease of use.',
    gradient: 'from-pink-500 to-rose-600',
    accent: 'border-pink-500/30',
  },
  {
    icon: Globe,
    title: 'Any Tournament Tier',
    desc: 'Configurable from casual & club weekend events to school, corporate, district, state, and national opens.',
    gradient: 'from-purple-500 to-violet-600',
    accent: 'border-purple-500/30',
  },
]

const SPORT_DETAILS_META: Record<string, {
  rules: string
  points: string
  tiebreak: string
  matchType: string
  venue: string
}> = {
  CHESS: {
    rules: 'FIDE Handbook · Dutch Swiss & Knockout · Strict Color Balancing',
    points: 'Win = 1.0, Draw = 0.5, Loss = 0.0',
    tiebreak: 'Buchholz Cut-1, Sonneborn-Berger, Direct Encounter',
    matchType: 'Classical, Rapid (15+10), Blitz (3+2)',
    venue: 'Standard Chess Boards 1-64 with Digital Clocks',
  },
  CRICKET: {
    rules: 'ICC Regulation Playing Conditions · Automated Net Run Rate (NRR)',
    points: 'Win = 2 pts, Tie/No Result = 1 pt, Loss = 0 pts',
    tiebreak: 'Net Run Rate (NRR), Head-to-Head, Super Over',
    matchType: 'T20 (20 Overs), T10 Blitz, 50-Over One Day',
    venue: 'Turf Pitch / Poly Grass Ground with Boundary Ropes',
  },
  FOOTBALL: {
    rules: 'FIFA Laws of the Game · Goal Difference & Head-to-Head Table',
    points: 'Win = 3 pts, Draw = 1 pt, Loss = 0 pts',
    tiebreak: 'Goal Difference (+/-), Goals Scored, Head-to-Head',
    matchType: '11v11 Full Pitch (90m), 7v7 Turf (50m), 5v5 Futsal',
    venue: 'Standard FIFA Regulation Turf or Futsal Court',
  },
  BASKETBALL: {
    rules: 'FIBA Official Basketball Rules · 4 Quarters · 24s Shot Clock',
    points: 'Win = 2 pts, Loss = 1 pt (Played), Forfeit = 0 pts',
    tiebreak: 'Head-to-Head Goal Average, Point Differential',
    matchType: '5v5 Full Court (4x10m), 3x3 Half Court (21 pts)',
    venue: 'Hardwood Indoor Court with Glass Backboards',
  },
  BADMINTON: {
    rules: 'BWF Rally Point Scoring · Best of 3 Sets to 21 Points',
    points: 'Match Win = 1 pt, Match Loss = 0 pts',
    tiebreak: 'Set Differential, Point Differential (+/-), Head-to-Head',
    matchType: 'Men/Women Singles, Doubles & Mixed Doubles',
    venue: 'Synthetic Badminton Court with BWF Certified Mats',
  },
  CARROM: {
    rules: 'ICF International Carrom Rules · 8 White, 8 Black, 1 Queen',
    points: 'Board Win = 1-3 pts, Match Win = 2 pts',
    tiebreak: 'Net Boards Differential, Total Coins Pocketed',
    matchType: 'Singles (29 Points / 8 Boards), Doubles Pairs',
    venue: 'Standard Rosewood Frame Carrom Boards',
  },
  VOLLEYBALL: {
    rules: 'FIVB 25-Point Rally System · Best of 3 or 5 Sets (Final Set to 15)',
    points: '3-0/3-1 Win = 3 pts, 3-2 Win = 2 pts, 2-3 Loss = 1 pt',
    tiebreak: 'Set Ratio, Point Ratio, Head-to-Head Results',
    matchType: '6v6 Indoor Court, 2v2 Beach Sand Series',
    venue: 'Indoor Teraflex Volleyball Court with Antennae Net',
  },
  TABLE_TENNIS: {
    rules: 'ITTF 11-Point Deuce System · 2-Serve Rotations',
    points: 'Match Win = 1 pt, Match Loss = 0 pts',
    tiebreak: 'Game Differential, Point Quotient, Head-to-Head',
    matchType: 'Best of 5 or 7 Games (Singles & Doubles)',
    venue: 'ITTF Approved 25mm Competition Tables',
  },
}

const TOURNAMENT_TYPES = [
  'Club Championship', 'School & College', 'Corporate League', 'District Official', 'State Championship', 'National Open', 'Academy Tour'
]

export function LandingPage() {
  const navigate = useNavigate()
  const sportsList = Object.values(SPORT_3D_DATA)
  const [activeSportCode, setActiveSportCode] = useState<string>('FOOTBALL')

  const activeSport = SPORT_3D_DATA[activeSportCode] || SPORT_3D_DATA.FOOTBALL
  const activeMeta = SPORT_DETAILS_META[activeSportCode] || SPORT_DETAILS_META.FOOTBALL

  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden bg-slate-950">
      {/* ─── Soothing Multi-Sport Ambient Background ──────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-20 left-1/3 w-[650px] h-[650px] bg-emerald-600/08 rounded-full blur-[150px]" />
        {/* Subtle Tech Grid Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      </div>

      <div className="relative z-10">
        {/* ─── HERO SECTION ───────────────────────────────────────────── */}
        <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Header Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-black text-indigo-300 mb-6 shadow-sm backdrop-blur-md"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Next-Gen Multi-Sport Tournament Engine · Knockout, Swiss & Round Robin</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-display text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] text-white tracking-tight"
              >
                Master Every Sport. <br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
                  Automated Bracket & Live Scoring Arena.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
              >
                From Round 1 pairings to podium celebration. Real-time sport physics, automated FIDE & FIFA algorithms, live match consoles, and spectator scoreboards.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
              >
                <Link
                  to={`/tournaments/create?sport=${activeSportCode}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all border border-indigo-400/40"
                >
                  <Trophy className="w-5 h-5 text-amber-300" />
                  <span>Create {activeSport.name} Tournament</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/tournaments"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 text-white font-bold text-base transition-all shadow-md backdrop-blur-md hover:scale-[1.02]"
                >
                  <Compass className="w-5 h-5 text-indigo-400" />
                  <span>Explore Tournaments</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </motion.div>
            </div>

            {/* ─── INTERACTIVE 3D MULTI-SPORT STAGE ARENA ──────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="max-w-5xl mx-auto"
            >
              {/* Sport Switcher Tabs */}
              <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none px-2">
                {sportsList.map((sport) => {
                  const isActive = activeSportCode === sport.code
                  return (
                    <button
                      key={sport.code}
                      onClick={() => setActiveSportCode(sport.code)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer border ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-105 border-indigo-400'
                          : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border-white/10 backdrop-blur-md'
                      }`}
                    >
                      <span className="text-base select-none">{sport.icon}</span>
                      <span>{sport.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* 3D Arena Stage Card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900/60 backdrop-blur-2xl shadow-2xl p-6 sm:p-10 perspective-1500 mt-2">
                {/* Dynamic Colored Gradient Accents */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, ${activeSport.accentColor}, #818cf8, #ffffff00)`,
                  }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: 3D Animated Object Showcase */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-6">
                    {/* Glowing 3D Floor Ring */}
                    <div
                      className="absolute w-48 h-20 rounded-full blur-2xl opacity-50 bottom-4 pointer-events-none transition-all duration-500"
                      style={{ backgroundColor: activeSport.accentColor }}
                    />
                    <div className="absolute w-40 h-10 border-2 rounded-full bottom-8 pointer-events-none border-indigo-500/20 rotate-x-60 animate-pulse" />

                    {/* 3D Animated Sport Equipment */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeSportCode}
                        initial={{ scale: 0.7, rotateY: -90, opacity: 0 }}
                        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                        exit={{ scale: 0.7, rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="relative z-10"
                      >
                        <Sport3DObject sportCode={activeSportCode} size="hero" />
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800/80 text-slate-200 border border-white/10 backdrop-blur-md">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        Dynamic Physics & Match Rules
                      </span>
                    </div>
                  </div>

                  {/* Right: Sport Spec Details & Direct CTA */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-ping"
                        style={{ backgroundColor: activeSport.accentColor }}
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                        {activeSport.type}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {activeSport.name} Tournament Suite
                    </h3>

                    <p className="text-sm font-semibold text-slate-300">
                      {activeSport.tagline}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 shadow-inner">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rules & Federation</div>
                        <div className="text-xs font-bold text-white mt-0.5">{activeMeta.rules}</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 shadow-inner">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Points Protocol</div>
                        <div className="text-xs font-bold text-white mt-0.5">{activeMeta.points}</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 shadow-inner">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiebreak Standard</div>
                        <div className="text-xs font-bold text-white mt-0.5">{activeMeta.tiebreak}</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 shadow-inner">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Structure</div>
                        <div className="text-xs font-bold text-white mt-0.5">{activeMeta.matchType}</div>
                      </div>
                    </div>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => navigate(`/tournaments/create?sport=${activeSportCode}`)}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-102 border border-indigo-400/30"
                      >
                        <Trophy className="w-4 h-4 text-amber-300" />
                        <span>Launch {activeSport.name} Event</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to="/tournaments"
                        className="px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-white/15 text-slate-200 font-bold text-xs sm:text-sm transition-all shadow-sm backdrop-blur-md"
                      >
                        View Active Matches
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 8 SPORTS 3D TILES SECTION ─────────────────────────────── */}
        <section className="py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 text-xs font-bold mb-3 shadow-xs">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Interactive 3D Disciplines</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                Explore All 8 Sports Disciplines
              </h2>
              <p className="text-slate-400 text-sm">
                Smooth cursor spring physics and customized tournament setup for each official discipline.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sportsList.map((sport) => (
                <Sport3DCard
                  key={sport.code}
                  sportCode={sport.code}
                  selected={activeSportCode === sport.code}
                  onClick={() => {
                    setActiveSportCode(sport.code)
                    navigate(`/tournaments/create?sport=${sport.code}`)
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ─── PLATFORM CAPABILITIES & FEATURES ───────────────────────── */}
        <section className="py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Engineered For Precision</span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                Seamless Tournament Operations
              </h2>
              <p className="text-slate-400 text-sm">
                From participant enrollment and squad rosters to live scoring and championship trophies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all duration-300 shadow-xl group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-105 transition-transform`}>
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TOURNAMENT TIERS ───────────────────────────────────────── */}
        <section className="py-14 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-6">
              Configurable for Any Tournament Level & Format
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {TOURNAMENT_TYPES.map((type) => (
                <span
                  key={type}
                  className="px-4 py-2 rounded-2xl bg-slate-900/70 border border-white/10 text-slate-300 text-xs font-semibold shadow-sm backdrop-blur-md"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HIGH IMPACT BOTTOM CTA ─────────────────────────────────── */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-slate-900/80 to-violet-900/40 border border-indigo-500/30 backdrop-blur-2xl shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center mx-auto mb-6 text-amber-300 shadow-lg">
                <Trophy className="w-7 h-7" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black mb-4 tracking-tight text-white">
                Ready to Run Your Official Championship?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
                Create an event in seconds. Enroll participants, generate Swiss or Knockout rounds, and broadcast live scores to spectators.
              </p>
              <Link
                to="/tournaments/create"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all border border-indigo-400/40"
              >
                <Trophy className="w-5 h-5 text-amber-300" />
                <span>Create Tournament Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
