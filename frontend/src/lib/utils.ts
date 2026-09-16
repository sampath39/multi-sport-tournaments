import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  }).format(new Date(date))
}

export function slugify(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    LIVE: 'text-green-400 bg-green-500/20 border-green-500/30',
    SCHEDULED: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    COMPLETED: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
    DRAFT: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    REGISTRATION_OPEN: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    CANCELLED: 'text-red-400 bg-red-500/20 border-red-500/30',
    PAUSED: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    WALKOVER: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  }
  return map[status] || 'text-gray-400 bg-gray-500/20 border-gray-500/30'
}

export function getSportColor(sportCode: string) {
  const map: Record<string, { from: string; to: string; text: string }> = {
    CHESS:        { from: '#4f46e5', to: '#7c3aed', text: '#a5b4fc' },
    CRICKET:      { from: '#059669', to: '#10b981', text: '#6ee7b7' },
    FOOTBALL:     { from: '#2563eb', to: '#3b82f6', text: '#93c5fd' },
    BASKETBALL:   { from: '#ea580c', to: '#f97316', text: '#fdba74' },
    BADMINTON:    { from: '#db2777', to: '#ec4899', text: '#f9a8d4' },
    CARROM:       { from: '#92400e', to: '#b45309', text: '#fde68a' },
    VOLLEYBALL:   { from: '#7c3aed', to: '#8b5cf6', text: '#c4b5fd' },
    TABLE_TENNIS: { from: '#dc2626', to: '#ef4444', text: '#fca5a5' },
  }
  return map[sportCode] || { from: '#4b5563', to: '#6b7280', text: '#d1d5db' }
}

export function getSportBadgeColor(sportCode: string): string {
  const map: Record<string, string> = {
    CHESS: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    CRICKET: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    FOOTBALL: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    BASKETBALL: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    BADMINTON: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    CARROM: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    VOLLEYBALL: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    TABLE_TENNIS: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  }
  return map[sportCode] || 'bg-secondary text-muted-foreground border border-border/50'
}


export function getSportIcon(sportCode: string): string {
  const map: Record<string, string> = {
    CHESS: '♟️',
    CRICKET: '🏏',
    FOOTBALL: '⚽',
    BASKETBALL: '🏀',
    BADMINTON: '🏸',
    CARROM: '🎯',
    VOLLEYBALL: '🏐',
    TABLE_TENNIS: '🏓',
  }
  return map[sportCode] || '🏆'
}

export const SPORTS = [
  { code: 'CHESS', name: 'Chess', type: 'INDIVIDUAL', icon: '♟️' },
  { code: 'CRICKET', name: 'Cricket', type: 'TEAM', icon: '🏏' },
  { code: 'FOOTBALL', name: 'Football', type: 'TEAM', icon: '⚽' },
  { code: 'BASKETBALL', name: 'Basketball', type: 'TEAM', icon: '🏀' },
  { code: 'BADMINTON', name: 'Badminton', type: 'INDIVIDUAL', icon: '🏸' },
  { code: 'CARROM', name: 'Carrom', type: 'INDIVIDUAL', icon: '🎯' },
  { code: 'VOLLEYBALL', name: 'Volleyball', type: 'TEAM', icon: '🏐' },
  { code: 'TABLE_TENNIS', name: 'Table Tennis', type: 'INDIVIDUAL', icon: '🏓' },
]


export function getFormatLabel(format: string): string {
  const map: Record<string, string> = {
    SWISS: 'Swiss',
    ROUND_ROBIN: 'Round Robin',
    DOUBLE_ROUND_ROBIN: 'Double Round Robin',
    SINGLE_ELIMINATION: 'Knockout',
    KNOCKOUT: 'Knockout',
    DOUBLE_ELIMINATION: 'Double Elimination',
    GROUP_STAGE_KNOCKOUT: 'Group + Knockout',
    LEAGUE: 'League',
    LEAGUE_AND_PLAYOFF: 'League + Playoff',
    CUSTOM: 'Custom',
  }
  return map[format] || format
}

export function getRecommendedRounds(participants: number, format: string): number {
  if (format === 'SWISS') {
    if (participants <= 8) return 4
    if (participants <= 16) return 5
    if (participants <= 32) return 6
    if (participants <= 64) return 7
    if (participants <= 128) return 8
    return Math.ceil(Math.log2(participants)) + 1
  }
  if (format === 'ROUND_ROBIN') return participants - 1
  if (format === 'SINGLE_ELIMINATION') return Math.ceil(Math.log2(participants))
  return 1
}
