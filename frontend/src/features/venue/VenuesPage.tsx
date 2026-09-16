import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Plus, Trophy, Activity, CheckCircle2,
  Calendar, Layers, Sparkles, Search, Filter
} from 'lucide-react'
import { venuesApi } from '@/lib/api'

export function VenuesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const demoVenues = [
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
  ]

  const filtered = demoVenues.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Venues & Court Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage multi-court facilities, pit turf surfaces, lighting schedules, and conflict-free allocations
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 transition-all">
          <Plus className="h-4 w-4" />
          Register New Venue
        </button>
      </div>

      {/* Filter */}
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-4 mb-8 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search venue by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Venue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((venue) => (
          <div
            key={venue.id}
            className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-lg text-foreground">{venue.name}</h3>
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                  {venue.totalCourts} Courts
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{venue.address}, {venue.city}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {venue.sports.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-semibold text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>

              <div className="space-y-2 border-t border-border/40 pt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Court Inventory
                </div>
                {venue.courts.map((court, cIdx) => (
                  <div key={cIdx} className="p-2.5 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{court.name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      court.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {court.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs">
              <button className="text-primary hover:underline font-semibold">
                Manage Courts
              </button>
              <button className="text-muted-foreground hover:text-foreground font-semibold">
                View Schedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
