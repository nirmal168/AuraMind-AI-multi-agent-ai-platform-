import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'

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

  const handleLogin = async token => {
    try {
      const { data } = await api.post('/api/auth/login', { token })
      console.log('Login success:', data)
      dispatch(setUserData(data))
    } catch (error) {
      console.error('Backend login error:', error)
      const serverMsg = error.response?.data?.message || error.message || 'Failed to connect to backend server'
      setErrorMessage(`Backend error: ${serverMsg}`)
    }
  }

  const googleLogin = async () => {
    setErrorMessage('')
    setLoading(true)
    try {
      const data = await signInWithPopup(auth, googleProvider)
      const token = await data.user.getIdToken()
      await handleLogin(token)
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      if (error.code === 'auth/popup-closed-by-user') {
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
              disabled={loading}
              className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer'
            >
              {loading ? (
                <span className='inline-block w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin'></span>
              ) : (
                <FcGoogle size={15} />
              )}
              {loading ? 'Signing in...' : 'Continue With Google'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
