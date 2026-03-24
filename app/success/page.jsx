"use client";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const [paso, setPaso] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setPaso(2), 1500);
    return () => clearTimeout(timer);
  }, []);

  const C = {
    bg: "#050A14", card: "#0E1525", border: "#1A2540",
    accent: "#00E8B8", t1: "#F1F5F9", t2: "#8B9DC3", t3: "#475569",
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.t1, fontFamily: "'DM Sans',system-ui,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet" />
      {paso === 1 ? (
        <>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚙️</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: C.accent, margin: "0 0 8px" }}>Activando tu cuenta...</h2>
          <p style={{ fontSize: 14, color: C.t2 }}>Solo un momento</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: C.accent, margin: "0 0 12px" }}>
            ¡Ya eres Arquitecto Financiero!
          </h1>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7, maxWidth: 340, margin: "0 0 24px" }}>
            Tu suscripción está activa. Revisa tu correo — te enviamos un link para crear tu contraseña y entrar a la app.
          </p>
          <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.accent}22`, maxWidth: 360, width: "100%", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, marginBottom: 10 }}>QUÉ SIGUE:</div>
            {[
              "1. Revisa tu correo (incluyendo spam)",
              "2. Da clic en el link para crear tu contraseña",
              "3. Entra a la app con tu correo y contraseña",
              "4. Configura tu presupuesto en 3 minutos",
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: C.t1, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}33` : "none" }}>{s}</div>
            ))}
          </div>
          <a href="/login" style={{ display: "block", width: "100%", maxWidth: 360, padding: "16px", borderRadius: 12, background: C.accent, color: "#000", fontSize: 16, fontWeight: 800, textDecoration: "none", textAlign: "center", marginBottom: 12 }}>
            Ya tengo mi contraseña — Entrar →
          </a>
          <div style={{ fontSize: 11, color: C.t3 }}>¿No llegó el correo? Revisa tu carpeta de spam.</div>
        </>
      )}
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={
      <div style={{ background: "#050A14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#00E8B8", fontSize: 16, fontWeight: 700 }}>Cargando...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
