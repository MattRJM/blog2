/**
 * usePosts.js - Hook para gerenciar posts - COMPLETO COM createdAt
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { collection, query, orderBy, onSnapshot, where, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export function usePosts(authorId = null, limit = 50) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  const fetchPostsWithAuthorData = useCallback(async (snapshot) => {
    try {
      const list = [];
      for (let docItem of snapshot.docs) {
        const data = docItem.data();

        // ✅ NOVO: Buscar dados COMPLETOS do autor
        try {
          const authorSnap = await getDoc(
            doc(db, "users", data.authorId)
          );
          const authorData = authorSnap.exists()
            ? authorSnap.data()
            : {};

          list.push({
            id: docItem.id,
            ...data,
            // Dados básicos (retrocompatibilidade)
            authorName: authorData.name || data.authorEmail || "",
            authorPhoto: authorData.photoURL || "",
            // ✅ NOVO: Dados completos do autor
            authorData: {
              uid: data.authorId,
              name: authorData.name || data.authorEmail || "",
              email: authorData.email || data.authorEmail || "",
              photoURL: authorData.photoURL || "",
              about: authorData.about || "",
              subscribers: authorData.subscribers || [],
              createdAt: authorData.createdAt || null,  // ← NOVO
            },
          });
        } catch (err) {
          console.error(
            "Erro ao buscar dados do autor:",
            err
          );
          // Fallback se não conseguir buscar dados do autor
          list.push({
            id: docItem.id,
            ...data,
            authorName: data.authorEmail || "",
            authorPhoto: "",
            authorData: {
              uid: data.authorId,
              name: data.authorName || data.authorEmail || "",
              email: data.authorEmail || "",
              photoURL: data.authorPhoto || "",
              about: "",
              subscribers: [],
              createdAt: null,
            },
          });
        }
      }
      setPosts(list.slice(0, limit));
      setError(null);
    } catch (err) {
      console.error("Erro ao processar posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    setLoading(true);

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    try {
      const q = authorId
        ? query(
            collection(db, "posts"),
            where("authorId", "==", authorId),
            orderBy("createdAt", "desc")
          )
        : query(
            collection(db, "posts"),
            orderBy("createdAt", "desc")
          );

      unsubRef.current = onSnapshot(
        q,
        fetchPostsWithAuthorData,
        (err) => {
          console.error("Error:", err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      setLoading(false);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [authorId, fetchPostsWithAuthorData, limit]);

  return { posts, loading, error };
}