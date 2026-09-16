import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Trophy, LayoutDashboard, Calendar, Users, MapPin,
  BarChart3, LogOut, Menu, X, ChevronDown, Bell, Search
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
    <div className="min-h-screen bg-background">
      {/* ─── Navbar ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-black text-xl text-slate-900 tracking-tight hidden sm:block">
                Tournament<span className="text-primary">Pro</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <link.icon className="w-4 h-4 text-slate-500" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2.5">
              {/* Create Tournament */}
              <Link
                to="/tournaments/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/95 transition-all"
              >
                <span>+ Create Tournament</span>
              </Link>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                  </button>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {user?.displayName?.[0] || user?.fullName?.[0] || 'U'}
                      </div>
                      <span className="hidden sm:block text-xs font-bold text-slate-800 max-w-[120px] truncate">
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
                          className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 py-1.5 shadow-xl z-50 text-slate-800"
                        >
                          <div className="px-3.5 py-2 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || user?.displayName}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              to="/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                              Dashboard
                            </Link>
                          </div>
                          <div className="pt-1 border-t border-slate-100">
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                handleLogout()
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <LogOut className="w-3.5 h-3.5" />
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
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main>
        <Outlet />
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-display font-semibold gradient-text">TournamentPro</span>
              <span className="text-xs text-muted-foreground">— Multi-Sport Tournament Platform</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TournamentPro. Production-grade tournament management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
