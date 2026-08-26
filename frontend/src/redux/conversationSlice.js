import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversations: [],
    selectedConversation: null,
  },
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },

    addConversation: (state, action) => {
      state.conversations.unshift(action.payload);
    },

    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },

    setConversationTitle: (state, action) => {
      const { conversationsId, title } = action.payload;

      state.conversations = state.conversations.map((conv) =>
        conv._id === conversationsId
          ? { ...conv, title }
          : conv
      );

      if (state.selectedConversation?._id === conversationsId) {
        state.selectedConversation = {
          ...state.selectedConversation,
          title,
        };
      }
    },

    removeConversation: (state, action) => {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter((conv) => conv._id !== conversationId);
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