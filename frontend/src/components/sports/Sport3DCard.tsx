import React from 'react'
import { motion } from 'framer-motion'

export interface SportInfo {
  code: string
  name: string
  type: string
  icon: string
  tagline: string
  gradient: string
  accentColor: string
  svgPath?: string
}

export const SPORT_3D_DATA: Record<string, SportInfo> = {
  CHESS: {
    code: 'CHESS',
    name: 'Chess',
    type: 'Strategy / Individual',
    icon: '♟️',
    tagline: 'FIDE Swiss & Classical Protocols',
    gradient: 'from-indigo-600 via-purple-600 to-slate-900',
    accentColor: '#6366f1',
  },
  CRICKET: {
    code: 'CRICKET',
    name: 'Cricket',
    type: 'Bat & Ball / Team',
    icon: '🏏',
    tagline: 'T20, ODI & Super Overs',
    gradient: 'from-emerald-600 via-teal-600 to-slate-900',
    accentColor: '#10b981',
  },
  FOOTBALL: {
    code: 'FOOTBALL',
    name: 'Football',
    type: 'Outdoor / Team',
    icon: '⚽',
    tagline: 'FIFA Leagues & Knockouts',
    gradient: 'from-blue-600 via-cyan-600 to-slate-900',
    accentColor: '#3b82f6',
  },
  BASKETBALL: {
    code: 'BASKETBALL',
    name: 'Basketball',
    type: 'Court / Team',
    icon: '🏀',
    tagline: 'FIBA 5v5 & 3x3 Series',
    gradient: 'from-orange-600 via-amber-600 to-slate-900',
    accentColor: '#f97316',
  },
  BADMINTON: {
    code: 'BADMINTON',
    name: 'Badminton',
    type: 'Racket / Singles & Doubles',
    icon: '🏸',
    tagline: 'BWF 21-Point Rallies',
    gradient: 'from-pink-600 via-rose-600 to-slate-900',
    accentColor: '#ec4899',
  },
  CARROM: {
    code: 'CARROM',
    name: 'Carrom',
    type: 'Board / Singles & Doubles',
    icon: '🎯',
    tagline: 'ICF Carrom 29-Point Boards',
    gradient: 'from-amber-700 via-yellow-600 to-slate-900',
    accentColor: '#d97706',
  },
  VOLLEYBALL: {
    code: 'VOLLEYBALL',
    name: 'Volleyball',
    type: 'Indoor & Beach / Team',
    icon: '🏐',
    tagline: 'FIVB 25-Point Sets',
    gradient: 'from-violet-600 via-indigo-600 to-slate-900',
    accentColor: '#8b5cf6',
  },
  TABLE_TENNIS: {
    code: 'TABLE_TENNIS',
    name: 'Table Tennis',
    type: 'Fast Racket / Singles & Doubles',
    icon: '🏓',
    tagline: 'ITTF 11-Point Matches',
    gradient: 'from-red-600 via-rose-600 to-slate-900',
    accentColor: '#ef4444',
  },
}

export function Sport3DBadge({ sportCode, size = 'md' }: { sportCode: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sport = SPORT_3D_DATA[sportCode?.toUpperCase()] || SPORT_3D_DATA.CHESS

  const sizeClasses = {
    sm: 'w-8 h-8 text-base rounded-lg',
    md: 'w-12 h-12 text-2xl rounded-xl',
    lg: 'w-16 h-16 text-3xl rounded-2xl',
    xl: 'w-24 h-24 text-5xl rounded-3xl',
  }[size]

  return (
    <div
      className={`relative inline-flex items-center justify-center ${sizeClasses} shadow-md overflow-hidden bg-gradient-to-br ${sport.gradient} border border-white/20`}
      style={{
        boxShadow: `0 8px 20px -4px ${sport.accentColor}40, inset 0 1px 1px rgba(255,255,255,0.4)`
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <span className="relative z-10 transform hover:scale-110 transition-transform select-none drop-shadow-md">
        {sport.icon}
      </span>
    </div>
  )
}

export function Sport3DCard({
  sportCode,
  selected = false,
  onClick,
}: {
  sportCode: string
  selected?: boolean
  onClick?: () => void
}) {
  const sport = SPORT_3D_DATA[sportCode?.toUpperCase()] || SPORT_3D_DATA.CHESS

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full p-4 rounded-2xl text-left transition-all duration-200 overflow-hidden border ${
        selected
          ? 'bg-white border-primary shadow-xl ring-2 ring-primary/40'
          : 'bg-white/80 hover:bg-white border-slate-200/80 shadow-sm hover:shadow-md'
      }`}
    >
      {/* 3D gradient highlight accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${sport.accentColor}, #ffffff00)` }}
      />

      <div className="flex items-center gap-3.5">
        <Sport3DBadge sportCode={sportCode} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base leading-tight truncate">{sport.name}</h4>
            {selected && (
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{sport.type}</p>
          <span className="inline-block text-[11px] text-slate-400 mt-1 font-mono truncate">
            {sport.tagline}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
