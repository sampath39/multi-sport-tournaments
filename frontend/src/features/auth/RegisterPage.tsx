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

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterForm, 'confirmPassword'>) => authApi.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success('Account created! Welcome to TournamentPro.')
      navigate('/dashboard')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero-gradient px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-glow-md">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl gradient-text">TournamentPro</span>
          </Link>
          <h1 className="text-2xl font-display font-bold mt-6 mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Start running professional tournaments today</p>
        </div>

        <div className="glass-card p-8">
          <form
            onSubmit={handleSubmit(({ confirmPassword: _, ...data }) => registerMutation.mutate(data))}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="fullName">Full Name</label>
              <input id="fullName" type="text" placeholder="Arjun Sharma" {...register('fullName')}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-sm placeholder:text-muted-foreground" />
              {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" placeholder="you@example.com" {...register('email')}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-sm placeholder:text-muted-foreground" />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="reg-password">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" {...register('password')}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-sm placeholder:text-muted-foreground" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" placeholder="Repeat password" {...register('confirmPassword')}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-sm placeholder:text-muted-foreground" />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={registerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold transition-all hover:shadow-glow-md disabled:opacity-60 mt-2">
              {registerMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
