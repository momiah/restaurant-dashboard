// Platform Firebase project (shared across all restaurants). Config comes from
// EXPO_PUBLIC_* env vars where set (see .env.example); the fallbacks keep local
// development working. Data is scoped by restaurantId, and each owner is tied to
// one restaurant via the owners/{uid} mapping.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const env = process.env;

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAm1bPTxm9csx2HYISUm35xlwUahGKxg8Q",
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "menudock-platform.firebaseapp.com",
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "menudock-platform",
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "menudock-platform.firebasestorage.app",
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "824146300662",
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:824146300662:web:9b55170f16fd98bb62e6d7",
  measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-6V9SW20WHC",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// React Native needs AsyncStorage-backed auth persistence: owners stay signed in across
// app restarts, and plain getAuth() would pull in web code that crashes Hermes. The
// try/catch stops Fast Refresh (which re-runs this module) re-initialising auth.
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  auth = getAuth(app);
}

export { app, db, auth };
