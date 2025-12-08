// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAsCmzOUFyOeBBKu-Dcf2DojSJ7VpDgl38",
  authDomain: "makerworks-31c33.firebaseapp.com",
  projectId: "makerworks-31c33",
  storageBucket: "makerworks-31c33.firebasestorage.app",
  messagingSenderId: "247985134020",
  appId: "1:247985134020:web:1ef8a8fb162a540ee92c91",
  measurementId: "G-TX2YPY4ZSV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in App.jsx
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
