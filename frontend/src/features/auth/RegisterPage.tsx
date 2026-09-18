import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Eye, EyeOff, Loader2, User, Mail, Lock, ArrowRight } from 'lucide-react'
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
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create account')
    }
  })

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100 overflow-hidden select-none selection:bg-indigo-500 selection:text-white">
      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20 group-hover:scale-105 transition-all">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-black text-2xl text-white tracking-tight">
              Tournament<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Pro</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-black text-white mt-6 mb-1">Create an Account</h1>
          <p className="text-slate-400 text-xs">Start running professional tournaments across 8 sports</p>
        </div>

        <div className="backdrop-blur-2xl bg-slate-900/75 border border-white/15 rounded-3xl p-8 shadow-2xl">
          <form
            onSubmit={handleSubmit(({ confirmPassword: _, ...data }) => registerMutation.mutate(data))}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Arjun Sharma"
                  {...register('fullName')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-indigo-500 outline-none transition-all text-sm text-white placeholder-slate-500 shadow-inner font-medium"
                />
              </div>
              {errors.fullName && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="reg-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-indigo-500 outline-none transition-all text-sm text-white placeholder-slate-500 shadow-inner font-medium"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-indigo-500 outline-none transition-all text-sm text-white placeholder-slate-500 shadow-inner font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  {...register('confirmPassword')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-indigo-500 outline-none transition-all text-sm text-white placeholder-slate-500 shadow-inner font-medium"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed border border-indigo-400/40 cursor-pointer mt-2"
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
