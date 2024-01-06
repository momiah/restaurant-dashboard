// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3ehzE8DkNklEK5f3X_mZvSm7ULTcqtdY",
  authDomain: "tacomonster-a73fa.firebaseapp.com",
  databaseURL:
    "https://tacomonster-a73fa-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tacomonster-a73fa",
  storageBucket: "tacomonster-a73fa.appspot.com",
  messagingSenderId: "772366282257",
  appId: "1:772366282257:web:0d3cd0f07621fa6cfb4bb0",
  measurementId: "G-GXF65X8PDW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
