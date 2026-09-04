import { createSlice } from "@reduxjs/toolkit";

const getInitialUser = () => {
  try {
    const cached = localStorage.getItem('auramind_cached_user')
    return cached ? JSON.parse(cached) : null
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