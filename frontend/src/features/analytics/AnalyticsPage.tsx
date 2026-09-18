import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, Users, Trophy, Activity, Calendar,
  Award, Filter, Download, Sparkles, Shield
} from 'lucide-react'

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d')

  const sportData = [
    { sport: 'Chess', tournaments: 18, matches: 340 },
    { sport: 'Cricket', tournaments: 12, matches: 120 },
    { sport: 'Football', tournaments: 24, matches: 280 },
    { sport: 'Basketball', tournaments: 16, matches: 210 },
    { sport: 'Badminton', tournaments: 30, matches: 520 },
    { sport: 'Carrom', tournaments: 14, matches: 190 },
    { sport: 'Volleyball', tournaments: 10, matches: 140 },
    { sport: 'Table Tennis', tournaments: 22, matches: 410 },
  ]

  const activityTrend = [
    { date: 'Sep 1', matches: 18 },
    { date: 'Sep 5', matches: 34 },
    { date: 'Sep 9', matches: 52 },
    { date: 'Sep 13', matches: 48 },
    { date: 'Sep 17', matches: 75 },
    { date: 'Sep 21', matches: 92 },
    { date: 'Sep 25', matches: 110 },
  ]

  const tierDistribution = [
    { name: 'Club / Academy', value: 45, color: '#8b5cf6' },
    { name: 'School / College', value: 30, color: '#06b6d4' },
    { name: 'Corporate', value: 15, color: '#10b981' },
    { name: 'State / National', value: 10, color: '#f59e0b' },
  ]

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-500 selection:text-white bg-slate-950">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Multi-Sport Intelligence Hub
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Platform Competition Analytics
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time telemetry across all 8 sports, match schedules, player participation, and tournament velocity
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">All Time (1 Year)</option>
            </select>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs shadow-xl shadow-indigo-600/25 flex items-center gap-1.5 transition-all border border-indigo-400/30 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Tournaments', value: '38', change: '+12% this month', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
            { label: 'Matches Scheduled', value: '2,210', change: '+28% vs last cycle', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
            { label: 'Registered Competitors', value: '6,480', change: '+450 new athletes', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/30' },
            { label: 'Integrity Rating', value: '99.98%', change: '0 dispute flags', icon: Award, color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' },
          ].map((m, idx) => {
            const Icon = m.icon
            return (
              <div
                key={idx}
                className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
                  <div className={`p-2 rounded-xl border ${m.bg} ${m.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono text-white">{m.value}</div>
                <div className="text-xs text-slate-400 mt-1.5 font-medium">{m.change}</div>
              </div>
            )
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matches by Sport */}
          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Matches Scheduled by Sport Discipline</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sportData}>
                  <XAxis dataKey="sport" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '1rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="matches" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Trend */}
          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Match Velocity Trend</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrend}>
                  <defs>
                    <linearGradient id="colorMatch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '1rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="matches" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMatch)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
