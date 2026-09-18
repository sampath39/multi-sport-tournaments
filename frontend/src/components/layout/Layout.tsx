import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Trophy, LayoutDashboard, Calendar, Users, MapPin,
  BarChart3, LogOut, Menu, X, ChevronDown, Bell, Search,
  Plus, Sparkles, Shield, Activity, Radio
} from 'lucide-react'

const navLinks = [
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
  { href: '/venues', label: 'Venues', icon: MapPin, admin: true },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, auth: true },
]

export function Layout() {
  const { user, isAuthenticated, clearAuth, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  const visibleLinks = navLinks.filter(link => {
    if (link.admin && !isAdmin()) return false
    if (link.auth && !isAuthenticated) return false
    return true
  })

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-between">
      {/* ─── Modern Sticky Glass Navbar ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-slate-950/75 backdrop-blur-2xl border-b border-white/10 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20 group-hover:scale-105 transition-all duration-300">
                <Trophy className="w-5 h-5 text-white drop-shadow-md" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors">
                  Tournament<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Pro</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                  Multi-Sport Arena
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              {visibleLinks.map((link) => {
                const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Create Tournament CTA */}
              <Link
                to="/tournaments/create"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 border border-indigo-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Tournament</span>
              </Link>

              {isAuthenticated ? (
                <>
                  {/* Notification Radar */}
                  <Link
                    to="/dashboard"
                    className="relative p-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                    title="Live Tournaments & Alerts"
                  >
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </Link>

                  {/* User Profile Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-2xl bg-slate-900/80 border border-white/15 hover:border-indigo-400/50 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                    >
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
                        {user?.displayName?.[0] || user?.fullName?.[0] || 'U'}
                      </div>
                      <span className="hidden sm:block text-xs font-bold text-slate-200 max-w-[110px] truncate">
                        {user?.displayName || user?.fullName || 'Organizer'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-white/20 py-2 shadow-2xl z-50 text-white divide-y divide-white/10"
                        >
                          <div className="px-4 py-2.5">
                            <p className="text-xs font-black text-white truncate">{user?.fullName || user?.displayName}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                              {user?.roles?.[0] || 'ORGANIZER'}
                            </span>
                          </div>
                          <div className="py-1.5">
                            <Link
                              to="/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-indigo-600/20 hover:text-white transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                              Organizer Dashboard
                            </Link>
                            <Link
                              to="/tournaments/create"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-indigo-600/20 hover:text-white transition-colors sm:hidden"
                            >
                              <Plus className="w-4 h-4 text-emerald-400" />
                              New Tournament
                            </Link>
                          </div>
                          <div className="pt-1.5 px-1">
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                handleLogout()
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {visibleLinks.map((link) => {
                  const isActive = location.pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <link.icon className="w-4 h-4 text-indigo-400" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
                <Link
                  to="/tournaments/create"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Tournament</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Main Content Outlet ────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ─── High-End Modern Footer ─────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-2xl py-12 mt-20 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-8 border-b border-white/10">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="font-display font-black text-lg text-white">TournamentPro</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Next-generation tournament platform supporting Swiss (Dutch FIDE), Knockout, and Round Robin pairing algorithms with real-time live scoring across 8 sports.
              </p>
              <div className="flex items-center gap-2 pt-1 text-slate-400 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Certified FIDE, FIFA & BWF Regulatory Engine Compliant</span>
              </div>
            </div>

            {/* Disciplines column */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">8 Disciplines</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="hover:text-slate-200 transition-colors">♟️ Chess (FIDE Swiss & Rapid)</li>
                <li className="hover:text-slate-200 transition-colors">🏏 Cricket (T20 & ODI)</li>
                <li className="hover:text-slate-200 transition-colors">⚽ Football (FIFA Leagues & Cups)</li>
                <li className="hover:text-slate-200 transition-colors">🏀 Basketball (FIBA 5v5 & 3x3)</li>
                <li className="hover:text-slate-200 transition-colors">🏸 Badminton (BWF Rallies)</li>
                <li className="hover:text-slate-200 transition-colors">🏓 Table Tennis · 🏐 Volleyball · 🎯 Carrom</li>
              </ul>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Quick Navigation</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><Link to="/tournaments" className="hover:text-white transition-colors">Browse Tournaments</Link></li>
                <li><Link to="/tournaments/create" className="hover:text-white transition-colors">Create Tournament</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Organizer Dashboard</Link></li>
                <li><Link to="/analytics" className="hover:text-white transition-colors">Platform Analytics</Link></li>
                <li><Link to="/venues" className="hover:text-white transition-colors">Arena Venues</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
            <p>© {new Date().getFullYear()} TournamentPro Enterprise Platform. All sports rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Matching & Scoring Engine Online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
