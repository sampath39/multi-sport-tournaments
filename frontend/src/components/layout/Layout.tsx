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
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-all">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text hidden sm:block">
                TournamentPro
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Search className="w-4 h-4" />
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
                  </button>

                  {/* Create Tournament */}
                  {isAdmin() && (
                    <Link
                      to="/tournaments/create"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-glow-sm hover:shadow-glow-md"
                    >
                      <span>+ Create</span>
                    </Link>
                  )}

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white">
                        {user?.displayName?.[0] || user?.fullName?.[0] || 'U'}
                      </div>
                      <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                        {user?.displayName || user?.fullName}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-48 glass-card py-1 shadow-card"
                        >
                          <div className="px-3 py-2 border-b border-white/10">
                            <p className="text-sm font-medium truncate">{user?.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                          <Link
                            to="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" /> Sign out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Sign in
                  </Link>
                  <Link to="/register" className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-glow-sm">
                    Get started
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
