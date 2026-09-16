import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, Users, Trophy, Activity, Calendar,
  Award, Filter, Download
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Platform Competition Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time telemetry across all 8 sports, match schedules, player participation, and tournament velocity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-card border border-border/50 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">All Time (1 Year)</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-lg shadow-primary/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Tournaments', value: '38', change: '+12% this month', icon: Trophy, color: 'text-amber-400' },
          { label: 'Matches Scheduled', value: '2,210', change: '+28% vs last cycle', icon: Activity, color: 'text-emerald-400' },
          { label: 'Registered Competitors', value: '6,480', change: '+450 new athletes', icon: Users, color: 'text-primary' },
          { label: 'Integrity Rating', value: '99.98%', change: '0 dispute flags', icon: Award, color: 'text-cyan-400' },
        ].map((m, idx) => {
          const Icon = m.icon
          return (
            <div
              key={idx}
              className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-xl"
            >
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase">{m.label}</span>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div className="text-3xl font-black font-mono text-foreground">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1.5">{m.change}</div>
            </div>
          )
        })}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tournament Volume by Sport */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-foreground">Matches & Competitions by Sport</h3>
          <p className="text-xs text-muted-foreground">Distribution across all 8 supported disciplines</p>
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sportData}>
                <XAxis dataKey="sport" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="matches" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Velocity Over Time */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-foreground">Match Execution Velocity</h3>
          <p className="text-xs text-muted-foreground">Daily matches completed with real-time audit logging</p>
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Area type="monotone" dataKey="matches" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#velocityGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
