/**
 * profileService.js - Serviços para gerenciar perfil
 */

import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationsService";

/**
 * Obtém dados do perfil do usuário
 */
export const getProfileData = async (userId) => {
  if (!userId) return null;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    return userSnap.exists()
      ? { uid: userId, ...userSnap.data() }
      : null;
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
};

/**
 * Atualiza perfil do usuário
 */
export const updateProfile = async (
  userId,
  { name, about, photoURL }
) => {
  if (!userId) throw new Error("ID do usuário é obrigatório");

  try {
    const userRef = doc(db, "users", userId);

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (about !== undefined) updates.about = about;
    if (photoURL !== undefined) updates.photoURL = photoURL;

    await updateDoc(userRef, updates);

    // Atualiza posts antigos do usuário (opcional, pode fazer async)
    if (name || photoURL) {
      updateAuthorInfoInOldPosts(userId, name, photoURL).catch((err) =>
        console.error("Erro ao atualizar posts antigos:", err)
      );
    }

    return updates;
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    throw error;
  }
};

/**
 * Atualiza informações do autor em posts antigos
 */
const updateAuthorInfoInOldPosts = async (
  userId,
  authorName,
  authorPhoto
) => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", userId)
    );
    const postsSnap = await getDocs(postsQuery);

    const updates = postsSnap.docs.map((p) => {
      const postRef = doc(db, "posts", p.id);
      const updateData = {};

      if (authorName) updateData.authorName = authorName;
      if (authorPhoto) updateData.authorPhoto = authorPhoto;

      return updateDoc(postRef, updateData);
    });

    await Promise.all(updates);
  } catch (error) {
    console.error("Erro ao atualizar posts antigos:", error);
  }
};

/**
 * Toggle subscribe/unsubscribe de um usuário
 */
export const toggleSubscribe = async (
  profileUserId,
  currentUserId,
  isCurrentlySubscribed
) => {
  if (!profileUserId || !currentUserId) {
    throw new Error("IDs de usuários são obrigatórios");
  }

  try {
    const profileUserRef = doc(db, "users", profileUserId);
    const profileSnap = await getDoc(profileUserRef);

    if (!profileSnap.exists()) {
      throw new Error("Usuário não encontrado");
    }

    const subscribers = profileSnap.data().subscribers || [];

    let newSubscribers;
    if (isCurrentlySubscribed) {
      // Unsubscribe
      newSubscribers = subscribers.filter((id) => id !== currentUserId);
    } else {
      // Subscribe
      newSubscribers = [...subscribers, currentUserId];
    }

    await updateDoc(profileUserRef, { subscribers: newSubscribers });

    // Cria notificação
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserName = currentUserSnap.exists()
      ? currentUserSnap.data().name || ""
      : "";

    await createNotification({
      toUserId: profileUserId,
      fromUserId: currentUserId,
      type: isCurrentlySubscribed ? "unfollow" : "follow",
      text: `${currentUserName || "Alguém"} ${
        isCurrentlySubscribed ? "deixou de seguir" : "começou a seguir"
      } você`,
    });

    return newSubscribers;
  } catch (error) {
    console.error("Erro ao toggle subscribe:", error);
    throw error;
  }
};