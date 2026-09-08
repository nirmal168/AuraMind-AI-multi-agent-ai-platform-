import { createSlice } from "@reduxjs/toolkit";

const getInitialUser = () => {
  try {
    const sessionId = localStorage.getItem('auramind_session_id')
    if (!sessionId) {
      localStorage.removeItem('auramind_cached_user')
      return null
    }
    const cached = localStorage.getItem('auramind_cached_user')
    if (cached) return JSON.parse(cached)

    // Decode user profile directly from JWT session token if available
    const parts = sessionId.split('.')
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(jsonStr)
      if (payload && (payload._id || payload.userId || payload.email)) {
        return payload
      }
    }
    return null
  } catch (e) {
    return null
  }
}

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: getInitialUser()
    },
    reducers: {
      setUserData: (state, action) => {
        state.userData = action.payload
        try {
          if (action.payload) {
            localStorage.setItem('auramind_cached_user', JSON.stringify(action.payload))
          } else {
            localStorage.removeItem('auramind_cached_user')
          }
        } catch (e) {}
      }
    }
})

export const { setUserData } = userSlice.actions
export default userSlice.reducer 