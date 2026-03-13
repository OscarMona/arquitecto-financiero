import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

/* ═══════════════════════════════════════════════════════════════
   THEME & HELPERS
   ═══════════════════════════════════════════════════════════════ */
const C = {
  bg: "#050A14", card: "#0C1322", border: "#162036",
  accent: "#00E8B8", danger: "#FF4757", warning: "#FFB443",
  purple: "#A78BFA", blue: "#5B9CF6", cyan: "#22D3EE",
  t1: "#F1F5F9", t2: "#8B9DC3", t3: "#475569",
  gold: "#F5C842",
};

const fmt = (n) => {
  if (n == null || isNaN(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  return "$" + Math.round(abs).toLocaleString("es-MX");
};

/* ═══════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, glow }) => (
  <div style={{
    background: C.card, borderRadius: 16, padding: 24,
    border: `1px solid ${glow ? C.accent + "33" : C.border}`,
    boxShadow: glow ? `0 0 40px ${C.accent}11` : "none",
    ...style,
  }}>{children}</div>
);

const Inp = ({ label, ...props }) => (
  <div>
    <label style={{ fontSize: 11, color: C.t3, display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>
    <input {...props} style={{
      width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
      background: C.bg, border: `1px solid ${C.border}`, color: C.t1, fontSize: 14,
      outline: "none", fontWeight: 600, fontVariantNumeric: "tabular-nums",
      transition: "border-color 0.2s",
    }} onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
  </div>
);

const MoneyInput = ({ label, value, onChange, placeholder }) => {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");
  const display = focused ? raw : (value ? "$" + Math.round(parseFloat(value) || 0).toLocaleString("es-MX") : "");
  return (
    <div>
      <label style={{ fontSize: 11, color: C.t3, display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <input
        type={focused ? "number" : "text"}
        value={focused ? raw : display}
        placeholder={placeholder || "$0"}
        onFocus={e => { setFocused(true); setRaw(value ? String(value) : ""); }}
        onBlur={e => { setFocused(false); }}
        onChange={e => { setRaw(e.target.value); onChange && onChange(e); }}
        style={{
          width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
          background: C.bg, border: `1px solid ${focused ? C.accent : C.border}`, color: C.t1, fontSize: 14,
          outline: "none", fontWeight: 600, fontVariantNumeric: "tabular-nums",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
};

const PctInput = ({ label, value, onChange, step }) => {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");
  const display = focused ? raw : (value ? value + "%" : "");
  return (
    <div>
      <label style={{ fontSize: 11, color: C.t3, display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <input
        type={focused ? "number" : "text"}
        value={focused ? raw : display}
        placeholder="0%"
        step={step || "0.01"}
        onFocus={e => { setFocused(true); setRaw(value ? String(value) : ""); }}
        onBlur={e => { setFocused(false); }}
        onChange={e => { setRaw(e.target.value); onChange && onChange(e); }}
        style={{
          width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
          background: C.bg, border: `1px solid ${focused ? C.accent : C.border}`, color: C.t1, fontSize: 14,
          outline: "none", fontWeight: 600, fontVariantNumeric: "tabular-nums",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
};

const ShockNumber = ({ label, value, color = C.danger, sub, icon }) => (
  <div style={{ textAlign: "center", padding: "16px 8px" }}>
    {icon && <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>}
    <div style={{ fontSize: 11, color: C.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Space Grotesk', monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>{sub}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   CALCULADORA 1: SIMULADOR DE CRÉDITO (HIPOTECA / AUTO)
   ═══════════════════════════════════════════════════════════════ */
function SimuladorCredito({ mob }) {
  const [tipo, setTipo] = useState("hipoteca");
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ monto: 0, tasa: 0, plazo: 0, mesActual: 1, extra: 0, pagoReal: 0, valorCompra: 0, plusvalia: 5 });
  const [showAnual, setShowAnual] = useState(true);
  const [bonos, setBonos] = useState([]);
  const [newBono, setNewBono] = useState({ mes: "", monto: "", desc: "" });
  const [showCambio, setShowCambio] = useState(false);
  const [nuevaTasa, setNuevaTasa] = useState(0);
  const [showMejoras, setShowMejoras] = useState(false);
  const set = (k, v) => setP(prev => ({ ...prev, [k]: parseFloat(v) || 0 }));

  const addBono = () => {
    const m = parseInt(newBono.mes) || 0;
    const mto = parseFloat(newBono.monto) || 0;
    if (m <= 0 || mto <= 0) return;
    setBonos(prev => [...prev, { mes: m, monto: mto, desc: newBono.desc || `Bono mes ${m}` }]);
    setNewBono({ mes: "", monto: "", desc: "" });
  };
  const delBono = (i) => setBonos(prev => prev.filter((_, idx) => idx !== i));

  const selectTipo = (t) => {
    setTipo(t);
    setP({ monto: 0, tasa: 0, plazo: 0, mesActual: 1, extra: 0, pagoReal: 0, valorCompra: 0, plusvalia: t === "hipoteca" ? 5 : 0 });
    setBonos([]); setStep(1); setShowCambio(false); setNuevaTasa(0); setShowMejoras(false);
  };

  const calcAmort = (monto, tasa, plazo, mesActual, extra, bonosList, pagoReal) => {
    if (monto <= 0 || tasa <= 0 || plazo <= 0) return null;
    const tm = tasa / 100 / 12;
    const pago = monto * (tm * Math.pow(1 + tm, plazo)) / (Math.pow(1 + tm, plazo) - 1);
    const mensualidadReal = pagoReal > 0 ? pagoReal : pago;
    const costosAdicionales = pagoReal > pago ? pagoReal - pago : 0;
    const rows = []; let saldo = monto; let totalInt = 0; let totalCostos = 0;
    for (let i = 1; i <= plazo && saldo > 0.5; i++) {
      const int = saldo * tm; const amort = Math.min(pago - int, saldo);
      const extraMes = (i >= mesActual && extra > 0) ? extra : 0;
      const bonoEste = (bonosList || []).filter(b => b.mes === i).reduce((s, b) => s + b.monto, 0);
      const abTotal = Math.min(extraMes + bonoEste, Math.max(saldo - amort, 0));
      rows.push({ no: i, saldo, int, amort, pago, ab: abTotal, abBono: bonoEste, costos: costosAdicionales, isPast: i < mesActual });
      totalInt += int; totalCostos += costosAdicionales; saldo -= (amort + abTotal);
    }
    let s2 = monto; let tiOrig = 0;
    for (let i = 1; i <= plazo && s2 > 0.5; i++) { const int2 = s2 * tm; tiOrig += int2; s2 -= Math.min(pago - int2, s2); }
    const totalPagado = rows.reduce((s, r) => s + r.pago + r.ab, 0) + totalCostos;
    const totalPagadoOrig = pago * plazo + (costosAdicionales * plazo);
    const costoPct = monto > 0 ? (((totalInt + totalCostos) / monto) * 100).toFixed(1) : 0;
    let saldoActual = monto;
    for (let i = 1; i < mesActual && i <= rows.length; i++) saldoActual -= rows[i - 1].amort;
    const mesesRestantes = rows.filter(r => !r.isPast).length;
    const totalAbonos = rows.reduce((s, r) => s + r.ab, 0);
    const resumenAnual = []; const maxAño = Math.ceil(rows.length / 12);
    for (let a = 0; a < maxAño; a++) {
      const slice = rows.slice(a * 12, Math.min((a + 1) * 12, rows.length));
      const añoInt = slice.reduce((s, r) => s + r.int, 0);
      const añoCap = slice.reduce((s, r) => s + r.amort + r.ab, 0);
      const añoCostos = slice.reduce((s, r) => s + r.costos, 0);
      const añoTotal = añoInt + añoCap + añoCostos;
      resumenAnual.push({ año: a + 1, intereses: añoInt, capital: añoCap, costos: añoCostos, total: añoTotal,
        pctInt: añoTotal > 0 ? ((añoInt / añoTotal) * 100).toFixed(1) : 0, pctCap: añoTotal > 0 ? ((añoCap / añoTotal) * 100).toFixed(1) : 0,
        saldoFinal: slice.length > 0 ? Math.max(slice[slice.length - 1].saldo - slice[slice.length - 1].amort - slice[slice.length - 1].ab, 0) : 0,
        isPast: (a + 1) * 12 <= mesActual,
      });
    }
    const trend = resumenAnual.map(a => ({ periodo: `Año ${a.año}`, intereses: Math.round(a.intereses), capital: Math.round(a.capital), costos: Math.round(a.costos) }));
    return { rows, pago, totalInt, totalIntOrig: tiOrig, ahorro: tiOrig - totalInt, mesesAh: plazo - rows.length, totalAbonos, totalPagado, totalPagadoOrig, costoPct, saldoActual, mensualidadReal, costosAdicionales, resumenAnual, trend, mesesRestantes, totalCostos };
  };

  // Current situation (no extras)
  const tablaBase = useMemo(() => calcAmort(p.monto, p.tasa, p.plazo, p.mesActual, 0, [], p.pagoReal), [p.monto, p.tasa, p.plazo, p.mesActual, p.pagoReal]);
  // With improvements
  const tablaMejora = useMemo(() => calcAmort(p.monto, p.tasa, p.plazo, p.mesActual, p.extra, bonos, p.pagoReal), [p, bonos]);
  const hasAbonos = p.extra > 0 || bonos.length > 0;
  // Bank change
  const tablaCambio = useMemo(() => {
    if (!showCambio || !nuevaTasa || !tablaBase) return null;
    return calcAmort(tablaBase.saldoActual, nuevaTasa, p.plazo - p.mesActual + 1, 1, p.extra, [], p.pagoReal);
  }, [showCambio, nuevaTasa, tablaBase, p, bonos]);

  const stepLabels = ["Tipo", "Crédito", "Situación", "Tu realidad", "Mejora tu crédito"];

  return (
    <div>
      {/* Step indicator */}
      {step > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
          {stepLabels.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: i < stepLabels.length - 1 ? 1 : "none" }}>
              <button onClick={() => { if(i <= step) { setStep(i); window.scrollTo({top: 0, behavior: "smooth"}); } }} style={{
                width: 26, height: 26, borderRadius: "50%", border: "none", cursor: i <= step ? "pointer" : "default",
                background: i < step ? C.accent : i === step ? C.accent + "30" : C.border,
                color: i < step ? "#000" : i === step ? C.accent : C.t3, fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i < step ? "✓" : i + 1}</button>
              {i < stepLabels.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? C.accent : C.border }} />}
            </div>
          ))}
        </div>
      )}

      {/* STEP 0: Type */}
      {step === 0 && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: "0 0 4px" }}>¿Qué tipo de crédito quieres simular?</h3>
            <p style={{ fontSize: 13, color: C.t3, margin: 0 }}>Selecciona una opción para comenzar</p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {[{ id: "hipoteca", icon: "🏠", label: "Hipotecario", sub: "Casa o departamento" }, { id: "auto", icon: "🚗", label: "Automotriz", sub: "Carro o moto" }].map(t => (
              <button key={t.id} onClick={() => selectTipo(t.id)} style={{
                flex: 1, maxWidth: 200, padding: "24px 16px", borderRadius: 16, cursor: "pointer",
                background: C.card, border: `2px solid ${C.border}`, color: C.t1, textAlign: "center", transition: "all 0.2s",
              }} onMouseOver={e => e.currentTarget.style.borderColor = C.accent} onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{t.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: Credit data */}
      {step === 1 && (
        <Card style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 24 }}>{tipo === "hipoteca" ? "🏠" : "🚗"}</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>Datos de tu crédito</h3>
              <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>Los encuentras en tu contrato o estado de cuenta</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <MoneyInput label={tipo === "hipoteca" ? "¿De cuánto es tu crédito hipotecario?" : "¿De cuánto es tu crédito automotriz?"} type="number" value={p.monto || ""} onChange={e => set("monto", e.target.value)} />
              <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>El monto que te prestó el banco</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <PctInput label="Tasa de interés anual (%)" type="number" step="0.01" value={p.tasa || ""} onChange={e => set("tasa", e.target.value)} />
                <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>Solo el interés, sin seguros</p>
              </div>
              <div>
                <Inp label="Plazo total (meses)" type="number" value={p.plazo || ""} onChange={e => set("plazo", e.target.value)} />
                <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>{tipo === "hipoteca" ? "Ej: 240 = 20 años" : "Ej: 60 = 5 años"}</p>
              </div>
            </div>
            {tipo === "hipoteca" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <MoneyInput label="¿Cuánto costó la propiedad?" type="number" value={p.valorCompra || ""} onChange={e => set("valorCompra", e.target.value)} />
                  <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>Precio de venta (con enganche)</p>
                </div>
                <div>
                  <PctInput label="Plusvalía anual estimada (%)" type="number" step="0.5" value={p.plusvalia || ""} onChange={e => set("plusvalia", e.target.value)} />
                  <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>Promedio en México: 5-8%</p>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <button onClick={() => { setStep(0); window.scrollTo({top: 0, behavior: "smooth"}); }} style={{ padding: "10px 20px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.t3, cursor: "pointer", fontSize: 13 }}>← Atrás</button>
            <button onClick={() => { setStep(2); window.scrollTo({top: 0, behavior: "smooth"}); }} disabled={!(p.monto > 0 && p.tasa > 0 && p.plazo > 0)} style={{
              padding: "10px 24px", borderRadius: 8, border: "none", cursor: p.monto > 0 && p.tasa > 0 && p.plazo > 0 ? "pointer" : "default",
              background: p.monto > 0 && p.tasa > 0 && p.plazo > 0 ? C.accent : C.border, color: p.monto > 0 && p.tasa > 0 && p.plazo > 0 ? "#000" : C.t3, fontSize: 14, fontWeight: 700,
            }}>Siguiente →</button>
          </div>
        </Card>
      )}

      {/* STEP 2: Current situation */}
      {step === 2 && (
        <Card style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 24 }}>📍</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>¿Dónde estás hoy?</h3>
              <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>Si acabas de contratar, déjalo en mes 1</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Inp label="¿En qué mes de pago vas?" type="number" value={p.mesActual} onChange={e => set("mesActual", e.target.value)} />
              <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>Si llevas 3 años pagando = mes 36</p>
            </div>
            <div>
              <MoneyInput label="¿Cuánto pagas realmente al mes? (opcional)" type="number" value={p.pagoReal || ""} onChange={e => set("pagoReal", e.target.value)} />
              <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>
                Mensualidad calculada solo con interés: {tablaBase ? fmt(tablaBase.pago) : "$0"}.
                {tablaBase && tablaBase.costosAdicionales > 0 ? ` Diferencia de ${fmt(tablaBase.costosAdicionales)} = costos adicionales.` : " Incluye seguros y comisiones si los conoces."}
              </p>
            </div>
          </div>
          {tablaBase && (
            <div style={{ marginTop: 14, padding: 12, background: C.accent + "08", borderRadius: 10, border: `1px solid ${C.accent}22` }}>
              <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>📊 Saldo actual estimado: <strong style={{ color: C.accent }}>{fmt(tablaBase.saldoActual)}</strong> · Te faltan <strong style={{ color: C.accent }}>{tablaBase.mesesRestantes} meses</strong> ({Math.round(tablaBase.mesesRestantes / 12)} años)</p>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <button onClick={() => { setStep(1); window.scrollTo({top: 0, behavior: "smooth"}); }} style={{ padding: "10px 20px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.t3, cursor: "pointer", fontSize: 13 }}>← Atrás</button>
            <button onClick={() => { setStep(3); window.scrollTo({top: 0, behavior: "smooth"}); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer", background: C.accent, color: "#000", fontSize: 14, fontWeight: 700 }}>Ver mi realidad 🔍</button>
          </div>
        </Card>
      )}

      {/* STEP 3: Reality shock */}
      {step === 3 && tablaBase && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <button onClick={() => { setStep(2); window.scrollTo({top: 0, behavior: "smooth"}); }} style={{ padding: "8px 16px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.t3, cursor: "pointer", fontSize: 12, marginBottom: 14 }}>← Editar datos</button>

          {/* Shock card */}
          <Card glow style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #1a0a0a)` }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.t3, margin: "0 0 4px" }}>{tipo === "hipoteca" ? "Tu casa" : "Tu carro"} de</p>
              <span style={{ fontSize: 32, fontWeight: 800, color: C.t1 }}>{fmt(p.monto)}</span>
              <p style={{ fontSize: 13, color: C.t3, margin: "4px 0 0" }}>te va a costar en realidad</p>
              <div style={{ fontSize: mob ? 32 : 48, fontWeight: 900, color: C.danger, fontFamily: "'Space Grotesk', monospace", margin: "8px 0", lineHeight: 1 }}>{fmt(tablaBase.totalPagado)}</div>
              <p style={{ fontSize: 14, color: C.warning, fontWeight: 600 }}>{tablaBase.costoPct}% más — por cada $1 pagas ${p.monto > 0 ? (tablaBase.totalPagado / p.monto).toFixed(2) : 0}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 8 }}>
              <ShockNumber icon="💸" label="Intereses" value={fmt(tablaBase.totalInt)} color={C.danger} sub="regalados al banco" />
              {tablaBase.totalCostos > 0 && <ShockNumber icon="📋" label="Costos extra" value={fmt(tablaBase.totalCostos)} color={C.warning} sub="seguros, comisiones" />}
              <ShockNumber icon="📍" label="Saldo actual" value={fmt(tablaBase.saldoActual)} color={C.cyan} sub={`mes ${p.mesActual} de ${p.plazo}`} />
              <ShockNumber icon="⏰" label="Te faltan" value={`${tablaBase.mesesRestantes} meses`} color={C.t1} sub={`${Math.round(tablaBase.mesesRestantes / 12)} años`} />
            </div>
          </Card>

          {/* Payment breakdown */}
          {p.pagoReal > 0 && tablaBase.rows.length > 0 && (() => {
            const r = tablaBase.rows[Math.min(p.mesActual, tablaBase.rows.length) - 1];
            if (!r) return null;
            const intPct = ((r.int / p.pagoReal) * 100).toFixed(1);
            const capPct = ((r.amort / p.pagoReal) * 100).toFixed(1);
            const cosPct = tablaBase.costosAdicionales > 0 ? ((tablaBase.costosAdicionales / p.pagoReal) * 100).toFixed(1) : 0;
            return (
              <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 12 }}>💰 De tu pago de {fmt(p.pagoReal)}, ¿a dónde va cada peso?</h3>
                <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: `${intPct}%`, background: C.danger, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{intPct > 10 ? `${intPct}%` : ""}</div>
                  <div style={{ width: `${capPct}%`, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#000" }}>{capPct > 10 ? `${capPct}%` : ""}</div>
                  {cosPct > 0 && <div style={{ width: `${cosPct}%`, background: C.warning, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#000" }}>{cosPct > 10 ? `${cosPct}%` : ""}</div>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : (tablaBase.costosAdicionales > 0 ? "1fr 1fr 1fr" : "1fr 1fr"), gap: 8 }}>
                  <div style={{ padding: 10, background: C.danger + "15", borderRadius: 8, borderLeft: `3px solid ${C.danger}` }}>
                    <div style={{ fontSize: 10, color: C.t3 }}>🔥 INTERESES</div><div style={{ fontSize: 18, fontWeight: 800, color: C.danger }}>{fmt(r.int)}</div><div style={{ fontSize: 11, color: C.t2 }}>{intPct}%</div>
                  </div>
                  <div style={{ padding: 10, background: C.accent + "15", borderRadius: 8, borderLeft: `3px solid ${C.accent}` }}>
                    <div style={{ fontSize: 10, color: C.t3 }}>✅ CAPITAL</div><div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{fmt(r.amort)}</div><div style={{ fontSize: 11, color: C.t2 }}>{capPct}%</div>
                  </div>
                  {tablaBase.costosAdicionales > 0 && <div style={{ padding: 10, background: C.warning + "15", borderRadius: 8, borderLeft: `3px solid ${C.warning}` }}>
                    <div style={{ fontSize: 10, color: C.t3 }}>📋 COSTOS</div><div style={{ fontSize: 18, fontWeight: 800, color: C.warning }}>{fmt(tablaBase.costosAdicionales)}</div><div style={{ fontSize: 11, color: C.t2 }}>{cosPct}%</div>
                  </div>}
                </div>
                <p style={{ fontSize: 11, color: C.t3, marginTop: 10, textAlign: "center" }}>Este es el desglose del mes {p.mesActual}. Los primeros años casi todo va a intereses.</p>
              </Card>
            );
          })()}

          {/* Annual summary */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, margin: 0 }}>📊 Resumen por año</h3>
              <button onClick={() => setShowAnual(!showAnual)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 12 }}>{showAnual ? "▲" : "▼"}</button>
            </div>
            {showAnual && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {["Año", "Intereses", "%", "Capital", "%", tablaBase.totalCostos > 0 ? "Costos" : null, "Total", "Saldo"].filter(Boolean).map((h, i) => (
                      <th key={i} style={{ padding: "8px 6px", textAlign: "right", color: C.t3, fontWeight: 600, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{tablaBase.resumenAnual.map(a => (
                    <tr key={a.año} style={{ borderBottom: `1px solid ${C.border}22`, background: a.isPast ? C.accent + "06" : "transparent" }}>
                      <td style={{ padding: "6px", textAlign: "right", fontWeight: 600, color: C.t2 }}>{a.año}{a.isPast ? " ✓" : ""}</td>
                      <td style={{ padding: "6px", textAlign: "right", color: C.danger, fontWeight: 600 }}>{fmt(a.intereses)}</td>
                      <td style={{ padding: "6px", textAlign: "right" }}><span style={{ background: a.pctInt > 50 ? C.danger + "25" : a.pctInt > 30 ? C.warning + "20" : C.accent + "20", color: a.pctInt > 50 ? C.danger : a.pctInt > 30 ? C.warning : C.accent, padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{a.pctInt}%</span></td>
                      <td style={{ padding: "6px", textAlign: "right", color: C.accent, fontWeight: 600 }}>{fmt(a.capital)}</td>
                      <td style={{ padding: "6px", textAlign: "right" }}><span style={{ background: C.accent + "20", color: C.accent, padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{a.pctCap}%</span></td>
                      {tablaBase.totalCostos > 0 && <td style={{ padding: "6px", textAlign: "right", color: C.warning }}>{fmt(a.costos)}</td>}
                      <td style={{ padding: "6px", textAlign: "right", fontWeight: 600 }}>{fmt(a.total)}</td>
                      <td style={{ padding: "6px", textAlign: "right", color: C.cyan }}>{fmt(a.saldoFinal)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Chart */}
          {tablaBase.trend.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 12 }}>📉 Distribución por año</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tablaBase.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="periodo" stroke={C.t3} fontSize={10} />
                  <YAxis stroke={C.t3} fontSize={10} tickFormatter={v => fmt(v)} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 12 }} formatter={v => fmt(v)} />
                  <Area type="monotone" dataKey="intereses" stackId="1" stroke={C.danger} fill={C.danger + "40"} name="Intereses" />
                  <Area type="monotone" dataKey="capital" stackId="1" stroke={C.accent} fill={C.accent + "40"} name="Capital" />
                  {tablaBase.totalCostos > 0 && <Area type="monotone" dataKey="costos" stackId="1" stroke={C.warning} fill={C.warning + "40"} name="Costos" />}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CTA to improve */}
          <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.accent}08, ${C.card})`, border: `1px solid ${C.accent}22` }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💡</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: "0 0 6px" }}>¿Quieres mejorar estos números?</h3>
              <p style={{ fontSize: 13, color: C.t2, margin: "0 0 14px" }}>Simula abonos a capital, bonos extraordinarios, cambio de banco y compara la plusvalía</p>
              <button onClick={() => { setStep(4); window.scrollTo({top: 0, behavior: "smooth"}); }} style={{ padding: "12px 28px", borderRadius: 10, border: "none", cursor: "pointer", background: C.accent, color: "#000", fontSize: 15, fontWeight: 700 }}>
                Mejorar mi crédito →
              </button>
            </div>
          </Card>

          {/* Disclaimer */}
          <div style={{ padding: "12px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10, color: C.t3, margin: 0, lineHeight: 1.6 }}>⚠️ <strong>Aviso:</strong> Simulación aproximada con fines educativos (sistema francés). Los montos reales pueden variar. Consulta tu estado de cuenta.</p>
          </div>
        </div>
      )}

      {/* STEP 4: Improve */}
      {step === 4 && tablaBase && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <button onClick={() => { setStep(3); window.scrollTo({top: 0, behavior: "smooth"}); }} style={{ padding: "8px 16px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.t3, cursor: "pointer", fontSize: 12, marginBottom: 14 }}>← Ver mi situación actual</button>

          {/* Abonos extra */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>💪</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>Abonos a capital</h3>
                <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>Cada peso extra va directo a reducir tu deuda</p>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <MoneyInput label="Abono extra fijo cada mes" type="number" value={p.extra || ""} onChange={e => set("extra", e.target.value)} />
              <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>Se aplica a partir del mes {p.mesActual} directo a capital</p>
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: C.t2, margin: "0 0 8px" }}>🎯 Abonos extraordinarios (aguinaldo, PTU, bonos)</h4>
            {bonos.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {bonos.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.accent + "08", borderRadius: 8 }}>
                    <span style={{ fontSize: 12, flex: 1, color: C.t2 }}>💰 <strong style={{ color: C.accent }}>{fmt(b.monto)}</strong> mes {b.mes} · {b.desc}</span>
                    <button onClick={() => delBono(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "80px 1fr 1fr auto", gap: 8, alignItems: "end" }}>
              <Inp label="Mes" type="number" value={newBono.mes} onChange={e => setNewBono(prev => ({ ...prev, mes: e.target.value }))} />
              <MoneyInput label="Monto" value={newBono.monto} onChange={e => setNewBono(prev => ({ ...prev, monto: e.target.value }))} />
              <Inp label="Concepto" value={newBono.desc} onChange={e => setNewBono(prev => ({ ...prev, desc: e.target.value }))} />
              <button onClick={addBono} disabled={!newBono.mes || !newBono.monto} style={{
                padding: "10px 14px", borderRadius: 8, background: newBono.mes && newBono.monto ? C.accent : C.border,
                border: "none", color: newBono.mes && newBono.monto ? "#000" : C.t3, cursor: "pointer", fontSize: 12, fontWeight: 700,
              }}>+ Agregar</button>
            </div>
          </Card>

          {/* Comparison: before vs after */}
          {hasAbonos && tablaMejora && (
            <Card glow style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #0a1a0a)` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: mob ? 8 : 16, alignItems: "center", marginBottom: 14 }}>
                <div style={{ textAlign: "center", padding: 12, background: C.danger + "10", borderRadius: 12, border: `1px solid ${C.danger}22` }}>
                  <div style={{ fontSize: 10, color: C.danger, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>❌ Sin abonos</div>
                  <div style={{ fontSize: mob ? 20 : 26, fontWeight: 900, color: C.danger, fontFamily: "'Space Grotesk', monospace", lineHeight: 1 }}>{fmt(tablaBase.totalPagado)}</div>
                  <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>{p.plazo} meses ({Math.round(p.plazo / 12)} años)</div>
                </div>
                <div style={{ fontSize: 24 }}>→</div>
                <div style={{ textAlign: "center", padding: 12, background: C.accent + "10", borderRadius: 12, border: `1px solid ${C.accent}22` }}>
                  <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>✅ Con abonos</div>
                  <div style={{ fontSize: mob ? 20 : 26, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace", lineHeight: 1 }}>{fmt(tablaMejora.totalPagado)}</div>
                  <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>{tablaMejora.rows.length} meses ({Math.round(tablaMejora.rows.length / 12)} años)</div>
                </div>
              </div>
              <div style={{ textAlign: "center", padding: 14, background: C.accent + "08", borderRadius: 10, border: `1px dashed ${C.accent}33` }}>
                <div style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>💰 TE AHORRAS</div>
                <div style={{ display: "flex", justifyContent: "center", gap: mob ? 16 : 32 }}>
                  <div><div style={{ fontSize: 26, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace" }}>{fmt(tablaMejora.ahorro)}</div><div style={{ fontSize: 11, color: C.t2 }}>en intereses</div></div>
                  <div><div style={{ fontSize: 26, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace" }}>{tablaMejora.mesesAh} meses</div><div style={{ fontSize: 11, color: C.t2 }}>{Math.round(tablaMejora.mesesAh / 12)} años menos</div></div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: 12, background: C.warning + "08", borderRadius: 10, border: `1px solid ${C.warning}22` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.t3 }}>Antes pagabas</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.t1 }}>{fmt(tablaBase.mensualidadReal || tablaBase.pago)}</div>
                    <div style={{ fontSize: 10, color: C.t3 }}>al mes</div>
                  </div>
                  <div style={{ fontSize: 20, color: C.warning }}>→</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.warning }}>Ahora pagarás</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.warning }}>{fmt((tablaBase.mensualidadReal || tablaBase.pago) + p.extra)}</div>
                    <div style={{ fontSize: 10, color: C.t3 }}>al mes ({fmt(tablaBase.mensualidadReal || tablaBase.pago)} + {fmt(p.extra)} extra)</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Bank change */}
          <Card style={{ marginBottom: 16 }}>
            <button onClick={() => setShowCambio(!showCambio)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, color: C.t1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🏦</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>¿Y si cambio mi deuda a otro banco?</h3>
                  <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>Simula una transferencia con menor tasa</p>
                </div>
                <span style={{ color: C.t3 }}>{showCambio ? "▲" : "▼"}</span>
              </div>
            </button>
            {showCambio && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, color: C.t3, margin: "0 0 4px" }}>Tu tasa actual</p>
                    <div style={{ padding: "10px 12px", background: C.danger + "15", borderRadius: 8, fontSize: 18, fontWeight: 800, color: C.danger, textAlign: "center" }}>{p.tasa}%</div>
                  </div>
                  <PctInput label="Nueva tasa anual (%)" type="number" step="0.01" value={nuevaTasa || ""} onChange={e => setNuevaTasa(parseFloat(e.target.value) || 0)} />
                </div>
                {tablaCambio && nuevaTasa > 0 && (
                  <div style={{ padding: 14, background: C.accent + "08", borderRadius: 10, border: `1px solid ${C.accent}22` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.danger, fontWeight: 600, marginBottom: 4 }}>ACTUAL ({p.tasa}%)</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.danger }}>{fmt(tablaBase.totalPagado)}</div>
                      </div>
                      <div style={{ fontSize: 20 }}>→</div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, marginBottom: 4 }}>NUEVA ({nuevaTasa}%)</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>{fmt(tablaCambio.totalPagado)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: 10, background: C.accent + "10", borderRadius: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>Ahorras {fmt(tablaBase.totalPagado - tablaCambio.totalPagado)} cambiando de banco</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Plusvalía - hipoteca only */}
          {tipo === "hipoteca" && p.valorCompra > 0 && (() => {
            const t = hasAbonos ? tablaMejora : tablaBase;
            const añosC = t.rows.length / 12;
            const añosO = p.plazo / 12;
            const vfCon = p.valorCompra * Math.pow(1 + (p.plusvalia / 100), añosC);
            const vfSin = p.valorCompra * Math.pow(1 + (p.plusvalia / 100), añosO);
            const vfConPlazoOrig = p.valorCompra * Math.pow(1 + (p.plusvalia / 100), añosO);
            const balSin = vfSin - tablaBase.totalPagadoOrig;
            const balCon = hasAbonos ? vfCon - tablaMejora.totalPagado : balSin;
            const balConReal = hasAbonos ? vfConPlazoOrig - tablaMejora.totalPagado : balSin;
            const enganche = p.valorCompra - p.monto;
            return (
              <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 4 }}>🏠 ¿Tu casa es negocio o pérdida?</h3>
                <p style={{ fontSize: 11, color: C.t3, margin: "0 0 14px" }}>Costo del crédito vs plusvalía</p>
                <div style={{ display: "grid", gridTemplateColumns: hasAbonos ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 14 }}>
                  <div style={{ padding: 14, background: C.danger + "08", borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: C.danger, fontWeight: 700, marginBottom: 10 }}>{hasAbonos ? "❌ SIN ABONOS" : "📊 BALANCE"}</div>
                    <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: C.t3 }}>Total pagado:</span><span style={{ color: C.danger, fontWeight: 600 }}>{fmt(tablaBase.totalPagadoOrig + enganche)}</span></div>
                    <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.t3 }}>Valor en {Math.round(añosO)} años:</span><span style={{ color: C.accent, fontWeight: 600 }}>{fmt(vfSin)}</span></div>
                    <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                    <div style={{ fontSize: 14, display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span style={{ color: C.t2 }}>Balance:</span><span style={{ color: balSin >= 0 ? C.accent : C.danger }}>{balSin >= 0 ? "+" : ""}{fmt(balSin - enganche)}</span></div>
                  </div>
                  {hasAbonos && (
                    <div style={{ padding: 14, background: C.accent + "08", borderRadius: 12 }}>
                      <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, marginBottom: 10 }}>✅ CON ABONOS (liquidando en {Math.round(añosC)} años)</div>
                      <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: C.t3 }}>Total pagado:</span><span style={{ color: C.accent, fontWeight: 600 }}>{fmt(tablaMejora.totalPagado + enganche)}</span></div>
                      <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.t3 }}>Valor en {Math.round(añosC)} años:</span><span style={{ color: C.accent, fontWeight: 600 }}>{fmt(vfCon)}</span></div>
                      <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                      <div style={{ fontSize: 14, display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span style={{ color: C.t2 }}>Balance:</span><span style={{ color: balCon >= 0 ? C.accent : C.danger }}>{balCon >= 0 ? "+" : ""}{fmt(balCon - enganche)}</span></div>
                    </div>
                  )}
                </div>
                {hasAbonos && (
                  <div style={{ padding: 14, background: C.blue + "08", borderRadius: 12, marginBottom: 14, border: `1px solid ${C.blue}22` }}>
                    <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, marginBottom: 10 }}>📊 COMPARATIVA REAL — Con abonos pero al plazo original ({Math.round(añosO)} años)</div>
                    <p style={{ fontSize: 11, color: C.t3, margin: "0 0 8px" }}>Pagas en {Math.round(añosC)} años, pero tu casa sigue ganando plusvalía hasta los {Math.round(añosO)} años</p>
                    <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: C.t3 }}>Total pagado (con abonos):</span><span style={{ color: C.accent, fontWeight: 600 }}>{fmt(tablaMejora.totalPagado + enganche)}</span></div>
                    <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.t3 }}>Valor de tu casa en {Math.round(añosO)} años:</span><span style={{ color: C.blue, fontWeight: 600 }}>{fmt(vfConPlazoOrig)}</span></div>
                    <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                    <div style={{ fontSize: 14, display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span style={{ color: C.t2 }}>Balance real:</span><span style={{ color: balConReal >= 0 ? C.accent : C.danger, fontSize: 18 }}>{balConReal >= 0 ? "+" : ""}{fmt(balConReal - enganche)}</span></div>
                    <p style={{ fontSize: 11, color: C.accent, marginTop: 8, fontWeight: 600 }}>💡 Terminas de pagar en {Math.round(añosC)} años y los {Math.round(añosO - añosC)} años restantes tu casa sigue creciendo de valor sin que debas nada.</p>
                  </div>
                )}
                <div style={{ padding: 10, borderRadius: 8, background: (hasAbonos ? balConReal : balSin) >= 0 ? C.accent + "10" : C.danger + "10", textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: (hasAbonos ? balConReal : balSin) >= 0 ? C.accent : C.danger }}>
                    {hasAbonos && balConReal >= 0 && balSin < 0 ? "💡 Sin abonos sería pérdida. Con abonos, tu casa es inversión." : (hasAbonos ? balConReal : balSin) >= 0 ? "✅ La plusvalía supera el costo del crédito." : "🔥 El crédito cuesta más de lo que valdrá. Abona a capital."}
                  </p>
                </div>
                <p style={{ fontSize: 10, color: C.t3, marginTop: 6, textAlign: "center" }}>* Plusvalía estimada, depende de ubicación y mercado.</p>
              </Card>
            );
          })()}

          {/* Amortization table with improvements */}
          {tablaMejora && hasAbonos && (
            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 12 }}>📋 Tabla con abonos extra aplicados</h3>
              <div style={{ overflowX: "auto", maxHeight: 400 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead style={{ position: "sticky", top: 0, background: C.card }}>
                    <tr>{["#", "Saldo", "Interés", "Capital", "Mensualidad", "Abono Extra"].map((h, i) => (
                      <th key={i} style={{ padding: "7px 5px", textAlign: "right", color: C.t3, fontWeight: 500, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>{tablaMejora.rows.map(r => (
                    <tr key={r.no} style={{ borderBottom: `1px solid ${C.border}11`, background: r.no === p.mesActual ? C.accent + "15" : r.abBono > 0 ? "#F5C84210" : r.isPast ? C.bg + "80" : "transparent", opacity: r.isPast ? 0.6 : 1 }}>
                      <td style={{ padding: "5px", textAlign: "right", color: r.no === p.mesActual ? C.accent : C.t3, fontWeight: r.no === p.mesActual ? 700 : 400 }}>{r.no}{r.no === p.mesActual ? " ←" : ""}</td>
                      <td style={{ padding: "5px", textAlign: "right" }}>{fmt(r.saldo)}</td>
                      <td style={{ padding: "5px", textAlign: "right", color: C.danger }}>{fmt(r.int)}</td>
                      <td style={{ padding: "5px", textAlign: "right", color: C.accent }}>{fmt(r.amort)}</td>
                      <td style={{ padding: "5px", textAlign: "right" }}>{fmt(r.pago)}</td>
                      <td style={{ padding: "5px", textAlign: "right", color: r.abBono > 0 ? "#F5C842" : C.accent, fontWeight: r.ab > 0 ? 700 : 400 }}>{r.ab > 0 ? fmt(r.ab) : "—"}{r.abBono > 0 ? " ⭐" : ""}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          )}

          <div style={{ padding: "12px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10, color: C.t3, margin: 0, lineHeight: 1.6 }}>⚠️ <strong>Aviso:</strong> Simulación aproximada con fines educativos. Consulta tu estado de cuenta para datos exactos.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALCULADORA 2: LIBERTAD FINANCIERA (INTERÉS COMPUESTO)
   ═══════════════════════════════════════════════════════════════ */
function LibertadFinanciera({ mob }) {
  const [modo, setModo] = useState("futuro"); // "futuro" or "retiro"
  // Shared
  const [edad, setEdad] = useState(30);
  const [tasaAnual, setTasaAnual] = useState(10);
  const [inicial, setInicial] = useState(0);
  const [showTabla, setShowTabla] = useState(false);
  const [bonos, setBonos] = useState([]);
  const [newBono, setNewBono] = useState({ mes: "", monto: "", desc: "" });
  // Modo futuro
  const [ahorroMes, setAhorroMes] = useState(1000);
  const [años, setAños] = useState(20);
  // Modo retiro
  const [ingMeta, setIngMeta] = useState(50000);
  const [edadRetiro, setEdadRetiro] = useState(60);

  const addBono = () => {
    const m = parseInt(newBono.mes) || 0;
    const mto = parseFloat(newBono.monto) || 0;
    if (m <= 0 || mto <= 0) return;
    setBonos(prev => [...prev, { mes: m, monto: mto, desc: newBono.desc || `Bono mes ${m}` }]);
    setNewBono({ mes: "", monto: "", desc: "" });
  };
  const delBono = (i) => setBonos(prev => prev.filter((_, idx) => idx !== i));

  // ── MODO FUTURO ──
  const resultado = useMemo(() => {
    if (modo !== "futuro") return null;
    const tm = tasaAnual / 100 / 12;
    const meses = años * 12;
    let saldo = inicial;
    const dataAnual = [];
    const dataMensual = [];
    let totalAportado = inicial;
    let totalBonos = 0;
    let intMesAcum = 0;
    for (let i = 1; i <= meses; i++) {
      const intMes = saldo * tm;
      const bonoEste = bonos.filter(b => b.mes === i).reduce((s, b) => s + b.monto, 0);
      saldo = saldo + intMes + ahorroMes + bonoEste;
      totalAportado += ahorroMes + bonoEste;
      totalBonos += bonoEste;
      intMesAcum += intMes;
      dataMensual.push({ mes: i, aporteMes: ahorroMes, bonoMes: bonoEste, interesMes: intMes, totalAportado, interesesAcum: intMesAcum, saldo });
      if (i % 12 === 0) dataAnual.push({ año: `Año ${i / 12}`, total: Math.round(saldo), aportado: Math.round(totalAportado), intereses: Math.round(saldo - totalAportado) });
    }
    let saldoSinBonos = inicial;
    for (let i = 1; i <= meses; i++) saldoSinBonos = saldoSinBonos * (1 + tm) + ahorroMes;
    return { final: saldo, totalAportado, interesesGanados: saldo - totalAportado, dataAnual, dataMensual, totalBonos, saldoSinBonos };
  }, [modo, ahorroMes, tasaAnual, años, inicial, bonos]);

  // ── MODO RETIRO ──
  const retiro = useMemo(() => {
    if (modo !== "retiro" || edadRetiro <= edad || ingMeta <= 0) return null;
    const tm = tasaAnual / 100 / 12;
    const añosHasta = edadRetiro - edad;
    const meses = añosHasta * 12;
    // Capital necesario: para generar ingMeta/mes al tasaAnual%, necesitas: ingMeta * 12 / (tasaAnual/100)
    const capitalNecesario = (ingMeta * 12) / (tasaAnual / 100);
    // Cuánto ahorrar al mes para llegar a ese capital (fórmula de anualidad futura)
    // FV = PMT * ((1+r)^n - 1) / r + PV * (1+r)^n
    // PMT = (FV - PV * (1+r)^n) / (((1+r)^n - 1) / r)
    const fvInicial = inicial * Math.pow(1 + tm, meses);
    const fvNecesario = capitalNecesario - fvInicial;
    const factor = (Math.pow(1 + tm, meses) - 1) / tm;
    const ahorroNecesario = fvNecesario > 0 ? fvNecesario / factor : 0;
    // Bonos contribution
    let saldoBonos = 0;
    for (let i = 1; i <= meses; i++) {
      saldoBonos = saldoBonos * (1 + tm);
      const bonoEste = bonos.filter(b => b.mes === i).reduce((s, b) => s + b.monto, 0);
      saldoBonos += bonoEste;
    }
    const ahorroConBonos = fvNecesario > saldoBonos ? (fvNecesario - saldoBonos) / factor : 0;
    const totalPuesto = Math.max(ahorroConBonos, 0) * meses + inicial + bonos.reduce((s, b) => s + b.monto, 0);
    // Simulate monthly
    const dataMensual = [];
    let saldo = inicial;
    const ahMes = bonos.length > 0 ? Math.max(ahorroConBonos, 0) : Math.max(ahorroNecesario, 0);
    let totalAp = inicial;
    let intAcum = 0;
    for (let i = 1; i <= meses; i++) {
      const intMes = saldo * tm;
      const bonoEste = bonos.filter(b => b.mes === i).reduce((s, b) => s + b.monto, 0);
      saldo = saldo + intMes + ahMes + bonoEste;
      totalAp += ahMes + bonoEste;
      intAcum += intMes;
      dataMensual.push({ mes: i, aporteMes: ahMes, bonoMes: bonoEste, interesMes: intMes, totalAportado: totalAp, interesesAcum: intAcum, saldo });
    }
    const dataAnual = [];
    for (let i = 12; i <= meses; i += 12) {
      const r = dataMensual[i - 1];
      dataAnual.push({ año: `Año ${i / 12}`, total: Math.round(r.saldo), aportado: Math.round(r.totalAportado), intereses: Math.round(r.interesesAcum) });
    }
    return { capitalNecesario, ahorroNecesario: Math.max(ahorroNecesario, 0), ahorroConBonos: Math.max(ahorroConBonos, 0), añosHasta, meses, saldoFinal: saldo, totalPuesto: totalAp, intereses: intAcum, dataMensual, dataAnual, ahMes };
  }, [modo, ingMeta, edadRetiro, edad, tasaAnual, inicial, bonos]);

  const hasBonos = bonos.length > 0;
  const data = modo === "futuro" ? resultado : retiro;

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ id: "futuro", icon: "📈", label: "Calcula tu futuro", sub: "¿Cuánto voy a tener?" }, { id: "retiro", icon: "🎯", label: "Planea tu retiro", sub: "¿Cuánto necesito ahorrar?" }].map(m => (
          <button key={m.id} onClick={() => setModo(m.id)} style={{
            flex: 1, padding: "14px 12px", borderRadius: 12, cursor: "pointer",
            background: modo === m.id ? C.accent + "15" : C.bg,
            border: `2px solid ${modo === m.id ? C.accent : C.border}`,
            color: modo === m.id ? C.accent : C.t2, textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 22 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* ═══ MODO FUTURO ═══ */}
      {modo === "futuro" && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(5,1fr)", gap: 10 }}>
              <Inp label="Tu edad" type="number" value={edad} onChange={e => setEdad(parseFloat(e.target.value) || 0)} />
              <MoneyInput label="Ahorro mensual" type="number" value={ahorroMes} onChange={e => setAhorroMes(parseFloat(e.target.value) || 0)} />
              <PctInput label="Rendimiento anual (%)" type="number" step="0.5" value={tasaAnual} onChange={e => setTasaAnual(parseFloat(e.target.value) || 0)} />
              <Inp label="Años de inversión" type="number" value={años} onChange={e => setAños(parseFloat(e.target.value) || 0)} />
              <MoneyInput label="Inversión inicial" type="number" value={inicial || ""} onChange={e => setInicial(parseFloat(e.target.value) || 0)} />
            </div>
          </Card>

          {resultado && (
            <>
              <Card glow style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #0a1a0a)` }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: C.t3, margin: "0 0 4px" }}>{edad > 0 ? `Si empiezas a los ${edad} años ahorrando ${fmt(ahorroMes)}/mes` : `Ahorrando ${fmt(ahorroMes)}/mes`}{hasBonos ? " + aportes extra" : ""}</p>
                  <p style={{ fontSize: 13, color: C.t3, margin: "0 0 8px" }}>{edad > 0 ? `a los ${edad + años} años vas a tener` : `en ${años} años vas a acumular`}</p>
                  <div style={{ fontSize: mob ? 32 : 48, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace", lineHeight: 1 }}>{fmt(resultado.final)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <ShockNumber icon="💰" label="Tú pusiste" value={fmt(resultado.totalAportado)} color={C.blue} />
                  <ShockNumber icon="✨" label="Interés te regaló" value={fmt(resultado.interesesGanados)} color={C.accent} sub={`${resultado.totalAportado > 0 ? ((resultado.interesesGanados / resultado.totalAportado) * 100).toFixed(0) : 0}% extra`} />
                  <ShockNumber icon="📅" label="Meses" value={años * 12} color={C.t1} sub={`${años} años`} />
                </div>
              </Card>

              {/* Age scenarios */}
              {edad > 0 && (
                <Card style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 4 }}>🎂 ¿Cómo te verías en diferentes edades?</h3>
                  <p style={{ fontSize: 11, color: C.t3, margin: "0 0 12px" }}>Con {fmt(ahorroMes)}/mes al {tasaAnual}%{hasBonos ? " + aportes extra" : ""}</p>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)", gap: 8 }}>
                    {[50, 55, 60, 65].filter(e => e > edad).slice(0, 3).map(edadMeta => {
                      const añosH = edadMeta - edad; const mesesH = añosH * 12; const tm = tasaAnual / 100 / 12;
                      let s = inicial; for (let i = 1; i <= mesesH; i++) { const b = bonos.filter(x => x.mes === i).reduce((a, x) => a + x.monto, 0); s = s * (1 + tm) + ahorroMes + b; }
                      const tp = inicial + ahorroMes * mesesH + bonos.filter(b => b.mes <= mesesH).reduce((a, b) => a + b.monto, 0);
                      return (
                        <div key={edadMeta} style={{ padding: 14, borderRadius: 12, textAlign: "center", background: edadMeta >= 60 ? C.accent + "10" : C.bg, border: `1px solid ${edadMeta >= 60 ? C.accent + "33" : C.border}` }}>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>{edadMeta >= 65 ? "🏖️" : edadMeta >= 60 ? "🌴" : edadMeta >= 55 ? "💎" : "📈"}</div>
                          <div style={{ fontSize: 12, color: C.t3 }}>A los <strong style={{ color: C.t1 }}>{edadMeta} años</strong></div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace" }}>{fmt(s)}</div>
                          <div style={{ fontSize: 10, color: C.t2, marginTop: 4 }}>Pusiste {fmt(tp)} · Intereses {fmt(s - tp)}</div>
                        </div>
                      );
                    })}
                  </div>
                  {edad <= 25 && <div style={{ marginTop: 10, padding: 10, background: C.accent + "08", borderRadius: 8, textAlign: "center" }}><p style={{ fontSize: 12, color: C.accent, fontWeight: 700, margin: 0 }}>🌟 Empezar joven es tu mayor ventaja. El interés compuesto trabaja exponencialmente a tu favor.</p></div>}
                  {edad >= 40 && <div style={{ marginTop: 10, padding: 10, background: C.warning + "10", borderRadius: 8, textAlign: "center" }}><p style={{ fontSize: 12, color: C.warning, fontWeight: 700, margin: 0 }}>💪 Nunca es tarde. Considera aportar más o meter bonos extraordinarios.</p></div>}
                </Card>
              )}

              {hasBonos && <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.accent}` }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 28 }}>🚀</span><div><div style={{ fontSize: 15, fontWeight: 800, color: C.accent }}>Aportes extra generan {fmt(resultado.final - resultado.saldoSinBonos)} adicionales</div><p style={{ fontSize: 12, color: C.t2, margin: "4px 0 0" }}>Sin ellos tendrías {fmt(resultado.saldoSinBonos)}, con ellos <strong style={{ color: C.accent }}>{fmt(resultado.final)}</strong></p></div></div></Card>}
            </>
          )}
        </>
      )}

      {/* ═══ MODO RETIRO ═══ */}
      {modo === "retiro" && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🎯</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>¿Cuánto quieres recibir al mes cuando te retires?</h3>
                <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>Te calculamos cuánto necesitas ahorrar desde hoy</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(5,1fr)", gap: 10 }}>
              <Inp label="Tu edad actual" type="number" value={edad} onChange={e => setEdad(parseFloat(e.target.value) || 0)} />
              <MoneyInput label="Ingreso mensual deseado" type="number" value={ingMeta} onChange={e => setIngMeta(parseFloat(e.target.value) || 0)} />
              <Inp label="Edad de retiro" type="number" value={edadRetiro} onChange={e => setEdadRetiro(parseFloat(e.target.value) || 0)} />
              <PctInput label="Rendimiento anual (%)" type="number" step="0.5" value={tasaAnual} onChange={e => setTasaAnual(parseFloat(e.target.value) || 0)} />
              <MoneyInput label="Ya tienes ahorrado" type="number" value={inicial || ""} onChange={e => setInicial(parseFloat(e.target.value) || 0)} />
            </div>
          </Card>

          {retiro && (
            <>
              <Card glow style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #0a1a0a)` }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: C.t3, margin: "0 0 4px" }}>Para recibir <strong style={{ color: C.accent }}>{fmt(ingMeta)}/mes</strong> a partir de los {edadRetiro} años</p>
                  <p style={{ fontSize: 13, color: C.t3, margin: "0 0 8px" }}>necesitas acumular</p>
                  <div style={{ fontSize: mob ? 30 : 42, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace", lineHeight: 1, marginBottom: 8 }}>{fmt(retiro.capitalNecesario)}</div>
                  <p style={{ fontSize: 13, color: C.t3 }}>y para lograrlo necesitas ahorrar</p>
                  <div style={{ fontSize: mob ? 36 : 48, fontWeight: 900, color: C.warning, fontFamily: "'Space Grotesk', monospace", lineHeight: 1, margin: "8px 0" }}>{fmt(retiro.ahMes)}/mes</div>
                  <p style={{ fontSize: 14, color: C.t2 }}>durante {retiro.añosHasta} años ({retiro.meses} meses)</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <ShockNumber icon="🎯" label="Capital necesario" value={fmt(retiro.capitalNecesario)} color={C.accent} sub={`genera ${fmt(ingMeta)}/mes`} />
                  <ShockNumber icon="💰" label="Tú pondrías" value={fmt(retiro.totalPuesto)} color={C.blue} sub={`en ${retiro.añosHasta} años`} />
                  <ShockNumber icon="✨" label="Interés pone" value={fmt(retiro.intereses)} color={C.accent} sub="trabaja por ti" />
                </div>
              </Card>

              {/* Context card */}
              <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.warning}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>💡</span>
                  <div>
                    <div style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1 }}>
                      {fmt(retiro.ahMes)}/mes son {fmt(retiro.ahMes / 30)}/día
                    </div>
                    <p style={{ fontSize: 12, color: C.t2, margin: "4px 0 0" }}>
                      {retiro.ahMes < 500 ? "¡Es menos de lo que gastas en café al mes! Totalmente alcanzable." :
                       retiro.ahMes < 2000 ? "Es como una suscripción de streaming + unas comidas fuera. Sacrificio pequeño, resultado enorme." :
                       retiro.ahMes < 5000 ? "Parece mucho, pero cada peso cuenta. Empieza con lo que puedas y ve aumentando." :
                       "Es un monto considerable. Considera meter aportes extra (aguinaldo, bonos) para reducir el ahorro mensual necesario."}
                    </p>
                  </div>
                </div>
              </Card>

              {hasBonos && retiro.ahorroConBonos < retiro.ahorroNecesario && (
                <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.accent}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 28 }}>🚀</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.accent }}>Con tus aportes extra solo necesitas {fmt(retiro.ahorroConBonos)}/mes</div>
                      <p style={{ fontSize: 12, color: C.t2, margin: "4px 0 0" }}>En vez de {fmt(retiro.ahorroNecesario)}/mes — te ahorras {fmt(retiro.ahorroNecesario - retiro.ahorroConBonos)} mensuales gracias a tus bonos</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Different retirement income scenarios */}
              <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 4 }}>📊 ¿Y si quiero otro ingreso mensual?</h3>
                <p style={{ fontSize: 11, color: C.t3, margin: "0 0 12px" }}>Cuánto necesitarías ahorrar al mes para diferentes ingresos a los {edadRetiro} años</p>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(4, 1fr)", gap: 8 }}>
                  {[20000, 30000, 50000, 100000].map(meta => {
                    const capNec = (meta * 12) / (tasaAnual / 100);
                    const tm = tasaAnual / 100 / 12;
                    const meses = retiro.meses;
                    const fvIni = inicial * Math.pow(1 + tm, meses);
                    const factor = (Math.pow(1 + tm, meses) - 1) / tm;
                    const ahNec = Math.max((capNec - fvIni) / factor, 0);
                    return (
                      <div key={meta} style={{
                        padding: 12, borderRadius: 10, textAlign: "center",
                        background: meta === ingMeta ? C.accent + "15" : C.bg,
                        border: `1px solid ${meta === ingMeta ? C.accent : C.border}`,
                      }}>
                        <div style={{ fontSize: 11, color: C.t3 }}>Recibir</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: meta === ingMeta ? C.accent : C.t1 }}>{fmt(meta)}/mes</div>
                        <div style={{ fontSize: 11, color: C.t3, margin: "6px 0 2px" }}>Ahorrar</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.warning }}>{fmt(ahNec)}/mes</div>
                        <div style={{ fontSize: 10, color: C.t3 }}>{fmt(ahNec / 30)}/día</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* ═══ SHARED: Bonos + Chart + Table ═══ */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <div>
            <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, margin: 0 }}>Aportes extraordinarios</h3>
            <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>Aguinaldo, PTU o cualquier extra que metas</p>
          </div>
        </div>
        {bonos.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {bonos.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.accent + "08", borderRadius: 8 }}>
                <span style={{ fontSize: 12, flex: 1, color: C.t2 }}>💰 <strong style={{ color: C.accent }}>{fmt(b.monto)}</strong> mes {b.mes} · {b.desc}</span>
                <button onClick={() => delBono(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3 }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "80px 1fr 1fr auto", gap: 8, alignItems: "end" }}>
          <Inp label="Mes" type="number" value={newBono.mes} onChange={e => setNewBono(prev => ({ ...prev, mes: e.target.value }))} />
          <MoneyInput label="Monto" value={newBono.monto} onChange={e => setNewBono(prev => ({ ...prev, monto: e.target.value }))} />
          <Inp label="Concepto" value={newBono.desc} onChange={e => setNewBono(prev => ({ ...prev, desc: e.target.value }))} />
          <button onClick={addBono} disabled={!newBono.mes || !newBono.monto} style={{
            padding: "10px 14px", borderRadius: 8, background: newBono.mes && newBono.monto ? C.accent : C.border,
            border: "none", color: newBono.mes && newBono.monto ? "#000" : C.t3, cursor: "pointer", fontSize: 12, fontWeight: 700,
          }}>+ Agregar</button>
        </div>
      </Card>

      {/* Chart */}
      {data && (modo === "futuro" ? data.dataAnual : data.dataAnual)?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 12 }}>📈 Tu dinero creciendo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={modo === "futuro" ? data.dataAnual : data.dataAnual}>
              <defs>
                <linearGradient id="gTotal2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.3} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} /></linearGradient>
                <linearGradient id="gAport2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="año" stroke={C.t3} fontSize={10} />
              <YAxis stroke={C.t3} fontSize={10} tickFormatter={v => fmt(v)} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 12 }} formatter={v => fmt(v)} />
              <Area type="monotone" dataKey="total" stroke={C.accent} fill="url(#gTotal2)" strokeWidth={2} name="Total" />
              <Area type="monotone" dataKey="aportado" stroke={C.blue} fill="url(#gAport2)" strokeWidth={2} name="Tú pusiste" />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Snowball table */}
      {data && data.dataMensual?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, margin: 0 }}>🐾 Bola de nieve mes a mes</h3>
            <button onClick={() => setShowTabla(!showTabla)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 12 }}>{showTabla ? "▲" : "▼"}</button>
          </div>
          {showTabla && (
            <div style={{ overflowX: "auto", maxHeight: 500 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead style={{ position: "sticky", top: 0, background: C.card }}>
                  <tr>{["Mes", "Aporte", hasBonos ? "Bono" : null, "Interés", "Intereses acum.", "Saldo"].filter(Boolean).map((h, i) => (
                    <th key={i} style={{ padding: "8px 5px", textAlign: "right", color: C.t3, fontWeight: 600, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>{data.dataMensual.map(r => {
                  const isYear = r.mes % 12 === 0;
                  const ahMensual = modo === "futuro" ? ahorroMes : retiro?.ahMes || 0;
                  return (
                    <tr key={r.mes} style={{ borderBottom: isYear ? `2px solid ${C.accent}33` : `1px solid ${C.border}11`, background: r.bonoMes > 0 ? "#F5C84210" : isYear ? C.accent + "08" : "transparent" }}>
                      <td style={{ padding: "5px", textAlign: "right", color: isYear ? C.accent : C.t3, fontWeight: isYear ? 700 : 400 }}>{r.mes}{isYear ? ` (Año ${r.mes / 12})` : ""}</td>
                      <td style={{ padding: "5px", textAlign: "right", color: C.blue }}>{fmt(r.aporteMes)}</td>
                      {hasBonos && <td style={{ padding: "5px", textAlign: "right", color: r.bonoMes > 0 ? "#F5C842" : C.t3, fontWeight: r.bonoMes > 0 ? 700 : 400 }}>{r.bonoMes > 0 ? fmt(r.bonoMes) + " ⭐" : "—"}</td>}
                      <td style={{ padding: "5px", textAlign: "right", color: r.interesMes > ahMensual * 0.5 ? C.accent : C.t2, fontWeight: r.interesMes > ahMensual ? 700 : 400 }}>{fmt(r.interesMes)}{r.interesMes > ahMensual && ahMensual > 0 ? " 🔥" : ""}</td>
                      <td style={{ padding: "5px", textAlign: "right", color: C.accent, fontWeight: 600 }}>{fmt(r.interesesAcum)}</td>
                      <td style={{ padding: "5px", textAlign: "right", fontWeight: 700, color: C.t1 }}>{fmt(r.saldo)}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
          {(() => {
            const ahMensual = modo === "futuro" ? ahorroMes : retiro?.ahMes || 0;
            const mesCruce = data.dataMensual.find(r => r.interesMes >= ahMensual);
            return mesCruce && ahMensual > 0 ? (
              <div style={{ marginTop: 12, padding: 12, background: C.accent + "10", borderRadius: 10, textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, margin: 0 }}>🔥 En el mes {mesCruce.mes} ({Math.floor(mesCruce.mes / 12)} años) los intereses superan tu aporte — el dinero trabaja más que tú.</p>
              </div>
            ) : null;
          })()}
        </Card>
      )}

      <div style={{ padding: "12px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 8 }}>
        <p style={{ fontSize: 10, color: C.t3, margin: 0, lineHeight: 1.6 }}>⚠️ <strong>Aviso:</strong> Simulación con rendimiento constante y capitalización mensual. Los rendimientos reales varían. No garantiza resultados. Consulta a un asesor financiero certificado.</p>
      </div>
    </div>
  );
}


function TarjetaCredito({ mob }) {
  const [deuda, setDeuda] = useState(42000);
  const [pagoMin, setPagoMin] = useState(3500);
  const [conoceTasa, setConoceTasa] = useState(false);
  const [tasa, setTasa] = useState(0);
  const [pagoFijo, setPagoFijo] = useState(0);

  const pctMin = deuda > 0 ? ((pagoMin / deuda) * 100).toFixed(1) : 0;

  // Simulate paying minimum
  const simular = (tasaAnual, deudaInicial, pagoMinimo, pagoExtra) => {
    if (deudaInicial <= 0 || tasaAnual <= 0 || pagoMinimo <= 0) return null;
    const tm = tasaAnual / 100 / 12;
    let saldo = deudaInicial; let totalPag = 0; let totalInt = 0; let mes = 0;
    const data = [];
    while (saldo > 1 && mes < 600) {
      mes++;
      const int = saldo * tm;
      const minCalc = Math.max(saldo * (pagoMinimo / deudaInicial), 200);
      const pago = pagoExtra > 0 ? Math.min(pagoExtra, saldo + int) : Math.min(minCalc, saldo + int);
      if (pago <= int && saldo > 1 && pagoExtra > 0) return { error: true, minRequerido: int };
      const cap = pago - int;
      totalPag += pago; totalInt += int;
      saldo = Math.max(saldo - cap, 0);
      if (mes % 3 === 0 || saldo <= 1) data.push({ mes: `Mes ${mes}`, saldo: Math.round(saldo), pagado: Math.round(totalPag) });
    }
    return { meses: mes, totalPagado: totalPag, totalInt, data };
  };

  const tasasComunes = [25, 30, 36, 45, 55, 65];
  const tasaActiva = conoceTasa && tasa > 0 ? tasa : null;

  // Results for each scenario
  const escenarios = useMemo(() => {
    const tasas = tasaActiva ? [tasaActiva] : tasasComunes;
    return tasas.map(t => {
      const minimo = simular(t, deuda, pagoMin, 0);
      const fijo = pagoFijo > 0 ? simular(t, deuda, pagoMin, pagoFijo) : null;
      return { tasa: t, minimo, fijo };
    });
  }, [deuda, pagoMin, tasa, conoceTasa, pagoFijo]);

  const escPrincipal = tasaActiva ? escenarios[0] : escenarios.find(e => e.tasa === 36) || escenarios[2];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 24 }}>💳</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>Datos de tu tarjeta</h3>
            <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>Estos datos los ves en la app de tu banco</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <MoneyInput label="¿Cuánto debes en total?" type="number" value={deuda} onChange={e => setDeuda(parseFloat(e.target.value) || 0)} />
              <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>Tu saldo actual o "pago para no generar intereses"</p>
            </div>
            <div>
              <MoneyInput label="¿Cuánto te pide de pago mínimo?" type="number" value={pagoMin} onChange={e => setPagoMin(parseFloat(e.target.value) || 0)} />
              <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>El mínimo que marca tu app · Es el {pctMin}% de tu deuda</p>
            </div>
          </div>

          {/* Tasa toggle */}
          <div style={{ padding: 12, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: conoceTasa ? 10 : 0 }}>
              <button onClick={() => setConoceTasa(!conoceTasa)} style={{
                width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                background: conoceTasa ? C.accent : C.border, position: "relative", transition: "all 0.2s",
              }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: conoceTasa ? 20 : 2, transition: "all 0.2s" }} />
              </button>
              <span style={{ fontSize: 12, color: C.t2 }}>¿Conoces tu tasa de interés anual?</span>
            </div>
            {conoceTasa ? (
              <div>
                <PctInput label="Tasa de interés ordinaria anual (%)" type="number" step="0.5" value={tasa || ""} onChange={e => setTasa(parseFloat(e.target.value) || 0)} />
                <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>La encuentras en tu estado de cuenta como "Tasa de interés ordinaria anual"</p>
              </div>
            ) : (
              <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>No te preocupes, te mostramos escenarios con las tasas más comunes en México (25% a 65%)</p>
            )}
          </div>

          <div>
            <MoneyInput label="¿Cuánto podrías pagar fijo al mes? (opcional)" type="number" value={pagoFijo || ""} onChange={e => setPagoFijo(parseFloat(e.target.value) || 0)} />
            <p style={{ fontSize: 10, color: C.t3, margin: "4px 0 0" }}>Si en vez del mínimo pagaras una cantidad fija, ¿cuánto sería?</p>
          </div>
        </div>
      </Card>

      {/* Main shock - single rate or featured scenario */}
      {escPrincipal && escPrincipal.minimo && !escPrincipal.minimo.error && (
        <Card glow style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #1a0a0a)` }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: C.t3, margin: "0 0 4px" }}>Si solo pagas el mínimo en tu tarjeta{!tasaActiva ? ` (estimando tasa del ${escPrincipal.tasa}%)` : ""}</p>
            <p style={{ fontSize: 13, color: C.t3, margin: "0 0 8px" }}>tu deuda de {fmt(deuda)} te va a costar</p>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.danger, fontFamily: "'Space Grotesk', monospace", lineHeight: 1 }}>
              {fmt(escPrincipal.minimo.totalPagado)}
            </div>
            <p style={{ fontSize: 16, color: C.warning, fontWeight: 700, margin: "8px 0 0" }}>
              ¡{Math.floor(escPrincipal.minimo.meses / 12)} años y {escPrincipal.minimo.meses % 12} meses para liquidarla!
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8 }}>
            <ShockNumber icon="💳" label="Tu deuda" value={fmt(deuda)} color={C.t1} />
            <ShockNumber icon="🔥" label="Intereses" value={fmt(escPrincipal.minimo.totalInt)} color={C.danger} sub={`${deuda > 0 ? ((escPrincipal.minimo.totalInt / deuda) * 100).toFixed(0) : 0}% de tu deuda`} />
            <ShockNumber icon="⏰" label="Tiempo" value={`${escPrincipal.minimo.meses} meses`} color={C.warning} sub={`${Math.floor(escPrincipal.minimo.meses / 12)} años`} />
          </div>
        </Card>
      )}

      {/* Fixed payment comparison */}
      {pagoFijo > 0 && escPrincipal?.fijo && !escPrincipal.fijo.error && escPrincipal.minimo && (
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #0a1a0a)` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: mob ? 8 : 16, alignItems: "center", marginBottom: 14 }}>
            <div style={{ textAlign: "center", padding: 12, background: C.danger + "10", borderRadius: 12, border: `1px solid ${C.danger}22` }}>
              <div style={{ fontSize: 10, color: C.danger, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>❌ Pago mínimo</div>
              <div style={{ fontSize: mob ? 18 : 24, fontWeight: 900, color: C.danger, fontFamily: "'Space Grotesk', monospace", lineHeight: 1 }}>{fmt(escPrincipal.minimo.totalPagado)}</div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>{escPrincipal.minimo.meses} meses</div>
            </div>
            <div style={{ fontSize: 24 }}>→</div>
            <div style={{ textAlign: "center", padding: 12, background: C.accent + "10", borderRadius: 12, border: `1px solid ${C.accent}22` }}>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>✅ Pagando {fmt(pagoFijo)}/mes</div>
              <div style={{ fontSize: mob ? 18 : 24, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace", lineHeight: 1 }}>{fmt(escPrincipal.fijo.totalPagado)}</div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>{escPrincipal.fijo.meses} meses</div>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: 12, background: C.accent + "08", borderRadius: 10, border: `1px dashed ${C.accent}33` }}>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>💰 TE AHORRAS</div>
            <div style={{ display: "flex", justifyContent: "center", gap: mob ? 16 : 32 }}>
              <div><div style={{ fontSize: 24, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace" }}>{fmt(escPrincipal.minimo.totalPagado - escPrincipal.fijo.totalPagado)}</div><div style={{ fontSize: 11, color: C.t2 }}>en intereses</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 900, color: C.accent, fontFamily: "'Space Grotesk', monospace" }}>{escPrincipal.minimo.meses - escPrincipal.fijo.meses} meses</div><div style={{ fontSize: 11, color: C.t2 }}>menos de deuda</div></div>
            </div>
          </div>
        </Card>
      )}

      {pagoFijo > 0 && escPrincipal?.fijo?.error && (
        <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.danger}` }}>
          <p style={{ color: C.danger, fontSize: 13, margin: 0 }}>⚠️ Ese pago no alcanza ni para cubrir los intereses. Necesitas pagar más de {fmt(escPrincipal.fijo.minRequerido)} al mes.</p>
        </Card>
      )}

      {/* Rate scenarios - only when user doesn't know their rate */}
      {!tasaActiva && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 4 }}>📊 ¿Y si mi tasa es diferente?</h3>
          <p style={{ fontSize: 11, color: C.t3, margin: "0 0 12px" }}>Así se ve tu deuda de {fmt(deuda)} pagando el mínimo con diferentes tasas</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Tasa anual", "Total a pagar", "Intereses", "Tiempo", pagoFijo > 0 ? `Pagando ${fmt(pagoFijo)}/mes` : null].filter(Boolean).map((h, i) => (
                  <th key={i} style={{ padding: "8px 6px", textAlign: "right", color: C.t3, fontWeight: 600, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {escenarios.map(e => e.minimo && !e.minimo.error && (
                  <tr key={e.tasa} style={{ borderBottom: `1px solid ${C.border}22`, background: e.tasa === 36 ? C.warning + "08" : "transparent" }}>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: e.tasa > 50 ? C.danger : e.tasa > 35 ? C.warning : C.t1 }}>
                      {e.tasa}% {e.tasa === 36 ? " ← promedio" : ""}
                    </td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: C.danger, fontWeight: 600 }}>{fmt(e.minimo.totalPagado)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: C.t2 }}>{fmt(e.minimo.totalInt)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: C.warning }}>{Math.floor(e.minimo.meses / 12)}a {e.minimo.meses % 12}m</td>
                    {pagoFijo > 0 && e.fijo && !e.fijo.error && (
                      <td style={{ padding: "8px 6px", textAlign: "right", color: C.accent, fontWeight: 600 }}>{fmt(e.fijo.totalPagado)} ({e.fijo.meses}m)</td>
                    )}
                    {pagoFijo > 0 && (!e.fijo || e.fijo.error) && (
                      <td style={{ padding: "8px 6px", textAlign: "right", color: C.danger, fontSize: 10 }}>No alcanza</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 10, color: C.t3, marginTop: 8 }}>💡 Busca tu tasa en tu estado de cuenta como "Tasa de interés ordinaria anual" para un resultado exacto.</p>
        </Card>
      )}

      {/* Chart */}
      {escPrincipal?.minimo?.data?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, marginBottom: 12 }}>📉 Así baja tu deuda pagando el mínimo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={escPrincipal.minimo.data}>
              <defs>
                <linearGradient id="gDeuda" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.danger} stopOpacity={0.3} /><stop offset="95%" stopColor={C.danger} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" stroke={C.t3} fontSize={10} />
              <YAxis stroke={C.t3} fontSize={10} tickFormatter={v => fmt(v)} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 12 }} formatter={v => fmt(v)} />
              <Area type="monotone" dataKey="saldo" stroke={C.danger} fill="url(#gDeuda)" strokeWidth={2} name="Saldo pendiente" />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.t3, marginTop: 8, textAlign: "center" }}>Observa cómo la deuda baja extremadamente lento al principio. Eso es porque casi todo tu pago se va a intereses.</p>
        </Card>
      )}

      <div style={{ padding: "12px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 8 }}>
        <p style={{ fontSize: 10, color: C.t3, margin: 0, lineHeight: 1.6 }}>
          ⚠️ <strong>Aviso:</strong> Esta simulación es una aproximación. Cada banco calcula el pago mínimo diferente y puede incluir IVA, comisiones y anualidad. El pago mínimo real puede cambiar cada mes. Consulta tu estado de cuenta para datos exactos.
        </p>
      </div>
    </div>
  );
}



function SimuladorInfonavit({ mob }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ monto: 0, tasa: 0, plazo: 0, mesActual: 1, extra: 0, pagoReal: 0, valorCompra: 0, plusvalia: 5 });
  const [showAnual, setShowAnual] = useState(true);
  const [bonos, setBonos] = useState([]);
  const [newBono, setNewBono] = useState({ mes: "", monto: "", desc: "" });
  const set = (k, v) => setP(prev => ({ ...prev, [k]: parseFloat(v) || 0 }));
  const addBono = () => { const m=parseInt(newBono.mes)||0;const mto=parseFloat(newBono.monto)||0;if(m<=0||mto<=0)return;setBonos(prev=>[...prev,{mes:m,monto:mto,desc:newBono.desc||`Bono mes ${m}`}]);setNewBono({mes:"",monto:"",desc:""}); };
  const delBono = (i) => setBonos(prev=>prev.filter((_,idx)=>idx!==i));

  const calc = (monto,tasa,plazo,mesActual,extra,bl,pagoReal) => {
    if(monto<=0||tasa<=0||plazo<=0) return null;
    const tm=tasa/100/12;
    const pago=monto*(tm*Math.pow(1+tm,plazo))/(Math.pow(1+tm,plazo)-1);
    const mensReal=pagoReal>0?pagoReal:pago;
    const costosAd=pagoReal>pago?pagoReal-pago:0;
    const rows=[];let saldo=monto;let totalInt=0;let totalCostos=0;
    for(let i=1;i<=plazo&&saldo>0.5;i++){
      const int=saldo*tm;const amort=Math.min(pago-int,saldo);
      const extraMes=(i>=mesActual&&extra>0)?extra:0;
      const bonoEste=(bl||[]).filter(b=>b.mes===i).reduce((s,b)=>s+b.monto,0);
      const abTotal=Math.min(extraMes+bonoEste,Math.max(saldo-amort,0));
      rows.push({no:i,saldo,int,amort,pago,ab:abTotal,abBono:bonoEste,costos:costosAd,isPast:i<mesActual});
      totalInt+=int;totalCostos+=costosAd;saldo-=(amort+abTotal);
    }
    let s2=monto;let tiOrig=0;for(let i=1;i<=plazo&&s2>0.5;i++){const i2=s2*tm;tiOrig+=i2;s2-=Math.min(pago-i2,s2);}
    const totalPagado=rows.reduce((s,r)=>s+r.pago+r.ab,0)+totalCostos;
    const totalPagadoOrig=pago*plazo+costosAd*plazo;
    const costoPct=monto>0?(((totalInt+totalCostos)/monto)*100).toFixed(1):0;
    let saldoActual=monto;for(let i=1;i<mesActual&&i<=rows.length;i++)saldoActual-=rows[i-1].amort;
    const mesesRest=rows.filter(r=>!r.isPast).length;
    const resAnual=[];const maxA=Math.ceil(rows.length/12);
    for(let a=0;a<maxA;a++){const sl=rows.slice(a*12,Math.min((a+1)*12,rows.length));const aI=sl.reduce((s,r)=>s+r.int,0);const aC=sl.reduce((s,r)=>s+r.amort+r.ab,0);const aCo=sl.reduce((s,r)=>s+r.costos,0);const aT=aI+aC+aCo;resAnual.push({año:a+1,intereses:aI,capital:aC,costos:aCo,total:aT,pctInt:aT>0?((aI/aT)*100).toFixed(1):0,pctCap:aT>0?((aC/aT)*100).toFixed(1):0,saldoFinal:sl.length>0?Math.max(sl[sl.length-1].saldo-sl[sl.length-1].amort-sl[sl.length-1].ab,0):0,isPast:(a+1)*12<=mesActual});}
    return{rows,pago,totalInt,totalIntOrig:tiOrig,ahorro:tiOrig-totalInt,mesesAh:plazo-rows.length,totalPagado,totalPagadoOrig,costoPct,saldoActual,costosAd,mensReal,resAnual,mesesRest,totalCostos};
  };

  const tablaBase=useMemo(()=>calc(p.monto,p.tasa,p.plazo,p.mesActual,0,[],p.pagoReal),[p.monto,p.tasa,p.plazo,p.mesActual,p.pagoReal]);
  const tablaMejora=useMemo(()=>calc(p.monto,p.tasa,p.plazo,p.mesActual,p.extra,bonos,p.pagoReal),[p,bonos]);
  const hasAbonos=p.extra>0||bonos.length>0;
  const stepLabels=["Datos","Situación","Tu realidad","Mejoras"];

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:16}}>
        {stepLabels.map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:4,flex:i<stepLabels.length-1?1:"none"}}><button onClick={()=>i<=step?setStep(i):null} style={{width:26,height:26,borderRadius:"50%",border:"none",cursor:i<=step?"pointer":"default",background:i<step?C.accent:i===step?C.accent+"30":C.border,color:i<step?"#000":i===step?C.accent:C.t3,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{i<step?"✓":i+1}</button>{i<stepLabels.length-1&&<div style={{flex:1,height:2,background:i<step?C.accent:C.border}}/>}</div>))}
      </div>

      {/* STEP 0: Datos */}
      {step===0&&(<Card style={{animation:"fadeIn 0.3s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{fontSize:24}}>🏗️</span><div><h3 style={{fontSize:16,fontWeight:700,color:C.t1,margin:0}}>Crédito Infonavit en pesos</h3><p style={{fontSize:12,color:C.t3,margin:0}}>Créditos del 2017 en adelante con tasa fija</p></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><MoneyInput label="Monto original del crédito" type="number" value={p.monto||""} onChange={e=>set("monto",e.target.value)} /><p style={{fontSize:10,color:C.t3,margin:"4px 0 0"}}>Lo que Infonavit te prestó</p></div>
            <div><PctInput label="Tasa de interés anual (%)" type="number" step="0.01" value={p.tasa||""} onChange={e=>set("tasa",e.target.value)} /><p style={{fontSize:10,color:C.t3,margin:"4px 0 0"}}>Viene en tu estado de cuenta (3.5% a 10.45%)</p></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Inp label="Plazo (meses)" type="number" value={p.plazo||""} onChange={e=>set("plazo",e.target.value)} /><p style={{fontSize:10,color:C.warning,margin:"4px 0 0",fontWeight:600}}>⚠️ Usa el plazo de tu tabla de amortización, no el del contrato — a veces varía</p></div>
            <div><MoneyInput label="¿Cuánto te descuentan al mes?" type="number" value={p.pagoReal||""} onChange={e=>set("pagoReal",e.target.value)} /><p style={{fontSize:10,color:C.t3,margin:"4px 0 0"}}>El descuento real de tu nómina</p></div>
          </div>
          {tablaBase&&p.pagoReal>0&&tablaBase.costosAd>0&&(
            <div style={{padding:10,background:C.warning+"10",borderRadius:8,border:`1px solid ${C.warning}22`}}>
              <p style={{fontSize:12,color:C.t2,margin:0}}>💡 Mensualidad calculada: <strong style={{color:C.accent}}>{fmt(tablaBase.pago)}</strong> · Te descuentan: <strong style={{color:C.warning}}>{fmt(p.pagoReal)}</strong> · Diferencia de <strong style={{color:C.warning}}>{fmt(tablaBase.costosAd)}</strong>/mes son costos adicionales (seguro de daños, administración, etc.)</p>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><MoneyInput label="Valor de compra de la vivienda (opcional)" type="number" value={p.valorCompra||""} onChange={e=>set("valorCompra",e.target.value)} /><p style={{fontSize:10,color:C.t3,margin:"4px 0 0"}}>Para calcular plusvalía</p></div>
            <div><PctInput label="Plusvalía anual (%)" type="number" step="0.5" value={p.plusvalia||""} onChange={e=>set("plusvalia",e.target.value)} /><p style={{fontSize:10,color:C.t3,margin:"4px 0 0"}}>Promedio 5-8%</p></div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:18}}><button onClick={()=>{setStep(1);window.scrollTo({top:0,behavior:"smooth"});}} disabled={!(p.monto>0&&p.tasa>0&&p.plazo>0)} style={{padding:"10px 24px",borderRadius:8,border:"none",cursor:p.monto>0&&p.tasa>0&&p.plazo>0?"pointer":"default",background:p.monto>0&&p.tasa>0&&p.plazo>0?C.accent:C.border,color:p.monto>0&&p.tasa>0&&p.plazo>0?"#000":C.t3,fontSize:14,fontWeight:700}}>Siguiente →</button></div>
      </Card>)}

      {/* STEP 1: Situación */}
      {step===1&&(<Card style={{animation:"fadeIn 0.3s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{fontSize:24}}>📍</span><div><h3 style={{fontSize:16,fontWeight:700,color:C.t1,margin:0}}>¿Dónde estás hoy?</h3><p style={{fontSize:12,color:C.t3,margin:0}}>Si es crédito nuevo, déjalo en mes 1</p></div></div>
        <Inp label="¿En qué mes de pago vas?" type="number" value={p.mesActual} onChange={e=>set("mesActual",e.target.value)} />
        <p style={{fontSize:10,color:C.t3,margin:"4px 0 0"}}>3 años = mes 36. Consulta en Mi Cuenta Infonavit.</p>
        {tablaBase&&(<div style={{marginTop:14,padding:12,background:C.accent+"08",borderRadius:10}}><p style={{fontSize:12,color:C.t2,margin:0}}>📊 Saldo: <strong style={{color:C.accent}}>{fmt(tablaBase.saldoActual)}</strong> · Faltan <strong style={{color:C.accent}}>{tablaBase.mesesRest} meses</strong> ({Math.round(tablaBase.mesesRest/12)} años)</p></div>)}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:18}}>
          <button onClick={()=>{setStep(0);window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"10px 20px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:13}}>← Atrás</button>
          <button onClick={()=>{setStep(2);window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"10px 24px",borderRadius:8,border:"none",cursor:"pointer",background:C.accent,color:"#000",fontSize:14,fontWeight:700}}>Ver mi realidad 🔍</button>
        </div>
      </Card>)}

      {/* STEP 2: Reality */}
      {step===2&&tablaBase&&(<div style={{animation:"fadeIn 0.3s ease"}}>
        <button onClick={()=>{setStep(1);window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"8px 16px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:12,marginBottom:14}}>← Editar</button>
        <Card glow style={{marginBottom:16,background:`linear-gradient(135deg, ${C.card}, #1a0a0a)`}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <p style={{fontSize:13,color:C.t3,margin:"0 0 4px"}}>Tu crédito Infonavit de</p>
            <span style={{fontSize:32,fontWeight:800,color:C.t1}}>{fmt(p.monto)}</span>
            <p style={{fontSize:13,color:C.t3,margin:"4px 0 0"}}>al {p.tasa}% te va a costar</p>
            <div style={{fontSize:48,fontWeight:900,color:p.tasa<=5?C.warning:C.danger,fontFamily:"'Space Grotesk', monospace",margin:"8px 0",lineHeight:1}}>{fmt(tablaBase.totalPagado)}</div>
            <p style={{fontSize:14,color:C.warning,fontWeight:600}}>{tablaBase.costoPct}% más — por cada $1 pagas ${p.monto>0?(tablaBase.totalPagado/p.monto).toFixed(2):0}</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:8}}>
            <ShockNumber icon="💸" label="Intereses" value={fmt(tablaBase.totalInt)} color={C.danger} sub="al Infonavit" />
            {tablaBase.totalCostos>0&&<ShockNumber icon="📋" label="Costos extra" value={fmt(tablaBase.totalCostos)} color={C.warning} sub="seguros, admin" />}
            <ShockNumber icon="📍" label="Saldo actual" value={fmt(tablaBase.saldoActual)} color={C.cyan} sub={`mes ${p.mesActual}`} />
            <ShockNumber icon="⏰" label="Te faltan" value={`${tablaBase.mesesRest}m`} color={C.t1} sub={`${Math.round(tablaBase.mesesRest/12)} años`} />
          </div>
        </Card>

        {/* Payment breakdown */}
        {p.pagoReal>0&&tablaBase.rows.length>0&&(()=>{
          const r=tablaBase.rows[Math.min(p.mesActual,tablaBase.rows.length)-1];if(!r)return null;
          const intPct=((r.int/p.pagoReal)*100).toFixed(1);const capPct=((r.amort/p.pagoReal)*100).toFixed(1);
          const cosPct=tablaBase.costosAd>0?((tablaBase.costosAd/p.pagoReal)*100).toFixed(1):0;
          return(<Card style={{marginBottom:16}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:12}}>💰 De tu descuento de {fmt(p.pagoReal)}, ¿a dónde va?</h3>
            <div style={{display:"flex",height:32,borderRadius:8,overflow:"hidden",marginBottom:12}}>
              <div style={{width:`${intPct}%`,background:C.danger,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{intPct>10?`${intPct}%`:""}</div>
              <div style={{width:`${capPct}%`,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#000"}}>{capPct>10?`${capPct}%`:""}</div>
              {cosPct>0&&<div style={{width:`${cosPct}%`,background:C.warning,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#000"}}>{cosPct>10?`${cosPct}%`:""}</div>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":(tablaBase.costosAd>0?"1fr 1fr 1fr":"1fr 1fr"),gap:8}}>
              <div style={{padding:10,background:C.danger+"15",borderRadius:8,borderLeft:`3px solid ${C.danger}`}}><div style={{fontSize:10,color:C.t3}}>🔥 INTERESES</div><div style={{fontSize:18,fontWeight:800,color:C.danger}}>{fmt(r.int)}</div><div style={{fontSize:11,color:C.t2}}>{intPct}%</div></div>
              <div style={{padding:10,background:C.accent+"15",borderRadius:8,borderLeft:`3px solid ${C.accent}`}}><div style={{fontSize:10,color:C.t3}}>✅ CAPITAL</div><div style={{fontSize:18,fontWeight:800,color:C.accent}}>{fmt(r.amort)}</div><div style={{fontSize:11,color:C.t2}}>{capPct}%</div></div>
              {tablaBase.costosAd>0&&<div style={{padding:10,background:C.warning+"15",borderRadius:8,borderLeft:`3px solid ${C.warning}`}}><div style={{fontSize:10,color:C.t3}}>📋 COSTOS</div><div style={{fontSize:18,fontWeight:800,color:C.warning}}>{fmt(tablaBase.costosAd)}</div><div style={{fontSize:11,color:C.t2}}>{cosPct}%</div></div>}
            </div>
          </Card>);
        })()}

        {/* Annual table */}
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h3 style={{fontSize:14,fontWeight:700,color:C.t1,margin:0}}>📊 Resumen por año</h3><button onClick={()=>setShowAnual(!showAnual)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:12}}>{showAnual?"▲":"▼"}</button></div>
          {showAnual&&(<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr style={{borderBottom:`2px solid ${C.border}`}}>{["Año","Intereses","%","Capital","%",tablaBase.totalCostos>0?"Costos":null,"Total","Saldo"].filter(Boolean).map((h,i)=>(<th key={i} style={{padding:"8px 6px",textAlign:"right",color:C.t3,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:1}}>{h}</th>))}</tr></thead><tbody>{tablaBase.resAnual.map(a=>(<tr key={a.año} style={{borderBottom:`1px solid ${C.border}22`,background:a.isPast?C.accent+"06":"transparent"}}><td style={{padding:"6px",textAlign:"right",fontWeight:600,color:C.t2}}>{a.año}{a.isPast?" ✓":""}</td><td style={{padding:"6px",textAlign:"right",color:C.danger,fontWeight:600}}>{fmt(a.intereses)}</td><td style={{padding:"6px",textAlign:"right"}}><span style={{background:a.pctInt>50?C.danger+"25":a.pctInt>30?C.warning+"20":C.accent+"20",color:a.pctInt>50?C.danger:a.pctInt>30?C.warning:C.accent,padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700}}>{a.pctInt}%</span></td><td style={{padding:"6px",textAlign:"right",color:C.accent,fontWeight:600}}>{fmt(a.capital)}</td><td style={{padding:"6px",textAlign:"right"}}><span style={{background:C.accent+"20",color:C.accent,padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700}}>{a.pctCap}%</span></td>{tablaBase.totalCostos>0&&<td style={{padding:"6px",textAlign:"right",color:C.warning}}>{fmt(a.costos)}</td>}<td style={{padding:"6px",textAlign:"right",fontWeight:600}}>{fmt(a.total)}</td><td style={{padding:"6px",textAlign:"right",color:C.cyan}}>{fmt(a.saldoFinal)}</td></tr>))}</tbody></table></div>)}
        </Card>

        <Card style={{marginBottom:16,background:`linear-gradient(135deg, ${C.accent}08, ${C.card})`,border:`1px solid ${C.accent}22`}}><div style={{textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>💡</div><h3 style={{fontSize:16,fontWeight:700,color:C.t1,margin:"0 0 6px"}}>¿Quieres liquidar antes?</h3><p style={{fontSize:13,color:C.t2,margin:"0 0 14px"}}>Infonavit NO cobra penalización por adelantar pagos</p><button onClick={()=>{setStep(3);window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"12px 28px",borderRadius:10,border:"none",cursor:"pointer",background:C.accent,color:"#000",fontSize:15,fontWeight:700}}>Simular abonos →</button></div></Card>
        <div style={{padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}><p style={{fontSize:10,color:C.t3,margin:0,lineHeight:1.6}}>⚠️ Simulación para créditos Infonavit en pesos con tasa fija. El plazo debe ser el de tu tabla de amortización. Consulta Mi Cuenta Infonavit para datos exactos.</p></div>
      </div>)}

      {/* STEP 3: Mejoras */}
      {step===3&&tablaBase&&(<div style={{animation:"fadeIn 0.3s ease"}}>
        <button onClick={()=>{setStep(2);window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"8px 16px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:12,marginBottom:14}}>← Mi situación</button>
        <Card style={{marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{fontSize:24}}>💪</span><div><h3 style={{fontSize:16,fontWeight:700,color:C.t1,margin:0}}>Abonos a capital</h3><p style={{fontSize:12,color:C.t3,margin:0}}>Sin penalización en Infonavit</p></div></div>
          <div style={{marginBottom:14}}><MoneyInput label="Abono extra fijo/mes" type="number" value={p.extra||""} onChange={e=>set("extra",e.target.value)} /></div>
          <h4 style={{fontSize:13,fontWeight:600,color:C.t2,margin:"0 0 8px"}}>🎯 Bonos extraordinarios</h4>
          {bonos.length>0&&(<div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>{bonos.map((b,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.accent+"08",borderRadius:8}}><span style={{fontSize:12,flex:1,color:C.t2}}>💰 <strong style={{color:C.accent}}>{fmt(b.monto)}</strong> mes {b.mes} · {b.desc}</span><button onClick={()=>delBono(i)} style={{background:"none",border:"none",cursor:"pointer",color:C.t3}}>✕</button></div>))}</div>)}
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"80px 1fr 1fr auto",gap:8,alignItems:"end"}}>
            <Inp label="Mes" type="number" value={newBono.mes} onChange={e=>setNewBono(prev=>({...prev,mes:e.target.value}))} />
            <MoneyInput label="Monto" value={newBono.monto} onChange={e=>setNewBono(prev=>({...prev,monto:e.target.value}))} />
            <Inp label="Concepto" value={newBono.desc} onChange={e=>setNewBono(prev=>({...prev,desc:e.target.value}))} />
            <button onClick={addBono} disabled={!newBono.mes||!newBono.monto} style={{padding:"10px 14px",borderRadius:8,background:newBono.mes&&newBono.monto?C.accent:C.border,border:"none",color:newBono.mes&&newBono.monto?"#000":C.t3,cursor:"pointer",fontSize:12,fontWeight:700}}>+ Agregar</button>
          </div>
        </Card>
        {hasAbonos&&tablaMejora&&(<Card glow style={{marginBottom:16,background:`linear-gradient(135deg, ${C.card}, #0a1a0a)`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:mob?8:16,alignItems:"center",marginBottom:14}}>
            <div style={{textAlign:"center",padding:12,background:C.danger+"10",borderRadius:12}}><div style={{fontSize:10,color:C.danger,fontWeight:700,marginBottom:6}}>❌ SIN ABONOS</div><div style={{fontSize:mob?18:24,fontWeight:900,color:C.danger,fontFamily:"'Space Grotesk', monospace"}}>{fmt(tablaBase.totalPagado)}</div><div style={{fontSize:11,color:C.t2,marginTop:4}}>{p.plazo} meses ({Math.round(p.plazo/12)} años)</div></div>
            <div style={{fontSize:24}}>→</div>
            <div style={{textAlign:"center",padding:12,background:C.accent+"10",borderRadius:12}}><div style={{fontSize:10,color:C.accent,fontWeight:700,marginBottom:6}}>✅ CON ABONOS</div><div style={{fontSize:mob?18:24,fontWeight:900,color:C.accent,fontFamily:"'Space Grotesk', monospace"}}>{fmt(tablaMejora.totalPagado)}</div><div style={{fontSize:11,color:C.t2,marginTop:4}}>{tablaMejora.rows.length} meses ({Math.round(tablaMejora.rows.length/12)} años)</div></div>
          </div>
          <div style={{textAlign:"center",padding:14,background:C.accent+"08",borderRadius:10,border:`1px dashed ${C.accent}33`}}>
            <div style={{fontSize:11,color:C.t3,marginBottom:4}}>💰 TE AHORRAS</div>
            <div style={{display:"flex",justifyContent:"center",gap:mob?16:32}}>
              <div><div style={{fontSize:26,fontWeight:900,color:C.accent,fontFamily:"'Space Grotesk', monospace"}}>{fmt(tablaMejora.ahorro)}</div><div style={{fontSize:11,color:C.t2}}>en intereses</div></div>
              <div><div style={{fontSize:26,fontWeight:900,color:C.accent,fontFamily:"'Space Grotesk', monospace"}}>{tablaMejora.mesesAh} meses</div><div style={{fontSize:11,color:C.t2}}>{Math.round(tablaMejora.mesesAh/12)} años menos</div></div>
            </div>
          </div>
        </Card>)}
        {p.valorCompra>0&&(()=>{const t=hasAbonos?tablaMejora:tablaBase;const aC=t.rows.length/12;const aO=p.plazo/12;const vC=p.valorCompra*Math.pow(1+(p.plusvalia/100),aC);const vS=p.valorCompra*Math.pow(1+(p.plusvalia/100),aO);const bS=vS-tablaBase.totalPagadoOrig;const bC=hasAbonos?vC-tablaMejora.totalPagado:bS;const eng=p.valorCompra-p.monto;return(<Card style={{marginBottom:16}}><h3 style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:12}}>🏠 ¿Tu casa Infonavit es negocio?</h3><div style={{display:"grid",gridTemplateColumns:hasAbonos?"1fr 1fr":"1fr",gap:12,marginBottom:14}}><div style={{padding:14,background:C.danger+"08",borderRadius:12}}><div style={{fontSize:10,color:C.danger,fontWeight:700,marginBottom:10}}>{hasAbonos?"❌ SIN ABONOS":"📊 BALANCE"}</div><div style={{fontSize:12,display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.t3}}>Total pagado:</span><span style={{color:C.danger,fontWeight:600}}>{fmt(tablaBase.totalPagadoOrig+eng)}</span></div><div style={{fontSize:12,display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:C.t3}}>Valor en {Math.round(aO)} años:</span><span style={{color:C.accent,fontWeight:600}}>{fmt(vS)}</span></div><div style={{height:1,background:C.border}}/><div style={{fontSize:14,display:"flex",justifyContent:"space-between",fontWeight:800,marginTop:6}}><span style={{color:C.t2}}>Balance:</span><span style={{color:bS>=0?C.accent:C.danger}}>{bS>=0?"+":""}{fmt(bS-eng)}</span></div></div>{hasAbonos&&(<div style={{padding:14,background:C.accent+"08",borderRadius:12}}><div style={{fontSize:10,color:C.accent,fontWeight:700,marginBottom:10}}>✅ CON ABONOS</div><div style={{fontSize:12,display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.t3}}>Total pagado:</span><span style={{color:C.accent,fontWeight:600}}>{fmt(tablaMejora.totalPagado+eng)}</span></div><div style={{fontSize:12,display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:C.t3}}>Valor en {Math.round(aC)} años:</span><span style={{color:C.accent,fontWeight:600}}>{fmt(vC)}</span></div><div style={{height:1,background:C.border}}/><div style={{fontSize:14,display:"flex",justifyContent:"space-between",fontWeight:800,marginTop:6}}><span style={{color:C.t2}}>Balance:</span><span style={{color:bC>=0?C.accent:C.danger}}>{bC>=0?"+":""}{fmt(bC-eng)}</span></div></div>)}</div><p style={{fontSize:10,color:C.t3,textAlign:"center"}}>* Plusvalía estimada</p></Card>);})()}
        <div style={{padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}><p style={{fontSize:10,color:C.t3,margin:0,lineHeight:1.6}}>⚠️ Simulación aproximada. Consulta Mi Cuenta Infonavit.</p></div>
      </div>)}
    </div>
  );
}


export default function Landing() {
  const [tab, setTab] = useState("hipoteca");
  const [mob, setMob] = useState(true);

  useEffect(() => {
    const ch = () => setMob(window.innerWidth < 768);
    ch(); window.addEventListener("resize", ch); return () => window.removeEventListener("resize", ch);
  }, []);

  const tools = [
    { id: "hipoteca", icon: "🏠", label: "Hipoteca / Auto", sub: "¿Cuánto pagarás realmente?" },
    { id: "libertad", icon: "🚀", label: "Libertad Financiera", sub: "El poder del interés compuesto" },
    { id: "tarjeta", icon: "💳", label: "Tarjeta de Crédito", sub: "El costo del pago mínimo" },
    { id: "infonavit", icon: "🏗️", label: "Infonavit", sub: "Crédito en pesos · Tasa fija" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.t1, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield;} html{scroll-behavior:smooth}`}</style>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: mob ? "40px 16px 24px" : "60px 20px 32px", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}08, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <svg width={mob ? 70 : 90} height={mob ? 70 : 90} viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="57" stroke={C.accent} strokeWidth="2.5" fill="none" opacity="0.2" />
            <circle cx="60" cy="60" r="52" stroke={C.accent} strokeWidth="1" fill="none" opacity="0.1" />
            <rect x="30" y="72" width="60" height="6" rx="1.5" fill={C.accent} opacity="0.85" />
            <rect x="38" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7" />
            <rect x="57.5" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7" />
            <rect x="77" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7" />
            <rect x="36" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9" />
            <rect x="55.5" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9" />
            <rect x="75" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9" />
            <path d="M28 43 L60 24 L92 43" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="28" y1="43" x2="92" y2="43" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" />
            <text x="60" y="65" textAnchor="middle" fontSize="20" fontWeight="700" fontFamily="'Sora', sans-serif" fill={C.accent}>$</text>
            <rect x="20" y="38" width="4" height="40" rx="1" fill={C.accent + "55"} />
            <path d="M96 78 L96 38 L108 78 Z" stroke={C.accent + "55"} strokeWidth="1.5" fill="none" />
            <circle cx="60" cy="58" r="18" fill={C.accent} opacity="0.04" />
          </svg>
        </div>
        <h1 style={{ fontSize: mob ? 28 : 42, fontWeight: 900, fontFamily: "'Sora', sans-serif", margin: "0 0 8px", lineHeight: 1.1 }}>
          <span style={{ color: C.accent }}>Arquitecto</span> Financiero
        </h1>
        <p style={{ fontSize: mob ? 15 : 18, color: C.t2, maxWidth: 520, margin: "0 auto 8px", lineHeight: 1.5 }}>
          Descubre la verdad detrás de tus créditos.<br />
          <strong style={{ color: C.warning }}>¿Sabes cuánto estás pagando realmente?</strong>
        </p>
        <p style={{ fontSize: 13, color: C.t3 }}>Herramientas gratuitas · Sin registro · Funciona en todo el mundo</p>
      </div>

      {/* TAB SELECTOR */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: mob ? "0 12px" : "0 20px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {tools.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: mob ? "none" : 1, minWidth: mob ? 140 : "auto",
              padding: "14px 16px", borderRadius: 12, cursor: "pointer",
              background: tab === t.id ? C.accent + "12" : C.card,
              border: `2px solid ${tab === t.id ? C.accent : C.border}`,
              color: tab === t.id ? C.accent : C.t2, textAlign: "center",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              <div style={{ fontSize: 22 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{t.label}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: C.t3 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* CALCULATOR CONTENT */}
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {tab === "hipoteca" && <SimuladorCredito mob={mob} />}
          {tab === "libertad" && <LibertadFinanciera mob={mob} />}
          {tab === "tarjeta" && <TarjetaCredito mob={mob} />}
          {tab === "infonavit" && <SimuladorInfonavit mob={mob} />}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "40px 0 20px" }}>
          <div style={{ background: `linear-gradient(135deg, ${C.accent}10, ${C.purple}10)`, border: `1px solid ${C.accent}22`, borderRadius: 16, padding: 24, maxWidth: 500, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <svg width="48" height="48" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="57" stroke={C.accent} strokeWidth="2.5" fill="none" opacity="0.2" />
                <rect x="30" y="72" width="60" height="6" rx="1.5" fill={C.accent} opacity="0.85" />
                <rect x="38" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7" />
                <rect x="57.5" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7" />
                <rect x="77" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7" />
                <path d="M28 43 L60 24 L92 43" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="28" y1="43" x2="92" y2="43" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" />
                <text x="60" y="65" textAnchor="middle" fontSize="20" fontWeight="700" fontFamily="'Sora', sans-serif" fill={C.accent}>$</text>
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.t1, fontFamily: "'Sora', sans-serif", margin: "0 0 8px" }}>
              ¿Quieres tomar el control de tus finanzas?
            </h3>
            <p style={{ fontSize: 13, color: C.t2, margin: "0 0 16px", lineHeight: 1.5 }}>
              Próximamente: Arquitecto Financiero Pro — tu presupuesto personal, seguimiento de gastos, proyecciones y más. <strong style={{ color: C.accent }}>Primer mes gratis.</strong>
            </p>
            <div style={{ display: "inline-block", padding: "10px 24px", borderRadius: 8, background: C.accent + "15", border: `1px solid ${C.accent}33`, color: C.accent, fontSize: 13, fontWeight: 600 }}>
              🔔 Próximamente
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <div style={{ padding: "32px 0 16px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, fontFamily: "'Sora', sans-serif", marginBottom: 12 }}>Simuladores Financieros Gratuitos · Disponible en todo el mundo</h2>
          <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.7, marginBottom: 16 }}>
            Arquitecto Financiero te ofrece calculadoras gratuitas para que descubras cuánto pagarás realmente por tu crédito hipotecario, automotriz o tarjeta de crédito. Funciona para cualquier país: México, Colombia, Argentina, Chile, Perú, España, Estados Unidos y más. Simula abonos a capital, bonos extraordinarios, compara tasas de interés entre bancos y calcula si tu propiedad es negocio o pérdida con la plusvalía.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 14, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, margin: "0 0 6px" }}>🏠 Simulador de Hipoteca y Auto</h3>
              <p style={{ fontSize: 12, color: C.t3, margin: 0, lineHeight: 1.6 }}>Calcula el costo real de tu crédito hipotecario o automotriz. Ve cuánto pagas de intereses vs capital cada mes. Simula abonos extra y descubre cuántos años y pesos te puedes ahorrar.</p>
            </div>
            <div style={{ padding: 14, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, margin: "0 0 6px" }}>🏗️ Simulador Crédito Infonavit</h3>
              <p style={{ fontSize: 12, color: C.t3, margin: 0, lineHeight: 1.6 }}>Para créditos Infonavit en pesos del 2017 en adelante. Ingresa tu tasa fija, monto y plazo real de tu tabla de amortización. Compara cuánto ahorras vs un banco comercial.</p>
            </div>
            <div style={{ padding: 14, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, margin: "0 0 6px" }}>💳 Simulador Tarjeta de Crédito</h3>
              <p style={{ fontSize: 12, color: C.t3, margin: 0, lineHeight: 1.6 }}>Descubre cuánto te va a costar pagar solo el mínimo de tu tarjeta. Compara con un pago fijo mensual y ve cuántos años y pesos te ahorras. Escenarios con tasas del 25% al 65%.</p>
            </div>
            <div style={{ padding: 14, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: C.t1, margin: "0 0 6px" }}>🚀 Calculadora de Interés Compuesto</h3>
              <p style={{ fontSize: 12, color: C.t3, margin: 0, lineHeight: 1.6 }}>Calcula cuánto dinero puedes acumular ahorrando mensualmente. Planea tu retiro: descubre cuánto necesitas ahorrar para recibir el ingreso mensual que quieras a los 60 años.</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.t3, lineHeight: 1.6 }}>
            Todas las herramientas son 100% gratuitas, sin registro y sin compartir datos personales. Los cálculos se realizan en tu dispositivo con sistema de amortización francés, el estándar internacional. Funciona para cualquier moneda y cualquier país. Para decisiones financieras importantes, consulta a un asesor certificado en tu país.
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px 0 40px", borderTop: `1px solid ${C.border}`, marginTop: 20 }}>
          <p style={{ fontSize: 11, color: C.t3 }}>Arquitecto Financiero © 2026 · Diseña tus finanzas para un mejor futuro</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            <a href="https://www.tiktok.com/@arquitecto.financ" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.t3, textDecoration: "none" }}>📱 TikTok</a>
            <a href="https://www.instagram.com/arquitecto_financiero" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.t3, textDecoration: "none" }}>📸 Instagram</a>
          </div>
        </div>
      </div>
    </div>
  );
}
