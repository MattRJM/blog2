import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubData = null;

    // Listener de autenticação
    const unsubAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);

        // ✅ LISTENER em tempo real para dados do usuário
        const userRef = doc(db, "users", authUser.uid);
        unsubData = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setCurrentUserData({
              uid: authUser.uid,
              ...snapshot.data(),
            });
          }
        });

        setLoading(false);
      } else {
        setUser(null);
        setCurrentUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubData) unsubData();
    };
  }, []);

  // ✅ FUNÇÃO DE LOGIN
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ✅ FUNÇÃO DE REGISTRO
  const register = async (email, password, userData = {}) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // ✅ Criar documento do usuário no Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: userData.name || email.split("@")[0],
        photoURL: userData.photoURL || null,
        about: userData.about || "",
        createdAt: new Date(),
        subscribers: [],
        subscriptions: [],
      });

      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ✅ FUNÇÃO DE LOGOUT
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setCurrentUserData(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

const displayName =
    currentUserData?.name || user?.email || "Usuário";
  
  return {
    user,
    currentUserData,
    loading,
    error,
    login,
    register,
    logout,
    displayName,
  };
};