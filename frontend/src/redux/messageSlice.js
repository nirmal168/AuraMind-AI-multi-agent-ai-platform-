import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name:"message",
    initialState:{
        messages:[],
        artifacts:[]
    },
    reducers:{
      setMessages : (state,action) => {
        state.messages = action.payload
      },
      addMessage:(state,action) =>{
        state.messages.push(action.payload)
      },
      setArtifacts:(state,action) =>{
        state.artifacts = action.payload
      },
      addFileToArtifact: (state, action) => {
        if (!state.artifacts || state.artifacts.length === 0) {
          state.artifacts = [{
            id: Date.now(),
            type: "Project",
            title: "Imported Project",
            files: [action.payload]
          }]
        } else {
          const files = [...(state.artifacts[0].files || [])]
          const existingIndex = files.findIndex(f => f.name === action.payload.name)
          if (existingIndex >= 0) {
            files[existingIndex] = action.payload
          } else {
            files.push(action.payload)
          }
          state.artifacts[0] = {
            ...state.artifacts[0],
            files
          }
        }
      },
      importProject: (state, action) => {
        state.artifacts = [{
          id: Date.now(),
          type: "Project",
          title: action.payload.title || "Imported Project",
          files: action.payload.files || []
        }]
      }
    }
})

export const { setMessages, addMessage, setArtifacts, addFileToArtifact, importProject } = messageSlice.actions
export default messageSlice.reducer