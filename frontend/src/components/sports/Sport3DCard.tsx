import React, { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export interface SportInfo {
  code: string
  name: string
  type: string
  icon: string
  tagline: string
  gradient: string
  accentColor: string
  darkGradient: string
  ambientColor: string
}

export const SPORT_3D_DATA: Record<string, SportInfo> = {
  CHESS: {
    code: 'CHESS',
    name: 'Chess',
    type: 'Grandmaster Strategy',
    icon: '♟️',
    tagline: 'FIDE Swiss & Classical Protocols',
    gradient: 'from-indigo-600 via-purple-600 to-slate-900',
    darkGradient: 'from-slate-900 via-indigo-950 to-slate-900',
    accentColor: '#6366f1',
    ambientColor: 'rgba(99, 102, 241, 0.25)',
  },
  CRICKET: {
    code: 'CRICKET',
    name: 'Cricket',
    type: 'Willow & Leather Pitch',
    icon: '🏏',
    tagline: 'T20, ODI & Super Overs',
    gradient: 'from-emerald-600 via-teal-600 to-slate-900',
    darkGradient: 'from-slate-900 via-emerald-950 to-slate-900',
    accentColor: '#10b981',
    ambientColor: 'rgba(16, 185, 129, 0.25)',
  },
  FOOTBALL: {
    code: 'FOOTBALL',
    name: 'Football',
    type: 'Penta-Hex Turf League',
    icon: '⚽',
    tagline: 'FIFA Leagues & Knockouts',
    gradient: 'from-blue-600 via-cyan-600 to-slate-900',
    darkGradient: 'from-slate-900 via-blue-950 to-slate-900',
    accentColor: '#3b82f6',
    ambientColor: 'rgba(59, 130, 246, 0.25)',
  },
  BASKETBALL: {
    code: 'BASKETBALL',
    name: 'Basketball',
    type: 'Hardwood Arc & Rim',
    icon: '🏀',
    tagline: 'FIBA 5v5 & 3x3 Series',
    gradient: 'from-orange-600 via-amber-600 to-slate-900',
    darkGradient: 'from-slate-900 via-orange-950 to-slate-900',
    accentColor: '#f97316',
    ambientColor: 'rgba(249, 115, 22, 0.25)',
  },
  BADMINTON: {
    code: 'BADMINTON',
    name: 'Badminton',
    type: 'High-Velocity Rally',
    icon: '🏸',
    tagline: 'BWF 21-Point Rallies',
    gradient: 'from-pink-600 via-rose-600 to-slate-900',
    darkGradient: 'from-slate-900 via-pink-950 to-slate-900',
    accentColor: '#ec4899',
    ambientColor: 'rgba(236, 72, 153, 0.25)',
  },
  CARROM: {
    code: 'CARROM',
    name: 'Carrom',
    type: 'Polished Rosewood Board',
    icon: '🎯',
    tagline: 'ICF Carrom 29-Point Boards',
    gradient: 'from-amber-700 via-yellow-600 to-slate-900',
    darkGradient: 'from-slate-900 via-amber-950 to-slate-900',
    accentColor: '#d97706',
    ambientColor: 'rgba(217, 119, 6, 0.25)',
  },
  VOLLEYBALL: {
    code: 'VOLLEYBALL',
    name: 'Volleyball',
    type: 'Beach & Indoor Sets',
    icon: '🏐',
    tagline: 'FIVB 25-Point Sets',
    gradient: 'from-violet-600 via-indigo-600 to-slate-900',
    darkGradient: 'from-slate-900 via-violet-950 to-slate-900',
    accentColor: '#8b5cf6',
    ambientColor: 'rgba(139, 92, 246, 0.25)',
  },
  TABLE_TENNIS: {
    code: 'TABLE_TENNIS',
    name: 'Table Tennis',
    type: 'Spin & Celluloid Speed',
    icon: '🏓',
    tagline: 'ITTF 11-Point Matches',
    gradient: 'from-red-600 via-rose-600 to-slate-900',
    darkGradient: 'from-slate-900 via-red-950 to-slate-900',
    accentColor: '#ef4444',
    ambientColor: 'rgba(239, 68, 68, 0.25)',
  },
}

/**
 * Rich 3D Animated Object component for each sport
 */
export function Sport3DObject({ sportCode, size = 'md' }: { sportCode: string; size?: 'sm' | 'md' | 'lg' | 'hero' }) {
  const sport = SPORT_3D_DATA[sportCode?.toUpperCase()] || SPORT_3D_DATA.CHESS

  const dims = {
    sm: { w: 'w-10 h-10', text: 'text-2xl', ball: 'w-6 h-6' },
    md: { w: 'w-16 h-16', text: 'text-3xl', ball: 'w-10 h-10' },
    lg: { w: 'w-24 h-24', text: 'text-5xl', ball: 'w-16 h-16' },
    hero: { w: 'w-36 h-36', text: 'text-7xl', ball: 'w-24 h-24' },
  }[size]

  return (
    <div className={`relative ${dims.w} flex items-center justify-center perspective-1000 select-none group`}>
      {/* 3D Animated Ambient Glow Halo - 0.3x Speed Smooth Breathing */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
        style={{ backgroundColor: sport.accentColor }}
      />

      {/* 3D Floating Sport Container - 0.3x Speed Smooth Motion */}
      <motion.div
        animate={{
          y: [-4, 4, -4],
          rotateZ: [-1.5, 1.5, -1.5],
          rotateX: [4, -4, 4],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="relative z-10 flex items-center justify-center preserve-3d"
      >
        {/* Dynamic 3D Equipment Renderers */}
        {sport.code === 'FOOTBALL' ? (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
              className={`${dims.text} filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)]`}
            >
              ⚽
            </motion.div>
            <div className="absolute -bottom-2 w-3/4 h-2 bg-black/20 rounded-full blur-xs" />
          </div>
        ) : sport.code === 'BASKETBALL' ? (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                y: [0, -8, 0],
                scale: [1, 0.97, 1],
                rotate: [-4, 6, -4]
              }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`${dims.text} filter drop-shadow-[0_14px_20px_rgba(249,115,22,0.4)]`}
            >
              🏀
            </motion.div>
            <div className="absolute -bottom-2 w-3/4 h-2 bg-orange-950/20 rounded-full blur-xs" />
          </div>
        ) : sport.code === 'CRICKET' ? (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                rotate: [-6, 6, -6],
                y: [-2, 2, -2]
              }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className={`${dims.text} filter drop-shadow-[0_12px_18px_rgba(16,185,129,0.35)]`}
            >
              🏏
            </motion.div>
            <div className="absolute -bottom-2 w-3/4 h-2 bg-black/20 rounded-full blur-xs" />
          </div>
        ) : sport.code === 'CHESS' ? (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                y: [-4, 2, -4],
                rotateY: [-10, 10, -10]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className={`${dims.text} filter drop-shadow-[0_15px_22px_rgba(99,102,241,0.4)]`}
            >
              ♟️
            </motion.div>
            <div className="absolute -bottom-2 w-3/4 h-2 bg-indigo-950/30 rounded-full blur-xs" />
          </div>
        ) : sport.code === 'TABLE_TENNIS' ? (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                rotate: [-8, 8, -8],
                y: [-3, 3, -3]
              }}
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`${dims.text} filter drop-shadow-[0_12px_18px_rgba(239,68,68,0.35)]`}
            >
              🏓
            </motion.div>
          </div>
        ) : sport.code === 'VOLLEYBALL' ? (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                rotate: 360,
                y: [-4, 4, -4]
              }}
              transition={{
                rotate: { duration: 35, repeat: Infinity, ease: 'linear' },
                y: { duration: 8, repeat: Infinity, ease: 'easeInOut' }
              }}
              className={`${dims.text} filter drop-shadow-[0_14px_20px_rgba(139,92,246,0.35)]`}
            >
              🏐
            </motion.div>
          </div>
        ) : sport.code === 'BADMINTON' ? (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                y: [-6, 3, -6],
                rotate: [-10, 8, -10]
              }}
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`${dims.text} filter drop-shadow-[0_12px_18px_rgba(236,72,153,0.35)]`}
            >
              🏸
            </motion.div>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                scale: [0.97, 1.03, 0.97],
                rotate: [-4, 4, -4]
              }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className={`${dims.text} filter drop-shadow-[0_12px_18px_rgba(217,119,6,0.35)]`}
            >
              🎯
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/**
 * 3D Badge with specular highlights and elevation
 */
export function Sport3DBadge({ sportCode, size = 'md' }: { sportCode: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sport = SPORT_3D_DATA[sportCode?.toUpperCase()] || SPORT_3D_DATA.CHESS

  const sizeClasses = {
    sm: 'w-9 h-9 text-lg rounded-xl',
    md: 'w-12 h-12 text-2xl rounded-2xl',
    lg: 'w-16 h-16 text-3xl rounded-3xl',
    xl: 'w-24 h-24 text-5xl rounded-3xl',
  }[size]

  return (
    <div
      className={`relative inline-flex items-center justify-center ${sizeClasses} shadow-lg overflow-hidden bg-gradient-to-br ${sport.gradient} border border-white/30 transform hover:scale-105 transition-all group`}
      style={{
        boxShadow: `0 10px 25px -5px ${sport.accentColor}50, inset 0 2px 2px rgba(255,255,255,0.4)`
      }}
    >
      {/* Specular light sweep */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <span className="relative z-10 select-none drop-shadow-md transform group-hover:scale-115 group-hover:rotate-6 transition-transform">
        {sport.icon}
      </span>
    </div>
  )
}

/**
 * Interactive 3D Card with dynamic cursor tilt
 */
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
  const cardRef = useRef<HTMLButtonElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring physics for buttery-smooth 3D tilt
  const springConfig = { damping: 15, stiffness: 200 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const xPct = (e.clientX - rect.left) / width - 0.5
    const yPct = (e.clientY - rect.top) / height - 0.5
    mouseX.set(xPct)
    mouseY.set(yPct)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative w-full p-4 rounded-3xl text-left transition-all duration-200 overflow-hidden border perspective-1000 group ${
        selected
          ? 'backdrop-blur-xl bg-slate-900/60 border-primary shadow-2xl ring-2 ring-primary/40 text-white'
          : 'backdrop-blur-xl bg-slate-950/35 hover:bg-slate-900/50 border-white/20 hover:border-white/40 shadow-xl text-white'
      }`}
    >
      {/* 3D Colored Rim Highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
        style={{
          background: `linear-gradient(90deg, ${sport.accentColor}, #ffffff00)`,
        }}
      />

      {/* Floating Shimmer Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center gap-3.5 relative z-10 translate-z-20">
        <Sport3DObject sportCode={sportCode} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-base leading-tight truncate group-hover:text-primary transition-colors">
              {sport.name}
            </h4>
            {selected && (
              <span className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/25 animate-pulse" />
            )}
          </div>
          <p className="text-xs text-slate-200 font-semibold truncate mt-0.5">{sport.type}</p>
          <span className="inline-block text-[11px] text-slate-300 mt-1 font-mono truncate">
            {sport.tagline}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

