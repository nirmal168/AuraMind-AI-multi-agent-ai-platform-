import { api } from "../../utils/axios"
import { signOut } from "firebase/auth"
import { auth } from "../../utils/firebase"

export const logOut = async () => {
  try {
    if (auth) {
      await signOut(auth).catch(() => {})
    }
  } catch (e) {
    console.warn("Firebase sign out error:", e)
  }

  try {
    await api.get("/api/auth/logout").catch(() => {})
  } catch (error) {
    console.warn("Backend logout error:", error)
  }

  try {
    localStorage.removeItem('auramind_session_id')
    localStorage.removeItem('auramind_cached_user')
    localStorage.removeItem('auramind_cached_conversations')
    localStorage.removeItem('auramind_cached_selected_conversation')
  } catch (e) {}
}

export default logOut