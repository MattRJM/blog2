/**
 * useChat.js - Hook para chat
 */

import { useContext, useCallback } from "react";
import { UserContext } from "../contexts/UserContext";
import * as chatService from "../services/chatService";

export function useChat() {
  const { conversations, user } = useContext(UserContext);

  const findOrCreateConversation = useCallback(
    async (otherUserId) => {
      if (!user) return null;
      return await chatService.findOrCreateConversation(
        user.uid,
        otherUserId
      );
    },
    [user]
  );

  const sendMessage = useCallback(
    async (conversationId, text) => {
      if (!user) return;
      return await chatService.sendMessage({
        conversationId,
        senderId: user.uid,
        senderName: user.email,
        text,
      });
    },
    [user]
  );

  return {
    conversations,
    findOrCreateConversation,
    sendMessage,
  };
}