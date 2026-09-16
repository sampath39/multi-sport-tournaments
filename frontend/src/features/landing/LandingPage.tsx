import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Trophy, Zap, Users, Shield, BarChart3, ChevronRight,
  ArrowRight, Star, Globe, Clock, Award, Sparkles, CheckCircle2
} from 'lucide-react'
import { SPORT_3D_DATA, Sport3DBadge } from '@/components/sports/Sport3DCard'

const FEATURES = [
  {
    icon: Zap,
    title: 'Smart Pairing Engine',
    desc: 'Swiss (Dutch FIDE), Round Robin, and Knockout engines with automated bye distribution and color balancing.',
    gradient: 'from-violet-500 to-indigo-600',
  },
  {
    icon: Trophy,
    title: 'Live Scoring & Scoreboards',
    desc: 'Point-by-point real-time score entry with instant match completion and live broadcast screens.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: BarChart3,
    title: 'Automated Leaderboards',
    desc: 'Dynamic standings with Buchholz, Sonneborn-Berger, head-to-head tie-breakers calculated on the fly.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Shield,
    title: 'Fair Play & Audit Logs',
    desc: 'Immutable audit logs, certified referee controls, and sport regulation compliance.',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    icon: Users,
    title: 'Multi-Role Access',
    desc: 'Organizer, Referee, Scorer, Player, and Spectator views tailored for maximum ease of use.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Globe,
    title: 'Any Tournament Tier',
    desc: 'From casual & club weekend events to district, state, and national opens.',
    gradient: 'from-purple-500 to-violet-600',
  },
]

const TOURNAMENT_TYPES = [
  'Casual', 'School', 'College', 'Corporate', 'Club', 'Academy', 'Community', 'District', 'State', 'National'
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function LandingPage() {
  const sportsList = Object.values(SPORT_3D_DATA)

  return (
    <div className="overflow-hidden bg-background text-slate-900">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 border-b border-slate-200/60">
        {/* Subtle background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-fuchsia-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 mb-6 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Multi-Sport Tournament Engine · 8 Official Disciplines
            </motion.div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] text-slate-900 tracking-tight">
              Create & Run Tournaments. <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Effortless Pairing & Live Scoring.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Organize tournaments from Round 1 to the championship finals. Add competitors, generate automated round fixtures, enter live scores, and stream dynamic leaderboards.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link
                to="/tournaments/create"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-102"
              >
                <Trophy className="w-5 h-5" />
                Create Tournament
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/tournaments"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-base hover:bg-slate-50 transition-all shadow-sm"
              >
                Browse Tournaments
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
            >
              {[
                { value: '8', label: 'Sports', icon: Star },
                { value: 'Swiss & KO', label: 'Pairing Engines', icon: Zap },
                { value: 'Live', label: 'Scoreboards', icon: Trophy },
                { value: '100%', label: 'Automated Rank', icon: Award },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── 3D SPORTS SHOWCASE ───────────────────────────────────────── */}
      <section className="py-20 bg-slate-50/60 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              8 Supported Sports Disciplines
            </h2>
            <p className="text-slate-500 text-sm">
              Each discipline includes official federation rules, tie-break protocols, and custom match formats
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {sportsList.map((sport) => (
              <motion.div
                key={sport.code}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <Sport3DBadge sportCode={sport.code} size="md" />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:text-primary transition-colors">
                      {sport.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{sport.type}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {sport.tagline}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Built For Serious Competition Management
            </h2>
            <p className="text-slate-500 text-sm">
              From participant registration to final podium celebration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 hover:bg-white hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white mb-4 shadow-sm`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOURNAMENT TYPES ─────────────────────────────────────────── */}
      <section className="py-14 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-6">
            Configurable for Any Tournament Level
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TOURNAMENT_TYPES.map((type) => (
              <span
                key={type}
                className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl font-black mb-4 tracking-tight">
            Ready to Run Your Tournament?
          </h2>
          <p className="text-indigo-200 text-base mb-8 max-w-xl mx-auto">
            Create an official event in seconds. Add participants, generate Swiss or Knockout rounds, and keep live scores.
          </p>
          <Link
            to="/tournaments/create"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-slate-950 font-bold text-base shadow-xl hover:bg-slate-100 transition-all hover:scale-102"
          >
            <Trophy className="w-5 h-5 text-indigo-600" />
            Create Tournament Now
          </Link>
        </div>
      </section>
    </div>
  )
}
