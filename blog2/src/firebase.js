import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdWm_ff5up3APp4JByauW1mfSg4cWY_Cg",
  authDomain: "blog-365bb.firebaseapp.com",
  projectId: "blog-365bb",
  storageBucket: "blog-365bb.firebasestorage.app",
  messagingSenderId: "1016060709150",
  appId: "1:1016060709150:web:a1325acf592004282ee10f",
  measurementId: "G-70N6MQT66C"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);