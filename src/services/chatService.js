/**
 * chatService.js - Serviços para chat
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationsService";

/**
 * Encontra ou cria conversa entre dois usuários
 */
export const findOrCreateConversation = async (
  currentUserId,
  otherUserId
) => {
  if (!currentUserId || !otherUserId) return null;

  try {
    // Busca conversas do usuário atual
    const q = query(
      collection(db, "conversations"),
      where("members", "array-contains", currentUserId),
      orderBy("lastTimestamp", "desc"),
      limit(50)
    );

    const snap = await getDocs(q);

    // Procura conversa com o outro usuário
    for (let d of snap.docs) {
      const data = d.data();
      if (data.members && data.members.includes(otherUserId)) {
        return { id: d.id, ...data };
      }
    }

    // Não existe -> cria nova
    const members = [currentUserId, otherUserId];
    const convRef = await addDoc(collection(db, "conversations"), {
      members,
      lastMessage: "",
      lastTimestamp: serverTimestamp(),
    });

    return { id: convRef.id, members };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

/**
 * Envia mensagem na conversa
 */
export const sendMessage = async ({
  conversationId,
  senderId,
  senderName,
  text,
}) => {
  if (!conversationId || !senderId || !text) {
    throw new Error(
      "Conversa, remetente e mensagem são obrigatórios"
    );
  }

  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    // Adiciona mensagem
    await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });

    // Atualiza última mensagem da conversa
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      lastMessage: text,
      lastTimestamp: serverTimestamp(),
    });

    // Notifica o outro membro
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const data = convSnap.data();
      const otherUserId = (data.members || []).find(
        (m) => m !== senderId
      );

      if (otherUserId) {
        await createNotification({
          toUserId: otherUserId,
          fromUserId: senderId,
          type: "message",
          text: `${senderName || "Alguém"} enviou uma mensagem`,
          meta: { conversationId },
        });
      }
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
};

/**
 * ✅ NOVO: Obtém mensagens de uma conversa
 */
export const getConversationMessages = async (conversationId) => {
  if (!conversationId) {
    throw new Error("Conversa ID é obrigatório");
  }

  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao obter mensagens:", error);
    throw error;
  }
};

/**
 * ✅ NOVO: Escuta mensagens em tempo real
 */
export const listenToMessages = (conversationId, callback) => {
  if (!conversationId) {
    console.error("Conversa ID é obrigatório");
    return () => {};
  }

  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Erro ao escutar mensagens:", error);
    return () => {};
  }
};