"use client";
import { useAuth } from "../lib/auth-context";
import LoginScreen from "./login";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0B1120", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
          <p style={{ color: "#94A3B8", fontSize: 14 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0B1120", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1 style={{ color: "#F1F5F9", fontSize: 24, fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>
          ¡Bienvenido!
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 8 }}>
          Conectado como: {user.email}
        </p>
        <p style={{ color: "#00D4AA", fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          Firebase funciona correctamente 🚀
        </p>
        <button onClick={logout} style={{
          padding: "10px 24px", borderRadius: 8, background: "#1E2D4A",
          border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 13,
        }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}