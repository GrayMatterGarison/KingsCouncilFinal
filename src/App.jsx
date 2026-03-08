import { useState, useEffect, useRef } from "react"
import CouncilSession from "./CouncilSession"

const GOLD = "#D4970C"
const GOLD2 = "#F0B000"
const GOLDDM = "#A07020"
const CRIM = "#E02020"
const CYAN = "#00C8F0"
const AMBER = "#E06A0A"
const TPRI = "#F2ECD8"
const TSUB = "#B0A888"
const TDIM = "#6A6258"
const BG = "#060606"
const BGCARD = "#141414"
const BGHOV = "#1C1C1C"
const BORDER = "#2E2E2E"
const BGOLD = "#5A4418"
const BCRIM = "#4A1818"

const ROSTER = {
  strategic: [
    { id: "cipher",    name: "THE CIPHER",    role: "Chief of Staff",     tier: "ANCIENT POWER", ac: GOLD,  icon: "S"  },
    { id: "vault",     name: "THE VAULT",     role: "CFO",                tier: "ANCIENT POWER", ac: GOLD2, icon: "V"  },
    { id: "oracle",    name: "THE ORACLE",    role: "Chief Strategist",   tier: "ANCIENT POWER", ac: AMBER, icon: "O"  },
    { id: "shadow",    name: "THE SHADOW",    role: "Chief Intelligence", tier: "ANCIENT POWER", ac: CRIM,  icon: "I"  },
  ],
  command: [
    { id: "commander", name: "COMMANDER", role: "COO", tier: "MILITARY", ac: CYAN,  icon: "C"  },
    { id: "director",  name: "DIRECTOR",  role: "CMO", tier: "MILITARY", ac: GOLD,  icon: "D"  },
    { id: "marshal",   name: "MARSHAL",   role: "CRO", tier: "MILITARY", ac: AMBER, icon: "M"  },
  ],
  corps: [
    { id: "operator", name: "OPERATOR", role: "Creative Director",  tier: "MILITARY", ac: GOLD,  icon: "CR" },
    { id: "scriptor", name: "SCRIPTOR", role: "Content and Copy",   tier: "MILITARY", ac: TSUB,  icon: "W"  },
    { id: "lens",     name: "LENS",     role: "Visual Production",  tier: "MILITARY", ac: CYAN,  icon: "L"  },
    { id: "vanguard", name: "VANGUARD", role: "Ad Strategy",        tier: "MILITARY", ac: AMBER, icon: "VG" },
    { id: "signal",   name: "SIGNAL",   role: "Social Broadcast",   tier: "MILITARY", ac: GOLD,  icon: "SG" },
    { id: "reel",     name: "REEL",     role: "Video Production",   tier: "MILITARY", ac: CRIM,  icon: "RL" },
  ],
  special: [
    { id: "broker",    name: "THE BROKER",    role: "Deal Executor",    tier: "SPECIAL FORCES", ac: GOLD, icon: "BK" },
    { id: "warden",    name: "THE WARDEN",    role: "People Culture",   tier: "SPECIAL FORCES", ac: TSUB, icon: "WD" },
    { id: "architect", name: "THE ARCHITECT", role: "Systems Builder",  tier: "SPECIAL FORCES", ac: CYAN, icon: "AR" },
  ],
}

const ALL = [...ROSTER.strategic, ...ROSTER.command, ...ROSTER.corps, ...ROSTER.special]

const PROMPTS = {
  cipher:    "You are THE CIPHER, Chief of Staff. Protect the Sovereign's time with absolute precision. Domain: briefings, inbox triage, priority queue. The Sovereign commands a $1.5B operation with 7 personnel. Be surgical and direct. Lead with what demands action TODAY.",
  vault:     "You are THE VAULT, CFO. Protect and multiply Kingdom capital. Domain: revenue architecture, cash flow, deal economics, financial risk. $1.5B projection. Lead with financial status: GREEN / YELLOW / RED.",
  oracle:    "You are THE ORACLE, Chief Strategist. Position the Kingdom for permanent dominance. Domain: competitive intelligence, long-range positioning. Think in decades. Address as Sovereign.",
  shadow:    "You are THE SHADOW, Chief of Intelligence. Nothing moves undetected. Domain: competitor surveillance, market signals, threat detection. Classify all intel: LOW / MEDIUM / HIGH / CRITICAL. Address as Sovereign.",
  commander: "You are COMMANDER, COO. Operational dominance. Domain: execution, team deployment (7 personnel), process optimization. Provide operational status plus recommended actions. Address as Sir.",
  director:  "You are DIRECTOR, CMO. Market dominance and brand authority. Domain: brand strategy, campaign architecture. Be bold. Address as Sir.",
  marshal:   "You are MARSHAL, CRO. Revenue at all costs. Domain: sales pipeline, deal velocity, revenue forecasting. Be relentless. Address as Sir.",
  operator:  "You are OPERATOR, Creative Director. Visual dominance. Domain: design systems, brand standards, visual identity. Address as Sir.",
  scriptor:  "You are SCRIPTOR, Content and Copy. The Kingdom's written voice. Domain: copy, email sequences, scripts, brand voice. Address as Sir.",
  lens:      "You are LENS, Visual Production. Imagery that commands attention. Domain: AI image prompts for DALL-E, Midjourney, Flux. Deliver 3 prompt variations per request. Address as Sir.",
  vanguard:  "You are VANGUARD, Ad Strategy. Deploy the Kingdom's message at maximum scale. Domain: paid campaigns, ad copy, audience targeting, ROAS. Address as Sir.",
  signal:    "You are SIGNAL, Social Broadcast. The Kingdom's reach. Domain: platform-native content, posting cadence, community. Address as Sir.",
  reel:      "You are REEL, Video Production. Motion content that converts. Domain: video scripts, storyboards, short-form briefs. Address as Sir.",
  broker:    "You are THE BROKER, Deal Executor. Structure and close deals. Domain: term sheets, deal structuring, negotiation, M&A. Address as Sovereign.",
  warden:    "You are THE WARDEN, People and Culture. Protect the Kingdom's 7 personnel. Domain: performance management, culture, hiring. Address as Sovereign.",
  architect: "You are THE ARCHITECT, Systems Builder. Build the Kingdom's technical infrastructure. Domain: n8n automation, API architecture, integrations. Address as Sovereign.",
}

const NAV = [
  { id: "dashboard", label: "DASHBOARD"         },
  { id: "strategic", label: "STRATEGIC COUNCIL" },
  { id: "command",   label: "EXEC COMMAND"       },
  { id: "corps",     label: "PRODUCTION CORPS"   },
  { id: "special",   label: "SPECIAL FORCES"     },
  { id: "ventures",  label: "VENTURES"           },
  { id: "intel",     label: "INTEL FEED"         },
]

const SECTIONS = {
  strategic: { members: ROSTER.strategic, label: "STRATEGIC COUNCIL", ac: GOLD  },
  command:   { members: ROSTER.command,   label: "EXEC COMMAND",      ac: CYAN  },
  corps:     { members: ROSTER.corps,     label: "PRODUCTION CORPS",  ac: AMBER },
  special:   { members: ROSTER.special,   label: "SPECIAL FORCES",    ac: CRIM  },
}

const mono = { fontFamily: "'Courier New', monospace" }

function Sidebar({ active, setActive, col, setCol }) {
  return (
    <nav style={{ position:"relative", zIndex:10, height:"100vh", flexShrink:0, width:col?52:212, transition:"width 0.25s", background:"rgba(6,6,6,0.97)", borderRight:`1px solid ${BGOLD}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"20px 0 16px", borderBottom:`1px solid ${BGOLD}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 14px" }}>
          <div style={{ width:26, height:26, borderRadius:4, border:`1px solid ${GOLDDM}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:GOLD, flexShrink:0, ...mono }}>KC</div>
          {!col && <div><div style={{ ...mono, fontWeight:700, fontSize:11, color:TPRI, letterSpacing:"0.2em" }}>KING'S</div><div style={{ ...mono, fontSize:11, color:GOLDDM, letterSpacing:"0.2em" }}>COUNCIL</div></div>}
        </div>
      </div>
      {!col && <div style={{ padding:"9px 14px", borderBottom:`1px solid ${BORDER}` }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:6, height:6, borderRadius:"50%", background:GOLD, boxShadow:`0 0 7px ${GOLD}` }} /><span style={{ ...mono, fontSize:9, color:GOLDDM, letterSpacing:"0.15em" }}>SYSTEMS OPERATIONAL</span></div></div>}
      <div style={{ flex:1, padding:"6px 0", display:"flex", flexDirection:"column", gap:1, overflowY:"auto" }}>
        {NAV.map(n => {
          const on = active === n.id
          return (
            <button key={n.id} onClick={() => setActive(n.id)} style={{ position:"relative", display:"flex", alignItems:"center", gap:10, padding:"9px 14px", border:"none", background:on?"rgba(200,147,10,0.08)":"transparent", width:"100%", cursor:"pointer" }}>
              {on && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2, height:20, background:`linear-gradient(180deg,${GOLD},${AMBER})` }} />}
              {!col && <span style={{ ...mono, fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:on?GOLD:TSUB, textTransform:"uppercase", whiteSpace:"nowrap" }}>{n.label}</span>}
              {col && <span style={{ ...mono, fontSize:9, color:on?GOLD:TSUB }}>{n.id.slice(0,2).toUpperCase()}</span>}
            </button>
          )
        })}
      </div>
      <button onClick={() => setCol(!col)} style={{ borderTop:`1px solid ${BGOLD}`, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, background:"transparent", border:"none", cursor:"pointer", width:"100%" }}>
        <span style={{ ...mono, fontSize:11, color:GOLDDM }}>{col ? ">>" : "<<"}</span>
        {!col && <span style={{ ...mono, fontSize:9, color:TDIM, letterSpacing:"0.1em" }}>COLLAPSE</span>}
      </button>
    </nav>
  )
}

function Kpi({ label, value, sub, ac }) {
  return (
    <div style={{ padding:"13px 16px", borderRadius:4, background:BGCARD, border:`1px solid ${BORDER}`, position:"relative", overflow:"hidden", flex:1 }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${ac||GOLD}80,transparent)` }} />
      <div style={{ ...mono, fontSize:9, color:TSUB, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:5 }}>{label}</div>
      <div style={{ ...mono, fontWeight:700, fontSize:22, color:ac||GOLD }}>{value}</div>
      {sub && <div style={{ ...mono, fontSize:8, color:TDIM, letterSpacing:"0.1em", marginTop:3 }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ label, count, ac }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, marginTop:4 }}>
      <div style={{ width:16, height:1.5, background:ac||GOLD }} />
      <span style={{ ...mono, fontSize:10, color:ac||GOLD, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:700 }}>{label}</span>
      <span style={{ ...mono, fontSize:9, color:TSUB, border:`1px solid ${BORDER}`, padding:"1px 7px", borderRadius:2 }}>{count}</span>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${BGOLD},transparent)` }} />
    </div>
  )
}

function Card({ m, onClick, sel }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={() => onClick(m)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:"relative", borderRadius:4, padding:"14px 16px", cursor:"pointer", background:sel?"#151208":hov?BGHOV:BGCARD, border:`1px solid ${sel?BGOLD:hov?"#2A2A2A":BORDER}`, transition:"all 0.15s" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:sel?`linear-gradient(90deg,transparent,${m.ac}80,transparent)`:"transparent" }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ ...mono, fontSize:9, color:TDIM, letterSpacing:"0.15em", textTransform:"uppercase" }}>{m.tier}</span>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:sel?GOLD:TDIM, boxShadow:sel?`0 0 5px ${GOLD}`:"none" }} />
          <span style={{ ...mono, fontSize:8, color:sel?GOLDDM:TDIM }}>STANDBY</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
        <div style={{ width:24, height:24, border:`1px solid ${sel?m.ac:BORDER}`, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ ...mono, fontSize:8, color:sel?m.ac:TDIM }}>{m.icon}</span>
        </div>
        <span style={{ ...mono, fontWeight:700, fontSize:12, color:sel?m.ac:TPRI, letterSpacing:"0.12em" }}>{m.name}</span>
      </div>
      <div style={{ ...mono, fontSize:10, color:sel?TSUB:TDIM, textTransform:"uppercase", marginBottom:12, paddingLeft:32 }}>{m.role}</div>
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={e => { e.stopPropagation(); onClick(m) }} style={{ flex:1, padding:"5px 0", background:sel?"rgba(200,147,10,0.1)":"transparent", border:`1px solid ${sel?BGOLD:BORDER}`, borderRadius:3, color:sel?GOLD:TDIM, ...mono, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer" }}>
          {sel ? ">> CHANNEL OPEN" : "OPEN CHANNEL"}
        </button>
      </div>
    </div>
  )
}

function Chat({ m, onClose, onEscalate, onCouncil }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:`${m.name} online. ${m.tier} operative standing by. Awaiting directive, Sovereign.` }])
  const [inp, setInp] = useState("")
  const [load, setLoad] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const bot = useRef(null)

  useEffect(() => { if (bot.current) bot.current.scrollIntoView({ behavior:"smooth" }) }, [msgs])

  const send = async () => {
    if (!inp.trim() || load) return
    const um = { role:"user", content:inp }
    const next = [...msgs, um]
    setMsgs(next); setInp(""); setLoad(true); setSaved(false)
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ systemPrompt: PROMPTS[m.id] || `You are ${m.name}, ${m.role}.`, messages: next.map(x => ({ role:x.role, content:x.content })) }),
      })
      const data = await res.json()
      setMsgs(p => [...p, { role:"assistant", content: data.content || data.error || "No response." }])
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"SIGNAL LOST. Check API configuration." }])
    }
    setLoad(false)
  }

  const saveSession = async () => {
    if (saving || msgs.length < 2) return
    setSaving(true)
    try {
      const res = await fetch("/api/log", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          operativeId: m.id,
          operativeName: m.name,
          messages: msgs.filter(x => x.role !== "assistant" || msgs.indexOf(x) > 0),
          type: "Conversation",
          venture: "Kingdom Alpha",
        }),
      })
      const data = await res.json()
      setSaved(data.success)
    } catch {
      setSaved(false)
    }
    setSaving(false)
  }

  return (
    <div style={{ position:"fixed", right:0, top:0, bottom:0, width:420, zIndex:50, background:"rgba(6,6,6,0.98)", borderLeft:`1px solid ${BGOLD}`, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 18px 14px", borderBottom:`1px solid ${BGOLD}`, flexShrink:0, background:"rgba(200,147,10,0.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <div style={{ width:24, height:24, border:`1px solid ${m.ac}`, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ ...mono, fontSize:8, color:m.ac }}>{m.icon}</span></div>
              <span style={{ ...mono, fontWeight:700, fontSize:13, color:TPRI, letterSpacing:"0.15em" }}>{m.name}</span>
            </div>
            <div style={{ ...mono, fontSize:9, color:TDIM, textTransform:"uppercase", paddingLeft:32 }}>{m.role} / {m.tier}</div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={saveSession} disabled={saving || msgs.length < 2} style={{ background:saved?"rgba(0,100,0,0.2)":"transparent", border:`1px solid ${saved?"#2A6A2A":BGOLD}`, borderRadius:3, color:saved?"#4CAF50":saving?TDIM:GOLDDM, padding:"4px 8px", ...mono, fontSize:8, cursor:saving||msgs.length<2?"not-allowed":"pointer" }}>
              {saving ? "SAVING..." : saved ? "LOGGED" : "SAVE SESSION"}
            </button>
            <button onClick={onCouncil} style={{ background:"rgba(0,200,240,0.08)", border:`1px solid ${CYAN}40`, borderRadius:3, color:CYAN, padding:"4px 8px", ...mono, fontSize:8, cursor:"pointer", letterSpacing:"0.1em" }}>COUNCIL</button>
            <button onClick={() => onEscalate && onEscalate(m)} style={{ background:"transparent", border:`1px solid ${BCRIM}`, borderRadius:3, color:CRIM, padding:"4px 8px", ...mono, fontSize:8, cursor:"pointer" }}>ESCALATE</button>
            <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${BORDER}`, borderRadius:3, color:TDIM, padding:"4px 8px", ...mono, fontSize:10, cursor:"pointer" }}>X</button>
          </div>
        </div>
        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:GOLD, boxShadow:`0 0 5px ${GOLD}` }} />
          <span style={{ ...mono, fontSize:8, color:GOLDDM, letterSpacing:"0.15em" }}>SECURE CHANNEL ESTABLISHED</span>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
        {msgs.map((msg, i) => (
          <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"88%", padding:"10px 13px", borderRadius:3, background:msg.role==="user"?"rgba(212,151,12,0.1)":"rgba(255,255,255,0.05)", border:`1px solid ${msg.role==="user"?BGOLD:BORDER}`, color:msg.role==="user"?TPRI:TSUB, fontSize:13, lineHeight:1.7, fontFamily:msg.role==="assistant"?"'Courier New',monospace":"sans-serif", whiteSpace:"pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {load && <div style={{ ...mono, fontSize:9, color:GOLDDM }}>TRANSMITTING...</div>}
        <div ref={bot} />
      </div>
      <div style={{ padding:"12px 16px", borderTop:`1px solid ${BGOLD}`, flexShrink:0 }}>
        <div style={{ ...mono, fontSize:8, color:GOLDDM, letterSpacing:"0.15em", marginBottom:6 }}>DIRECTIVE INPUT</div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder="Enter directive..." style={{ flex:1, background:"rgba(255,255,255,0.03)", border:`1px solid ${BGOLD}`, borderRadius:3, padding:"9px 12px", color:TPRI, fontSize:12, outline:"none", ...mono }} />
          <button onClick={send} style={{ padding:"9px 16px", background:"rgba(200,147,10,0.12)", border:`1px solid ${BGOLD}`, borderRadius:3, color:GOLD, fontSize:11, ...mono, cursor:"pointer" }}>SEND</button>
        </div>
      </div>
    </div>
  )
}

function MorningBrief() {
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const fetchBrief = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/brief")
      const data = await res.json()
      setBrief(data)
    } catch {
      setBrief({ brief:"BRIEF UNAVAILABLE - Check API configuration.", date:new Date().toDateString() })
    }
    setLoading(false); setFetched(true)
  }
  return (
    <div style={{ background:BGCARD, border:`1px solid ${BGOLD}`, borderRadius:4, padding:"20px", position:"relative", marginBottom:20 }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <div style={{ ...mono, fontSize:8, color:GOLDDM, letterSpacing:"0.2em", marginBottom:4 }}>THE CIPHER / MORNING BRIEF</div>
          <div style={{ ...mono, fontWeight:700, fontSize:14, color:TPRI }}>{brief?.date || new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}</div>
        </div>
        <button onClick={fetchBrief} disabled={loading} style={{ padding:"7px 14px", background:"rgba(212,151,12,0.1)", border:`1px solid ${BGOLD}`, borderRadius:3, color:loading?TDIM:GOLD, ...mono, fontSize:9, letterSpacing:"0.15em", cursor:loading?"not-allowed":"pointer" }}>
          {loading ? "GENERATING..." : fetched ? "REFRESH" : "GENERATE BRIEF"}
        </button>
      </div>
      {brief && <div style={{ ...mono, fontSize:11, color:TSUB, lineHeight:1.9, whiteSpace:"pre-wrap", borderTop:`1px solid ${BORDER}`, paddingTop:12 }}>{brief.brief}</div>}
      {!brief && !loading && <div style={{ ...mono, fontSize:10, color:TDIM }}>Click GENERATE BRIEF to receive your daily operational summary from THE CIPHER.</div>}
    </div>
  )
}

export default function App() {
  const [nav, setNav] = useState("dashboard")
  const [col, setCol] = useState(false)
  const [sel, setSel] = useState(null)
  const [councilOp, setCouncilOp] = useState(null)
  const [time, setTime] = useState(new Date())
  const [escalationCount, setEscalationCount] = useState(0)

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => {
    fetch("/api/notion?action=escalations")
      .then(r => r.json())
      .then(d => { if (d && Array.isArray(d.results)) setEscalationCount(d.results.length) })
      .catch(() => {})
  }, [])

  const handleEscalate = async (operative) => {
    try {
      await fetch("/api/notion?action=escalate", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ title:"Escalation from " + operative.name, operative: operative.name, details:"" }) })
      setEscalationCount(c => c + 1)
    } catch {}
  }

  const cur = SECTIONS[nav]

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { height: 100%; background: #060606; overflow: hidden; } ::-webkit-scrollbar { width: 2px; } ::-webkit-scrollbar-thumb { background: #5A4418; } input::placeholder { color: #4A4440; }`}</style>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:BG, paddingRight:sel?420:0, transition:"padding-right 0.25s" }}>
        <Sidebar active={nav} setActive={v => { setNav(v); setSel(null) }} col={col} setCol={setCol} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ height:52, flexShrink:0, borderBottom:`1px solid ${BGOLD}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"rgba(6,6,6,0.95)" }}>
            <div>
              <div style={{ ...mono, fontWeight:700, fontSize:14, color:TPRI, letterSpacing:"0.2em", textTransform:"uppercase" }}>{cur?.label || nav.toUpperCase()}</div>
              <div style={{ ...mono, fontSize:8, color:TDIM, marginTop:2 }}>{time.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" }).toUpperCase()} / {time.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:3, background:escalationCount>0?"rgba(196,30,30,0.2)":"rgba(139,26,26,0.1)", border:`1px solid ${escalationCount>0?CRIM:BCRIM}` }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:escalationCount>0?CRIM:TDIM }} />
                <span style={{ ...mono, fontSize:9, color:escalationCount>0?CRIM:TDIM }}>{escalationCount} ESCALATIONS</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:3, background:"rgba(200,147,10,0.1)", border:`1px solid ${BGOLD}` }}>
                <span style={{ ...mono, fontSize:9, color:GOLD }}>KC SOVEREIGN</span>
              </div>
            </div>
          </div>
          <div style={{ flexShrink:0, padding:"10px 24px", borderBottom:`1px solid ${BORDER}`, display:"flex", gap:10 }}>
            <Kpi label="Council Strength" value={ALL.length}      sub="OPERATIVES" ac={GOLD}  />
            <Kpi label="Active Ventures"  value="1"               sub="KINGDOMS"   ac={GOLD2} />
            <Kpi label="Revenue Target"   value="$1.5B"           sub="PROJECTION" ac={AMBER} />
            <Kpi label="Personnel"        value="7"               sub="OPERATORS"  ac={CYAN}  />
            <Kpi label="Escalations"      value={escalationCount} sub="OPEN"       ac={escalationCount>0?CRIM:TDIM} />
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
            {nav==="dashboard" && (
              <div>
                <MorningBrief />
                <SectionHeader label="FULL COUNCIL" count={ALL.length} />
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {ALL.map(m => (
                    <button key={m.id} onClick={() => setSel(m)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:3, background:sel?.id===m.id?"rgba(200,147,10,0.1)":"transparent", border:`1px solid ${sel?.id===m.id?BGOLD:BORDER}`, color:sel?.id===m.id?GOLD:TSUB, ...mono, fontSize:9, textTransform:"uppercase", cursor:"pointer" }}>
                      <span style={{ ...mono, fontSize:8, color:m.ac, border:`1px solid ${m.ac}40`, padding:"1px 4px", borderRadius:2 }}>{m.icon}</span>
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {nav==="ventures" && (
              <div>
                <SectionHeader label="ACTIVE KINGDOMS" count={1} />
                <div style={{ background:BGCARD, border:`1px solid ${BGOLD}`, borderRadius:4, padding:"24px", position:"relative" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
                  <div style={{ ...mono, fontSize:8, color:TDIM, letterSpacing:"0.2em", marginBottom:8 }}>VENTURE CLASSIFICATION: PRIMARY</div>
                  <div style={{ ...mono, fontWeight:700, fontSize:18, color:TPRI, marginBottom:16 }}>KINGDOM ALPHA</div>
                  <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
                    {[["REVENUE","UNDISCLOSED",TSUB],["PROJECTION","$1.5B",GOLD],["PERSONNEL","7 OPERATORS",CYAN],["STATUS","SCALING",AMBER]].map(([l,v,a]) => (
                      <div key={l}><div style={{ ...mono, fontSize:8, color:TDIM, marginBottom:4 }}>{l}</div><div style={{ ...mono, fontWeight:700, fontSize:13, color:a }}>{v}</div></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {nav==="intel" && (
              <div>
                <SectionHeader label="INTELLIGENCE FEED" count={0} ac={CRIM} />
                <div style={{ background:BGCARD, border:`1px solid ${BCRIM}`, borderRadius:4, padding:"32px", textAlign:"center" }}>
                  <div style={{ ...mono, color:TSUB, fontSize:11, marginBottom:6 }}>NO ACTIVE INTELLIGENCE BRIEFS</div>
                  <div style={{ ...mono, color:TDIM, fontSize:9, marginBottom:16 }}>DEPLOY THE SHADOW TO BEGIN SURVEILLANCE OPERATIONS</div>
                  <button onClick={() => { setNav("strategic"); setTimeout(() => setSel(ROSTER.strategic.find(m => m.id==="shadow")), 150) }} style={{ padding:"7px 18px", borderRadius:3, background:"rgba(196,30,30,0.1)", border:`1px solid ${BCRIM}`, color:CRIM, ...mono, fontSize:9, cursor:"pointer" }}>DEPLOY THE SHADOW</button>
                </div>
              </div>
            )}
            {cur && (
              <div>
                <SectionHeader label={cur.label} count={cur.members.length} ac={cur.ac} />
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
                  {cur.members.map(m => <Card key={m.id} m={m} onClick={setSel} sel={sel?.id===m.id} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {sel && <Chat m={sel} onClose={() => setSel(null)} onEscalate={handleEscalate} onCouncil={() => { setCouncilOp(sel.id); setSel(null) }} />}
      {councilOp && <CouncilSession primaryOperative={councilOp} onClose={() => setCouncilOp(null)} />}
    </>
  )
}
