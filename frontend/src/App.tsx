import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Layout } from '@/components/layout/Layout'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { AdminDashboard } from '@/features/dashboard/AdminDashboard'
import { TournamentsPage } from '@/features/tournament/TournamentsPage'
import { TournamentDetailPage } from '@/features/tournament/TournamentDetailPage'
import { CreateTournamentPage } from '@/features/tournament/CreateTournamentPage'
import { TournamentStandingsPage } from '@/features/standings/TournamentStandingsPage'
import { TournamentBracketPage } from '@/features/bracket/TournamentBracketPage'
import { MatchDetailPage } from '@/features/match/MatchDetailPage'
import { LiveScoringPage } from '@/features/scoring/LiveScoringPage'
import { PlayerProfilePage } from '@/features/player/PlayerProfilePage'
import { TvModePage } from '@/features/tv/TvModePage'
import { VenuesPage } from '@/features/venue/VenuesPage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  const isAdmin = user?.roles?.some(r =>
    ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'TOURNAMENT_ADMIN'].includes(r)
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Tournament TV mode — full screen, no layout */}
      <Route path="/tv/:id" element={<TvModePage />} />

      {/* Main layout routes */}
      <Route element={<Layout />}>
        {/* Public tournament pages */}
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="/tournaments/:id/standings" element={<TournamentStandingsPage />} />
        <Route path="/tournaments/:id/bracket" element={<TournamentBracketPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
        <Route path="/players/:id" element={<PlayerProfilePage />} />

        {/* Protected user routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/tournaments/create" element={
          <AdminRoute><CreateTournamentPage /></AdminRoute>
        } />
        <Route path="/matches/:id/score" element={
          <ProtectedRoute><LiveScoringPage /></ProtectedRoute>
        } />
        <Route path="/venues" element={
          <AdminRoute><VenuesPage /></AdminRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}
