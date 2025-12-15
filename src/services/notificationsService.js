/**
 * notificationsService.js - Serviços para notificações
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Cria uma notificação
 */
export const createNotification = async ({
  toUserId,
  fromUserId,
  type,
  text = "",
  meta = {},
}) => {
  // Não notifica a si mesmo
  if (!toUserId || !fromUserId || toUserId === fromUserId) {
    return;
  }

  try {
    await addDoc(collection(db, "notifications"), {
      userId: toUserId,
      fromId: fromUserId,
      type,
      text,
      meta,
      isRead: false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
  }
};

/**
 * Marca notificações como lidas
 */
export const markNotificationsAsRead = async (userId) => {
  if (!userId) return;

  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );

    const snap = await getDocs(q);
    const updates = snap.docs.map((d) =>
      updateDoc(doc(db, "notifications", d.id), { isRead: true })
    );

    await Promise.all(updates);
  } catch (error) {
    console.error("Erro ao marcar notificações como lidas:", error);
  }
};

/**
 * Marca notificações de uma conversa específica como lidas
 */
export const markConversationNotificationsAsRead = async (
  userId,
  conversationId
) => {
  if (!userId || !conversationId) return;

  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );

    const snap = await getDocs(q);

    const updates = snap.docs
      .filter((d) => d.data().meta?.conversationId === conversationId)
      .map((d) => updateDoc(doc(db, "notifications", d.id), { isRead: true }));

    await Promise.all(updates);
  } catch (error) {
    console.error(
      "Erro ao marcar notificações de conversa como lidas:",
      error
    );
  }
};