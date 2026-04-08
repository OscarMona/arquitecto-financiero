"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Capturar resultado del redirect de Google al volver
    getRedirectResult(auth)
      .then((result) => { if (result?.user) setUser(result.user); })
      .catch(() => {});

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsub;
  }, []);

  const loginEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      // Intentar popup primero
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      // Si popup falla (bloqueado por navegador), usar redirect
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        await signInWithRedirect(auth, provider);
      } else {
        throw err;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginEmail, registerEmail, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
