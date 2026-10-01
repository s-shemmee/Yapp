import React, { createContext, useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import LoadingScreen from "../components/LoadingScreen";

export const AuthContext = createContext<User | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const usersCollectionRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(usersCollectionRef);

          if (userDoc.exists()) {
            await updateDoc(usersCollectionRef, { online: true });
          } else {
            console.error("User document does not exist", user.uid);
          }
        } catch (error) {
          console.error("Error updating online status:", error);
        }
      }

      currentUserRef.current = user;
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      if (currentUserRef.current) {
        const usersCollectionRef = doc(db, "users", currentUserRef.current.uid);
        updateDoc(usersCollectionRef, { online: false }).catch((error) => {
          console.error("Error updating online status in cleanup:", error);
        });
      }
      unsub();
    };
  }, []);

  if (loading) {
    return (
      <div>
        <LoadingScreen />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={currentUser}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
