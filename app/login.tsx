"use client";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

export default function LoginScreen() {
  const { loginEmail, registerEmail, loginGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await registerEmail(email, password);
      } else {
        await loginEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres");
      } else if (err.code === "auth/invalid-email") {
        setError("Correo no válido");
      } else {
        setError("Error al conectar. Intenta de nuevo.");
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginGoogle();
    } catch (err: any) {
      setError("Error al conectar con Google");
    }
  };

  const C = {
    bg: "#0B1120", card: "#111B2E", border: "#1E2D4A",
    accent: "#00D4AA", danger: "#FF5A5A",
    t1: "#F1F5F9", t2: "#94A3B8", t3: "#475569",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        {/* Logo */}
        <svg viewBox="0 0 120 120" style={{ width: 80, height: 80, margin: "0 auto 16px" }}>
          <circle cx="60" cy="60" r="56" fill={C.accent + "08"} stroke={C.accent + "20"} strokeWidth="1" />
          <rect x="25" y="50" width="8" height="35" rx="2" fill={C.accent} opacity="0.7" />
          <rect x="38" y="42" width="8" height="43" rx="2" fill={C.accent} opacity="0.8" />
          <rect x="51" y="35" width="8" height="50" rx="2" fill={C.accent} />
          <rect x="64" y="42" width="8" height="43" rx="2" fill={C.accent} opacity="0.8" />
          <rect x="77" y="50" width="8" height="35" rx="2" fill={C.accent} opacity="0.7" />
          <path d="M30 48 L56 28 L60 25 L64 28 L90 48" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" />
          <text x="60" y="105" textAnchor="middle" fill={C.accent} fontSize="11" fontWeight="800" fontFamily="'Sora', sans-serif">ARQUITECTO</text>
        </svg>
        <p style={{ color: C.t2, fontSize: 14, marginBottom: 32 }}>Toma el control de tu dinero</p>

        <div style={{
          background: C.card, borderRadius: 16, padding: 28,
          border: `1px solid ${C.border}`,
        }}>
          <h2 style={{ color: C.t1, fontSize: 20, fontWeight: 700, marginBottom: 20, fontFamily: "'Sora', sans-serif" }}>
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </h2>

          {/* Google Button */}
          <button onClick={handleGoogle} style={{
            width: "100%", padding: 12, borderRadius: 10,
            background: C.bg, border: `1px solid ${C.border}`,
            color: C.t1, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 16,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ color: C.t3, fontSize: 12 }}>o con correo</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Email & Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <input
              type="email" placeholder="Tu correo electrónico" value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8,
                background: C.bg, border: `1px solid ${C.border}`,
                color: C.t1, fontSize: 14, outline: "none",
              }}
            />
            <input
              type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8,
                background: C.bg, border: `1px solid ${C.border}`,
                color: C.t1, fontSize: 14, outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ color: C.danger, fontSize: 12, marginBottom: 12 }}>{error}</p>
          )}

          <button onClick={handleSubmit} disabled={loading || !email || !password} style={{
            width: "100%", padding: 14, borderRadius: 10,
            background: C.accent, border: "none",
            color: "#0B1120", fontSize: 15, fontWeight: 700, cursor: "pointer",
            opacity: loading || !email || !password ? 0.5 : 1,
            marginBottom: 14,
          }}>
            {loading ? "Cargando..." : isRegister ? "Crear cuenta 🚀" : "Entrar"}
          </button>

          <p style={{ color: C.t3, fontSize: 12 }}>
            {isRegister ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}
              style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }}>
              {isRegister ? "Inicia sesión" : "Regístrate gratis"}
            </span>
          </p>
        </div>

        <p style={{ color: C.t3, fontSize: 10, marginTop: 20 }}>
          🌱 Tu primer presupuesto es gratis. Sin compromisos.
        </p>
      </div>
    </div>
  );
}