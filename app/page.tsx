"use client";
import { useAuth } from "../lib/auth-context";
import Landing from "./calculadoras";
import LoginScreen from "./login";
import AppPro from "./pro";
import { useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showPro, setShowPro] = useState(false);

  if (loading) return (
    <div style={{ background: "#050A14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
        <div style={{ color: "#00E8B8", fontSize: 16, fontWeight: 700 }}>Cargando...</div>
      </div>
    </div>
  );

  // If user is logged in and wants Pro, show App Pro
  if (user && showPro) {
    return <AppPro />;
  }

  // If user wants to login/register
  if (showLogin && !user) {
    return <LoginScreen onBack={() => setShowLogin(false)} />;
  }

  // If user just logged in, show Pro automatically
  if (user) {
    return <AppPro />;
  }

  // Default: show free calculators with CTA to Pro
  return <Landing onGoPro={() => setShowLogin(true)} />;
}
