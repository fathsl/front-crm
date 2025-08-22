import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCMxnNq-TucsDCblvUrnYxO8M-O9tcJ_gU",
  authDomain: "unixpadel-chat.firebaseapp.com",
  projectId: "unixpadel-chat",
  storageBucket: "unixpadel-chat.firebasestorage.app",
  messagingSenderId: "178898904180",
  appId: "1:178898904180:web:2e895747b78d1e23285d21",
  measurementId: "G-N5PZJDS5LG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);