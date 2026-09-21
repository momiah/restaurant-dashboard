// Owner authentication + restaurant scoping.
// On sign-in we read owners/{uid} to find the owner's restaurantId, then load that
// restaurant record. Every screen scopes its data to `restaurantId`, so an owner only
// ever sees their own restaurant's orders and settings.
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase.config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [owner, setOwner] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setError(null);
      setUser(nextUser);

      if (!nextUser) {
        setOwner(null);
        setRestaurant(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ownerSnap = await getDoc(doc(db, "owners", nextUser.uid));
        if (!ownerSnap.exists()) {
          setError("This account isn't linked to a restaurant. Contact your platform admin.");
          setOwner(null);
          setRestaurant(null);
          return;
        }
        const ownerData = ownerSnap.data();
        setOwner(ownerData);

        const restaurantSnap = await getDoc(
          doc(db, "restaurants", ownerData.restaurantId)
        );
        setRestaurant(
          restaurantSnap.exists()
            ? { id: restaurantSnap.id, ...restaurantSnap.data() }
            : null
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
  const signOutUser = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        user,
        owner,
        restaurant,
        restaurantId: owner?.restaurantId || null,
        loading,
        error,
        signIn,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
