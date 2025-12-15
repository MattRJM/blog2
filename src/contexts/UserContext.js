/**
 * UserContext.js - Contexto global de usuário
 */

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { createUserInFirestore } from "../services/authService";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  // Refs para listeners
  const notificationsUnsubRef = useRef(null);
  const conversationsUnsubRef = useRef(null);
  const followingUnsubRef = useRef(null);

  // Limpar listeners
  const cleanupListeners = useCallback(() => {
    if (notificationsUnsubRef.current) {
      notificationsUnsubRef.current();
      notificationsUnsubRef.current = null;
    }
    if (conversationsUnsubRef.current) {
      conversationsUnsubRef.current();
      conversationsUnsubRef.current = null;
    }
    if (followingUnsubRef.current) {
      followingUnsubRef.current();
      followingUnsubRef.current = null;
    }
  }, []);

  // Auth listener principal
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          // Criar usuário no Firestore se não existir
          await createUserInFirestore(u);

          // Carregar dados do usuário
          const userRef = doc(db, "users", u.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCurrentUserData({
              uid: u.uid,
              ...userSnap.data(),
            });
          }

          // Notificações listener
          cleanupListeners();
          const nq = query(
            collection(db, "notifications"),
            where("userId", "==", u.uid),
            orderBy("timestamp", "desc"),
            limit(50)
          );
          notificationsUnsubRef.current = onSnapshot(
            nq,
            (snapshot) => {
              const list = [];
              let unread = 0;
              snapshot.forEach((docItem) => {
                const data = docItem.data();
                list.push({ id: docItem.id, ...data });
                if (!data.isRead) unread++;
              });
              setNotifications(list);
              setUnreadCount(unread);
            },
            (err) => {
              console.error(
                "Erro ao ouvir notificações:",
                err
              );
            }
          );

          // Conversas listener
          const cq = query(
            collection(db, "conversations"),
            where("members", "array-contains", u.uid),
            orderBy("lastTimestamp", "desc")
          );
          conversationsUnsubRef.current = onSnapshot(
            cq,
            (snapshot) => {
              const list = [];
              snapshot.forEach((docItem) =>
                list.push({
                  id: docItem.id,
                  ...docItem.data(),
                })
              );
              setConversations(list);
            },
            (err) => {
              console.error("Erro ao ouvir conversas:", err);
            }
          );

          // Following list listener
          const fq = query(collection(db, "users"));
          followingUnsubRef.current = onSnapshot(
            fq,
            (snapshot) => {
              const list = [];
              snapshot.forEach((docItem) => {
                const data = docItem.data();
                if (data.subscribers?.includes(u.uid)) {
                  list.push({
                    uid: docItem.id,
                    ...data,
                  });
                }
              });
              setFollowingList(list);
            },
            (err) => {
              console.error(
                "Erro ao ouvir lista de seguindo:",
                err
              );
            }
          );
        } catch (error) {
          console.error(
            "Erro ao configurar dados do usuário:",
            error
          );
        }
      } else {
        // Usuário deslogou
        setCurrentUserData(null);
        setNotifications([]);
        setConversations([]);
        setFollowingList([]);
        cleanupListeners();
      }
    });

    return () => unsub();
  }, [cleanupListeners]);

  const value = {
    user,
    currentUserData,
    setCurrentUserData,
    notifications,
    setNotifications,
    unreadCount,
    conversations,
    followingList,
    cleanupListeners,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}