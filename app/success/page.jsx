"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Success() {
  const searchParams = useSearchParams();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setListo(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const C = {
    bg: "#050A14", card: "#0E1525", border: "#1A2540",
    accent: "#00E8B8", t1: "#F1F5F9", t2: "#8B9DC3", t3: "#475569",
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.t1, fontFamily: "'DM Sans',system-ui,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet" />

      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: C.accent, margin: "0 0 12px" }}>
        ¡Ya eres Arquitecto Financiero!
      </h1>
      <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7, maxWidth: 340, margin: "0 0 32px" }}>
        Tu suscripción está activa. Este es el primer día del resto de tu vida financiera.
      </p>

      <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.accent}22`, maxWidth: 360, width: "100%", marginBottom: 28, textAlign: "left" }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, marginBottom: 12 }}>QUÉ SIGUE:</div>
        {[
          "1. Entra a la app y pon tu nombre",
          "2. Configura tu presupuesto en 3 pasos",
          "3. Registra tu primer gasto",
          "4. Mira cómo tus finanzas cobran forma",
        ].map((s, i) => (
          <div key={i} style={{ fontSize: 13, color: C.t1, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}33` : "none" }}>{s}</div>
        ))}
      </div>

      <a
        href="/"
        style={{ display: "block", width: "100%", maxWidth: 360, padding: "16px", borderRadius: 12, border: "none", background: C.accent, color: "#000", fontSize: 16, fontWeight: 800, cursor: "pointer", textDecoration: "none", textAlign: "center" }}
      >
        Entrar a la app →
      </a>

      <div style={{ fontSize: 11, color: C.t3, marginTop: 16 }}>
        Recibirás un correo de confirmación de Stripe
      </div>
    </div>
  );
}
