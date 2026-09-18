import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Plus, Trophy, Activity, CheckCircle2,
  Calendar, Layers, Sparkles, Search, Filter, X,
  Loader2, Building2, Clock, Check, ArrowRight
} from 'lucide-react'
import { venuesApi } from '@/lib/api'
import toast from 'react-hot-toast'

export function VenuesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [selectedVenueForCourts, setSelectedVenueForCourts] = useState<any | null>(null)

  // Form State
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [totalCourts, setTotalCourts] = useState<number>(4)
  const [selectedSports, setSelectedSports] = useState<string[]>(['CRICKET', 'FOOTBALL'])
  const [surfaceType, setSurfaceType] = useState('Hybrid Turf')

  const availableSports = [
    'CRICKET', 'FOOTBALL', 'BASKETBALL', 'VOLLEYBALL',
    'TABLE_TENNIS', 'CARROM', 'CHESS', 'BADMINTON'
  ]

  // Fetch real venues from backend API
  const { data: apiVenues = [], isLoading, refetch } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venuesApi.list(),
  })

  const demoVenues = useMemo(() => [
    {
      id: 'v1',
      name: 'Metropolitan Sports Arena',
      city: 'San Francisco, CA',
      address: '750 Arena Blvd',
      totalCourts: 8,
      sports: ['BADMINTON', 'VOLLEYBALL', 'TABLE_TENNIS', 'BASKETBALL'],
      courts: [
        { name: 'Court 1 (Glass floor)', sport: 'BASKETBALL', status: 'OCCUPIED' },
        { name: 'Court 2 (Pro Hardwood)', sport: 'BADMINTON', status: 'AVAILABLE' },
        { name: 'Court 3 (Pro Hardwood)', sport: 'BADMINTON', status: 'AVAILABLE' },
        { name: 'Table Arena 1', sport: 'TABLE_TENNIS', status: 'AVAILABLE' },
      ]
    },
    {
      id: 'v2',
      name: 'Olympic Park Stadium & Grounds',
      city: 'San Jose, CA',
      address: '1200 Olympic Way',
      totalCourts: 4,
      sports: ['FOOTBALL', 'CRICKET'],
      courts: [
        { name: 'Main Pitch 1 (Hybrid Turf)', sport: 'FOOTBALL', status: 'OCCUPIED' },
        { name: 'Cricket Oval (Natural Turf)', sport: 'CRICKET', status: 'AVAILABLE' },
      ]
    },
    {
      id: 'v3',
      name: 'Grandmaster Chess Club Hall',
      city: 'Palo Alto, CA',
      address: '320 University Ave',
      totalCourts: 32,
      sports: ['CHESS', 'CARROM'],
      courts: [
        { name: 'Hall A (Boards 1-16)', sport: 'CHESS', status: 'AVAILABLE' },
        { name: 'Hall B (Boards 17-32)', sport: 'CHESS', status: 'AVAILABLE' },
        { name: 'Carrom Pavilion', sport: 'CARROM', status: 'AVAILABLE' },
      ]
    }
  ], [])

  // Merge API venues with fallback demo venues
  const allVenues = useMemo(() => {
    const list = [...(Array.isArray(apiVenues) ? apiVenues : [])]
    const formattedApi = list.map((v: any) => ({
      id: v.id || `v-${Math.random()}`,
      name: v.name,
      city: v.city || 'Local District',
      address: v.address || 'Tournament Avenue',
      totalCourts: v.totalCourts || 4,
      sports: v.sports && v.sports.length > 0 ? v.sports : ['CRICKET', 'FOOTBALL'],
      courts: v.courts || [
        { name: 'Arena Court 1', sport: 'GENERAL', status: 'AVAILABLE' },
        { name: 'Arena Court 2', sport: 'GENERAL', status: 'AVAILABLE' }
      ]
    }))

    const existingNames = new Set(formattedApi.map((v: any) => v.name.toLowerCase()))
    const uniqueDemos = demoVenues.filter(d => !existingNames.has(d.name.toLowerCase()))
    return [...formattedApi, ...uniqueDemos]
  }, [apiVenues, demoVenues])

  const filtered = allVenues.filter((v: any) =>
    (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Mutation: Create Venue
  const createVenueMutation = useMutation({
    mutationFn: (data: any) => venuesApi.create(data),
    onSuccess: (newV: any) => {
      toast.success(`Venue "${newV.name || venueName}" registered successfully!`)
      setIsRegisterOpen(false)
      setVenueName('')
      setCity('')
      setAddress('')
      queryClient.invalidateQueries({ queryKey: ['venues'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register venue')
    }
  })

  const handleCreateVenueSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!venueName.trim()) {
      toast.error('Please enter a venue name')
      return
    }

    createVenueMutation.mutate({
      name: venueName.trim(),
      city: city.trim() || 'City Center',
      address: address.trim() || 'Main Boulevard',
      totalCourts: Number(totalCourts) || 4,
    })
  }

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
                <Building2 className="w-3.5 h-3.5" /> Arena & Venue Directory
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Venues & Court Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage multi-court facilities, turf pitches, hall arenas, and automated conflict-free allocations
            </p>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] border border-indigo-400/30 cursor-pointer w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Register New Venue</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search venue by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            {filtered.length} venue{filtered.length !== 1 ? 's' : ''} listed
          </div>
        </div>

        {/* Venue Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((venue: any) => (
            <div
              key={venue.id}
              className="backdrop-blur-xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{venue.name}</h3>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs shrink-0">
                    {venue.totalCourts} Courts
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>{venue.address}, {venue.city}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {(venue.sports || []).map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-950/70 text-[11px] font-bold text-slate-300 border border-white/10">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Court Inventory
                  </div>
                  {(venue.courts || []).map((court: any, cIdx: number) => (
                    <div key={cIdx} className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs font-medium">
                      <span className="text-white">{court.name}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        court.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {court.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedVenueForCourts(venue)
                    toast.success(`Managing court allocations for ${venue.name}`)
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Manage Courts
                </button>
                <button
                  onClick={() => {
                    toast.success(`Schedule active for ${venue.name}. All courts operating at full capacity.`)
                  }}
                  className="text-slate-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5" />
                  View Schedule
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Register Venue Modal */}
        <AnimatePresence>
          {isRegisterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 text-white"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    Register New Arena / Venue
                  </h3>
                  <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateVenueSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Venue / Complex Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Pacific Stadium Complex"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City / Region *</label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Number of Courts / Boards</label>
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={totalCourts}
                        onChange={(e) => setTotalCourts(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 500 Championship Way"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsRegisterOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createVenueMutation.isPending}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md flex items-center gap-1.5"
                    >
                      {createVenueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Register Venue
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
