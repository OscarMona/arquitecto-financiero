"use client";
import { useState, useEffect } from "react";

export default function Suscribete() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pais, setPais] = useState("OTHER");
  const [precio, setPrecio] = useState("$4.99 USD");
  const [detectando, setDetectando] = useState(true);
  const [ref, setRef] = useState("");

  useEffect(() => {
    // Capturar ?ref= de la URL y guardarlo en cookie por 30 días
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) {
      setRef(refParam);
      document.cookie = `af_ref=${refParam};max-age=${30*24*60*60};path=/`;
    } else {
      // Buscar en cookie si ya tenía un ref previo
      const cookie = document.cookie.split(";").find(c => c.trim().startsWith("af_ref="));
      if (cookie) setRef(cookie.split("=")[1].trim());
    }

    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        if (data.country_code === "MX") { setPais("MX"); setPrecio("$89 MXN + IVA"); }
        else if (data.country_code === "US") { setPais("US"); setPrecio("$7.99 USD"); }
        else { setPais("OTHER"); setPrecio("$4.99 USD"); }
      })
      .catch(() => { setPais("OTHER"); setPrecio("$4.99 USD"); })
      .finally(() => setDetectando(false));
  }, []);

  const handlePago = async () => {
    if (!nombre.trim() || !email.trim()) { setError("Por favor ingresa tu nombre y correo."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Ingresa un correo válido."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, pais, ref }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Error al conectar con el sistema de pago. Intenta de nuevo.");
    } catch { setError("Error de conexión. Intenta de nuevo."); }
    setLoading(false);
  };

  const C = { bg:"#050A14",card:"#0E1525",border:"#1A2540",accent:"#00E8B8",danger:"#FF4D6A",warning:"#FFB443",t1:"#F1F5F9",t2:"#8B9DC3",t3:"#475569" };

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.t1,fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"0 16px 60px"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet"/>

      <div style={{padding:"32px 0 24px",textAlign:"center"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.accent,letterSpacing:2,textTransform:"uppercase"}}>Arquitecto Financiero</div>
      </div>

      <div style={{maxWidth:420,width:"100%",textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:13,color:C.warning,fontWeight:700,marginBottom:12,letterSpacing:1}}>PREGUNTA HONESTA</div>
        <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:800,lineHeight:1.2,margin:"0 0 16px",color:C.t1}}>
          ¿Sabes exactamente cuánto tienes ahorita en tu cuenta?
        </h1>
        <p style={{fontSize:15,color:C.t2,lineHeight:1.7,margin:0}}>
          La mayoría gana bien — pero llega a cero sin saber por qué. No es un problema de ingresos. Es un problema de control.
        </p>
      </div>

      <div style={{maxWidth:420,width:"100%",marginBottom:28}}>
        {[{icon:"😰",text:"Ganas bien pero el dinero desaparece"},{icon:"😓",text:"No sabes en qué te gastas el dinero"},{icon:"😤",text:"Llegas a fin de mes sin saber qué pasó"},{icon:"😔",text:"No tienes ahorro aunque quisieras"}].map((d,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:22}}>{d.icon}</span>
            <span style={{fontSize:14,color:C.t2}}>{d.text}</span>
          </div>
        ))}
      </div>

      <div style={{maxWidth:420,width:"100%",background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.accent}22`,marginBottom:28}}>
        <div style={{fontSize:13,color:C.accent,fontWeight:700,marginBottom:12}}>ARQUITECTO FINANCIERO HACE ESTO POR TI:</div>
        {["📊 Ve exactamente en qué gastas cada peso","🎯 Presupuesto real adaptado a tu vida","💸 Flujo de caja para que nada te agarre desprevenido","🤖 IA que clasifica tus gastos automáticamente","📅 Alertas de pagos grandes antes de que lleguen"].map((b,i)=>(
          <div key={i} style={{fontSize:13,color:C.t1,padding:"6px 0",borderBottom:i<4?`1px solid ${C.border}33`:"none"}}>{b}</div>
        ))}
      </div>

      <div style={{maxWidth:420,width:"100%",textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:13,color:C.t3,marginBottom:6}}>Todo esto por</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:48,fontWeight:800,color:C.accent,lineHeight:1}}>
          {detectando?"...":precio}
        </div>
        <div style={{fontSize:14,color:C.t2,marginTop:4}}>al mes — menos que un café</div>
        <div style={{fontSize:12,color:C.t3,marginTop:6}}>Cancela cuando quieras. Sin contratos.</div>
      </div>

      <div style={{maxWidth:420,width:"100%",marginBottom:16}}>
        <input type="text" placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)}
          style={{width:"100%",boxSizing:"border-box",padding:"14px 16px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.t1,fontSize:15,outline:"none",marginBottom:10}}/>
        <input type="email" placeholder="Tu correo electrónico" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handlePago()}
          style={{width:"100%",boxSizing:"border-box",padding:"14px 16px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.t1,fontSize:15,outline:"none",marginBottom:10}}/>
        {error&&<div style={{fontSize:12,color:C.danger,marginBottom:8,textAlign:"center"}}>{error}</div>}
        <button onClick={handlePago} disabled={loading||detectando}
          style={{width:"100%",padding:"16px",borderRadius:12,border:"none",background:loading||detectando?C.border:C.accent,color:"#000",fontSize:16,fontWeight:800,cursor:loading||detectando?"default":"pointer"}}>
          {loading?"Conectando...":detectando?"Un momento...":"Quiero tomar control de mi dinero →"}
        </button>
        <div style={{fontSize:11,color:C.t3,textAlign:"center",marginTop:10}}>
          🔒 Pago seguro con Stripe · Solo nombre, correo y tarjeta
        </div>
      </div>

      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:12,color:C.t3}}>La mayoría que lo intenta, no lo vuelve a dejar.</div>
      </div>
    </div>
  );
}
