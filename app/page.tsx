"use client";
import { useAuth } from "../lib/auth-context";
import Landing from "./calculadoras";
import LoginScreen from "./login";
import AppPro from "./pro";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [suscripcionActiva, setSuscripcionActiva] = useState<boolean | null>(null);
  const [checkingSub, setCheckingSub] = useState(false);
  const [precio, setPrecio] = useState("$4.99 USD/mes");

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        if (data.country_code === "MX") setPrecio("$89 MXN/mes");
        else if (data.country_code === "US") setPrecio("$7.99 USD/mes");
        else setPrecio("$4.99 USD/mes");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setSuscripcionActiva(null); return; }
    const check = async () => {
      setCheckingSub(true);
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) {
          setSuscripcionActiva(snap.data().suscripcionActiva === true);
        } else {
          setSuscripcionActiva(false);
        }
      } catch {
        setSuscripcionActiva(false);
      }
      setCheckingSub(false);
    };
    check();
  }, [user]);

  const C = { bg: "#050A14", accent: "#00E8B8", t2: "#8B9DC3", danger: "#FF4D6A" };

  if (loading || checkingSub) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
        <div style={{ color: C.accent, fontSize: 16, fontWeight: 700 }}>Cargando...</div>
      </div>
    </div>
  );

  if (showCalc) return <Landing onGoPro={() => setShowCalc(false)} />;
  if (showLogin && !user) return <LoginScreen onBack={() => setShowLogin(false)} />;

  if (user && suscripcionActiva === false) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: C.accent, margin: "0 0 12px" }}>
            Activa tu suscripción
          </h2>
          <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, margin: "0 0 24px" }}>
            Tu cuenta existe pero no tiene una suscripción activa. Por menos que un café al mes toma control total de tus finanzas.
          </p>
          <a href="/suscribete" style={{ display: "block", padding: "14px 28px", borderRadius: 12, background: C.accent, color: "#000", fontSize: 15, fontWeight: 800, textDecoration: "none", marginBottom: 12 }}>
            Activar por {precio} →
          </a>
          <button onClick={async () => { await logout(); }} style={{ background: "none", border: "none", color: C.t2, fontSize: 12, cursor: "pointer" }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (user && suscripcionActiva === true) {
    return <AppPro onLogout={async () => { await logout(); }} onGoCalc={() => setShowCalc(true)} />;
  }

  return <Landing onGoPro={() => setShowLogin(true)} />;
}
