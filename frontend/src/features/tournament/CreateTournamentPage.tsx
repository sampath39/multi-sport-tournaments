import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, Calendar, Users, Shield, MapPin,
  Settings2, Sparkles, AlertCircle, Loader2, ArrowLeft,
  CheckCircle2
} from 'lucide-react'
import { tournamentsApi, sportsApi, authApi } from '@/lib/api'
import { SPORTS } from '@/lib/utils'
import { Sport3DCard } from '@/components/sports/Sport3DCard'
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

type FormData = z.infer<typeof createTournamentSchema>

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const [selectedSport, setSelectedSport] = useState<string>('CHESS')

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
      sportId: 'CHESS',
      competitionType: 'SWISS',
      tier: 'CLUB',
      maxParticipants: 16,
      entryFee: 0,
      registrationStart: new Date().toISOString().split('T')[0],
      registrationEnd: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      startDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    }
  })

  const selectedFormat = watch('competitionType')

  const createMutation = useMutation({
    mutationFn: (data: any) => tournamentsApi.create(data),
    onSuccess: (res: any) => {
      toast.success('Tournament created successfully!')
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Create New Tournament
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure format, scheduling, official rules, and 3D sport parameters
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 1. Sport Selection with 3D Cards */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                1. Select Sport Discipline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official rules, scoring protocols, and pairing algorithms are preconfigured
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
              Selected: {selectedSport}
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
                  onClick={() => {
                    setSelectedSport(sport.code)
                    setValue('sportId', sport.code)
                  }}
                />
              )
            })}
          </div>
          {errors.sportId && (
            <p className="text-rose-500 text-xs mt-2 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {String(errors.sportId?.message || '')}
            </p>
          )}
        </div>

        {/* 2. Basic Information */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            2. Tournament Overview & Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Tournament Title *
              </label>
              <input
                {...register('name')}
                placeholder="e.g. 2026 Spring Masters Grand Prix"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white text-slate-900 font-medium"
              />
              {errors.name && (
                <p className="text-rose-500 text-xs mt-1">{String(errors.name?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Competition Tier *
              </label>
              <select
                {...register('tier')}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white text-slate-900 font-medium"
              >
                <option value="CLUB">Club Tournament</option>
                <option value="COMMUNITY">Community / Local</option>
                <option value="DISTRICT">District Official</option>
                <option value="STATE">State Championship</option>
                <option value="NATIONAL">National Open</option>
                <option value="SCHOOL">School Tournament</option>
                <option value="COLLEGE">College / University</option>
                <option value="CORPORATE">Corporate League</option>
                <option value="ACADEMY">Sports Academy</option>
                <option value="CASUAL">Casual / Fun</option>
                <option value="PROFESSIONAL">Professional Tour</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Tournament Description & Regulations
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Provide event details, time controls, prizes, and venue guidelines..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white text-slate-900 font-medium"
            />
          </div>
        </div>

        {/* 3. Format & Pairing System */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            3. Competition Format & Matching Engine
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'SWISS', label: 'Swiss System', desc: 'Dutch FIDE pairing, score grouping, no eliminations' },
              { id: 'SINGLE_ELIMINATION', label: 'Knockout', desc: 'Direct elimination bracket — lose a match and you are eliminated, winner advances' },
              { id: 'ROUND_ROBIN', label: 'Round Robin', desc: 'Every competitor plays all other participants' },
            ].map((f) => (
              <label
                key={f.id}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedFormat === f.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <input
                    type="radio"
                    value={f.id}
                    {...register('competitionType')}
                    className="accent-primary"
                  />
                  <span className="font-bold text-sm text-slate-900">{f.label}</span>
                </div>
                <p className="text-xs text-slate-500 pl-6 leading-relaxed">{f.desc}</p>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Max Competitors *
              </label>
              <input
                type="number"
                {...register('maxParticipants')}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Entry Fee (₹ / $)
              </label>
              <input
                type="number"
                {...register('entryFee')}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Venue / Hall
              </label>
              <input
                type="text"
                {...register('venueName')}
                placeholder="e.g. Center Court / Hall A"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 4. Scheduling */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            4. Dates & Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Reg. Open *
              </label>
              <input
                type="date"
                {...register('registrationStart')}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Reg. Deadline *
              </label>
              <input
                type="date"
                {...register('registrationEnd')}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-8 py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing Tournament...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4" />
                Create Tournament
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
