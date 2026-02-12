/**
 * authService.js - Serviços de autenticação
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * Registra novo usuário
 */
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await createUserInFirestore(userCredential.user);
    return userCredential.user;
  } catch (error) {
    throw new Error(
      error.message || "Erro ao registrar usuário"
    );
  }
};

/**
 * Faz login do usuário
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    await createUserInFirestore(userCredential.user);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message || "Error on login");
  }
};

/**
 * Faz logout do usuário
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message || "Error on logout");
  }
};

/**
 * Cria documento do usuário no Firestore se não existir
 */
export const createUserInFirestore = async (user) => {
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email || "",
        createdAt: serverTimestamp(),
        name: "",
        about: "",
        photoURL: "",
        subscribers: [],
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 * Obtém dados do usuário logado
 */
export const getCurrentUserData = async (userId) => {
  if (!userId) return null;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    return userSnap.exists() ? { uid: userId, ...userSnap.data() } : null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};