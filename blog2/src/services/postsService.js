/**
 * postsService.js - Serviços para gerenciar posts
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Cria novo post com anexo opcional
 */
export const createPost = async ({
  title,
  content,
  authorId,
  authorEmail,
  attachment = null,
}) => {
  if (!title || !content || !authorId) {
    throw new Error("Título, conteúdo e ID do autor são obrigatórios");
  }

  try {
    // Busca dados atualizados do autor
    const userRef = doc(db, "users", authorId);
    const userSnap = await getDoc(userRef);
    const author = userSnap.exists() ? userSnap.data() : {};

    const postData = {
      title,
      content,
      authorId,
      authorEmail,
      authorName: author.name || "",
      authorPhoto: author.photoURL || "",
      // ✅ NOVO: Armazena dados completos do autor
      authorData: {
        uid: authorId,
        name: author.name || "",
        email: authorEmail,
        photoURL: author.photoURL || "",
        about: author.about || "",
        subscribers: author.subscribers || [],
        createdAt: author.createdAt || serverTimestamp(),
      },
      attachment,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "posts"), postData);
    return { id: docRef.id, ...postData };
  } catch (error) {
    console.error("Erro ao criar post:", error);
    throw error;
  }
};

/**
 * Deleta um post
 */
export const deletePost = async (postId) => {
  if (!postId) throw new Error("ID do post é obrigatório");

  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (error) {
    console.error("Erro ao deletar post:", error);
    throw error;
  }
};

/**
 * Curtir post
 */
export const likePost = async (postId, userId) => {
  if (!postId || !userId) {
    throw new Error("ID do post e do usuário são obrigatórios");
  }

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post não encontrado");
    }

    const data = postSnap.data();
    const likedBy = data.likedBy || [];

    // Evita like duplicado
    if (likedBy.includes(userId)) {
      return false; // Já curtiu
    }

    await updateDoc(postRef, {
      likes: (data.likes || 0) + 1,
      likedBy: arrayUnion(userId),
    });

    return true; // Like adicionado
  } catch (error) {
    console.error("Erro ao curtir post:", error);
    throw error;
  }
};

/**
 * Adiciona comentário ao post
 */
export const addComment = async ({
  postId,
  userId,
  text,
  authorName,
  authorPhoto,
}) => {
  if (!postId || !userId || !text) {
    throw new Error("Post ID, usuário e texto são obrigatórios");
  }

  try {
    const comment = {
      id: crypto.randomUUID(),
      text,
      author: authorName || "",
      authorId: userId,
      authorPhoto: authorPhoto || "",
      upVotes: [],
      downVotes: [],
      createdAt: new Date(),
    };

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      comments: arrayUnion(comment),
    });

    return comment;
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    throw error;
  }
};

/**
 * Vota em um comentário (upvote/downvote)
 */
export const voteComment = async (postId, commentId, voteType, post) => {
  if (!postId || !commentId || !voteType) {
    throw new Error("Post ID, comentário ID e tipo de voto são obrigatórios");
  }

  try {
    const updatedComments = (post.comments || []).map((c) => {
      if (c.id !== commentId) return c;

      let up = c.upVotes || [];
      let down = c.downVotes || [];

      // Remove votos anteriores do usuário
      up = up.filter((id) => id !== localStorage.getItem("userId"));
      down = down.filter((id) => id !== localStorage.getItem("userId"));

      // Adiciona novo voto
      if (voteType === "up") up.push(localStorage.getItem("userId"));
      if (voteType === "down") down.push(localStorage.getItem("userId"));

      return { ...c, upVotes: up, downVotes: down };
    });

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, { comments: updatedComments });
  } catch (error) {
    console.error("Erro ao votar em comentário:", error);
    throw error;
  }
};

/**
 * Atualiza informações do autor em todos os seus posts antigos
 */
export const updateAuthorInfoInPosts = async (
  userId,
  authorName,
  authorPhoto
) => {
  if (!userId) throw new Error("ID do usuário é obrigatório");

  try {
    const postsRef = collection(db, "posts");
    // Nota: Em um cenário real, usaríamos query com where clause
    // Por agora, atualizamos quando necessário durante outras operações
    console.log(
      `Posts do usuário ${userId} serão atualizados quando sync for feito`
    );
  } catch (error) {
    console.error("Erro ao atualizar autor nos posts:", error);
    throw error;
  }
};