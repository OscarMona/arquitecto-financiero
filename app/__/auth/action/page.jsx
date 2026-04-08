"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../lib/firebase";

function AuthActionContent() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [paso, setPaso] = useState("cargando"); // cargando | form | exito | error
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const C = {
    bg:"#050A14", card:"#0E1525", border:"#1A2540",
    accent:"#00E8B8", danger:"#FF4D6A", t1:"#F1F5F9", t2:"#8B9DC3", t3:"#475569"
  };

  useEffect(() => {
    if (mode === "resetPassword" && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(email => { setEmail(email); setPaso("form"); })
        .catch(() => setPaso("error"));
    } else {
      setPaso("error");
    }
  }, [mode, oobCode]);

  const handleReset = async () => {
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setError("");
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setPaso("exito");
    } catch {
      setError("El link expiró o ya fue usado. Solicita uno nuevo.");
    }
    setLoading(false);
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>

        {/* Logo */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
          <svg width="60" height="60" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="57" stroke={C.accent} strokeWidth="2.5" fill="none" opacity="0.2"/>
            <rect x="30" y="72" width="60" height="6" rx="1.5" fill={C.accent} opacity="0.85"/>
            <rect x="38" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/>
            <rect x="57.5" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/>
            <rect x="77" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/>
            <path d="M28 43 L60 24 L92 43" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="28" y1="43" x2="92" y2="43" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/>
            <text x="60" y="65" textAnchor="middle" fontSize="20" fontWeight="700" fontFamily="sans-serif" fill={C.accent}>$</text>
          </svg>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:C.accent,letterSpacing:2,marginBottom:24}}>ARQUITECTO FINANCIERO</div>

        {paso === "cargando" && (
          <div style={{color:C.t2,fontSize:14}}>Verificando link...</div>
        )}

        {paso === "form" && (
          <div style={{background:C.card,borderRadius:16,padding:28,border:`1px solid ${C.border}`}}>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:C.t1,marginBottom:8}}>Crea tu contraseña</h2>
            <p style={{fontSize:13,color:C.t2,marginBottom:20}}>Para la cuenta: <strong style={{color:C.accent}}>{email}</strong></p>
            <input
              type="password" placeholder="Nueva contraseña (mín. 6 caracteres)"
              value={password} onChange={e=>setPassword(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:14,outline:"none",marginBottom:10}}
            />
            <input
              type="password" placeholder="Confirmar contraseña"
              value={confirm} onChange={e=>setConfirm(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleReset()}
              style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:14,outline:"none",marginBottom:12}}
            />
            {error && <p style={{color:C.danger,fontSize:12,marginBottom:12}}>{error}</p>}
            <button onClick={handleReset} disabled={loading}
              style={{width:"100%",padding:14,borderRadius:10,background:loading?C.border:C.accent,border:"none",color:"#000",fontSize:15,fontWeight:700,cursor:loading?"default":"pointer"}}>
              {loading?"Guardando...":"Guardar contraseña →"}
            </button>
          </div>
        )}

        {paso === "exito" && (
          <div style={{background:C.card,borderRadius:16,padding:28,border:`1px solid ${C.accent}33`}}>
            <div style={{fontSize:48,marginBottom:12}}>🎉</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:C.accent,marginBottom:8}}>¡Contraseña creada!</h2>
            <p style={{fontSize:13,color:C.t2,marginBottom:20}}>Ya puedes entrar a tu cuenta con tu correo y contraseña.</p>
            <a href="/" style={{display:"block",width:"100%",boxSizing:"border-box",padding:14,borderRadius:10,background:C.accent,color:"#000",fontSize:15,fontWeight:700,textDecoration:"none"}}>
              Entrar a la app →
            </a>
          </div>
        )}

        {paso === "error" && (
          <div style={{background:C.card,borderRadius:16,padding:28,border:`1px solid ${C.danger}33`}}>
            <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:C.danger,marginBottom:8}}>Link inválido o expirado</h2>
            <p style={{fontSize:13,color:C.t2,marginBottom:20}}>El link ya fue usado o expiró. Inicia sesión y solicita uno nuevo.</p>
            <a href="/" style={{display:"block",width:"100%",boxSizing:"border-box",padding:14,borderRadius:10,background:C.accent,color:"#000",fontSize:15,fontWeight:700,textDecoration:"none"}}>
              Ir a inicio →
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AuthAction() {
  return (
    <Suspense fallback={
      <div style={{background:"#050A14",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:"#00E8B8",fontSize:14}}>Cargando...</div>
      </div>
    }>
      <AuthActionContent/>
    </Suspense>
  );
}
