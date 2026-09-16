import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Trophy, Zap, Users, Shield, BarChart3, ChevronRight,
  ArrowRight, Star, Globe, Clock, Award
} from 'lucide-react'
import { getSportIcon, getSportColor } from '@/lib/utils'

const SPORTS = [
  { code: 'CHESS', name: 'Chess', desc: 'Swiss, Round Robin' },
  { code: 'CRICKET', name: 'Cricket', desc: 'T20, ODI, Custom' },
  { code: 'FOOTBALL', name: 'Football', desc: 'League, Knockout' },
  { code: 'BASKETBALL', name: 'Basketball', desc: 'Elimination, League' },
  { code: 'BADMINTON', name: 'Badminton', desc: 'All categories' },
  { code: 'CARROM', name: 'Carrom', desc: 'Singles & Doubles' },
  { code: 'VOLLEYBALL', name: 'Volleyball', desc: 'Group + Knockout' },
  { code: 'TABLE_TENNIS', name: 'Table Tennis', desc: 'All formats' },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Smart Pairing Engine',
    desc: 'Swiss, Round Robin, and Knockout engines with constraint-based fairness and full pairing transparency.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Trophy,
    title: 'Live Scoring',
    desc: 'Real-time score entry with WebSocket updates across all sports. Sport-specific scoring screens.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Intelligent Standings',
    desc: 'Configurable tie-breakers, NRR, Buchholz, Sonneborn-Berger, head-to-head, and more.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Shield,
    title: 'Rule Engine',
    desc: 'OFFICIAL, TOURNAMENT, and ADMIN rules clearly classified. Full rule versioning and audit trail.',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    icon: Users,
    title: 'Multi-Role Access',
    desc: 'Admin, Referee, Scorer, Team Manager, Player, and Spectator roles with object-level authorization.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Globe,
    title: 'Any Tournament Type',
    desc: 'Casual, school, college, corporate, club, professional and official — one platform.',
    gradient: 'from-amber-500 to-yellow-600',
  },
]

const TOURNAMENT_TYPES = [
  'Casual', 'School', 'College', 'Corporate', 'Club', 'Academy', 'Community', 'District', 'Professional', 'Official'
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-hero-gradient">
        {/* Background glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/30 text-sm font-medium text-violet-300 mb-8"
            >
              <span className="live-dot">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              Production-grade · 8 Sports · All Formats
            </motion.div>

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="text-white">Run Every</span>{' '}
              <span className="gradient-text">Tournament.</span>
              <br />
              <span className="text-white">One Intelligent</span>{' '}
              <span className="gradient-text-blue">Platform.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Create, schedule, pair, score and manage competitions across multiple sports.
              Swiss, Round Robin, Knockout, Group Stage — fully configurable.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/tournaments/create"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-lg shadow-glow-md hover:shadow-glow-lg transition-all hover:scale-105"
              >
                <Trophy className="w-5 h-5" />
                Create Tournament
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/tournaments"
                className="flex items-center gap-2 px-8 py-4 rounded-xl glass text-white font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Explore Tournaments
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
            >
              {[
                { value: '8', label: 'Sports', icon: Star },
                { value: '10+', label: 'Formats', icon: Trophy },
                { value: '10', label: 'Roles', icon: Users },
                { value: '∞', label: 'Tournaments', icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-4 text-center">
                  <div className="text-2xl font-display font-black gradient-text">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ─── SPORTS ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-black mb-4">
              <span className="gradient-text">8 Sports.</span> One Platform.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Sport-specific engines, scoring, rules, and standings.
              Extensible to new sports without rewriting anything.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {SPORTS.map((sport) => {
              const colors = getSportColor(sport.code)
              return (
                <motion.div
                  key={sport.code}
                  variants={itemVariants}
                  whileHover={{ scale: 1.04, y: -4 }}
                  className="glass-card p-6 text-center cursor-pointer group transition-all hover:border-white/20"
                  style={{
                    background: `linear-gradient(135deg, ${colors.from}15 0%, ${colors.to}10 100%)`,
                    borderColor: `${colors.from}30`,
                  }}
                >
                  <div
                    className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block"
                    role="img" aria-label={sport.name}
                  >
                    {getSportIcon(sport.code)}
                  </div>
                  <h3 className="font-display font-bold text-base mb-1" style={{ color: colors.text }}>
                    {sport.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{sport.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── TOURNAMENT TYPES ─────────────────────────────────────────── */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider font-semibold">
            For every tournament type
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TOURNAMENT_TYPES.map((type) => (
              <motion.span
                key={type}
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-full glass text-sm font-medium border border-white/10 hover:border-violet-500/40 transition-all cursor-default"
              >
                {type}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-black mb-4">
              Everything a Tournament Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From simple 8-player casual tournaments to 1,000-player professional championships.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="glass-card p-6 group hover:border-white/20 transition-all hover:shadow-card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── QUICK SETUP HIGHLIGHT ────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-background to-card/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/30 text-green-400 text-sm font-medium mb-8">
              <Clock className="w-3.5 h-3.5" />
              Create a tournament in 2 minutes
            </div>
            <h2 className="font-display text-4xl font-black mb-6">
              <span className="gradient-text">Simple by default.</span>
              <br />
              Powerful when needed.
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Quick Setup for casual tournaments. Advanced Setup for professionals.
              Custom Rules for unique competitions. Progressive disclosure throughout.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {[
                { label: 'Quick Setup', desc: 'Name, Sport, Players, Format — done.', color: 'from-green-500 to-emerald-600', icon: '⚡' },
                { label: 'Advanced Setup', desc: 'Full control: rounds, scoring, venues, seeding.', color: 'from-blue-500 to-cyan-600', icon: '⚙️' },
                { label: 'Custom Rules', desc: 'Build your own rules with no code required.', color: 'from-violet-500 to-purple-600', icon: '🔧' },
              ].map((mode) => (
                <div key={mode.label} className="glass-card p-5 text-left">
                  <div className="text-2xl mb-3">{mode.icon}</div>
                  <h4 className="font-display font-bold mb-1">{mode.label}</h4>
                  <p className="text-sm text-muted-foreground">{mode.desc}</p>
                </div>
              ))}
            </div>

            <Link
              to="/tournaments/create"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-lg shadow-glow-md hover:shadow-glow-lg transition-all hover:scale-105"
            >
              <Award className="w-5 h-5" />
              Start Your Tournament
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
