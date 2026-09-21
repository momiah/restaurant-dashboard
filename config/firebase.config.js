// Platform Firebase project (shared across all restaurants). Config comes from
// EXPO_PUBLIC_* env vars where set (see .env.example); the fallbacks keep local
// development working. Data is scoped by restaurantId, and each owner is tied to
// one restaurant via the owners/{uid} mapping.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const env = process.env;

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD3ehzE8DkNklEK5f3X_mZvSm7ULTcqtdY",
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "tacomonster-a73fa.firebaseapp.com",
  databaseURL:
    env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://tacomonster-a73fa-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "tacomonster-a73fa",
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "tacomonster-a73fa.appspot.com",
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "772366282257",
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:772366282257:web:0d3cd0f07621fa6cfb4bb0",
  measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GXF65X8PDW",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// NOTE: getAuth uses in-memory persistence on React Native. To persist sign-in
// across app restarts, switch to initializeAuth with getReactNativePersistence
// backed by @react-native-async-storage/async-storage.
const auth = getAuth(app);

export { app, db, auth };
