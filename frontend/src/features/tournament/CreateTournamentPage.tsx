import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, Calendar, Users, Shield, MapPin,
  Settings2, Sparkles, AlertCircle, Loader2, ArrowLeft,
  CheckCircle2, BookOpen, Clock, Activity, Coins, Landmark
} from 'lucide-react'
import { tournamentsApi, authApi } from '@/lib/api'
import { SPORTS } from '@/lib/utils'
import { Sport3DCard } from '@/components/sports/Sport3DCard'
import { SportLiveBackground } from '@/components/sports/SportLiveBackground'
import { getSportConfig } from '@/lib/sportConfig'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const createTournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters'),
  sportId: z.string().min(1, 'Please select a sport'),
  competitionType: z.enum([
    'SINGLE_ELIMINATION',
    'DOUBLE_ELIMINATION',
    'ROUND_ROBIN',
    'SWISS',
    'GROUP_STAGE_AND_KNOCKOUT'
  ]),
  tier: z.enum([
    'CASUAL', 'SCHOOL', 'COLLEGE', 'CORPORATE',
    'CLUB', 'ACADEMY', 'COMMUNITY', 'DISTRICT', 'STATE', 'NATIONAL', 'PROFESSIONAL'
  ]),
  description: z.string().optional(),
  maxParticipants: z.coerce.number().min(2, 'At least 2 participants required').max(1024),
  registrationStart: z.string().min(1, 'Registration start date is required'),
  registrationEnd: z.string().min(1, 'Registration end date is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  entryFee: z.coerce.number().min(0).default(0),
  venueName: z.string().optional(),
})

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramSport = searchParams.get('sport')?.toUpperCase()
  const validSport = SPORTS.some(s => s.code === paramSport) ? paramSport! : 'CHESS'

  const [selectedSport, setSelectedSport] = useState<string>(validSport)
  const sportCfg = getSportConfig(selectedSport)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(createTournamentSchema) as any,
    defaultValues: {
      name: '',
      sportId: validSport,
      competitionType: sportCfg.defaultFormat,
      tier: 'CLUB',
      maxParticipants: sportCfg.type === 'TEAM' ? 8 : 16,
      entryFee: 0,
      registrationStart: new Date().toISOString().split('T')[0],
      registrationEnd: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      startDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    }
  })

  const selectedFormat = watch('competitionType')

  // When sport changes, update default format
  const handleSelectSport = (code: string) => {
    setSelectedSport(code)
    setValue('sportId', code)
    const cfg = getSportConfig(code)
    setValue('competitionType', cfg.defaultFormat)
    setValue('maxParticipants', cfg.type === 'TEAM' ? 8 : 16)
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => tournamentsApi.create(data),
    onSuccess: (res: any) => {
      toast.success(`${sportCfg.name} tournament created successfully!`)
      navigate(`/tournaments/${res.id || ''}`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create tournament'
      toast.error(msg)
    }
  })

  const onSubmit = async (data: any) => {
    // Ensure authentication if not already logged in
    const token = useAuthStore.getState().accessToken
    if (!token) {
      try {
        const loginRes = await authApi.login({
          email: 'admin@tournament.io',
          password: 'Password@123'
        })
        useAuthStore.getState().setAuth(loginRes.user, loginRes.accessToken, loginRes.refreshToken)
      } catch (e) {
        console.error('Auto login fallback:', e)
      }
    }
    createMutation.mutate(data)
  }

  return (
    <div className="relative min-h-screen py-8 px-4 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Live Sport Wallpaper Background */}
      <SportLiveBackground sportCode={selectedSport} intensity="medium" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl bg-slate-900/80 border border-white/15 hover:bg-slate-800 transition-colors text-white shadow-md backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 drop-shadow-md">
              <span>Create {sportCfg.name} Tournament</span>
              <span className="text-2xl select-none">{sportCfg.icon}</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
              Configure {sportCfg.name} rules, {sportCfg.courtTerminologyPlural.toLowerCase()}, squad formats, and official tournament matching engines.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 1. Sport Selection with 3D Cards */}
          <div className="backdrop-blur-2xl bg-slate-900/70 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-indigo-400" />
                  <span>1. Select Sport Discipline</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official arena themes, rules, scoring steps, and pairing algorithms update dynamically
                </p>
              </div>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 self-start sm:self-center shadow-xs">
                <span>{sportCfg.icon}</span>
                {sportCfg.name} ({sportCfg.type})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {SPORTS.map((sport: any) => {
                const isSelected = selectedSport === sport.code
                return (
                  <Sport3DCard
                    key={sport.code}
                    sportCode={sport.code}
                    selected={isSelected}
                    onClick={() => handleSelectSport(sport.code)}
                  />
                )
              })}
            </div>
            {errors.sportId && (
              <p className="text-rose-400 text-xs mt-2 flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                {String(errors.sportId?.message || '')}
              </p>
            )}

            {/* Dynamic Sport Rules Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs shadow-inner">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Category & Squad</span>
                <span className="font-bold text-white">{sportCfg.squadSizeDesc}</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Court / Arena</span>
                <span className="font-bold text-white">{sportCfg.courtTerminology} ({sportCfg.sideAName} vs {sportCfg.sideBName})</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Scoring Unit</span>
                <span className="font-bold text-white">{sportCfg.scoringUnit}</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tiebreak Standard</span>
                <span className="font-bold text-white truncate" title={sportCfg.tiebreakDescription}>{sportCfg.tiebreakDescription}</span>
              </div>
            </div>
          </div>

          {/* 2. Basic Information */}
          <div className="backdrop-blur-2xl bg-slate-900/70 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span>2. {sportCfg.name} Tournament Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tournament Title *
                </label>
                <input
                  {...register('name')}
                  placeholder={sportCfg.tournamentTitlePlaceholder}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white font-medium placeholder-slate-500 shadow-inner"
                />
                {errors.name && (
                  <p className="text-rose-400 text-xs mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {String(errors.name?.message || '')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Competition Tier *
                </label>
                <select
                  {...register('tier')}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white font-medium shadow-inner cursor-pointer"
                >
                  <option value="CLUB" className="bg-slate-900 text-white">Club Tournament</option>
                  <option value="COMMUNITY" className="bg-slate-900 text-white">Community / Local</option>
                  <option value="DISTRICT" className="bg-slate-900 text-white">District Official</option>
                  <option value="STATE" className="bg-slate-900 text-white">State Championship</option>
                  <option value="NATIONAL" className="bg-slate-900 text-white">National Open</option>
                  <option value="SCHOOL" className="bg-slate-900 text-white">School Tournament</option>
                  <option value="COLLEGE" className="bg-slate-900 text-white">College / University</option>
                  <option value="CORPORATE" className="bg-slate-900 text-white">Corporate League</option>
                  <option value="ACADEMY" className="bg-slate-900 text-white">Sports Academy</option>
                  <option value="CASUAL" className="bg-slate-900 text-white">Casual / Fun</option>
                  <option value="PROFESSIONAL" className="bg-slate-900 text-white">Professional Tour</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {sportCfg.name} Rules, Time Controls & Regulations
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder={sportCfg.tournamentDescPlaceholder}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white font-medium placeholder-slate-500 shadow-inner resize-none"
              />
            </div>
          </div>

          {/* 3. Format & Pairing System */}
          <div className="backdrop-blur-2xl bg-slate-900/70 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-indigo-400" />
              <span>3. Tournament Format & Matching Engine</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {sportCfg.recommendedFormats.map((f) => (
                <label
                  key={f.id}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedFormat === f.id
                      ? 'border-indigo-500 bg-indigo-600/20 ring-2 ring-indigo-500/40 shadow-xl'
                      : 'border-white/10 bg-slate-950/60 hover:bg-slate-950/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <input
                      type="radio"
                      value={f.id}
                      {...register('competitionType')}
                      className="accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-sm text-white">{f.label}</span>
                  </div>
                  <p className="text-xs text-slate-300 pl-6 leading-relaxed">{f.desc}</p>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Max {sportCfg.competitorsTerm} *
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    {...register('maxParticipants')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white shadow-inner font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Entry Fee (₹ / $)
                </label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    {...register('entryFee')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white shadow-inner font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Venue / {sportCfg.courtTerminology}
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    {...register('venueName')}
                    placeholder={sportCfg.venuePlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500 shadow-inner font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Scheduling */}
          <div className="backdrop-blur-2xl bg-slate-900/70 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <span>4. Dates & Tournament Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Reg. Open *
                </label>
                <input
                  type="date"
                  {...register('registrationStart')}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Reg. Deadline *
                </label>
                <input
                  type="date"
                  {...register('registrationEnd')}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  End Date *
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm focus:outline-none focus:border-indigo-500 text-white shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-2xl border border-white/15 bg-slate-900/80 hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-300 backdrop-blur-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer border border-indigo-400/40"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing Tournament...</span>
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 text-amber-300" />
                  <span>Publish {sportCfg.name} Tournament</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
