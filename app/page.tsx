"use client";
import { useAuth } from "../lib/auth-context";
import Landing from "./calculadoras";
import LoginScreen from "./login";
import AppPro from "./pro";
import { useState } from "react";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  if (loading) return (
    <div style={{ background: "#050A14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
        <div style={{ color: "#00E8B8", fontSize: 16, fontWeight: 700 }}>Cargando...</div>
      </div>
    </div>
  );

  if (showCalc) {
    return <Landing onGoPro={() => setShowCalc(false)} />;
  }

  if (showLogin && !user) {
    return <LoginScreen onBack={() => setShowLogin(false)} />;
  }

  if (user) {
    return <AppPro onLogout={async () => { await logout(); }} onGoCalc={() => setShowCalc(true)} />;
  }

  return <Landing onGoPro={() => setShowLogin(true)} />;
}
