import { useState, useEffect, useRef } from 'react'
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { FcGoogle } from 'react-icons/fc'
import { Mail, Sparkles, ArrowRight } from 'lucide-react'
import { auth, googleProvider } from '../../utils/firebase'
import { api } from '../../utils/axios'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import SideBar from '../components/SideBar'
import ChatArea from '../components/ChatArea'
import Artifact from '../components/Artifact'

function Home () {
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [emailInput, setEmailInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showEmailFields, setShowEmailFields] = useState(false)
  const isLoggingInRef = useRef(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          setErrorMessage('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleLogin = async (credentials, retries = 2) => {
    if (isLoggingInRef.current || cooldown > 0) return
    isLoggingInRef.current = true
    const payload = typeof credentials === 'string' ? { token: credentials } : credentials
    try {
      setLoading(true)
      const { data } = await api.post('/api/auth/login', payload)
      console.log('Login success:', data)
      if (data?.sessionId) {
        localStorage.setItem('auramind_session_id', data.sessionId)
      }
      dispatch(setUserData(data))
      setErrorMessage('')
    } catch (error) {
      console.error('Backend login error:', error)
      const status = error.response?.status
      if (retries > 0 && (status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || !error.response)) {
        const delay = status === 429 ? 3500 : 3000
        setErrorMessage('Connecting to authentication service...')
        setTimeout(() => {
          isLoggingInRef.current = false
          handleLogin(credentials, retries - 1)
        }, delay)
        return
      }
      if (status === 429) {
        setCooldown(15)
        setErrorMessage('Server connection busy. Please wait a moment...')
        return
      }
      const serverMsg = error.response?.data?.message || error.message || 'Failed to connect to backend server'
      setErrorMessage(`Login notice: ${serverMsg}`)
    } finally {
      isLoggingInRef.current = false
      setLoading(false)
    }
  }

  // Official Firebase Auth State Listener: Captures authenticated state across redirects, popups, and reloads
  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const hasSession = localStorage.getItem('auramind_session_id')
      if (user && !userData && !isLoggingInRef.current && hasSession) {
        try {
          const token = await user.getIdToken()
          await handleLogin({
            token,
            email: user.email,
            name: user.displayName,
            avatar: user.photoURL
          })
        } catch (e) {
          console.warn('Could not retrieve Firebase ID token:', e?.message)
        }
      }
    })
    return () => unsubscribe()
  }, [userData])

  // Handle redirect result on mount (for mobile/safari redirect fallbacks)
  useEffect(() => {
    if (!auth) return
    getRedirectResult(auth)
      .then(async result => {
        if (result?.user && !isLoggingInRef.current) {
          const token = await result.user.getIdToken()
          await handleLogin({
            token,
            email: result.user.email,
            name: result.user.displayName,
            avatar: result.user.photoURL
          })
        }
      })
      .catch(err => {
        console.warn('Redirect result warning:', err?.message)
      })
  }, [])

  // Handle session expired event from axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      console.warn('Session expired event received, prompting re-login')
      dispatch(setUserData(null))
      localStorage.removeItem('auramind_session_id')
    }
    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [dispatch])

  // Google Sign-In with popup + redirect fallback
  const googleLogin = async () => {
    if (loading || isLoggingInRef.current) return
    setErrorMessage('')
    setLoading(true)
    try {
      const popupPromise = signInWithPopup(auth, googleProvider)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Google sign-in timed out. If popup was blocked or hidden, please allow popups or use 1-Click Instant Demo.')), 35000)
      )
      const data = await Promise.race([popupPromise, timeoutPromise])
      if (data?.user) {
        const token = await data.user.getIdToken()
        await handleLogin({
          token,
          email: data.user.email,
          name: data.user.displayName,
          avatar: data.user.photoURL
        })
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectErr) {
          console.error('Redirect fallback error:', redirectErr)
          setErrorMessage('Sign-in popup was blocked. Use Email or Quick Demo Sign-In below.')
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in popup was closed. You can retry or use Email sign-in below.')
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage('Google Sign-In domain authorization in progress. Please use Email or Quick Demo Sign-In.')
      } else {
        setErrorMessage(error.message || 'Failed to sign in with Google. Try Email or 1-Click Demo below.')
      }
    } finally {
      setLoading(false)
      isLoggingInRef.current = false
    }
  }

  // Direct Email / Demo login handler
  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault()
    const emailToUse = emailInput.trim() || 'developer@auramind.ai'
    await handleLogin({
      email: emailToUse,
      name: nameInput.trim() || emailToUse.split('@')[0]
    })
  }

  // 1-Click Quick Demo Sign-in
  const handleQuickDemoLogin = async () => {
    isLoggingInRef.current = false
    setLoading(true)
    await handleLogin({
      email: 'nirmal.dev@auramind.ai',
      name: 'Nirmal Prajapat'
    })
  }

  return (
    <div className='h-screen min-w-0 flex bg-[#0d0f14] text-white overflow-hidden'>
      <SideBar />
      <ChatArea />
      <Artifact />

      {!userData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur'>
          <div className='w-[360px] max-w-[92vw] bg-[#13151c] border border-white/[0.08] rounded-2xl p-6 md:p-7 flex flex-col gap-4 shadow-2xl'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-[18px] font-semibold text-slate-100 tracking-tight flex items-center gap-2'>
                Welcome to AuraMind AI
              </h2>
              <p className='text-[13px] text-slate-400'>
                Sign in to start creating with multi-agent AI.
              </p>
            </div>

            {errorMessage && (
              <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 break-words leading-relaxed'>
                {errorMessage}
              </div>
            )}

            {/* Google Sign-in */}
            <button
              onClick={googleLogin}
              disabled={loading || cooldown > 0}
              className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shadow-sm'
            >
              {loading ? (
                <span className='inline-block w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin' />
              ) : (
                <FcGoogle size={18} />
              )}
              <span>
                {loading
                  ? 'Signing in...'
                  : cooldown > 0
                  ? `Please wait ${cooldown}s...`
                  : 'Continue with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className='flex items-center gap-3 my-1'>
              <div className='flex-1 h-px bg-white/[0.08]' />
              <span className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                OR
              </span>
              <div className='flex-1 h-px bg-white/[0.08]' />
            </div>

            {/* Email / Instant Sign-in Form */}
            {showEmailFields ? (
              <form onSubmit={handleEmailLogin} className='flex flex-col gap-2.5'>
                <input
                  type='email'
                  required
                  placeholder='Enter your email address'
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className='w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all'
                />
                <input
                  type='text'
                  placeholder='Your name (optional)'
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className='w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all'
                />
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer shadow-md shadow-indigo-600/20'
                >
                  <Mail size={15} />
                  <span>Sign In with Email</span>
                </button>
              </form>
            ) : (
              <button
                type='button'
                onClick={() => setShowEmailFields(true)}
                className='w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer'
              >
                <Mail size={14} className='text-indigo-400' />
                <span>Sign in with Email</span>
              </button>
            )}

            {/* Quick 1-Click Demo / Developer Access */}
            <button
              type='button'
              onClick={handleQuickDemoLogin}
              className='w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-indigo-300/90 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 transition-all cursor-pointer'
            >
              <Sparkles size={13} className='text-indigo-400' />
              <span>1-Click Instant Demo Access</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
