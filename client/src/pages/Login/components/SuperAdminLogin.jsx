import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { loginSuperAdmin, isAuthenticated } from '../../../lib/auth'
import Button from '../../../components/ui/Button'
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { pudgy,white } from '../../../../public/lottie/lottie';
import { Loader2 } from 'lucide-react';
export default function SuperAdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  
  

  function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const res = loginSuperAdmin({ email, password })
    if (!res.success) {
      setError(res.error || 'Login failed')
      setIsLoading(false)
      return
    }
    navigate('/')
  }

  function handleGoogleLogin() {
    setIsLoading(true)
    setError('')

    const res = loginSuperAdmin({ email: 'admin@roshantraders.com', password: 'google-oauth' })
    if (!res.success) {
      setError('Google authentication failed')
      setIsLoading(false)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl"></div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 w-200">
        <div className=" flex rounded-2xl border bg-white shadow-xl overflow-hidden">
          <div className="flex flex-col justify-between rounded-l-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">

            <div className="items-center gap- mt-5 ml-5">
              <img src={white} alt="Roshan Traders" className="h-13 w-35" />
            </div>
            <DotLottieReact src={pudgy} loop autoplay style={{ width: 260, height: 260 }} />
          </div>
          <div className="p-6 sm:p-8 ">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-center ml-15">Super Admin Login</h1>
              <p className="mt-1 text-sm text-gray-600 ml-23">Sign in with your Gmail account or email</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 ml-15">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 placeholder:text-gray-400"
                  placeholder="admin@roshantraders.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 placeholder:text-gray-400"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-[15px] flex items-center justify-center gap-2 cursor-pointer transition duration-200"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              
            </form>
            <p className="text-xs text-gray-500 text-center mt-4 ml-20">
              By continuing you agree to our <span className="underline underline-offset-2">Terms</span> and <span className="underline underline-offset-2">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}