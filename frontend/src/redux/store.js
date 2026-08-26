import { configureStore } from '@reduxjs/toolkit'
import userReducer from "./userSlice"
import conversationSlice from "./conversationSlice"
import messagesSlice from "./messageSlice"
export const store = configureStore({
  reducer: {
        user : userReducer,
        conversation : conversationSlice,
        message:messagesSlice
  },
})