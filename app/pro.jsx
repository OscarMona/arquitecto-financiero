"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { useAuth } from "../lib/auth-context";
import { saveUserData, loadUserData } from "../lib/db";

const C = { bg: "#050A14", card: "#0E1525", border: "#1A2540", accent: "#00E8B8", accentDim: "#00E8B815", accentGlow: "rgba(0,232,184,0.08)", danger: "#FF4D6A", dangerDim: "#FF4D6A15", warning: "#FFB443", purple: "#A78BFA", blue: "#5B9CF6", cyan: "#22D3EE", pink: "#F472B6", t1: "#F1F5F9", t2: "#8B9DC3", t3: "#475569" };
const CATEGORIAS = [{ key:"Ingresos",label:"Ingresos",icon:"💰",color:C.accent },{ key:"Gastos_Fijos",label:"Gastos Fijos",icon:"🏠",color:C.danger },{ key:"Gastos_Variables",label:"Gastos Variables",icon:"🛒",color:C.warning },{ key:"Ahorro",label:"Ahorro e Inversión",icon:"🐷",color:C.cyan },{ key:"Deuda",label:"Deuda",icon:"💳",color:C.purple },{ key:"Salud",label:"Salud",icon:"🏥",color:C.pink },{ key:"Educacion",label:"Educación",icon:"📚",color:C.blue },{ key:"Entretenimiento",label:"Entretenimiento",icon:"🎬",color:C.warning },{ key:"Hogar",label:"Hogar",icon:"🔧",color:C.t2 },{ key:"Otros",label:"Otros",icon:"📦",color:C.t3 }];
const SUBCATS = { Ingresos:["Nómina","Negocio o Bono","Otro ingreso"], Gastos_Fijos:["Renta","Luz","Agua","Teléfono / Internet","Gas","Streaming","Transporte / Gasolina","Alimentación","Personal de limpieza","Otros gastos fijos"], Gastos_Variables:["Salidas / comidas fuera","Belleza / Ropa","Mascota","Regalos"], Ahorro:["Ahorro","Inversión","Meta ahorro"], Deuda:["Tarjeta de crédito","Crédito Personal","Hipoteca / Auto"], Salud:["Consultas médicas","Medicinas","Seguro médico"], Educacion:["Colegiaturas","Cursos / diplomados","Libros / apps"], Entretenimiento:["Cine / eventos","Videojuegos","Viajes"], Hogar:["Limpieza","Mejoras del hogar","Reparaciones"], Otros:["Multas","Otro"] };
const CAT_COLORS = {}; CATEGORIAS.forEach(c => CAT_COLORS[c.key] = c.color);
const QUICK_ITEMS = [{ icon:"💰",label:"Nómina",cat:"Ingresos",sub:"Nómina",tipo:"ingreso" },{ icon:"💼",label:"Bono",cat:"Ingresos",sub:"Negocio o Bono",tipo:"ingreso" },{ icon:"🐷",label:"Ahorro",cat:"Ahorro",sub:"Ahorro",tipo:"ahorro" },{ icon:"📈",label:"Inversión",cat:"Ahorro",sub:"Inversión",tipo:"ahorro" },{ icon:"🏠",label:"Renta",cat:"Gastos_Fijos",sub:"Renta",tipo:"gasto" },{ icon:"💡",label:"Luz",cat:"Gastos_Fijos",sub:"Luz",tipo:"gasto" },{ icon:"💧",label:"Agua",cat:"Gastos_Fijos",sub:"Agua",tipo:"gasto" },{ icon:"📱",label:"Tel/Internet",cat:"Gastos_Fijos",sub:"Teléfono / Internet",tipo:"gasto" },{ icon:"🔥",label:"Gas",cat:"Gastos_Fijos",sub:"Gas",tipo:"gasto" },{ icon:"📺",label:"Streaming",cat:"Gastos_Fijos",sub:"Streaming",tipo:"gasto" },{ icon:"🚗",label:"Transporte",cat:"Gastos_Fijos",sub:"Transporte / Gasolina",tipo:"gasto" },{ icon:"🛒",label:"Súper",cat:"Gastos_Fijos",sub:"Alimentación",tipo:"gasto" },{ icon:"🍔",label:"Comida fuera",cat:"Gastos_Variables",sub:"Salidas / comidas fuera",tipo:"gasto" },{ icon:"👗",label:"Ropa",cat:"Gastos_Variables",sub:"Belleza / Ropa",tipo:"gasto" },{ icon:"🐕",label:"Mascota",cat:"Gastos_Variables",sub:"Mascota",tipo:"gasto" },{ icon:"💳",label:"Tarjeta",cat:"Deuda",sub:"Tarjeta de crédito",tipo:"gasto" },{ icon:"🏦",label:"Hipoteca",cat:"Deuda",sub:"Hipoteca / Auto",tipo:"gasto" },{ icon:"🏥",label:"Salud",cat:"Salud",sub:"Consultas médicas",tipo:"gasto" },{ icon:"📚",label:"Educación",cat:"Educacion",sub:"Cursos / diplomados",tipo:"gasto" },{ icon:"🎬",label:"Ocio",cat:"Entretenimiento",sub:"Cine / eventos",tipo:"gasto" },{ icon:"🔧",label:"Hogar",cat:"Hogar",sub:"Reparaciones",tipo:"gasto" },{ icon:"🎁",label:"Regalo",cat:"Gastos_Variables",sub:"Regalos",tipo:"gasto" },{ icon:"❓",label:"Otro",cat:"Otros",sub:"Otro",tipo:"gasto" }];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const AÑOS = [2025,2026,2027,2028,2029,2030];
const ALL_PERIODS = AÑOS.flatMap(y => MESES.map(m => ({ mes:m, año:y, key:`${m}_${y}` })));
const pk = (m,y) => `${m}_${y}`;
const fmt = n => { if(n==null||isNaN(n))return"$0"; const a=Math.abs(n); const s=a>=1e6?`$${(a/1e6).toFixed(2)}M`:"$"+Math.round(a).toLocaleString("es-MX"); return n<0?`-${s}`:s; };
const catLabel = k => CATEGORIAS.find(c=>c.key===k)?.label||k;
const catIcon = k => CATEGORIAS.find(c=>c.key===k)?.icon||"📦";
const isApartado = c => c==="Ahorro";
const isGasto = c => c!=="Ingresos"&&!isApartado(c);
const Card = ({children,style}) => <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,...style}}>{children}</div>;
const Progress = ({value,max,color=C.accent,label:l}) => { const p=max>0?Math.min((value/max)*100,150):0; const o=value>max&&max>0; return <div style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:C.t2}}>{l}</span><span style={{fontSize:11,color:o?C.danger:C.t2,fontWeight:600}}>{fmt(value)}/{fmt(max)}{o?" ⚠️":""}</span></div><div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,background:o?C.danger:p>80?C.warning:color,borderRadius:3,transition:"width 0.5s"}}/></div></div>; };

export default function AppPro({ onLogout, onGoCalc }){
  const [tab,setTab]=useState("resumen");
  const [mob,setMob]=useState(true);
  const [toast,setToast]=useState("");
  const [nombre,setNombre]=useState("");
  const [onboarded,setOnboarded]=useState(false);
  const [gastos,setGastos]=useState([]);
  const [pres,setPres]=useState({});
  const [programados,setProgramados]=useState([]);
  const [metas,setMetas]=useState([]);
  const [mes,setMes]=useState(()=>MESES[new Date().getMonth()]);
  const [año,setAño]=useState(()=>new Date().getFullYear());
  const [qMonto,setQMonto]=useState("");
  const [qNota,setQNota]=useState("");
  const [qTipo,setQTipo]=useState("gasto");
  const [qMetodo,setQMetodo]=useState("efectivo");
  const [aiMode,setAiMode]=useState(false);
  const [aiText,setAiText]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResults,setAiResults]=useState(null);
  const [editingMov,setEditingMov]=useState(null);
  const [editingCat,setEditingCat]=useState(null);
  const [editingCatDraft,setEditingCatDraft]=useState({});
  const [prorateados,setProrateados]=useState({});
  const [prorateosRechazados,setProrateosRechazados]=useState({});
  const [programadosPagados,setProgramadosPagados]=useState({});
  const [saldoInicial,setSaldoInicial]=useState(0);
  const [deudaTarjetaInicial,setDeudaTarjetaInicial]=useState(0);
  const [diaCorte,setDiaCorte]=useState(0);
  const [diaPago,setDiaPago]=useState(0);
  const [showTipFecha,setShowTipFecha]=useState(false);
  const [showFirstBudget,setShowFirstBudget]=useState(false);
  const [fbStep,setFbStep]=useState(0);
  const [fbDraft,setFbDraft]=useState({});
  const [addingTo,setAddingTo]=useState(null);
  const [extraName,setExtraName]=useState("");
  const [loaded,setLoaded]=useState(false);

  const { user } = useAuth();

  useEffect(()=>{const ch=()=>setMob(window.innerWidth<768);ch();window.addEventListener("resize",ch);return()=>window.removeEventListener("resize",ch);},[]);
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(""),2500);};

  // Load data from Firebase on mount
  useEffect(()=>{
    if(!user)return;
    const load=async()=>{
      const data=await loadUserData(user.uid);
      if(data){
        if(data.nombre)setNombre(data.nombre);
        if(data.gastos)setGastos(data.gastos);
        if(data.pres)setPres(data.pres);
        if(data.programados)setProgramados(data.programados);
        if(data.metas)setMetas(data.metas);
        if(data.onboarded)setOnboarded(data.onboarded);
        if(data.saldoInicial)setSaldoInicial(data.saldoInicial);
        if(data.deudaTarjetaInicial)setDeudaTarjetaInicial(data.deudaTarjetaInicial);
        if(data.diaCorte)setDiaCorte(data.diaCorte);
        if(data.diaPago)setDiaPago(data.diaPago);
        if(data.prorateosRechazados)setProrateosRechazados(data.prorateosRechazados);
        if(data.programadosPagados)setProgramadosPagados(data.programadosPagados);
      }
      setLoaded(true);
    };
    load();
  },[user]);

  // Auto-save to Firebase when data changes
  useEffect(()=>{
    if(!user||!loaded)return;
    const timer=setTimeout(()=>{
      saveUserData(user.uid,{nombre,gastos,pres,programados,metas,onboarded,saldoInicial,deudaTarjetaInicial,diaCorte,diaPago,prorateosRechazados,programadosPagados});
    },1000);
    return()=>clearTimeout(timer);
  },[nombre,gastos,pres,programados,metas,onboarded,user,loaded]);
  const curPK=pk(mes,año);
  const hasBudget=Object.keys(pres).length>0&&Object.values(pres).some(p=>Object.values(p).some(v=>parseFloat(v)>0));

  const saveBudgetPermanent=draft=>{const budget={};Object.entries(draft).forEach(([k,v])=>{const n=parseFloat(v)||0;if(n>0){budget[k]=n;const cat=k.split("__")[0];budget[cat]=(budget[cat]||0)+n;}});setPres(prev=>{const up={...prev};const ci=ALL_PERIODS.findIndex(p=>p.mes===mes&&p.año===año);if(ci>=0)for(let i=ci;i<ALL_PERIODS.length;i++)up[ALL_PERIODS[i].key]={...budget};return up;});};

  const applyForward=(itemKey,newValue)=>{const num=parseFloat(newValue)||0;const ci=ALL_PERIODS.findIndex(p=>p.mes===mes&&p.año===año);if(ci<0)return;setPres(prev=>{const up={...prev};for(let i=ci;i<ALL_PERIODS.length;i++){const period=ALL_PERIODS[i];const ex={...(up[period.key]||{})};if(num>0)ex[itemKey]=num;else delete ex[itemKey];const cat=itemKey.split("__")[0];const ct=Object.entries(ex).filter(([k])=>k.startsWith(`${cat}__`)).reduce((s,[,v])=>s+(parseFloat(v)||0),0);if(ct>0)ex[cat]=ct;else delete ex[cat];up[period.key]=ex;}return up;});showToast("✅ Actualizado de este mes en adelante");};

  const addMov=(cat,sub,monto,desc="",metodo="efectivo")=>{const isIng=cat==="Ingresos";const isPagoTarjeta=sub==="Pago de tarjeta";const d=new Date();const mi=MESES.indexOf(mes);const fecha=`${año}-${String(mi+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;const g={id:Date.now()+Math.floor(Math.random()*10000),fecha,mes,año,cat,sub,monto:isIng?Math.abs(+monto):isPagoTarjeta?-Math.abs(+monto):-Math.abs(+monto),desc,metodo:isIng?"efectivo":isPagoTarjeta?"pago_tarjeta":metodo};setGastos(prev=>[...prev,g]);return g;};
  const delMov=id=>setGastos(prev=>prev.filter(g=>g.id!==id));
  const editMov=(id,nc,ns,nm,nn,met)=>{setGastos(prev=>prev.map(g=>{if(g.id!==id)return g;const isIng=nc==="Ingresos";return{...g,cat:nc,sub:ns,monto:isIng?Math.abs(+nm):-Math.abs(+nm),desc:nn,metodo:met||g.metodo||"efectivo"};}));setEditingMov(null);showToast("✅ Movimiento actualizado");};

  const handleAiEntry=async()=>{if(!aiText.trim())return;setAiLoading(true);try{const cl=QUICK_ITEMS.map(q=>`${q.cat}|${q.sub}:${q.label}`).join(",");const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Analiza texto y extrae movimientos. Responde SOLO JSON:[{"cat":"","sub":"","monto":0,"nota":"","tipo":"ingreso|gasto|ahorro","metodo":"efectivo|tarjeta"}]. Si mencionan tarjeta usa metodo tarjeta, si no, usa efectivo. Categorías:${cl}. Texto:"${aiText}"`}]})});const d=await r.json();setAiResults(JSON.parse((d.content?.[0]?.text||"[]").replace(/```json|```/g,"").trim()));}catch(e){showToast("Error");}setAiLoading(false);};
  const confirmAi=()=>{if(!aiResults)return;aiResults.forEach(r=>addMov(r.cat,r.sub,r.monto,r.nota,r.metodo||"efectivo"));showToast(`✅ ${aiResults.length} registrados`);setAiText("");setAiResults(null);setAiMode(false);};

  const todayStr=new Date().toISOString().slice(0,10);
  const hasRegToday=gastos.some(g=>g.fecha?.startsWith(todayStr));
  const markNoSpend=()=>{addMov("Otros","Día sin gastos",0,"✅ Hoy no gasté nada");showToast("✅ Racha mantenida");};
  const addMeta=(n,m)=>setMetas(prev=>[...prev,{id:Date.now(),nombre:n,monto:parseFloat(m)}]);
  const delMeta=id=>setMetas(prev=>prev.filter(m=>m.id!==id));

  const gMes=useMemo(()=>gastos.filter(g=>g.mes===mes&&g.año===año),[gastos,mes,año]);
  const gAño=useMemo(()=>gastos.filter(g=>g.año===año),[gastos,año]);
  const presMes=pres[curPK]||{};
  const ingMes=useMemo(()=>gMes.filter(g=>g.cat==="Ingresos").reduce((s,g)=>s+g.monto,0),[gMes]);
  const egrMes=useMemo(()=>gMes.filter(g=>isGasto(g.cat)&&g.sub!=="Pago de tarjeta").reduce((s,g)=>s+Math.abs(g.monto),0),[gMes]);
  const ahoMes=useMemo(()=>gMes.filter(g=>isApartado(g.cat)).reduce((s,g)=>s+Math.abs(g.monto),0),[gMes]);
  const tarjetaMes=useMemo(()=>gMes.filter(g=>g.metodo==="tarjeta"&&g.sub!=="Pago de tarjeta").reduce((s,g)=>s+Math.abs(g.monto),0),[gMes]);
  const efectivoMes=useMemo(()=>gMes.filter(g=>g.metodo==="efectivo"&&isGasto(g.cat)).reduce((s,g)=>s+Math.abs(g.monto),0),[gMes]);
  const pagosTarjetaMes=useMemo(()=>gMes.filter(g=>g.sub==="Pago de tarjeta").reduce((s,g)=>s+Math.abs(g.monto),0),[gMes]);
  const balMes=ingMes-egrMes-ahoMes;
  const ingAño=useMemo(()=>gAño.filter(g=>g.cat==="Ingresos").reduce((s,g)=>s+g.monto,0),[gAño]);
  const egrAño=useMemo(()=>gAño.filter(g=>isGasto(g.cat)).reduce((s,g)=>s+Math.abs(g.monto),0),[gAño]);
  const ahoAño=useMemo(()=>gAño.filter(g=>isApartado(g.cat)).reduce((s,g)=>s+Math.abs(g.monto),0),[gAño]);
  const ahoAcumulado=useMemo(()=>gastos.filter(g=>isApartado(g.cat)&&g.año<=año).reduce((s,g)=>s+Math.abs(g.monto),0),[gastos,año]);
  const pieData=useMemo(()=>{const m={};gMes.filter(g=>isGasto(g.cat)).forEach(g=>{m[g.cat]=(m[g.cat]||0)+Math.abs(g.monto);});return Object.entries(m).map(([k,v])=>({name:catLabel(k),value:v,color:CAT_COLORS[k]||C.t3})).sort((a,b)=>b.value-a.value);},[gMes]);
  const presVsReal=useMemo(()=>CATEGORIAS.filter(c=>c.key!=="Ingresos").map(cat=>{const real=gMes.filter(g=>g.cat===cat.key).reduce((s,g)=>s+Math.abs(g.monto),0);const p=presMes[cat.key]||0;return{...cat,real,pres:p,over:real>p&&p>0};}).filter(c=>c.real>0||c.pres>0),[gMes,presMes]);
  const trend=useMemo(()=>MESES.map(m=>{const gm=gastos.filter(g=>g.mes===m&&g.año===año);return{mes:m.slice(0,3),ingresos:gm.filter(g=>g.cat==="Ingresos").reduce((s,g)=>s+g.monto,0),egresos:gm.filter(g=>isGasto(g.cat)).reduce((s,g)=>s+Math.abs(g.monto),0)};}).filter(m=>m.ingresos>0||m.egresos>0),[gastos,año]);
  const projection=useMemo(()=>{let ap=0,ar=0;return MESES.map(m=>{const pm=pres[pk(m,año)]||{};const pI=Object.entries(pm).filter(([k])=>k.startsWith("Ingresos__")).reduce((s,[,v])=>s+(parseFloat(v)||0),0);const pE=Object.entries(pm).filter(([k])=>k.includes("__")&&!k.startsWith("Ingresos__")).reduce((s,[,v])=>s+(parseFloat(v)||0),0);ap+=pI-pE;const gm=gastos.filter(g=>g.mes===m&&g.año===año);const rI=gm.filter(g=>g.cat==="Ingresos").reduce((s,g)=>s+g.monto,0);const rE=gm.filter(g=>g.cat!=="Ingresos").reduce((s,g)=>s+Math.abs(g.monto),0);const hr=gm.length>0;if(hr)ar+=rI-rE;return{mes:m.slice(0,3),proyectado:pI>0?ap:null,real:hr?ar:null,hasPres:pI>0,hasReal:hr};});},[gastos,pres,año]);
  const racha=useMemo(()=>{const h=new Date();let d2=0;for(let d=0;d<365;d++){const f=new Date(h);f.setDate(f.getDate()-d);const fs=f.toISOString().slice(0,10);const tr=gastos.some(g=>g.fecha?.startsWith(fs));if(tr||d===0){if(tr)d2++;else continue;}else break;}return d2;},[gastos]);
  const score=useMemo(()=>{let s=50;if(racha>=30)s+=15;else if(racha>=14)s+=10;else if(racha>=7)s+=5;if(ingMes>0){const sr=(ahoMes/ingMes)*100;if(sr>=20)s+=15;else if(sr>=10)s+=8;else if(sr>0)s+=3;}const exc=presVsReal.filter(c=>c.over).length;const cp=presVsReal.filter(c=>c.pres>0).length;if(cp>0&&exc===0)s+=15;else if(cp>0&&exc<=2)s+=5;else if(exc>3)s-=10;if(balMes>0)s+=5;else if(balMes<0)s-=15;if(hasBudget)s+=5;if(metas.length>0)s+=5;return Math.max(0,Math.min(100,s));},[racha,ingMes,ahoMes,presVsReal,balMes,hasBudget,metas]);
  const scoreColor=score>=80?C.accent:score>=60?C.cyan:score>=40?C.warning:C.danger;
  const scoreLabel=score>=80?"Excelente":score>=60?"Bueno":score>=40?"Regular":"Necesita atención";
  const logros=useMemo(()=>{const l=[];if(gastos.length>=1)l.push({icon:"⭐",label:"Primer registro"});if(gastos.length>=50)l.push({icon:"📝",label:"50 registros"});if(racha>=7)l.push({icon:"📅",label:"1 semana"});if(racha>=30)l.push({icon:"🏆",label:"1 mes racha"});if(hasBudget)l.push({icon:"🎯",label:"Planificador"});if(ahoAcumulado>=10000)l.push({icon:"🐷",label:"$10K ahorrados"});if(ahoAcumulado>=100000)l.push({icon:"🚀",label:"$100K ahorrados"});if(presVsReal.length>0&&!presVsReal.some(c=>c.over))l.push({icon:"✅",label:"En control"});return l;},[gastos,racha,hasBudget,ahoAcumulado,presVsReal]);
  const insights=useMemo(()=>{const l=[];if(gMes.length===0)return[{icon:"💡",text:"Registra tu primer movimiento del mes",color:C.accent}];if(pieData.length>0)l.push({icon:"📊",text:`Mayor gasto: ${pieData[0].name} (${fmt(pieData[0].value)})`,color:C.warning});const exc=presVsReal.filter(c=>c.over);if(exc.length>0)l.push({icon:"⚠️",text:`Excedido en ${exc.map(c=>c.label).join(", ")}`,color:C.danger});if(ahoMes>0&&ingMes>0){const p=Math.round((ahoMes/ingMes)*100);l.push({icon:p>=20?"🌟":"💪",text:`Ahorrando ${p}%${p>=20?" — ¡excelente!":""}`,color:C.cyan});}if(racha>=3)l.push({icon:"🔥",text:`Racha de ${racha} días`,color:C.warning});return l.slice(0,3);},[gMes,pieData,presVsReal,ahoMes,ingMes,racha]);
  const allSubsFor=(ck,draft)=>{const base=(SUBCATS[ck]||[]).map(s=>({key:`${ck}__${s}`,name:s,isExtra:false}));if(!draft)return base;const extras=Object.keys(draft).filter(k=>k.startsWith(`${ck}__`)&&!base.find(b=>b.key===k)).map(k=>({key:k,name:k.split("__")[1],isExtra:true}));return[...base,...extras];};

  /* ONBOARDING */
  if(!onboarded)return(
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&family=Space+Grotesk:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><svg width="80" height="80" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="57" stroke={C.accent} strokeWidth="2.5" fill="none" opacity="0.2"/><rect x="30" y="72" width="60" height="6" rx="1.5" fill={C.accent} opacity="0.85"/><rect x="38" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/><rect x="57.5" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/><rect x="77" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/><rect x="36" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9"/><rect x="55.5" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9"/><rect x="75" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9"/><path d="M28 43 L60 24 L92 43" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="28" y1="43" x2="92" y2="43" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/><text x="60" y="65" textAnchor="middle" fontSize="20" fontWeight="700" fontFamily="sans-serif" fill={C.accent}>$</text><rect x="20" y="38" width="4" height="40" rx="1" fill={C.accent+"55"}/><path d="M96 78 L96 38 L108 78 Z" stroke={C.accent+"55"} strokeWidth="1.5" fill="none"/></svg></div>
        <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.accent,margin:"0 0 8px"}}>Arquitecto Financiero</h1>
        <p style={{color:C.t2,fontSize:15,margin:"0 0 32px",lineHeight:1.5}}>Toma el control de tu dinero.<br/>Empieza hoy, mejora mañana.</p>
        <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`,marginBottom:16}}>
          <label style={{fontSize:13,color:C.t2,display:"block",marginBottom:8,textAlign:"left"}}>¿Cómo te llamas?</label>
          <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Tu nombre" style={{width:"100%",boxSizing:"border-box",padding:"14px 16px",borderRadius:12,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:18,fontWeight:600,outline:"none",textAlign:"center"}} autoFocus/>
        </div>
        <button onClick={()=>nombre.trim()&&setOnboarded(true)} disabled={!nombre.trim()} style={{width:"100%",padding:16,borderRadius:12,border:"none",cursor:nombre.trim()?"pointer":"default",background:nombre.trim()?C.accent:C.border,color:nombre.trim()?"#000":C.t3,fontSize:16,fontWeight:700}}>Comenzar 🚀</button>
      </div>
    </div>
  );

  /* FIRST BUDGET WIZARD */
  if(showFirstBudget){
    const setFb=(k,v)=>setFbDraft(p=>({...p,[k]:v}));
    const fbT=prefix=>Object.entries(fbDraft).filter(([k])=>k.startsWith(prefix)).reduce((s,[,v])=>s+(parseFloat(v)||0),0);
    const tI=fbT("Ingresos__");const tE=Object.entries(fbDraft).filter(([k])=>k.includes("__")&&!k.startsWith("Ingresos__")).reduce((s,[,v])=>s+(parseFloat(v)||0),0);
    const is={width:"100%",boxSizing:"border-box",padding:"8px 10px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:14,fontWeight:600,outline:"none",textAlign:"right"};
    // Get all subs including custom ones added by user
    const allSubsWithExtras=(catKey)=>{
      const base=(SUBCATS[catKey]||[]).map(s=>({key:`${catKey}__${s}`,name:s,isExtra:false}));
      const extras=Object.keys(fbDraft).filter(k=>k.startsWith(`${catKey}__`)&&!base.find(b=>b.key===k)).map(k=>({key:k,name:k.split("__")[1],isExtra:true}));
      return[...base,...extras];
    };
    const addExtra=(catKey)=>{if(!extraName.trim())return;const key=`${catKey}__${extraName.trim()}`;setFb(key,"");setExtraName("");setAddingTo(null);};
    return(
      <div style={{background:C.bg,minHeight:"100vh",color:C.t1,fontFamily:"'DM Sans',system-ui,sans-serif",padding:"20px 16px 100px"}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&family=Space+Grotesk:wght@700;800&display=swap" rel="stylesheet"/>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} input[type=number]{-moz-appearance:textfield}`}</style>
        <div style={{display:"flex",gap:4,marginBottom:20}}>{["Ingresos","Egresos","Programados"].map((s,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=fbStep?C.accent:C.border}}/>)}</div>

        {fbStep===0&&<div style={{animation:"fadeIn 0.3s"}}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:40}}>💰</span><h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:C.t1,margin:"8px 0 4px"}}>¿Cuánto ganas al mes?</h2><p style={{color:C.t2,fontSize:13,margin:0}}>Es tu primer presupuesto. Te guiamos paso a paso.</p><p style={{color:C.t3,fontSize:11,margin:"6px 0 0"}}>Si cometes errores, los puedes corregir después en Presupuesto.</p></div>

          <div style={{background:C.card,borderRadius:12,padding:14,border:`1px solid ${C.accent}33`,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:4}}>📊 ¿Cómo arrancas hoy?</div>
            <div style={{fontSize:11,color:C.t2,marginBottom:12,lineHeight:1.5}}>Solo afecta el flujo de caja para ver desde dónde partes realmente.</div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:C.t3,marginBottom:3}}>🏦 Saldo en banco / efectivo</div>
              <input type="number" placeholder="$0" value={saldoInicial||""} onChange={e=>setSaldoInicial(parseFloat(e.target.value)||0)} style={{...is,width:"100%",color:C.accent}}/>
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:C.t3,marginBottom:3}}>💳 Deuda actual en tarjeta de crédito</div>
              <input type="number" placeholder="$0" value={deudaTarjetaInicial||""} onChange={e=>setDeudaTarjetaInicial(parseFloat(e.target.value)||0)} style={{...is,width:"100%",color:C.purple}}/>
            </div>

            {deudaTarjetaInicial>0&&<>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:C.t3,marginBottom:6}}>📅 Día de corte <span style={{color:C.t3}}>(cuando el banco congela el saldo)</span></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {[1,5,10,15,17,20,25,28].map(d=>(
                    <button key={d} onClick={()=>setDiaCorte(d)} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${diaCorte===d?C.purple:C.border}`,background:diaCorte===d?C.purple+"22":"transparent",color:diaCorte===d?C.purple:C.t3,fontSize:11,fontWeight:diaCorte===d?700:400,cursor:"pointer"}}>día {d}</button>
                  ))}
                  <input type="number" placeholder="otro" min={1} max={31} value={![0,1,5,10,15,17,20,25,28].includes(diaCorte)&&diaCorte>0?diaCorte:""} onChange={e=>{const v=parseInt(e.target.value);if(v>=1&&v<=31)setDiaCorte(v);}} style={{width:55,padding:"5px 8px",borderRadius:6,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:11,outline:"none",textAlign:"center"}}/>
                </div>
              </div>

              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:C.t3,marginBottom:6}}>💰 Día límite de pago <span style={{color:C.t3}}>(cuando tienes que pagar)</span></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {[1,5,10,15,17,20,25,28].map(d=>(
                    <button key={d} onClick={()=>setDiaPago(d)} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${diaPago===d?C.accent:C.border}`,background:diaPago===d?C.accent+"22":"transparent",color:diaPago===d?C.accent:C.t3,fontSize:11,fontWeight:diaPago===d?700:400,cursor:"pointer"}}>día {d}</button>
                  ))}
                  <input type="number" placeholder="otro" min={1} max={31} value={![0,1,5,10,15,17,20,25,28].includes(diaPago)&&diaPago>0?diaPago:""} onChange={e=>{const v=parseInt(e.target.value);if(v>=1&&v<=31)setDiaPago(v);}} style={{width:55,padding:"5px 8px",borderRadius:6,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:11,outline:"none",textAlign:"center"}}/>
                </div>
                <button onClick={()=>setShowTipFecha(!showTipFecha)} style={{marginTop:8,background:"none",border:"none",color:C.purple,fontSize:11,cursor:"pointer",padding:0,textDecoration:"underline"}}>
                  {showTipFecha?"▲ Ocultar":"❓ No sé mis fechas — ¿cómo las consulto?"}
                </button>
                {showTipFecha&&<div style={{marginTop:8,padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.purple}33`}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.purple,marginBottom:6}}>¿Cómo encontrar tus fechas?</div>
                  {[
                    {banco:"BBVA",tip:"App BBVA → tu tarjeta → Ver detalle → busca 'Fecha de corte' y 'Fecha límite de pago'"},
                    {banco:"Banamex / Citibanamex",tip:"App Citibanamex → Tarjetas → selecciona tu tarjeta → Estado de cuenta"},
                    {banco:"Santander",tip:"App Santander → Tarjetas → Detalle de tarjeta → Fechas de corte"},
                    {banco:"HSBC",tip:"App HSBC → Tarjetas → Ver estado de cuenta → Fechas"},
                    {banco:"Banorte",tip:"App Banorte → Tarjetas → Detalle → Información de la tarjeta"},
                  ].map((b,i)=>(
                    <div key={i} style={{marginBottom:6,paddingBottom:6,borderBottom:i<4?`1px solid ${C.border}22`:"none"}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.t1}}>{b.banco}</div>
                      <div style={{fontSize:10,color:C.t3,lineHeight:1.4}}>{b.tip}</div>
                    </div>
                  ))}
                  <div style={{fontSize:10,color:C.t2,marginTop:6,padding:"6px 8px",background:C.card,borderRadius:6}}>
                    💡 Si no puedes consultarlo ahorita, puedes dejarlo en blanco y completarlo después en tu Perfil.
                  </div>
                </div>}
              </div>
            </>}

            {(saldoInicial>0||deudaTarjetaInicial>0)&&<div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:11,color:C.t2}}>Liquidez disponible hoy</span>
                <span style={{fontSize:13,fontWeight:800,color:C.accent}}>{fmt(saldoInicial)}</span>
              </div>
              {deudaTarjetaInicial>0&&<div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:C.t2}}>Comprometido en tarjeta{diaPago>0?` (pago día ${diaPago})`:diaCorte>0?` (corte día ${diaCorte})`:""}</span>
                <span style={{fontSize:13,fontWeight:800,color:C.purple}}>−{fmt(deudaTarjetaInicial)}</span>
              </div>}
            </div>}
          </div>

          <div style={{fontSize:11,fontWeight:700,color:C.t2,marginBottom:8}}>Ingresos mensuales</div>
          {allSubsWithExtras("Ingresos").map(({key,name,isExtra})=><div key={key} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:12,color:isExtra?C.accent:C.t2,flex:1}}>{name}{isExtra?" ✨":""}</span><input type="number" placeholder="$0" value={fbDraft[key]||""} onChange={e=>setFb(key,e.target.value)} style={{...is,width:140,color:C.accent}}/></div>)}
          {addingTo==="Ingresos"?<div style={{display:"flex",gap:6,marginTop:6}}><input type="text" value={extraName} onChange={e=>setExtraName(e.target.value)} placeholder="Nombre (ej: Freelance)" style={{flex:1,padding:"8px 10px",borderRadius:8,background:C.bg,border:`1px solid ${C.accent}44`,color:C.t1,fontSize:12,outline:"none"}} autoFocus/><button onClick={()=>addExtra("Ingresos")} style={{padding:"8px 12px",borderRadius:8,border:"none",background:C.accent,color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>+</button><button onClick={()=>{setAddingTo(null);setExtraName("");}} style={{padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.t3,fontSize:11,cursor:"pointer"}}>✕</button></div>:<button onClick={()=>setAddingTo("Ingresos")} style={{width:"100%",padding:8,borderRadius:8,border:`1px dashed ${C.accent}33`,background:"transparent",color:C.accent,fontSize:11,cursor:"pointer",marginTop:6}}>+ Agregar otro ingreso</button>}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:16,padding:"12px 0",borderTop:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.t3}}>Total ingresos</span><span style={{fontSize:22,fontWeight:800,color:C.accent}}>{fmt(tI)}</span></div>
          <button onClick={()=>setFbStep(1)} disabled={tI<=0} style={{width:"100%",padding:14,borderRadius:12,border:"none",cursor:tI>0?"pointer":"default",background:tI>0?C.accent:C.border,color:tI>0?"#000":C.t3,fontSize:15,fontWeight:700,marginTop:8}}>Continuar a Egresos →</button>
        </div>}

        {fbStep===1&&<div style={{animation:"fadeIn 0.3s"}}>
          <div style={{textAlign:"center",marginBottom:16}}><span style={{fontSize:40}}>📋</span><h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:C.t1,margin:"8px 0 4px"}}>¿En qué gastas al mes?</h2><p style={{color:C.t2,fontSize:12}}>Pon lo que sepas. Lo que no, déjalo en cero.</p></div>

          {/* RESUMEN ARRIBA */}
          <div style={{background:C.card,borderRadius:12,padding:12,border:`1px solid ${C.border}`,marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:tE>0?10:0}}>
              <div style={{textAlign:"center",padding:"8px 4px",background:C.accentDim,borderRadius:8}}><div style={{fontSize:9,color:C.t3,marginBottom:2}}>Ingresos</div><div style={{fontSize:15,fontWeight:700,color:C.accent}}>{fmt(tI)}</div></div>
              <div style={{textAlign:"center",padding:"8px 4px",background:C.dangerDim,borderRadius:8}}><div style={{fontSize:9,color:C.t3,marginBottom:2}}>Egresos</div><div style={{fontSize:15,fontWeight:700,color:C.danger}}>{fmt(tE)}</div></div>
              <div style={{textAlign:"center",padding:"8px 4px",background:(tI-tE)>=0?C.accentDim:C.dangerDim,borderRadius:8}}><div style={{fontSize:9,color:C.t3,marginBottom:2}}>Te sobra</div><div style={{fontSize:15,fontWeight:700,color:(tI-tE)>=0?C.accent:C.danger}}>{fmt(tI-tE)}</div></div>
            </div>
            {tE>0&&<><div style={{fontSize:10,color:C.t3,marginBottom:6}}>Desglose por categoría:</div>
            {CATEGORIAS.filter(c=>c.key!=="Ingresos").map(cat=>{const subs=allSubsWithExtras(cat.key);const total=subs.reduce((s,sub)=>s+(parseFloat(fbDraft[sub.key])||0),0);if(total<=0)return null;return<div key={cat.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:7,marginBottom:3,background:C.bg}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:cat.color,flexShrink:0}}/><span style={{fontSize:11,color:C.t2}}>{cat.icon} {cat.label}</span></div><span style={{fontSize:12,fontWeight:700,color:cat.color}}>{fmt(total)}</span></div>;})}
            </>}
          </div>

          {/* LISTA DE CATEGORÍAS */}
          <div style={{maxHeight:380,overflowY:"auto"}}>{CATEGORIAS.filter(c=>c.key!=="Ingresos").map(cat=>{const subs=allSubsWithExtras(cat.key);const total=subs.reduce((s,sub)=>s+(parseFloat(fbDraft[sub.key])||0),0);return(<div key={cat.key} style={{marginBottom:10,background:C.card,borderRadius:10,padding:12,borderLeft:`3px solid ${cat.color}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:total>0?6:0}}><span style={{fontSize:12,fontWeight:700,color:cat.color}}>{cat.icon} {cat.label}</span>{total>0&&<span style={{fontSize:12,fontWeight:700,color:cat.color}}>{fmt(total)}</span>}</div>{subs.map(({key,name,isExtra})=><div key={key} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{fontSize:10,color:isExtra?cat.color:C.t3,flex:1}}>{name}{isExtra?" ✨":""}</span><input type="number" placeholder="$0" value={fbDraft[key]||""} onChange={e=>setFb(key,e.target.value)} style={{...is,width:110,fontSize:12}}/></div>)}
            {addingTo===cat.key?<div style={{display:"flex",gap:6,marginTop:4}}><input type="text" value={extraName} onChange={e=>setExtraName(e.target.value)} placeholder="Nombre del gasto" style={{flex:1,padding:"6px 8px",borderRadius:6,background:C.bg,border:`1px solid ${cat.color}44`,color:C.t1,fontSize:11,outline:"none"}} autoFocus/><button onClick={()=>addExtra(cat.key)} style={{padding:"6px 10px",borderRadius:6,border:"none",background:cat.color,color:"#000",fontSize:10,fontWeight:700,cursor:"pointer"}}>+</button><button onClick={()=>{setAddingTo(null);setExtraName("");}} style={{padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:C.t3,fontSize:10,cursor:"pointer"}}>✕</button></div>:<button onClick={()=>setAddingTo(cat.key)} style={{width:"100%",padding:6,borderRadius:6,border:`1px dashed ${cat.color}33`,background:"transparent",color:cat.color,fontSize:10,cursor:"pointer",marginTop:4}}>+ Agregar otro</button>}
          </div>);})}</div>

          {/* FRASE MOTIVACIONAL */}
          {tE>0&&<div style={{margin:"12px 0",padding:"14px 16px",borderRadius:12,textAlign:"center",background:(tI-tE)>=0?`${C.accent}12`:`${C.danger}12`,border:`1px solid ${(tI-tE)>=0?C.accent:C.danger}33`}}>
            {(tI-tE)>=0
              ?<><div style={{fontSize:22,marginBottom:4}}>🚀</div><div style={{fontSize:13,color:C.t2,marginBottom:2}}>Con este presupuesto ahorrarás</div><div style={{fontSize:22,fontWeight:800,color:C.accent}}>{fmt((tI-tE)*12)} al año</div><div style={{fontSize:11,color:C.t3,marginTop:3}}>{fmt(tI-tE)} cada mes disponibles</div></>
              :<><div style={{fontSize:22,marginBottom:4}}>⚠️</div><div style={{fontSize:13,color:C.danger,fontWeight:700}}>Tus egresos superan tus ingresos</div><div style={{fontSize:20,fontWeight:800,color:C.danger}}>{fmt(tI-tE)} al mes</div><div style={{fontSize:11,color:C.t3,marginTop:3}}>Revisa tus gastos antes de continuar</div></>
            }
          </div>}

          <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={()=>setFbStep(0)} style={{flex:1,padding:12,borderRadius:10,background:C.card,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:13}}>← Atrás</button><button onClick={()=>setFbStep(2)} style={{flex:2,padding:12,borderRadius:10,border:"none",background:C.accent,color:"#000",cursor:"pointer",fontSize:14,fontWeight:700}}>Gastos programados →</button></div>
        </div>}

        {fbStep===2&&<div style={{animation:"fadeIn 0.3s"}}><div style={{textAlign:"center",marginBottom:16}}><span style={{fontSize:40}}>📅</span><h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:C.t1,margin:"8px 0 4px"}}>¿Pagos grandes que se vienen?</h2><p style={{color:C.t2,fontSize:12}}>Anualidad, seguro, predial... Si no tienes, sáltalo.</p></div>
          {programados.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:C.card,borderRadius:10,marginBottom:6,border:`1px solid ${C.border}`}}><span style={{fontSize:16}}>📅</span><div style={{flex:1}}><div style={{fontSize:12,color:C.t1,fontWeight:600}}>{p.nombre}</div><div style={{fontSize:10,color:C.t3}}>{MESES[p.mes]}{p.repite?" · Anual":""}</div></div><span style={{fontSize:13,fontWeight:700,color:C.warning}}>{fmt(p.monto)}</span><button onClick={()=>setProgramados(prev=>prev.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}>✕</button></div>)}
          <ScheduledForm onAdd={(n,m,mp,r)=>setProgramados(prev=>[...prev,{id:Date.now(),nombre:n,monto:parseFloat(m),mes:mp,repite:r}])}/>
          <div style={{display:"flex",gap:8,marginTop:16}}><button onClick={()=>setFbStep(1)} style={{flex:1,padding:12,borderRadius:10,background:C.card,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:13}}>← Atrás</button><button onClick={()=>{saveBudgetPermanent(fbDraft);setShowFirstBudget(false);setTab("resumen");showToast("🎉 ¡Tu presupuesto está listo!");}} style={{flex:2,padding:12,borderRadius:10,border:"none",background:C.accent,color:"#000",cursor:"pointer",fontSize:14,fontWeight:700}}>✅ Guardar presupuesto</button></div>
        </div>}
      </div>
    );
  }

  /* MAIN APP */
  const tabs=[{id:"resumen",icon:"📊",label:"Resumen"},{id:"registro",icon:"➕",label:"Registrar"},{id:"presupuesto",icon:"🎯",label:"Presupuesto"},{id:"perfil",icon:"👤",label:"Perfil"}];

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.t1,fontFamily:"'DM Sans',system-ui,sans-serif",paddingBottom:80}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&family=Space+Grotesk:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} input[type=number]{-moz-appearance:textfield}`}</style>
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:C.accent,color:"#000",padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:9999,animation:"fadeIn 0.3s"}}>{toast}</div>}

      <div style={{margin:"0 16px 8px",padding:"8px 12px",background:C.warning+"12",borderRadius:8,border:`1px solid ${C.warning}33`,textAlign:"center"}}><span style={{fontSize:11,color:C.warning}}>🚧 Estamos en construcción — tu feedback nos ayuda a mejorar</span></div>

      <div style={{padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:C.t3}}>Hola, {nombre} 👋</div><div style={{fontSize:15,fontWeight:700}}>{mes} {año}</div></div><div style={{display:"flex",gap:6}}><button onClick={()=>{const i=MESES.indexOf(mes);if(i===0){setMes(MESES[11]);setAño(año-1);}else setMes(MESES[i-1]);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.t2,padding:"6px 10px",cursor:"pointer",fontSize:12}}>←</button><button onClick={()=>{const i=MESES.indexOf(mes);if(i===11){setMes(MESES[0]);setAño(año+1);}else setMes(MESES[i+1]);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.t2,padding:"6px 10px",cursor:"pointer",fontSize:12}}>→</button></div></div>

      <div style={{display:"grid",gridTemplateColumns:tarjetaMes>0?"1fr 1fr 1fr 1fr 1fr":"1fr 1fr 1fr 1fr",gap:6,padding:"0 16px 4px"}}>{[{l:"Ingresos",v:ingMes,c:C.accent},{l:"Efectivo",v:efectivoMes,c:C.danger},tarjetaMes>0?{l:"💳 Tarjeta",v:tarjetaMes,c:C.purple}:null,{l:"Apartado",v:ahoMes,c:C.cyan},{l:"Disponible",v:balMes,c:balMes>=0?C.accent:C.danger}].filter(Boolean).map((s,i)=><div key={i} style={{background:C.card,borderRadius:10,padding:"8px 4px",textAlign:"center"}}><div style={{fontSize:8,color:C.t3}}>{s.l}</div><div style={{fontSize:12,fontWeight:700,color:s.c}}>{fmt(s.v)}</div></div>)}</div>
      {(tarjetaMes>0||deudaTarjetaInicial>0)&&<div style={{margin:"0 16px 10px",padding:"10px 12px",background:C.purple+"12",borderRadius:10,border:`1px solid ${C.purple}33`}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:16}}>💳</span><div style={{flex:1}}><span style={{fontSize:11,color:C.purple,fontWeight:700}}>Llevas {fmt(tarjetaMes)} cargados a tarjeta este mes</span>{deudaTarjetaInicial>0&&<span style={{fontSize:10,color:C.t3}}> · Deuda anterior: {fmt(deudaTarjetaInicial)}</span>}{pagosTarjetaMes>0&&<span style={{fontSize:10,color:C.accent}}> · Abonado: {fmt(pagosTarjetaMes)}</span>}</div></div>{tarjetaMes>pagosTarjetaMes&&<div style={{fontSize:11,color:C.warning,lineHeight:1.5,paddingLeft:24,marginTop:4}}>⚠️ Tu saldo disponible muestra {fmt(balMes)}, pero necesitas apartar <strong style={{color:C.purple}}>{fmt(tarjetaMes-pagosTarjetaMes)}</strong> para pagar tu tarjeta cuando llegue el corte. Tu disponible real es <strong style={{color:balMes-(tarjetaMes-pagosTarjetaMes)>=0?C.accent:C.danger}}>{fmt(balMes-(tarjetaMes-pagosTarjetaMes))}</strong>{balMes-(tarjetaMes-pagosTarjetaMes)<0?" — ¡cuidado, no te va a alcanzar!":""}</div>}{deudaTarjetaInicial>0&&<div style={{fontSize:11,color:C.t3,paddingLeft:24,marginTop:4}}>Deuda total incluyendo anterior: <strong style={{color:C.purple}}>{fmt(tarjetaMes+deudaTarjetaInicial-pagosTarjetaMes)}</strong></div>}</div>}

      <div style={{padding:"0 16px",animation:"fadeIn 0.3s"}}>

        {tab==="resumen"&&<div>{!hasBudget?<Card style={{textAlign:"center",padding:30,background:`linear-gradient(135deg,${C.card},${C.accent}08)`,borderColor:C.accent+"22"}}><div style={{fontSize:48,marginBottom:12}}>🎯</div><h3 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:C.t1,margin:"0 0 8px"}}>Configura tu primer presupuesto</h3><p style={{color:C.t2,fontSize:13,margin:"0 0 20px",lineHeight:1.5}}>Te guiamos paso a paso. Solo necesitas saber cuánto ganas y en qué gastas.</p><button onClick={()=>{setShowFirstBudget(true);setFbStep(0);setFbDraft({});}} style={{padding:"14px 28px",borderRadius:12,border:"none",background:C.accent,color:"#000",fontSize:15,fontWeight:700,cursor:"pointer"}}>Empezar →</button></Card>:<div>
          <div style={{display:"flex",gap:10,marginBottom:12}}><div style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${scoreColor}22`,textAlign:"center",minWidth:90}}><div style={{position:"relative",width:60,height:60,margin:"0 auto 6px"}}><svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" stroke={C.border} strokeWidth="4" fill="none"/><circle cx="30" cy="30" r="26" stroke={scoreColor} strokeWidth="4" fill="none" strokeDasharray={`${score*1.63} 163`} transform="rotate(-90 30 30)" strokeLinecap="round"/></svg><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:18,fontWeight:800,color:scoreColor}}>{score}</div></div><div style={{fontSize:10,fontWeight:700,color:scoreColor}}>{scoreLabel}</div><div style={{fontSize:8,color:C.t3}}>Score financiero</div></div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><div style={{background:C.card,borderRadius:10,padding:"8px 12px",border:`1px solid ${racha>=7?C.warning+"33":C.border}`,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{racha>=30?"🏆":racha>=7?"🔥":racha>=1?"📅":"💤"}</span><div><div style={{fontSize:16,fontWeight:800,color:racha>=7?C.warning:C.t1}}>{racha} días</div><div style={{fontSize:9,color:C.t3}}>de racha</div></div></div>
              {!hasRegToday&&<button onClick={markNoSpend} style={{background:C.card,borderRadius:10,padding:"10px 12px",border:`2px dashed ${C.accent}33`,color:C.accent,fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left"}}>✅ Hoy no gasté nada</button>}
              {insights.slice(0,2).map((ins,i)=><div key={i} style={{background:C.card,borderRadius:8,padding:"6px 10px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{ins.icon}</span><span style={{fontSize:10,color:ins.color,flex:1}}>{ins.text}</span></div>)}
            </div></div>
          {presVsReal.length>0&&<Card style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:10}}>📊 Presupuesto vs Real</div>{presVsReal.map((c,i)=><Progress key={i} value={c.real} max={c.pres} color={CAT_COLORS[c.key]} label={`${c.icon} ${c.label}`}/>)}</Card>}
          {pieData.length>0&&<Card style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:10}}>¿A dónde se va tu dinero?</div><div style={{display:"flex",alignItems:"center",gap:12}}><ResponsiveContainer width="50%" height={130}><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={2}>{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart></ResponsiveContainer><div style={{flex:1}}>{pieData.slice(0,5).map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><div style={{width:6,height:6,borderRadius:"50%",background:d.color,flexShrink:0}}/><span style={{fontSize:10,color:C.t2,flex:1}}>{d.name}</span><span style={{fontSize:10,fontWeight:600,color:C.t1}}>{fmt(d.value)}</span></div>)}</div></div></Card>}
          {trend.length>1&&<Card style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:10}}>Tendencia {año}</div><ResponsiveContainer width="100%" height={160}><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="mes" stroke={C.t3} fontSize={10}/><YAxis stroke={C.t3} fontSize={10} tickFormatter={v=>fmt(v)}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.t1,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="ingresos" stroke={C.accent} fill={C.accent+"20"} strokeWidth={2} name="Ingresos"/><Area type="monotone" dataKey="egresos" stroke={C.danger} fill={C.danger+"20"} strokeWidth={2} name="Gastos"/><Legend wrapperStyle={{fontSize:10}}/></AreaChart></ResponsiveContainer></Card>}
          {projection.some(p=>p.hasPres)&&<Card style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:10}}>🎯 Proyección {año}</div><ResponsiveContainer width="100%" height={160}><AreaChart data={projection.filter(p=>p.hasPres)}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="mes" stroke={C.t3} fontSize={10}/><YAxis stroke={C.t3} fontSize={10} tickFormatter={v=>fmt(v)}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.t1,fontSize:11}} formatter={v=>v!=null?fmt(v):"—"}/><Area type="monotone" dataKey="proyectado" stroke={C.accent} fill={C.accent+"15"} strokeWidth={2} strokeDasharray="6 3" name="Plan"/><Area type="monotone" dataKey="real" stroke={C.cyan} fill={C.cyan+"20"} strokeWidth={3} name="Real" connectNulls/><Legend wrapperStyle={{fontSize:10}}/></AreaChart></ResponsiveContainer></Card>}
          {gMes.length===0&&presVsReal.length===0&&<div style={{textAlign:"center",padding:30,color:C.t3}}><div style={{fontSize:36,marginBottom:8}}>📝</div><p style={{fontSize:13}}>Ve a Registrar para agregar movimientos</p></div>}

          {/* PRORRATEO — tarjetas para gastos programados futuros sin ahorro asignado */}
          {hasBudget&&programados.filter(p=>{
            const mesIdx=MESES.indexOf(mes);
            const mesesRestantes=p.mes>=mesIdx?p.mes-mesIdx:12-(mesIdx-p.mes);
            const yaApartando=Object.entries(presMes).some(([k])=>k.startsWith("Ahorro__")&&k.includes(p.nombre));
            if(p.mes===mesIdx||mesesRestantes<=0||yaApartando||p.monto<=0||prorateados[p.id])return false;
            // Lógica de reaparición según proximidad
            const rechazo=prorateosRechazados[p.id];
            if(rechazo){
              const diasDesdeRechazo=Math.floor((Date.now()-rechazo.fecha)/(1000*60*60*24));
              if(mesesRestantes<=1)return true; // Urgente: siempre mostrar
              if(mesesRestantes<=3)return diasDesdeRechazo>=7; // Cerca: cada semana
              return diasDesdeRechazo>=30; // Lejos: cada mes
            }
            return true;
          }).map(p=>{
            const mesIdx=MESES.indexOf(mes);
            const mesesRestantes=p.mes>=mesIdx?p.mes-mesIdx:12-(mesIdx-p.mes);
            const porMes=Math.ceil(p.monto/mesesRestantes);
            const urgente=mesesRestantes<=1;
            const cerca=mesesRestantes<=3;
            const borderColor=urgente?C.danger:cerca?C.warning:C.accent;
            return(
              <Card key={p.id} style={{marginBottom:12,borderColor:borderColor+"44",background:`${borderColor}08`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:4,background:borderColor+"25",color:borderColor}}>{MESES[p.mes]}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.t1}}>{p.nombre}</span>
                  {urgente&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:C.danger+"25",color:C.danger,marginLeft:"auto"}}>⚠️ ¡Este mes!</span>}
                  {!urgente&&<span style={{fontSize:13,fontWeight:800,color:borderColor,marginLeft:"auto"}}>{fmt(p.monto)}</span>}
                </div>
                <div style={{fontSize:11,color:C.t2,marginBottom:10,lineHeight:1.5}}>
                  {urgente
                    ?<>Este mes tienes que pagar <strong style={{color:C.danger}}>{fmt(p.monto)}</strong>. ¿Ya lo tienes apartado?</>
                    :<>Faltan <strong style={{color:C.t1}}>{mesesRestantes} {mesesRestantes===1?"mes":"meses"}</strong>. Si prorrateas desde ahora, apartarías <strong style={{color:C.accent}}>{fmt(porMes)}/mes</strong> y no lo sentirías tan pesado.</>
                  }
                </div>
                {!urgente&&<div style={{background:C.bg,borderRadius:8,padding:"8px 10px",marginBottom:10}}>
                  {Array.from({length:Math.min(mesesRestantes,6)},(_,i)=>{
                    const idx=(mesIdx+i)%12;
                    const esUltimo=i===mesesRestantes-1||i===5;
                    return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:!esUltimo?`1px solid ${C.border}22`:"none"}}>
                      <span style={{fontSize:10,color:C.t3}}>{MESES[idx]}</span>
                      <span style={{fontSize:10,fontWeight:700,color:C.accent}}>+{fmt(porMes)}{i===mesesRestantes-1?" → pago "+fmt(p.monto):""}</span>
                    </div>;
                  })}
                  {mesesRestantes>6&&<div style={{fontSize:9,color:C.t3,textAlign:"center",paddingTop:4}}>...y {mesesRestantes-6} meses más</div>}
                </div>}
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <button onClick={()=>{
                    const ci=ALL_PERIODS.findIndex(pp=>pp.mes===mes&&pp.año===año);
                    if(ci<0)return;
                    setPres(prev=>{
                      const up={...prev};
                      for(let i=0;i<mesesRestantes;i++){
                        const period=ALL_PERIODS[ci+i];
                        if(!period)break;
                        const ex={...(up[period.key]||{})};
                        const itemKey=`Ahorro__Apartado ${p.nombre}`;
                        ex[itemKey]=(parseFloat(ex[itemKey])||0)+porMes;
                        ex["Ahorro"]=(parseFloat(ex["Ahorro"])||0)+porMes;
                        up[period.key]=ex;
                      }
                      return up;
                    });
                    setProrateados(prev=>({...prev,[p.id]:true}));
                    showToast(`✅ Prorrateo activado: ${fmt(porMes)}/mes`);
                  }} style={{width:"100%",padding:10,borderRadius:8,border:"none",background:C.accent,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Prorratear — apartar {fmt(porMes)}/mes</button>
                  <button onClick={()=>{
                    const mesTarget=ALL_PERIODS.find(pp=>pp.mes===MESES[p.mes]&&pp.año===año);
                    if(!mesTarget)return;
                    setPres(prev=>{
                      const up={...prev};
                      const ex={...(up[mesTarget.key]||{})};
                      const itemKey=`Gastos_Fijos__${p.nombre}`;
                      ex[itemKey]=(parseFloat(ex[itemKey])||0)+p.monto;
                      ex["Gastos_Fijos"]=(parseFloat(ex["Gastos_Fijos"])||0)+p.monto;
                      up[mesTarget.key]=ex;
                      return up;
                    });
                    setProrateados(prev=>({...prev,[p.id]:true}));
                    showToast(`📌 Agregado como gasto en ${MESES[p.mes]}`);
                  }} style={{width:"100%",padding:10,borderRadius:8,border:`1px solid ${C.border}`,background:C.card,color:C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>📌 Solo en {MESES[p.mes]} — pago puntual</button>
                  <button onClick={()=>{
                    setProrateosRechazados(prev=>({...prev,[p.id]:{fecha:Date.now(),mesesRestantes}}));
                    showToast(mesesRestantes<=3?"⏰ Te recordamos en 1 semana":"⏰ Te recordamos el mes que viene");
                  }} style={{width:"100%",padding:9,borderRadius:8,border:`1px solid ${C.border}33`,background:"transparent",color:C.t3,fontSize:11,cursor:"pointer"}}>⏰ Ahora no — recordármelo después</button>
                </div>
              </Card>
            );
          })}

          {/* FLUJO DE CAJA 12 MESES */}
          {hasBudget&&<Card style={{marginBottom:12,padding:"14px 10px"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12,paddingLeft:6}}>💸 Flujo de caja {año}</div>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",minWidth:680,width:"100%",fontSize:10}}>
                <thead>
                  <tr>{["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((h,i)=><th key={i} style={{padding:"4px 7px",textAlign:i===0?"left":"right",color:C.t3,fontWeight:600,whiteSpace:"nowrap",borderBottom:`1px solid ${C.border}`,minWidth:i===0?90:52}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(()=>{
                    const mesIdx=MESES.indexOf(mes);
                    // Proyectar pagos de tarjeta según día de corte y día de pago
                    const pagoTarjetaPorMes=gastos.reduce((acc,g)=>{
                      if(g.metodo!=="tarjeta"||g.sub==="Pago de tarjeta")return acc;
                      const diaGasto=parseInt((g.fecha||"").split("-")[2])||1;
                      const mesGastoIdx=MESES.indexOf(g.mes);
                      if(mesGastoIdx<0||g.año!==año)return acc;
                      // Si el gasto es después del corte, entra al ciclo siguiente
                      const cicloExtra=diaCorte>0&&diaGasto>diaCorte?1:0;
                      // El mes de pago: mes del gasto + 1 ciclo + si el día de pago es menor al corte, ya es el mes siguiente
                      let mesPago=(mesGastoIdx+1+cicloExtra)%12;
                      // Si tiene día de pago definido y es antes del corte del mes siguiente, ajustar
                      acc[mesPago]=(acc[mesPago]||0)+Math.abs(g.monto);
                      return acc;
                    },{});
                    // Deuda inicial cae en el próximo día de pago
                    if(deudaTarjetaInicial>0){
                      const hoy=new Date().getDate();
                      // Si ya pasó el día de pago este mes, cae el mes siguiente
                      const mesPagoDeuda=diaPago>0&&hoy<=diaPago?mesIdx:(mesIdx+1)%12;
                      pagoTarjetaPorMes[mesPagoDeuda]=(pagoTarjetaPorMes[mesPagoDeuda]||0)+deudaTarjetaInicial;
                    }
                    const flujos=MESES.map((mn,i)=>{
                      const pk2=`${mn}_${año}`;
                      const pm=pres[pk2]||{};
                      const ingresoP=Object.entries(pm).filter(([k])=>k.startsWith("Ingresos__")).reduce((s,[,v])=>s+(parseFloat(v)||0),0);
                      const egresoP=Object.entries(pm).filter(([k])=>k.includes("__")&&!k.startsWith("Ingresos__")).reduce((s,[,v])=>s+(parseFloat(v)||0),0);
                      const prog=programados.filter(p=>p.mes===i);
                      const netoP=ingresoP-egresoP;
                      const gm=gastos.filter(g=>g.mes===mn&&g.año===año);
                      const ingresoR=gm.filter(g=>g.cat==="Ingresos").reduce((s,g)=>s+g.monto,0);
                      const egresoR=gm.filter(g=>isGasto(g.cat)&&g.sub!=="Pago de tarjeta").reduce((s,g)=>s+Math.abs(g.monto),0);
                      const pagoTarjeta=pagoTarjetaPorMes[i]||0;
                      const netoR=gm.length>0?ingresoR-egresoR-pagoTarjeta:null;
                      return{netoP,netoR,prog,pagoTarjeta,pasado:i<mesIdx,actual:i===mesIdx};
                    });
                    let acumP=saldoInicial-deudaTarjetaInicial,acumR=saldoInicial-deudaTarjetaInicial;
                    const acumPA=flujos.map(f=>{acumP+=f.netoP;return acumP;});
                    const acumRA=flujos.map(f=>{if(f.netoR!==null){acumR+=f.netoR;return acumR;}return null;});
                    return[
                      <tr key="pres" style={{borderTop:`1px solid ${C.border}33`}}>
                        <td style={{padding:"4px 7px",color:C.t2,fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>Neto presupuestado</td>
                        {flujos.map((f,i)=>{
                          const c=f.netoP<0?C.danger:f.netoP<2000?C.warning:C.accent;
                          const pill=f.prog.length>0?` 📅`:"";
                          const isCurrent=i===MESES.indexOf(mes);
                          return<td key={i} style={{padding:"4px 7px",textAlign:"right",color:c,fontWeight:600,whiteSpace:"nowrap",outline:isCurrent?`2px solid ${C.blue}44`:"none",borderRadius:3}}>{fmt(f.netoP)}{pill}</td>;
                        })}
                      </tr>,
                      <tr key="real">
                        <td style={{padding:"4px 7px",color:C.t2,fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>Neto real</td>
                        {flujos.map((f,i)=>{
                          if(f.netoR===null)return<td key={i} style={{padding:"4px 7px",textAlign:"right",color:C.t3}}>—</td>;
                          const c=f.netoR<0?C.danger:f.netoR<2000?C.warning:C.accent;
                          const desv=f.netoR-f.netoP;
                          return<td key={i} style={{padding:"4px 7px",textAlign:"right",color:c,fontWeight:600,whiteSpace:"nowrap"}}>{fmt(f.netoR)} <span style={{fontSize:9,color:desv>=0?C.accent:C.danger}}>{desv>=0?"+":""}{fmt(desv)}</span></td>;
                        })}
                      </tr>,
                      flujos.some(f=>f.pagoTarjeta>0)&&<tr key="tarjeta">
                        <td style={{padding:"4px 7px",color:C.purple,fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>💳 Pago tarjeta</td>
                        {flujos.map((f,i)=>(
                          f.pagoTarjeta>0
                            ?<td key={i} style={{padding:"4px 7px",textAlign:"right",color:C.purple,fontWeight:600,whiteSpace:"nowrap"}}>−{fmt(f.pagoTarjeta)}</td>
                            :<td key={i} style={{padding:"4px 7px",textAlign:"right",color:C.t3}}>—</td>
                        ))}
                      </tr>,
                      <tr key="div" style={{borderTop:`2px solid ${C.border}`}}><td colSpan={13}></td></tr>,
                      <tr key="acump">
                        <td style={{padding:"4px 7px",color:C.t2,fontSize:9,fontWeight:700}}>Acumulado presupuestado</td>
                        {acumPA.map((a,i)=>{
                          const c=a<0?C.danger:a<5000?C.warning:C.accent;
                          const bg=a<0?C.danger+"22":a<5000?C.warning+"22":"transparent";
                          return<td key={i} style={{padding:"4px 7px",textAlign:"right",color:c,fontWeight:700,background:bg,borderRadius:3}}>{fmt(a)}</td>;
                        })}
                      </tr>,
                      <tr key="acumr">
                        <td style={{padding:"4px 7px",color:C.t2,fontSize:9,fontWeight:700}}>Acumulado real</td>
                        {acumRA.map((a,i)=>{
                          if(a===null)return<td key={i} style={{padding:"4px 7px",textAlign:"right",color:C.t3}}>—</td>;
                          const c=a<0?C.danger:a<5000?C.warning:C.accent;
                          const bg=a<0?C.danger+"22":a<5000?C.warning+"22":"transparent";
                          return<td key={i} style={{padding:"4px 7px",textAlign:"right",color:c,fontWeight:700,background:bg,borderRadius:3}}>{fmt(a)}</td>;
                        })}
                      </tr>
                    ];
                  })()}
                </tbody>
              </table>
            </div>
            <div style={{display:"flex",gap:12,marginTop:8,paddingLeft:6}}>{[{l:"Presupuestado",c:C.blue},{l:"Real",c:C.accent},{l:"📅 Gasto programado",c:C.warning}].map((l,i)=><span key={i} style={{fontSize:9,color:l.c}}>{l.l}</span>)}</div>
          </Card>}

        </div>}</div>}

        {tab==="registro"&&<div>
          <div style={{display:"flex",gap:8,marginBottom:14}}><button onClick={()=>{setAiMode(false);setAiResults(null);}} style={{flex:1,padding:10,borderRadius:10,border:`2px solid ${!aiMode?C.accent:C.border}`,background:!aiMode?C.accent+"15":C.card,color:!aiMode?C.accent:C.t2,fontSize:12,fontWeight:700,cursor:"pointer"}}>⚡ Rápido</button><button onClick={()=>setAiMode(true)} style={{flex:1,padding:10,borderRadius:10,border:`2px solid ${aiMode?C.accent:C.border}`,background:aiMode?C.accent+"15":C.card,color:aiMode?C.accent:C.t2,fontSize:12,fontWeight:700,cursor:"pointer"}}>🤖 Texto / Voz 🎤</button></div>
          {!aiMode?<div>
            <div style={{background:C.card,borderRadius:16,padding:16,marginBottom:14,border:`1px solid ${C.border}`}}><input type="number" value={qMonto} onChange={e=>setQMonto(e.target.value)} placeholder="$0" style={{background:"transparent",border:"none",color:C.t1,fontSize:36,fontWeight:800,textAlign:"center",outline:"none",width:"100%",fontFamily:"'Space Grotesk',monospace"}}/><input type="text" value={qNota} onChange={e=>setQNota(e.target.value)} placeholder="Nota (opcional)" style={{background:"transparent",border:"none",color:C.t3,fontSize:12,textAlign:"center",outline:"none",width:"100%",marginTop:4}}/></div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>{[{id:"gasto",l:"💸 Gasto",c:C.danger},{id:"ingreso",l:"💰 Ingreso",c:C.accent},{id:"ahorro",l:"🐷 Ahorro",c:C.cyan}].map(t=><button key={t.id} onClick={()=>setQTipo(t.id)} style={{flex:1,padding:7,borderRadius:8,border:`2px solid ${qTipo===t.id?t.c:C.border}`,background:qTipo===t.id?t.c+"15":"transparent",color:qTipo===t.id?t.c:C.t3,fontSize:11,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}</div>
            {qTipo==="gasto"&&<div style={{display:"flex",gap:6,marginBottom:10}}>{[{id:"efectivo",l:"💵 Efectivo/Débito",c:C.accent},{id:"tarjeta",l:"💳 Tarjeta crédito",c:C.purple}].map(m=><button key={m.id} onClick={()=>setQMetodo(m.id)} style={{flex:1,padding:6,borderRadius:8,border:`2px solid ${qMetodo===m.id?m.c:C.border}`,background:qMetodo===m.id?m.c+"15":"transparent",color:qMetodo===m.id?m.c:C.t3,fontSize:10,fontWeight:600,cursor:"pointer"}}>{m.l}</button>)}</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>{QUICK_ITEMS.filter(q=>qTipo==="ingreso"?q.tipo==="ingreso":qTipo==="ahorro"?q.tipo==="ahorro":q.tipo==="gasto").map((q,i)=><button key={i} onClick={()=>{if(qMonto){addMov(q.cat,q.sub,qMonto,qNota,qTipo==="gasto"?qMetodo:"efectivo");showToast(`${q.icon} ${fmt(parseFloat(qMonto))}${qMetodo==="tarjeta"&&qTipo==="gasto"?" 💳":""}`);setQMonto("");setQNota("");}}} style={{padding:"10px 4px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22}}>{q.icon}</div><div style={{fontSize:8,color:C.t3,marginTop:2}}>{q.label}</div></button>)}</div>
            {tarjetaMes>0&&<button onClick={()=>{const monto=prompt("¿Cuánto pagaste a tu tarjeta?");if(monto&&parseFloat(monto)>0){addMov("Deuda","Pago de tarjeta",monto,"Pago a tarjeta de crédito","pago_tarjeta");showToast("✅ Pago de tarjeta registrado");}}} style={{width:"100%",padding:10,borderRadius:10,border:`1px solid ${C.purple}33`,background:C.purple+"10",color:C.purple,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:14}}>💳 Registrar pago a tarjeta de crédito</button>}
            {!hasRegToday&&<button onClick={markNoSpend} style={{width:"100%",padding:10,borderRadius:10,border:`2px dashed ${C.accent}33`,background:"transparent",color:C.accent,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:14}}>✅ Hoy no gasté nada</button>}
          </div>:<Card style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:18}}>🤖</span><div><div style={{fontSize:13,fontWeight:700,color:C.t1}}>Escríbelo o díctalo 🎤</div><div style={{fontSize:10,color:C.t3}}>Usa el micrófono de tu teclado</div></div></div>
            <textarea value={aiText} onChange={e=>setAiText(e.target.value)} rows={4} placeholder={"Ejemplo:\nhoy gasté 80 en uber, 350 en super,\n150 en comida y me depositaron\n15000 de quincena"} style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:13,outline:"none",resize:"none",lineHeight:1.5}}/>
            <button onClick={handleAiEntry} disabled={!aiText.trim()||aiLoading} style={{width:"100%",padding:12,borderRadius:10,border:"none",marginTop:8,background:aiText.trim()?C.accent:C.border,color:aiText.trim()?"#000":C.t3,fontSize:13,fontWeight:700,cursor:aiText.trim()?"pointer":"default"}}>{aiLoading?"Analizando...":"Analizar con IA 🧠"}</button>
            {aiResults?.length>0&&<div style={{marginTop:12}}><div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:8}}>Encontré {aiResults.length} movimientos:</div>{aiResults.map((r,i)=>{const q=QUICK_ITEMS.find(q=>q.cat===r.cat)||{};return<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<aiResults.length-1?`1px solid ${C.border}22`:"none"}}><span style={{fontSize:20}}>{q.icon||"📦"}</span><div style={{flex:1}}><div style={{fontSize:12,color:C.t1}}>{r.nota||r.sub}</div><div style={{fontSize:10,color:C.t3}}>{r.sub}</div></div><span style={{fontSize:14,fontWeight:700,color:r.tipo==="ingreso"?C.accent:C.danger}}>{r.tipo==="ingreso"?"+":"-"}{fmt(r.monto)}</span></div>;})}<button onClick={confirmAi} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:C.accent,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:10}}>✅ Registrar todos</button></div>}
          </Card>}
          {gMes.length>0&&<div><div style={{fontSize:13,fontWeight:700,color:C.t2,marginBottom:8}}>📋 Movimientos de {mes} ({gMes.length})</div>{[...gMes].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(g=><div key={g.id}><div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:editingMov===g.id?"none":`1px solid ${C.border}11`}}><span style={{fontSize:22}}>{g.sub==="Pago de tarjeta"?"💳":QUICK_ITEMS.find(q=>q.cat===g.cat&&q.sub===g.sub)?.icon||catIcon(g.cat)}</span><div style={{flex:1}}><div style={{fontSize:13,color:C.t1,fontWeight:500}}>{g.sub}{g.metodo==="tarjeta"?" 💳":""}</div><div style={{fontSize:10,color:C.t3}}>{catLabel(g.cat)}{g.metodo==="tarjeta"?" · Tarjeta":g.metodo==="pago_tarjeta"?" · Pago deuda":""}{g.desc?` · ${g.desc}`:""} · {g.fecha}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,color:g.sub==="Pago de tarjeta"?C.purple:g.monto>=0?C.accent:isApartado(g.cat)?C.cyan:g.metodo==="tarjeta"?C.purple:C.danger}}>{g.monto>=0?"+":""}{fmt(g.monto)}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setEditingMov(editingMov===g.id?null:g.id)} style={{background:"none",border:"none",color:C.cyan,fontSize:9,cursor:"pointer",padding:0}}>Editar</button><button onClick={()=>delMov(g.id)} style={{background:"none",border:"none",color:C.t3,fontSize:9,cursor:"pointer",padding:0}}>Eliminar</button></div></div></div>{editingMov===g.id&&<EditMovForm mov={{...g}} onSave={editMov} onCancel={()=>setEditingMov(null)}/>}</div>)}</div>}
        </div>}

        {tab==="presupuesto"&&<div>{!hasBudget?<Card style={{textAlign:"center",padding:30}}><p style={{color:C.t3}}>Aún no tienes presupuesto.</p><button onClick={()=>{setShowFirstBudget(true);setFbStep(0);setFbDraft({});}} style={{padding:"12px 24px",borderRadius:10,border:"none",background:C.accent,color:"#000",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:8}}>Configurar presupuesto</button></Card>:<div>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:4}}>Presupuesto {mes} {año}</div><p style={{fontSize:11,color:C.t3,margin:"0 0 12px"}}>Cambia un monto y aplica de este mes en adelante</p>
          {CATEGORIAS.map(cat=>{
            const subs=allSubsFor(cat.key,presMes);
            const subsConExtras=[...subs,...Object.keys(presMes).filter(k=>k.startsWith(`${cat.key}__`)&&!subs.find(s=>s.key===k)).map(k=>({key:k,name:k.split("__")[1],isExtra:true}))];
            const total=subsConExtras.reduce((s,sub)=>s+(parseFloat(presMes[sub.key])||0),0);
            const isOpen=editingCat===cat.key;
            if(total===0&&cat.key!=="Ingresos"&&!isOpen)return(
              <button key={cat.key} onClick={()=>{
                const draft={};subsConExtras.forEach(s=>{draft[s.key]=presMes[s.key]||"";});
                setEditingCatDraft(draft);setEditingCat(cat.key);
              }} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,background:C.card,border:`1px dashed ${cat.color}33`,marginBottom:6,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:14}}>{cat.icon}</span>
                <span style={{fontSize:12,color:C.t3,flex:1}}>{cat.label}</span>
                <span style={{fontSize:11,color:cat.color}}>+ Agregar →</span>
              </button>
            );
            if(isOpen){
              const is={width:"100%",boxSizing:"border-box",padding:"7px 10px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:13,fontWeight:600,outline:"none",textAlign:"right"};
              const allSubs=(SUBCATS[cat.key]||[]).map(s=>({key:`${cat.key}__${s}`,name:s}));
              const extras=Object.keys(editingCatDraft).filter(k=>k.startsWith(`${cat.key}__`)&&!allSubs.find(s=>s.key===k)).map(k=>({key:k,name:k.split("__")[1],isExtra:true}));
              const todosLosSubs=[...allSubs,...extras];
              return(
                <Card key={cat.key} style={{marginBottom:8,borderLeft:`3px solid ${cat.color}`,padding:12,border:`1px solid ${cat.color}44`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:13,fontWeight:700,color:cat.color}}>{cat.icon} {cat.label}</span>
                    <button onClick={()=>setEditingCat(null)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}>✕</button>
                  </div>
                  {todosLosSubs.map(({key,name,isExtra})=>(
                    <div key={key} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:11,color:isExtra?cat.color:C.t2,flex:1}}>{name}{isExtra?" ✨":""}</span>
                      <input type="number" placeholder="$0" value={editingCatDraft[key]||""} onChange={e=>setEditingCatDraft(p=>({...p,[key]:e.target.value}))} style={{...is,width:120}}/>
                    </div>
                  ))}
                  {addingTo===cat.key
                    ?<div style={{display:"flex",gap:6,marginTop:4}}><input type="text" value={extraName} onChange={e=>setExtraName(e.target.value)} placeholder="Nombre del concepto" style={{flex:1,padding:"7px 10px",borderRadius:8,background:C.bg,border:`1px solid ${cat.color}44`,color:C.t1,fontSize:12,outline:"none"}} autoFocus/><button onClick={()=>{if(!extraName.trim())return;const k=`${cat.key}__${extraName.trim()}`;setEditingCatDraft(p=>({...p,[k]:""}));setExtraName("");setAddingTo(null);}} style={{padding:"7px 12px",borderRadius:8,border:"none",background:cat.color,color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>+</button><button onClick={()=>{setAddingTo(null);setExtraName("");}} style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.t3,fontSize:11,cursor:"pointer"}}>✕</button></div>
                    :<button onClick={()=>setAddingTo(cat.key)} style={{width:"100%",padding:7,borderRadius:8,border:`1px dashed ${cat.color}33`,background:"transparent",color:cat.color,fontSize:11,cursor:"pointer",marginTop:4}}>+ Agregar concepto</button>
                  }
                  <button onClick={()=>{
                    Object.entries(editingCatDraft).forEach(([k,v])=>applyForward(k,v||"0"));
                    setEditingCat(null);
                    showToast(`✅ ${cat.label} actualizado`);
                  }} style={{width:"100%",padding:10,borderRadius:8,border:"none",background:cat.color,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",marginTop:10}}>Guardar cambios →</button>
                </Card>
              );
            }
            return(
              <Card key={cat.key} style={{marginBottom:8,borderLeft:`3px solid ${cat.color}`,padding:12,cursor:"pointer"}} onClick={()=>{
                const draft={};
                const todosSubs=(SUBCATS[cat.key]||[]).map(s=>(`${cat.key}__${s}`));
                const extrasEnPres=Object.keys(presMes).filter(k=>k.startsWith(`${cat.key}__`)&&!todosSubs.includes(k));
                [...todosSubs,...extrasEnPres].forEach(k=>{draft[k]=presMes[k]||"";});
                setEditingCatDraft(draft);setEditingCat(cat.key);
              }}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:cat.color}}>{cat.icon} {cat.label}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:cat.color}}>{fmt(total)}</span>
                    <span style={{fontSize:10,color:C.t3}}>✏️ editar</span>
                  </div>
                </div>
                {subsConExtras.filter(s=>parseFloat(presMes[s.key]||0)>0).map(({key,name})=>(
                  <div key={key} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
                    <span style={{fontSize:10,color:C.t3}}>{name}</span>
                    <span style={{fontSize:10,fontWeight:600,color:C.t2}}>{fmt(presMes[key]||0)}</span>
                  </div>
                ))}
              </Card>
            );
          })}          <div style={{marginTop:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:8}}>📅 Gastos programados</div>
            {programados.map(p=>{
              const pagadoEsteAño=programadosPagados[`${p.id}_${año}`];
              const mesIdx=MESES.indexOf(mes);
              const yaPaso=p.mes<mesIdx;
              return(
                <div key={p.id} style={{background:C.card,borderRadius:10,marginBottom:6,border:`1px solid ${pagadoEsteAño?C.accent+"33":C.border}`,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px"}}>
                    <span style={{fontSize:16}}>{pagadoEsteAño?"✅":"📅"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:pagadoEsteAño?C.t3:C.t1,fontWeight:600,textDecoration:pagadoEsteAño?"line-through":"none"}}>{p.nombre}</div>
                      <div style={{fontSize:10,color:C.t3}}>{MESES[p.mes]}{p.repite?" · Anual":""}{pagadoEsteAño?` · Pagado ${año} ✓`:""}</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:pagadoEsteAño?C.t3:C.warning}}>{fmt(p.monto)}</span>
                    <button onClick={()=>setProgramados(prev=>prev.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                  {!pagadoEsteAño&&(yaPaso||p.mes===mesIdx)&&<div style={{padding:"0 12px 10px"}}>
                    <button onClick={()=>{
                      // Marcar como pagado este año
                      setProgramadosPagados(prev=>({...prev,[`${p.id}_${año}`]:true}));
                      // Calcular meses hasta el mismo mes del año siguiente
                      const mesTarget=p.mes;
                      const mesesHasta=mesTarget>=mesIdx?(12-mesIdx+mesTarget):12+(mesTarget-mesIdx);
                      if(mesesHasta>0&&p.repite){
                        // Prorratear para el siguiente año
                        const porMes=Math.ceil(p.monto/mesesHasta);
                        const ci=ALL_PERIODS.findIndex(pp=>pp.mes===mes&&pp.año===año);
                        if(ci>=0){
                          setPres(prev=>{
                            const up={...prev};
                            for(let i=0;i<mesesHasta;i++){
                              const period=ALL_PERIODS[ci+i];
                              if(!period)break;
                              const ex={...(up[period.key]||{})};
                              const itemKey=`Ahorro__Próximo ${p.nombre}`;
                              ex[itemKey]=(parseFloat(ex[itemKey])||0)+porMes;
                              ex["Ahorro"]=(parseFloat(ex["Ahorro"])||0)+porMes;
                              up[period.key]=ex;
                            }
                            return up;
                          });
                          showToast(`✅ Pagado. Prorateando ${fmt(porMes)}/mes para el ${año+1}`);
                        }
                      } else {
                        showToast(`✅ Marcado como pagado en ${año}`);
                      }
                    }} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"none",background:C.accent+"15",color:C.accent,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left"}}>
                      ✅ Ya lo pagué — prepararme para {año+1}
                    </button>
                  </div>}
                </div>
              );
            })}
            <ScheduledForm onAdd={(n,m,mp,r)=>setProgramados(prev=>[...prev,{id:Date.now(),nombre:n,monto:parseFloat(m),mes:mp,repite:r}])}/>
            {programados.length>0&&<Card style={{marginTop:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:8}}>Próximos 12 meses</div>
              {Array.from({length:12},(_,i)=>{
                const mi=(MESES.indexOf(mes)+i)%12;
                const a=año+Math.floor((MESES.indexOf(mes)+i)/12);
                const gp=programados.filter(p=>p.mes===mi&&!programadosPagados[`${p.id}_${a}`]).reduce((s,p)=>s+p.monto,0);
                if(gp===0)return null;
                return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}11`}}>
                  <span style={{fontSize:11,color:C.t2}}>{MESES[mi]} {a}</span>
                  <span style={{fontSize:11,fontWeight:700,color:C.warning}}>⚠️ {fmt(gp)}</span>
                </div>;
              }).filter(Boolean)}
            </Card>}
          </div>
        </div>}<button onClick={()=>{if(confirm("Reiniciar presupuesto? Esto borra tu plan actual.")){setPres({});showToast("Presupuesto reiniciado");}}} style={{width:"100%",padding:10,borderRadius:8,background:"transparent",border:`1px solid ${C.danger}33`,color:C.danger,fontSize:11,cursor:"pointer",marginTop:16}}>Reiniciar presupuesto desde cero</button></div>}

        {tab==="perfil"&&<div>
          <div style={{textAlign:"center",padding:"16px 0"}}><div style={{display:"flex",justifyContent:"center",marginBottom:10}}><svg width="60" height="60" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="57" stroke={C.accent} strokeWidth="2.5" fill="none" opacity="0.2"/><rect x="30" y="72" width="60" height="6" rx="1.5" fill={C.accent} opacity="0.85"/><rect x="38" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/><rect x="57.5" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/><rect x="77" y="45" width="5" height="27" rx="1.5" fill={C.accent} opacity="0.7"/><rect x="36" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9"/><rect x="55.5" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9"/><rect x="75" y="43" width="9" height="3" rx="1" fill={C.accent} opacity="0.9"/><path d="M28 43 L60 24 L92 43" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="28" y1="43" x2="92" y2="43" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/><text x="60" y="65" textAnchor="middle" fontSize="20" fontWeight="700" fontFamily="sans-serif" fill={C.accent}>$</text><rect x="20" y="38" width="4" height="40" rx="1" fill={C.accent+"55"}/><path d="M96 78 L96 38 L108 78 Z" stroke={C.accent+"55"} strokeWidth="1.5" fill="none"/></svg></div><div style={{fontSize:18,fontWeight:700,color:C.t1}}>{nombre}</div><div style={{fontSize:11,color:C.accent,marginTop:2}}>Arquitecto Financiero Pro ✓</div><div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,background:racha>=7?C.warning+"15":C.card,borderRadius:20,padding:"4px 14px",border:`1px solid ${racha>=7?C.warning+"33":C.border}`}}><span style={{fontSize:14}}>{racha>=30?"🏆":racha>=7?"🔥":"📅"}</span><span style={{fontSize:12,fontWeight:700,color:racha>=7?C.warning:C.t2}}>{racha} días de racha</span></div></div>
          <Card style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:8}}>🏅 Logros ({logros.length})</div>{logros.length===0?<p style={{fontSize:12,color:C.t3,textAlign:"center",padding:10}}>Registra movimientos para desbloquear</p>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{logros.map((l,i)=><div key={i} style={{background:C.bg,borderRadius:10,padding:"8px 4px",textAlign:"center",border:`1px solid ${C.accent}22`}}><div style={{fontSize:20}}>{l.icon}</div><div style={{fontSize:9,fontWeight:700,color:C.t1}}>{l.label}</div></div>)}</div>}</Card>
          <Card style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:8}}>🎯 Metas de ahorro</div>{metas.map(m=>{const pct=m.monto>0?Math.min((ahoAcumulado/m.monto)*100,100):0;return<div key={m.id} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}11`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.t1,fontWeight:600}}>{m.nombre}</span><div style={{display:"flex",gap:6}}><span style={{fontSize:11,color:C.t2}}>{fmt(m.monto)}</span><button onClick={()=>delMeta(m.id)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:10}}>✕</button></div></div><div style={{height:6,background:C.border,borderRadius:3}}><div style={{height:"100%",width:`${pct}%`,background:pct>=100?C.accent:C.cyan,borderRadius:3}}/></div><div style={{fontSize:9,color:C.t3,marginTop:2}}>{Math.round(pct)}%{pct>=100?" — ¡Meta cumplida! 🎉":""}</div></div>;})}<MetaForm onAdd={addMeta}/></Card>
          <Card style={{marginBottom:12,background:`linear-gradient(135deg,${C.card},${C.warning}08)`,borderColor:C.warning+"22"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:28}}>🎰</span><div><div style={{fontSize:13,fontWeight:700,color:C.warning}}>Sorteo trimestral $1,000 USD</div><div style={{fontSize:11,color:C.t2,marginTop:2}}>Mínimo 2 registros/semana, 10 de 12 semanas. ¡La disciplina tiene premio!</div></div></div></Card>
          <Card><div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:10}}>Resumen anual {año}</div>{[{l:"Ingresos",v:ingAño,c:C.accent},{l:"Gastos",v:egrAño,c:C.danger},{l:"Apartado",v:ahoAño,c:C.cyan},{l:"Ahorro acumulado",v:ahoAcumulado,c:C.purple}].map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<3?`1px solid ${C.border}11`:"none"}}><span style={{fontSize:12,color:C.t2}}>{r.l}</span><span style={{fontSize:12,fontWeight:700,color:r.c}}>{fmt(r.v)}</span></div>)}</Card>
          {onGoCalc&&<button onClick={onGoCalc} style={{width:"100%",padding:12,borderRadius:10,background:C.card,border:`1px solid ${C.border}`,color:C.t2,fontSize:13,cursor:"pointer",marginTop:12}}>🧮 Ir a simuladores gratuitos</button>}
          {onLogout&&<button onClick={onLogout} style={{width:"100%",padding:12,borderRadius:10,background:C.danger+"15",border:`1px solid ${C.danger}33`,color:C.danger,fontSize:13,cursor:"pointer",marginTop:8}}>Cerrar sesión</button>}
        </div>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 12px",zIndex:100}}>{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",textAlign:"center",padding:"4px 0"}}><div style={{fontSize:20,marginBottom:2,opacity:tab===t.id?1:0.4}}>{t.icon}</div><div style={{fontSize:9,color:tab===t.id?C.accent:C.t3,fontWeight:tab===t.id?700:400}}>{t.label}</div></button>)}</div>
    </div>
  );
}

function EditablePresItem({name,value,color,onApply}){const[editing,setEditing]=useState(false);const[val,setVal]=useState(value.toString());if(!editing)return<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}><span style={{fontSize:11,color:C.t2,flex:1}}>{name}</span><span style={{fontSize:12,fontWeight:600,color:C.t1}}>{fmt(value)}</span><button onClick={()=>{setVal(value.toString());setEditing(true);}} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:9}}>✏️</button></div>;return<div style={{display:"flex",alignItems:"center",gap:6,background:C.bg,borderRadius:6,padding:"6px 8px",marginBottom:2}}><span style={{fontSize:11,color:C.t2,flex:1}}>{name}</span><input type="number" value={val} onChange={e=>setVal(e.target.value)} style={{width:90,padding:"4px 6px",borderRadius:6,background:C.card,border:`1px solid ${color}44`,color,fontSize:13,fontWeight:700,outline:"none",textAlign:"right"}} autoFocus/><button onClick={()=>{onApply(val);setEditing(false);}} style={{background:color,border:"none",borderRadius:6,padding:"4px 8px",color:"#000",cursor:"pointer",fontSize:10,fontWeight:700}}>Aplicar →</button><button onClick={()=>setEditing(false)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:10}}>✕</button></div>;}
function EditMovForm({mov,onSave,onCancel}){const[cat,setCat]=useState(mov.cat);const[sub,setSub]=useState(mov.sub);const[monto,setMonto]=useState(Math.abs(mov.monto).toString());const[nota,setNota]=useState(mov.desc||"");const subs=SUBCATS[cat]||[];const is={width:"100%",boxSizing:"border-box",padding:"8px 10px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:12,outline:"none",marginBottom:6};return<div style={{background:C.card,borderRadius:10,padding:12,border:`1px solid ${C.cyan}33`,marginBottom:8,animation:"fadeIn 0.2s"}}><div style={{fontSize:11,fontWeight:700,color:C.cyan,marginBottom:8}}>Editar movimiento</div><select value={cat} onChange={e=>{setCat(e.target.value);setSub((SUBCATS[e.target.value]||[])[0]||"");}} style={is}>{CATEGORIAS.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select><select value={sub} onChange={e=>setSub(e.target.value)} style={is}>{subs.map(s=><option key={s} value={s}>{s}</option>)}</select><input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="Monto" style={is}/><input type="text" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Nota" style={is}/><div style={{display:"flex",gap:6}}><button onClick={onCancel} style={{flex:1,padding:8,borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:11}}>Cancelar</button><button onClick={()=>onSave(mov.id,cat,sub,monto,nota)} style={{flex:1,padding:8,borderRadius:8,border:"none",background:C.cyan,color:"#000",cursor:"pointer",fontSize:11,fontWeight:700}}>Guardar</button></div></div>;}
function ScheduledForm({onAdd}){const[show,setShow]=useState(false);const[n,setN]=useState("");const[m,setM]=useState("");const[mp,setMp]=useState(0);const[r,setR]=useState(true);if(!show)return<button onClick={()=>setShow(true)} style={{width:"100%",padding:10,borderRadius:8,border:`2px dashed ${C.border}`,background:"transparent",color:C.t3,fontSize:11,cursor:"pointer"}}>+ Agregar gasto programado</button>;const is={width:"100%",boxSizing:"border-box",padding:"8px 10px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:13,outline:"none",marginBottom:6};return<div style={{background:C.card,borderRadius:10,padding:12,border:`1px solid ${C.border}`,marginTop:8}}><input type="text" value={n} onChange={e=>setN(e.target.value)} placeholder="Nombre (ej: Anualidad carro)" style={is}/><input type="number" value={m} onChange={e=>setM(e.target.value)} placeholder="Monto" style={is}/><select value={mp} onChange={e=>setMp(parseInt(e.target.value))} style={is}>{MESES.map((ms,i)=><option key={i} value={i}>{ms}</option>)}</select><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><button onClick={()=>setR(!r)} style={{width:36,height:20,borderRadius:10,border:"none",cursor:"pointer",background:r?C.accent:C.border,position:"relative"}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:r?18:2,transition:"all 0.2s"}}/></button><span style={{fontSize:11,color:C.t2}}>Se repite cada año</span></div><div style={{display:"flex",gap:6}}><button onClick={()=>setShow(false)} style={{flex:1,padding:8,borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:11}}>Cancelar</button><button onClick={()=>{if(n&&m){onAdd(n,m,mp,r);setN("");setM("");setShow(false);}}} disabled={!n||!m} style={{flex:1,padding:8,borderRadius:8,border:"none",background:n&&m?C.accent:C.border,color:n&&m?"#000":C.t3,cursor:"pointer",fontSize:11,fontWeight:700}}>Agregar</button></div></div>;}
function MetaForm({onAdd}){const[show,setShow]=useState(false);const[n,setN]=useState("");const[m,setM]=useState("");if(!show)return<button onClick={()=>setShow(true)} style={{width:"100%",padding:10,borderRadius:8,border:`2px dashed ${C.accent}33`,background:"transparent",color:C.accent,fontSize:11,cursor:"pointer",marginTop:8}}>+ Agregar meta de ahorro</button>;const is={width:"100%",boxSizing:"border-box",padding:"8px 10px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,color:C.t1,fontSize:13,outline:"none",marginBottom:6};return<div style={{background:C.bg,borderRadius:10,padding:12,border:`1px solid ${C.border}`,marginTop:8}}><input type="text" value={n} onChange={e=>setN(e.target.value)} placeholder="Nombre (ej: Viaje a Europa)" style={is}/><input type="number" value={m} onChange={e=>setM(e.target.value)} placeholder="Monto meta ($)" style={is}/><div style={{display:"flex",gap:6}}><button onClick={()=>setShow(false)} style={{flex:1,padding:8,borderRadius:8,background:C.card,border:`1px solid ${C.border}`,color:C.t3,cursor:"pointer",fontSize:11}}>Cancelar</button><button onClick={()=>{if(n&&m){onAdd(n,m);setN("");setM("");setShow(false);}}} disabled={!n||!m} style={{flex:1,padding:8,borderRadius:8,border:"none",background:n&&m?C.accent:C.border,color:n&&m?"#000":C.t3,cursor:"pointer",fontSize:11,fontWeight:700}}>Agregar</button></div></div>;}
