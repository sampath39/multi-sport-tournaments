import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, Calendar, Users, Shield, MapPin,
  Settings2, Sparkles, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react'
import { tournamentsApi, sportsApi } from '@/lib/api'
import { SPORTS, getSportIcon } from '@/lib/utils'
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

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: sportsApi.getAll,
    initialData: SPORTS,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<any>({
    defaultValues: {
      name: '',
      sportId: 'CHESS',
      competitionType: 'SINGLE_ELIMINATION',
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
      toast.error(err.response?.data?.message || 'Failed to create tournament')
    }
  })

  const onSubmit = (data: any) => {
    createMutation.mutate(data)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-card border border-border/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-muted-foreground">
            Create New Tournament
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure rules, format, scheduling, and official sport-specific parameters
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Sport Selection */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            1. Select Official Sport
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SPORTS.map((sport: any) => {
              const iconEmoji = getSportIcon(sport.code)
              const isSelected = selectedSport === sport.code
              return (
                <button
                  type="button"
                  key={sport.code}
                  onClick={() => {
                    setSelectedSport(sport.code)
                    setValue('sportId', sport.code)
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col items-start gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary shadow-lg shadow-primary/10'
                      : 'border-border/50 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-2xl">{iconEmoji}</span>
                  <div>
                    <div className="font-semibold text-sm">{sport.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{sport.type.toLowerCase()}</div>
                  </div>
                </button>
              )
            })}
          </div>
          {errors.sportId && (
            <p className="text-destructive text-xs mt-2 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {String(errors.sportId?.message || '')}
            </p>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            2. Tournament Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Tournament Title *
              </label>
              <input
                {...register('name')}
                placeholder="e.g. 2026 Spring Grand Prix Championship"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{String(errors.name?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Competition Tier *
              </label>
              <select
                {...register('tier')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="CASUAL">Casual / Fun</option>
                <option value="SCHOOL">School Tournament</option>
                <option value="COLLEGE">College / University</option>
                <option value="CORPORATE">Corporate League</option>
                <option value="CLUB">Club Tournament</option>
                <option value="ACADEMY">Sports Academy</option>
                <option value="COMMUNITY">Community / Local</option>
                <option value="DISTRICT">District Official</option>
                <option value="STATE">State Championship</option>
                <option value="NATIONAL">National Open</option>
                <option value="PROFESSIONAL">Professional Tour</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Description & Tournament Overview
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Provide information on format, awards, rules, eligibility, and equipment guidelines..."
              className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Competition System & Format */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            3. Competition Format & Structure
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'SINGLE_ELIMINATION',
                name: 'Single Elimination',
                desc: 'Knockout bracket with 3rd place playoff. Fast and high stakes.'
              },
              {
                id: 'DOUBLE_ELIMINATION',
                name: 'Double Elimination',
                desc: 'Winners and losers bracket. Requires two losses to be eliminated.'
              },
              {
                id: 'ROUND_ROBIN',
                name: 'Round Robin',
                desc: 'Every team plays every other team. Ranked by standard points table.'
              },
              {
                id: 'SWISS',
                name: 'Swiss System',
                desc: 'FIDE-standard pairings by current score without eliminations.'
              },
              {
                id: 'GROUP_STAGE_AND_KNOCKOUT',
                name: 'Group Stage + Knockout',
                desc: 'Round-robin groups followed by seeded knockout phase.'
              },
            ].map((format) => (
              <label
                key={format.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === format.id
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border/50 bg-secondary/30 hover:bg-secondary/60'
                }`}
              >
                <input
                  type="radio"
                  value={format.id}
                  {...register('competitionType')}
                  className="sr-only"
                />
                <div className="font-semibold text-sm mb-1">{format.name}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{format.desc}</div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Maximum Participants / Teams
              </label>
              <input
                type="number"
                {...register('maxParticipants')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.maxParticipants && (
                <p className="text-destructive text-xs mt-1">{String(errors.maxParticipants?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Entry Fee (USD / Currency Units)
              </label>
              <input
                type="number"
                {...register('entryFee')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Dates */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            4. Timeline & Dates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Reg. Open *
              </label>
              <input
                type="date"
                {...register('registrationStart')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Reg. Deadline *
              </label>
              <input
                type="date"
                {...register('registrationEnd')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Tournament Start *
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Tournament End *
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl border border-border/50 hover:bg-secondary transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing Tournament...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4" />
                Create & Publish Tournament
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
