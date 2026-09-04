import { useState, useEffect, useRef } from 'react'
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth'

import { FcGoogle } from 'react-icons/fc'
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

  const handleLogin = async (token, retries = 2) => {
    if (isLoggingInRef.current || cooldown > 0) return
    isLoggingInRef.current = true
    try {
      setLoading(true)
      const { data } = await api.post('/api/auth/login', { token })
      console.log('Login success:', data)
      if (data?.sessionId) {
        localStorage.setItem('auramind_session_id', data.sessionId)
      }
      dispatch(setUserData(data))
      setErrorMessage('')
    } catch (error) {
      console.error('Backend login error:', error)
      const status = error.response?.status
      if (status === 429) {
        setCooldown(15)
        setErrorMessage('Cloudflare server rate limit active. Please wait 15 seconds for cooldown...')
        return
      }
      if (retries > 0 && (status === 502 || status === 504 || !error.response)) {
        setErrorMessage('Cloud servers are warming up from standby (Render free tier). Retrying in 4 seconds...')
        setTimeout(() => {
          isLoggingInRef.current = false
          handleLogin(token, retries - 1)
        }, 4000)
        return
      }
      const serverMsg = error.response?.data?.message || error.message || 'Failed to connect to backend server'
      setErrorMessage(`Backend error: ${serverMsg}`)
    } finally {
      isLoggingInRef.current = false
      setLoading(false)
    }
  }

  // Listen for auth state changes on mount only
  useEffect(() => {
    // 1. Check redirect result (if returning from redirect)
    getRedirectResult(auth)
      .then(async result => {
        if (result?.user && !isLoggingInRef.current) {
          const token = await result.user.getIdToken()
          await handleLogin(token)
        }
      })
      .catch(err => {
        console.error('Redirect result error:', err)
      })

    // 2. Listen to Firebase auth state directly on mount
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user && !isLoggingInRef.current && !localStorage.getItem('auramind_session_id')) {
        try {
          const token = await user.getIdToken()
          await handleLogin(token)
        } catch (err) {
          console.error('Auth state token error:', err)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const googleLogin = async () => {
    if (loading || isLoggingInRef.current) return
    setErrorMessage('')
    setLoading(true)
    try {
      // Try popup first on all devices (works reliably without 3rd-party cookie issues)
      const data = await signInWithPopup(auth, googleProvider)
      const token = await data.user.getIdToken()
      await handleLogin(token)
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      // If mobile browser blocked popup, fall back to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectErr) {
          console.error('Redirect fallback error:', redirectErr)
          setErrorMessage('Sign-in was blocked by browser. Please allow popups or cookies.')
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in popup was closed before completing.')
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).')
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMessage('Google Sign-in is not enabled in Firebase Console (Authentication > Sign-in method).')
      } else if (error.code === 'auth/configuration-not-found') {
        setErrorMessage('Firebase auth configuration not found. Check your .env Firebase credentials.')
      } else {
        setErrorMessage(error.message || 'Failed to sign in with Google.')
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='h-screen min-w-0 flex bg-[#0d0f14] text-white overflow-hidden'>

       <SideBar/>
       <ChatArea/>
       <Artifact/>


      {!userData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur'>
          <div className='w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>
                Welcome to AuraMind AI
              </h2>

              <p className='text-[13px] text-slate-500'>
                Please login to continue using the app.
              </p>
            </div>

            {errorMessage && (
              <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 break-words'>
                {errorMessage}
              </div>
            )}

            <button
              onClick={googleLogin}
              disabled={loading || cooldown > 0}
              className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer'
            >
              {loading ? (
                <span className='inline-block w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin'></span>
              ) : (
                <FcGoogle size={15} />
              )}
              {loading
                ? 'Signing in...'
                : cooldown > 0
                ? `Please wait ${cooldown}s...`
                : 'Continue With Google'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
