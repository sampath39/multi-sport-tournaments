import React from 'react'
import { getSportConfig } from '../../lib/sportConfig'

interface SportLiveBackgroundProps {
  sportCode?: string | null
  intensity?: 'vivid' | 'medium' | 'subtle'
}

export const SportLiveBackground: React.FC<SportLiveBackgroundProps> = ({
  sportCode,
}) => {
  const sportCfg = getSportConfig(sportCode)

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-slate-950">
      {/* 4K Realistic Full-Color Sport Wallpaper - 100% Bright, Vivid & 0.3x Smooth Slow-Motion */}
      <img
        key={sportCfg.code}
        src={sportCfg.theme.wallpaper}
        alt={`${sportCfg.name} 4K Live Wallpaper`}
        className="w-full h-full object-cover object-center filter brightness-[1.04] contrast-[1.04] saturate-[1.08] animate-stadium-slow transition-all duration-1000"
        onError={(e) => {
          console.warn('Wallpaper failed to load:', sportCfg.theme.wallpaper)
        }}
      />

      {/* Subtle Luminous Stadium Lighting Tint */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 mix-blend-screen pointer-events-none"
        style={{ background: sportCfg.theme.primaryHex }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-15 mix-blend-screen pointer-events-none"
        style={{ background: sportCfg.theme.accentHex }}
      />

      {/* Crystal-Clear Translucent Vignette for Header/Footer Legibility without darkening the stadium */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />
    </div>
  )
}

export default SportLiveBackground



