import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success(`Welcome back, ${data.user.displayName || data.user.fullName}!`)
      navigate('/dashboard')
    },
    onError: () => {
      toast.error('Invalid email or password')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero-gradient px-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-glow-md">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl gradient-text">TournamentPro</span>
          </Link>
          <h1 className="text-2xl font-display font-bold mt-6 mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to manage your tournaments</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-sm placeholder:text-muted-foreground"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-sm placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold transition-all hover:shadow-glow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium">
              Get started free
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
