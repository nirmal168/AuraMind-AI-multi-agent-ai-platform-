import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversations: [],
    selectedConversation: null,
  },
  reducers: {
    setConversations: (state, action) => {
      state.conversations = Array.isArray(action.payload)
        ? action.payload.filter(c => c && typeof c === 'object' && c._id)
        : [];
    },

    addConversation: (state, action) => {
      if (action.payload && action.payload._id) {
        state.conversations = [
          action.payload,
          ...state.conversations.filter(c => c && c._id && c._id !== action.payload._id)
        ];
      }
    },

    setSelectedConversation: (state, action) => {
      if (action.payload && action.payload._id) {
        state.selectedConversation = action.payload;
      } else {
        state.selectedConversation = null;
      }
    },

    setConversationTitle: (state, action) => {
      const { conversationsId, title } = action.payload || {};
      if (!conversationsId) return;

      state.conversations = state.conversations
        .filter(c => c && c._id)
        .map((conv) => (conv._id === conversationsId ? { ...conv, title } : conv));

      if (state.selectedConversation?._id === conversationsId) {
        state.selectedConversation = {
          ...state.selectedConversation,
          title,
        };
      }
    },

    removeConversation: (state, action) => {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter(
        (conv) => conv && conv._id && conv._id !== conversationId
      );
      if (state.selectedConversation?._id === conversationId) {
        state.selectedConversation = state.conversations[0] || null;
      }
    },
  },
});

export const {
  setConversations,
  addConversation,
  setSelectedConversation,
  setConversationTitle,
  removeConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;