import { createSlice } from "@reduxjs/toolkit";

const getInitialConversations = () => {
  try {
    const cached = localStorage.getItem('auramind_cached_conversations')
    const parsed = cached ? JSON.parse(cached) : []
    return Array.isArray(parsed) ? parsed.filter(c => c && typeof c === 'object' && c._id) : []
  } catch (e) {
    return []
  }
}

const initialList = getInitialConversations()

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversations: initialList,
    selectedConversation: initialList.length > 0 ? initialList[0] : null,
  },
  reducers: {
    setConversations: (state, action) => {
      const incoming = Array.isArray(action.payload)
        ? action.payload.filter(c => c && typeof c === 'object' && c._id)
        : [];
      if (incoming.length > 0) {
        state.conversations = incoming;
        try {
          localStorage.setItem('auramind_cached_conversations', JSON.stringify(incoming));
        } catch (e) {}
      }
      // Retain existing conversations if incoming is empty (e.g. cold start/network glitch)
    },

    clearConversations: (state) => {
      state.conversations = [];
      state.selectedConversation = null;
      try {
        localStorage.removeItem('auramind_cached_conversations');
        localStorage.removeItem('auramind_cached_selected_conversation');
      } catch (e) {}
    },

    addConversation: (state, action) => {
      if (action.payload && action.payload._id) {
        const updated = [
          action.payload,
          ...state.conversations.filter(c => c && c._id && c._id !== action.payload._id)
        ];
        state.conversations = updated;
        try {
          localStorage.setItem('auramind_cached_conversations', JSON.stringify(updated));
        } catch (e) {}
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

      const updated = state.conversations
        .filter(c => c && c._id)
        .map((conv) => (conv._id === conversationsId ? { ...conv, title } : conv));
      state.conversations = updated;
      try {
        localStorage.setItem('auramind_cached_conversations', JSON.stringify(updated));
      } catch (e) {}

      if (state.selectedConversation?._id === conversationsId) {
        state.selectedConversation = {
          ...state.selectedConversation,
          title,
        };
      }
    },

    removeConversation: (state, action) => {
      const conversationId = action.payload;
      const updated = state.conversations.filter(
        (conv) => conv && conv._id && conv._id !== conversationId
      );
      state.conversations = updated;
      try {
        localStorage.setItem('auramind_cached_conversations', JSON.stringify(updated));
      } catch (e) {}
      if (state.selectedConversation?._id === conversationId) {
        state.selectedConversation = updated[0] || null;
      }
    },
  },
});

export const {
  setConversations,
  clearConversations,
  addConversation,
  setSelectedConversation,
  setConversationTitle,
  removeConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;