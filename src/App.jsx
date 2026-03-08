import { useState, useEffect, useRef } from "react"
import CouncilSession from "./CouncilSession"

// ─── PALETTE ────────────────────────────────────────────────────────────────
const GOLD   = "#D4970C"
const GOLD2  = "#F0B000"
const GOLDDM = "#A07020"
const CRIM   = "#E02020"
const CYAN   = "#00C8F0"
const AMBER  = "#E06A0A"
const TPRI   = "#F2ECD8"
const TSUB   = "#B0A888"
const TDIM   = "#6A6258"
const BG     = "#060606"
const BGCARD = "#141414"
const BGHOV  = "#1C1C1C"
const BORDER = "#2E2E2E"
const BGOLD  = "#5A4418"
const BCRIM  = "#4A1818"
const PURPLE = "#8855CC"
const GREEN  = "#60C890"

const mono = { fontFamily: "'Courier New', monospace" }

// ─── AUTH ─────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "kc_token"

function getToken() { return localStorage.getItem(TOKEN_KEY) }

async function authFetch(url, opts = {}) {
  const token = getToken()
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  })
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ onAuth }) {
  const [pw, setPw]       = useState("")
  const [err, setErr]     = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!pw.trim()) return
    setLoading(true)
    setErr("")
    try {
      const res  = await fetch("/api/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password: pw }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || "Incorrect password"); setLoading(false); return }
      localStorage.setItem(TOKEN_KEY, data.token)
      onAuth()
    } catch {
      setErr("Connection error. Try again.")
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === "Enter") submit() }

  return (
    <div style={{ height:"100vh", background:"#060606", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } body { background:#060606; }`}</style>
      <div style={{ width:340, textAlign:"center" }}>
        {/* Crown */}
        <div style={{ fontSize:48, marginBottom:16, filter:"drop-shadow(0 0 24px rgba(212,151,12,0.7))" }}>♛</div>
        <div style={{ fontFamily:"'Courier New',monospace", fontWeight:700, fontSize:13, color:"#D4970C", letterSpacing:"0.3em", marginBottom:4 }}>KINGDOM INTELLIGENCE</div>
        <div style={{ fontFamily:"'Courier New',monospace", fontSize:9, color:"#6A6258", letterSpacing:"0.2em", marginBottom:32 }}>RESTRICTED ACCESS · SOVEREIGN ONLY</div>

        {/* Input */}
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr("") }}
          onKeyDown={onKey}
          placeholder="ENTER PASSPHRASE"
          autoFocus
          style={{
            width:"100%", padding:"12px 16px",
            background:"#0E0E0E", border:`1px solid ${err ? "#8B1A1A" : "#5A4418"}`,
            borderRadius:3, color:"#F2ECD8",
            fontFamily:"'Courier New',monospace", fontSize:12,
            letterSpacing:"0.15em", outline:"none",
            marginBottom: err ? 8 : 16,
          }}
        />

        {err && (
          <div style={{ fontFamily:"'Courier New',monospace", fontSize:9, color:"#E02020", letterSpacing:"0.1em", marginBottom:12 }}>
            ✕ {err.toUpperCase()}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading || !pw.trim()}
          style={{
            width:"100%", padding:"11px",
            background: loading || !pw.trim() ? "rgba(212,151,12,0.1)" : "rgba(212,151,12,0.15)",
            border:`1px solid ${loading || !pw.trim() ? "#5A4418" : "#D4970C"}`,
            borderRadius:3, color: loading || !pw.trim() ? "#6A6258" : "#D4970C",
            fontFamily:"'Courier New',monospace", fontSize:10,
            letterSpacing:"0.2em", cursor: loading || !pw.trim() ? "not-allowed" : "pointer",
            transition:"all 0.2s",
          }}
        >
          {loading ? "VERIFYING..." : "ENTER THE KINGDOM"}
        </button>
      </div>
    </div>
  )
}


// ─── V3 ROSTER ───────────────────────────────────────────────────────────────

const SOVEREIGN = { id: "sovereign", name: "THE SOVEREIGN", role: "Vision Holder · Final Authority", tier: "TIER I", ac: GOLD, icon: "♛" }

const COUNCIL = [
  { id: "chancellor",  name: "LORD CHANCELLOR",   role: "Chief of Staff",        ac: GOLD,   icon: "⚖️" },
  { id: "oracle",      name: "THE ORACLE",         role: "Research · Foresight",  ac: AMBER,  icon: "🔮" },
  { id: "scribe",      name: "ROYAL SCRIBE",       role: "Memory · Records",      ac: TSUB,   icon: "📜" },
  { id: "devil",       name: "DEVIL'S ADVOCATE",   role: "Risk · Challenge",      ac: CRIM,   icon: "😈" },
  { id: "truthteller", name: "TRUTH-TELLER",       role: "Ground Reality",        ac: CYAN,   icon: "🪞" },
  { id: "inspector",   name: "INSPECTOR GENERAL",  role: "Agent Auditor",         ac: AMBER,  icon: "🔎" },
  { id: "visionary",   name: "THE VISIONARY",      role: "Strategic Reinvention", ac: PURPLE, icon: "🌌" },
]

const MINISTERS = [
  { id: "war",        name: "MINISTER OF WAR",         role: "Strategy · Defense · Conflict",        ac: CRIM,   icon: "⚔️",  domain: "war"        },
  { id: "economics",  name: "MINISTER OF ECONOMICS",   role: "Resources · Commerce · Growth",         ac: GOLD,   icon: "💰",  domain: "econ"       },
  { id: "justice",    name: "LORD JUSTICE",             role: "Rules · Policy · Governance",           ac: CYAN,   icon: "🏛️", domain: "law"        },
  { id: "shadows",    name: "MINISTER OF SHADOWS",     role: "Intelligence · Covert Ops",             ac: PURPLE, icon: "🌑",  domain: "shadows"    },
  { id: "people",     name: "MINISTER OF PEOPLE",      role: "Culture · Community · Loyalty",         ac: GREEN,  icon: "👥",  domain: "people"     },
  { id: "herald",     name: "ROYAL HERALD",            role: "Narrative · Messaging · Brand",         ac: AMBER,  icon: "📣",  domain: "herald"     },
  { id: "builder",    name: "MASTER BUILDER",          role: "Projects · Systems · Infrastructure",   ac: GOLD2,  icon: "🏗️", domain: "build"      },
  { id: "philosopher",name: "HIGH PHILOSOPHER",        role: "Values · Ideology · Meaning",           ac: PURPLE, icon: "🕯️", domain: "faith"      },
  { id: "foreign",    name: "FOREIGN MINISTER",        role: "Alliances · External Relations",        ac: CYAN,   icon: "🌍",  domain: "foreign"    },
  { id: "continuity", name: "MINISTER OF CONTINUITY",  role: "Succession · Crisis · Resilience",      ac: GREEN,  icon: "⚕️",  domain: "health"     },
  { id: "pioneer",    name: "MINISTER OF FRONTIERS",   role: "Innovation · Experiments · R&D",        ac: AMBER,  icon: "🔭",  domain: "pioneer"    },
  { id: "knowledge",  name: "MINISTER OF KNOWLEDGE",   role: "Learning · Wisdom · Memory",            ac: GREEN,  icon: "📖",  domain: "knowledge"  },
]

const OPERATIVES = [
  { id: "tactician",   name: "TACTICIAN",            role: "Attack · Campaign",      minister: "war",         polarity: "light", ac: CRIM,   icon: "🗺️" },
  { id: "sentinel",    name: "SENTINEL",             role: "Protect · Fortify",      minister: "war",         polarity: "dark",  ac: CRIM,   icon: "🛡️" },
  { id: "trader",      name: "TRADE ENVOY",          role: "Create · Grow",          minister: "economics",   polarity: "light", ac: GOLD,   icon: "🤝" },
  { id: "auditor",     name: "AUDITOR",              role: "Guard · Track",          minister: "economics",   polarity: "dark",  ac: GOLD,   icon: "📊" },
  { id: "lawmaker",    name: "LAWMAKER",             role: "Build · Create Policy",  minister: "justice",     polarity: "light", ac: CYAN,   icon: "📋" },
  { id: "enforcer",    name: "ENFORCER",             role: "Comply · Adjudicate",    minister: "justice",     polarity: "dark",  ac: CYAN,   icon: "⚖️" },
  { id: "analyst",     name: "ANALYST",              role: "Gather · Synthesize",    minister: "shadows",     polarity: "light", ac: PURPLE, icon: "🔍" },
  { id: "counterintel",name: "COUNTER-INTEL",        role: "Deceive · Protect",      minister: "shadows",     polarity: "dark",  ac: PURPLE, icon: "🗡️" },
  { id: "recruiter",   name: "RECRUITER",            role: "Pull In · Build Tribe",  minister: "people",      polarity: "light", ac: GREEN,  icon: "🌟" },
  { id: "keeper",      name: "KEEPER",               role: "Hold Loyalty · Heal",    minister: "people",      polarity: "dark",  ac: GREEN,  icon: "🔗" },
  { id: "writer",      name: "ROYAL WRITER",         role: "Build · Craft",          minister: "herald",      polarity: "light", ac: AMBER,  icon: "✍️" },
  { id: "historian",   name: "HISTORIAN",            role: "Guard Legacy · Archive", minister: "herald",      polarity: "dark",  ac: AMBER,  icon: "📚" },
  { id: "architect",   name: "ARCHITECT",            role: "Design · Blueprint",     minister: "builder",     polarity: "light", ac: GOLD2,  icon: "📐" },
  { id: "engineer",    name: "ENGINEER",             role: "Build · Maintain",       minister: "builder",     polarity: "dark",  ac: GOLD2,  icon: "⚙️" },
  { id: "ethicist",    name: "ROYAL ETHICIST",       role: "Apply Values",           minister: "philosopher", polarity: "light", ac: PURPLE, icon: "⚜️" },
  { id: "inquisitor",  name: "INQUISITOR",           role: "Stress-Test Beliefs",    minister: "philosopher", polarity: "dark",  ac: PURPLE, icon: "🔥" },
  { id: "envoy",       name: "ROYAL ENVOY",          role: "Project · Bridge",       minister: "foreign",     polarity: "light", ac: CYAN,   icon: "✉️" },
  { id: "watcher",     name: "WATCHER",              role: "Monitor · Read World",   minister: "foreign",     polarity: "dark",  ac: CYAN,   icon: "👁️" },
  { id: "resilience",  name: "RESILIENCE ARCHITECT", role: "Build · Prevent",        minister: "continuity",  polarity: "light", ac: GREEN,  icon: "🏰" },
  { id: "crisis",      name: "CRISIS COMMANDER",     role: "React · Stabilize",      minister: "continuity",  polarity: "dark",  ac: GREEN,  icon: "🚨" },
  { id: "scout",       name: "SCOUT",                role: "Explore · Map Unknown",  minister: "pioneer",     polarity: "light", ac: AMBER,  icon: "🧭" },
  { id: "integrator",  name: "INTEGRATOR",           role: "Pull In · Embed",        minister: "pioneer",     polarity: "dark",  ac: AMBER,  icon: "🔄" },
  { id: "pedagogue",   name: "PEDAGOGUE",            role: "Teach · Spread",         minister: "knowledge",   polarity: "light", ac: GREEN,  icon: "🎓" },
  { id: "curator",     name: "CURATOR",              role: "Capture · Protect",      minister: "knowledge",   polarity: "dark",  ac: GREEN,  icon: "🗄️" },
]

const ALL_AGENTS = [SOVEREIGN, ...COUNCIL, ...MINISTERS, ...OPERATIVES]

// ─── NAV ─────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",  label: "DASHBOARD"        },
  { id: "sovereign",  label: "THE SOVEREIGN"    },
  { id: "council",    label: "INNER COUNCIL"    },
  { id: "ministers",  label: "XII MINISTERS"    },
  { id: "operatives", label: "XXIV OPERATIVES"  },
  { id: "ventures",   label: "VENTURES"         },
  { id: "intel",      label: "INTEL FEED"       },
]

// ─── WRITE PROPOSAL PARSER ───────────────────────────────────────────────────
// Extracts [WRITE_PROPOSAL] blocks from agent response text.
// Returns { cleanText, proposal } where proposal is null if none found.

function parseWriteProposal(text) {
  const match = text.match(/\[WRITE_PROPOSAL\]\s*target:\s*(.+?)\s*content:\s*([\s\S]+?)\s*\[\/WRITE_PROPOSAL\]/i)
  if (!match) return { cleanText: text, proposal: null }
  const cleanText = text.replace(/\[WRITE_PROPOSAL\][\s\S]*?\[\/WRITE_PROPOSAL\]/i, "").trim()
  return {
    cleanText,
    proposal: { target: match[1].trim(), content: match[2].trim(), status: "pending" }
  }
}

// ─── WRITE PROPOSAL CARD ─────────────────────────────────────────────────────
// Rendered inside the chat below the agent message that contains a proposal.

function WriteProposalCard({ proposal, onApprove, onReject }) {
  const resolved = proposal.status === "approved" || proposal.status === "rejected"

  return (
    <div style={{
      marginTop: 8,
      border: `1px solid ${proposal.status === "approved" ? "#2A6A2A" : proposal.status === "rejected" ? BCRIM : BGOLD}`,
      borderRadius: 3,
      overflow: "hidden",
      background: "rgba(90,68,24,0.08)",
    }}>
      {/* Header */}
      <div style={{
        padding: "6px 10px",
        borderBottom: `1px solid ${BGOLD}40`,
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(90,68,24,0.12)",
      }}>
        <span style={{ fontSize: 11 }}>✍️</span>
        <span style={{ ...mono, fontSize: 8, color: GOLDDM, letterSpacing: "0.2em" }}>WRITE PROPOSAL — PENDING SOVEREIGN APPROVAL</span>
      </div>

      {/* Target */}
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ ...mono, fontSize: 8, color: TDIM, letterSpacing: "0.12em" }}>TARGET: </span>
        <span style={{ ...mono, fontSize: 8, color: GOLDDM, letterSpacing: "0.1em" }}>{proposal.target}</span>
      </div>

      {/* Content */}
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ ...mono, fontSize: 10, color: TSUB, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
          {proposal.content}
        </div>
      </div>

      {/* Actions or Result */}
      {!resolved ? (
        <div style={{ padding: "8px 10px", display: "flex", gap: 8 }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1, padding: "5px 0",
              background: "rgba(42,106,42,0.15)", border: "1px solid #2A6A2A",
              borderRadius: 3, color: "#4CAF50",
              ...mono, fontSize: 8, letterSpacing: "0.15em", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(42,106,42,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(42,106,42,0.15)"}
          >
            ✓ APPROVE &amp; WRITE
          </button>
          <button
            onClick={onReject}
            style={{
              padding: "5px 12px",
              background: "rgba(74,24,24,0.15)", border: `1px solid ${BCRIM}`,
              borderRadius: 3, color: CRIM,
              ...mono, fontSize: 8, letterSpacing: "0.15em", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(74,24,24,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(74,24,24,0.15)"}
          >
            ✕ REJECT
          </button>
        </div>
      ) : (
        <div style={{ padding: "7px 10px", ...mono, fontSize: 8, letterSpacing: "0.15em", textAlign: "center", color: proposal.status === "approved" ? "#4CAF50" : CRIM }}>
          {proposal.status === "approved" ? `✓ WRITTEN TO ${proposal.target.toUpperCase()}` : "✕ REJECTED BY SOVEREIGN"}
        </div>
      )}
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, col, setCol }) {
  return (
    <nav style={{ position:"relative", zIndex:10, height:"100vh", flexShrink:0, width:col?52:220, transition:"width 0.25s", background:"rgba(6,6,6,0.97)", borderRight:`1px solid ${BGOLD}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"20px 0 16px", borderBottom:`1px solid ${BGOLD}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 14px" }}>
          <div style={{ width:26, height:26, borderRadius:4, border:`1px solid ${GOLDDM}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:GOLD, flexShrink:0 }}>♛</div>
          {!col && <div><div style={{ ...mono, fontWeight:700, fontSize:11, color:TPRI, letterSpacing:"0.2em" }}>KING'S</div><div style={{ ...mono, fontSize:11, color:GOLDDM, letterSpacing:"0.2em" }}>COUNCIL v3</div></div>}
        </div>
      </div>
      {!col && (
        <div style={{ padding:"9px 14px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:GOLD, boxShadow:`0 0 7px ${GOLD}` }} />
            <span style={{ ...mono, fontSize:9, color:GOLDDM, letterSpacing:"0.15em" }}>43 AGENTS OPERATIONAL</span>
          </div>
        </div>
      )}
      <div style={{ flex:1, padding:"6px 0", display:"flex", flexDirection:"column", gap:1, overflowY:"auto" }}>
        {NAV.map(n => {
          const on = active === n.id
          return (
            <button key={n.id} onClick={() => setActive(n.id)} style={{ position:"relative", display:"flex", alignItems:"center", gap:10, padding:"9px 14px", border:"none", background:on?"rgba(200,147,10,0.08)":"transparent", width:"100%", cursor:"pointer" }}>
              {on && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2, height:20, background:`linear-gradient(180deg,${GOLD},${AMBER})` }} />}
              {!col && <span style={{ ...mono, fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:on?GOLD:TSUB, textTransform:"uppercase", whiteSpace:"nowrap" }}>{n.label}</span>}
              {col  && <span style={{ ...mono, fontSize:9, color:on?GOLD:TSUB }}>{n.id.slice(0,2).toUpperCase()}</span>}
            </button>
          )
        })}
      </div>
      {!col && (
        <div style={{ padding:"10px 14px", borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ ...mono, fontSize:8, color:TDIM, letterSpacing:"0.12em", marginBottom:6 }}>ARCHITECTURE</div>
          {[["TIER I",   "1 Sovereign", GOLD],["COUNCIL","7 Advisors", AMBER],["TIER II","12 Ministers", CYAN],["TIER III","24 Operatives", PURPLE]].map(([l,v,a]) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ ...mono, fontSize:8, color:a }}>{l}</span>
              <span style={{ ...mono, fontSize:8, color:TDIM }}>{v}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setCol(!col)} style={{ borderTop:`1px solid ${BGOLD}`, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, background:"transparent", border:"none", cursor:"pointer", width:"100%" }}>
        <span style={{ ...mono, fontSize:11, color:GOLDDM }}>{col ? ">>" : "<<"}</span>
        {!col && <span style={{ ...mono, fontSize:9, color:TDIM, letterSpacing:"0.1em" }}>COLLAPSE</span>}
      </button>
    </nav>
  )
}

// ─── KPI ─────────────────────────────────────────────────────────────────────

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

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

function SectionHeader({ label, count, ac, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, marginTop:4 }}>
      <div style={{ width:16, height:1.5, background:ac||GOLD }} />
      <span style={{ ...mono, fontSize:10, color:ac||GOLD, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:700 }}>{label}</span>
      {count !== undefined && <span style={{ ...mono, fontSize:9, color:TSUB, border:`1px solid ${BORDER}`, padding:"1px 7px", borderRadius:2 }}>{count}</span>}
      {sub && <span style={{ ...mono, fontSize:9, color:TDIM, fontStyle:"italic" }}>{sub}</span>}
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${BGOLD},transparent)` }} />
    </div>
  )
}

// ─── AGENT CARD ──────────────────────────────────────────────────────────────

function AgentCard({ m, onClick, sel, compact }) {
  const [hov, setHov] = useState(false)
  if (compact) {
    return (
      <button onClick={() => onClick(m)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", borderRadius:3, background:sel?"rgba(200,147,10,0.1)":hov?BGHOV:"transparent", border:`1px solid ${sel?BGOLD:hov?"#2A2A2A":BORDER}`, color:sel?GOLD:TSUB, ...mono, fontSize:9, textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s" }}>
        <span style={{ fontSize:12 }}>{m.icon}</span>
        <span style={{ color:sel?GOLD:TSUB }}>{m.name}</span>
        {m.polarity && <span style={{ fontSize:7, padding:"1px 4px", borderRadius:2, background:m.polarity==="light"?"rgba(255,220,100,0.1)":"rgba(120,80,200,0.1)", border:`1px solid ${m.polarity==="light"?"rgba(255,220,100,0.3)":"rgba(120,80,200,0.3)"}`, color:m.polarity==="light"?"#FFD860":"#AA80FF" }}>{m.polarity==="light"?"☀":"🌑"}</span>}
      </button>
    )
  }
  return (
    <div onClick={() => onClick(m)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:"relative", borderRadius:4, padding:"14px 16px", cursor:"pointer", background:sel?"#151208":hov?BGHOV:BGCARD, border:`1px solid ${sel?BGOLD:hov?"#2A2A2A":BORDER}`, transition:"all 0.15s" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:sel?`linear-gradient(90deg,transparent,${m.ac}80,transparent)`:"transparent" }} />
      {m.polarity && (
        <div style={{ position:"absolute", top:8, right:8, fontSize:7, fontFamily:"'Courier New',monospace", letterSpacing:"1px", padding:"1px 5px", borderRadius:1, background:m.polarity==="light"?"rgba(255,220,100,0.12)":"rgba(120,80,200,0.15)", border:`1px solid ${m.polarity==="light"?"rgba(255,220,100,0.3)":"rgba(120,80,200,0.3)"}`, color:m.polarity==="light"?"#FFD860":"#AA80FF" }}>
          {m.polarity==="light"?"☀ LIGHT":"🌑 DARK"}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ ...mono, fontSize:9, color:TDIM, letterSpacing:"0.12em", textTransform:"uppercase" }}>{m.tier || (m.polarity ? `OPERATIVE · ${m.minister?.toUpperCase()}` : "INNER COUNCIL")}</span>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:sel?GOLD:TDIM, boxShadow:sel?`0 0 5px ${GOLD}`:"none" }} />
          <span style={{ ...mono, fontSize:8, color:sel?GOLDDM:TDIM }}>STANDBY</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
        <div style={{ width:28, height:28, border:`1px solid ${sel?m.ac:BORDER}`, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>{m.icon}</div>
        <span style={{ ...mono, fontWeight:700, fontSize:12, color:sel?m.ac:TPRI, letterSpacing:"0.1em" }}>{m.name}</span>
      </div>
      <div style={{ ...mono, fontSize:10, color:sel?TSUB:TDIM, textTransform:"uppercase", marginBottom:12, paddingLeft:36 }}>{m.role}</div>
      <button onClick={e => { e.stopPropagation(); onClick(m) }}
        style={{ width:"100%", padding:"5px 0", background:sel?"rgba(200,147,10,0.1)":"transparent", border:`1px solid ${sel?BGOLD:BORDER}`, borderRadius:3, color:sel?GOLD:TDIM, ...mono, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer" }}>
        {sel ? ">> CHANNEL OPEN" : "OPEN CHANNEL"}
      </button>
    </div>
  )
}

// ─── SOVEREIGN NODE ──────────────────────────────────────────────────────────

function SovereignNode({ onClick, sel }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
      <div onClick={() => onClick(SOVEREIGN)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ background:`linear-gradient(135deg,#1C1608,#2A2010,#1C1608)`, border:`2px solid ${sel?GOLD2:BGOLD}`, borderRadius:4, padding:"20px 44px", textAlign:"center", cursor:"pointer", transition:"all 0.3s", minWidth:260, boxShadow:sel?`0 0 60px rgba(201,168,76,0.4)`:`0 0 40px rgba(201,168,76,0.15)`, position:"relative" }}>
        <div style={{ position:"absolute", inset:-4, border:`1px solid rgba(201,168,76,0.12)`, borderRadius:6, pointerEvents:"none" }} />
        <div style={{ fontSize:32, marginBottom:6 }}>♛</div>
        <div style={{ ...mono, fontWeight:700, fontSize:13, color:GOLD, letterSpacing:"0.2em" }}>THE SOVEREIGN</div>
        <div style={{ ...mono, fontSize:9, color:TSUB, marginTop:4, letterSpacing:"0.1em" }}>Vision Holder · Final Authority · You</div>
        <div style={{ display:"inline-block", marginTop:8, padding:"2px 12px", border:`1px solid ${BGOLD}`, borderRadius:2, ...mono, fontSize:8, letterSpacing:"0.2em", color:GOLDDM }}>HUMAN IN COMMAND</div>
      </div>
    </div>
  )
}

// ─── OPERATIVE PAIRS ─────────────────────────────────────────────────────────

function OperativePair({ minister, onClick, sel }) {
  const pair = OPERATIVES.filter(o => o.minister === minister.id)
  if (!pair.length) return null
  const [light, dark] = [pair.find(o=>o.polarity==="light"), pair.find(o=>o.polarity==="dark")]
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:"2px 2px 0 0", border:`1px solid ${minister.ac}40`, borderBottom:"none", background:`${minister.ac}10`, ...mono, fontSize:8, color:minister.ac, letterSpacing:"0.15em" }}>
        <span>{minister.icon}</span> {minister.name}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, border:`1px solid ${minister.ac}40`, borderTop:"none", borderRadius:"0 0 2px 2px", overflow:"hidden" }}>
        {[light, dark].map((op, i) => op && (
          <div key={op.id} onClick={() => onClick(op)}
            style={{ padding:"10px 10px", cursor:"pointer", background:sel?.id===op.id?"rgba(200,147,10,0.08)":"transparent", transition:"all 0.15s", borderLeft:i===1?`1px solid ${minister.ac}25`:"none", position:"relative" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
            onMouseLeave={e => e.currentTarget.style.background=sel?.id===op.id?"rgba(200,147,10,0.08)":"transparent"}>
            <div style={{ position:"absolute", top:5, right:6, fontSize:6, ...mono, letterSpacing:"0.5px", padding:"1px 4px", borderRadius:1, background:op.polarity==="light"?"rgba(255,220,100,0.08)":"rgba(120,80,200,0.1)", border:`1px solid ${op.polarity==="light"?"rgba(255,220,100,0.25)":"rgba(120,80,200,0.25)"}`, color:op.polarity==="light"?"#FFD860":"#AA80FF" }}>{op.polarity==="light"?"☀":"🌑"}</div>
            <div style={{ fontSize:16, marginBottom:3 }}>{op.icon}</div>
            <div style={{ ...mono, fontSize:9, color:sel?.id===op.id?op.ac:TPRI, fontWeight:600, letterSpacing:"0.08em" }}>{op.name}</div>
            <div style={{ ...mono, fontSize:8, color:op.ac, marginTop:2, opacity:0.8 }}>{op.role}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CHAT PANEL ──────────────────────────────────────────────────────────────
// MODIFIED: messages now carry an optional `proposal` field.
// When an agent response contains a [WRITE_PROPOSAL] block it is stripped from
// the visible text and rendered as a WriteProposalCard that the Sovereign must
// approve before anything is written.

function Chat({ m, onClose, onEscalate, onCouncil, onWriteLogged }) {
  const [msgs, setMsgs] = useState([
    { role:"assistant", content:`${m.name} online. Standing by, Sovereign.`, proposal: null }
  ])
  const [inp, setInp]     = useState("")
  const [load, setLoad]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const bot = useRef(null)

  useEffect(() => { if (bot.current) bot.current.scrollIntoView({ behavior:"smooth" }) }, [msgs])

  // ── send message ──────────────────────────────────────────────────────────
  const send = async () => {
    if (!inp.trim() || load) return
    const um   = { role:"user", content:inp, proposal: null }
    const next = [...msgs, um]
    setMsgs(next); setInp(""); setLoad(true); setSaved(false)
    try {
      const res  = await authFetch("/api/chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          agentId: m.id,
          messages: next.map(x => ({ role:x.role, content:x.content })),
        }),
      })
      const data = await res.json()
      const raw  = data.content || data.error || "No response."

      // Parse write proposal out of the response
      const { cleanText, proposal } = parseWriteProposal(raw)
      setMsgs(p => [...p, { role:"assistant", content: cleanText, proposal }])
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"SIGNAL LOST. Check API configuration.", proposal: null }])
    }
    setLoad(false)
  }

  // ── approve write ─────────────────────────────────────────────────────────
  const approveWrite = async (msgIndex) => {
    const msg = msgs[msgIndex]
    if (!msg?.proposal) return

    // Optimistically mark approved
    setMsgs(prev => prev.map((x, i) =>
      i === msgIndex ? { ...x, proposal: { ...x.proposal, status: "approved" } } : x
    ))

    // Write directly to the agent's Notion DB via the dedicated write endpoint
    try {
      await authFetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId:   m.id,
          agentName: m.name,
          target:    msg.proposal.target,
          content:   msg.proposal.content,
          venture:   "Kingdom Alpha",
        }),
      })
    } catch {}

    // Notify parent so write log count can update
    if (onWriteLogged) onWriteLogged({ agent: m.name, target: msg.proposal.target, content: msg.proposal.content, status: "approved" })

    // Agent acknowledgement
    setMsgs(prev => [...prev, {
      role: "assistant",
      content: `Written to ${msg.proposal.target}. Record secured, Sovereign.`,
      proposal: null,
    }])
  }

  // ── reject write ──────────────────────────────────────────────────────────
  const rejectWrite = (msgIndex) => {
    setMsgs(prev => prev.map((x, i) =>
      i === msgIndex ? { ...x, proposal: { ...x.proposal, status: "rejected" } } : x
    ))
    if (onWriteLogged) onWriteLogged({ agent: m.name, target: msgs[msgIndex]?.proposal?.target, status: "rejected" })
    setMsgs(prev => [...prev, {
      role: "assistant",
      content: `Understood, Sovereign. Write set aside. Shall I revise the proposal?`,
      proposal: null,
    }])
  }

  // ── save session ──────────────────────────────────────────────────────────
  const saveSession = async () => {
    if (saving || msgs.length < 2) return
    setSaving(true)
    try {
      const res  = await authFetch("/api/log", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ agentId: m.id, agentName: m.name, messages: msgs.filter((x,i) => i > 0), type:"Conversation", venture:"Kingdom Alpha" }),
      })
      const data = await res.json()
      setSaved(data.success)
    } catch { setSaved(false) }
    setSaving(false)
  }

  const tierLabel = m.tier || (m.polarity ? `OPERATIVE · ${m.minister?.toUpperCase()}` : "INNER COUNCIL")

  return (
    <div style={{ position:"fixed", right:0, top:0, bottom:0, width:420, zIndex:50, background:"rgba(6,6,6,0.98)", borderLeft:`1px solid ${BGOLD}`, display:"flex", flexDirection:"column" }}>

      {/* ── Header (unchanged) ── */}
      <div style={{ padding:"16px 18px 14px", borderBottom:`1px solid ${BGOLD}`, flexShrink:0, background:"rgba(200,147,10,0.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <div style={{ width:28, height:28, border:`1px solid ${m.ac}`, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{m.icon}</div>
              <span style={{ ...mono, fontWeight:700, fontSize:13, color:TPRI, letterSpacing:"0.15em" }}>{m.name}</span>
            </div>
            <div style={{ ...mono, fontSize:9, color:TDIM, textTransform:"uppercase", paddingLeft:36 }}>{m.role} / {tierLabel}</div>
            {m.polarity && (
              <div style={{ paddingLeft:36, marginTop:4 }}>
                <span style={{ fontSize:8, ...mono, letterSpacing:"0.1em", padding:"2px 7px", borderRadius:2, background:m.polarity==="light"?"rgba(255,220,100,0.1)":"rgba(120,80,200,0.12)", border:`1px solid ${m.polarity==="light"?"rgba(255,220,100,0.3)":"rgba(120,80,200,0.3)"}`, color:m.polarity==="light"?"#FFD860":"#AA80FF" }}>
                  {m.polarity==="light"?"☀ LIGHT POLARITY":"🌑 DARK POLARITY"}
                </span>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
            <button onClick={saveSession} disabled={saving||msgs.length<2} style={{ background:saved?"rgba(0,100,0,0.2)":"transparent", border:`1px solid ${saved?"#2A6A2A":BGOLD}`, borderRadius:3, color:saved?"#4CAF50":saving?TDIM:GOLDDM, padding:"4px 8px", ...mono, fontSize:8, cursor:saving||msgs.length<2?"not-allowed":"pointer" }}>
              {saving?"SAVING...":saved?"LOGGED":"SAVE"}
            </button>
            <button onClick={onCouncil} style={{ background:"rgba(0,200,240,0.08)", border:`1px solid ${CYAN}40`, borderRadius:3, color:CYAN, padding:"4px 8px", ...mono, fontSize:8, cursor:"pointer" }}>COUNCIL</button>
            <button onClick={() => onEscalate && onEscalate(m)} style={{ background:"transparent", border:`1px solid ${BCRIM}`, borderRadius:3, color:CRIM, padding:"4px 8px", ...mono, fontSize:8, cursor:"pointer" }}>ESCALATE</button>
            <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${BORDER}`, borderRadius:3, color:TDIM, padding:"4px 8px", ...mono, fontSize:10, cursor:"pointer" }}>✕</button>
          </div>
        </div>
        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:GOLD, boxShadow:`0 0 5px ${GOLD}` }} />
          <span style={{ ...mono, fontSize:8, color:GOLDDM, letterSpacing:"0.15em" }}>SECURE CHANNEL ESTABLISHED</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
        {msgs.map((msg, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"88%", padding:"10px 13px", borderRadius:3, background:msg.role==="user"?"rgba(212,151,12,0.1)":"rgba(255,255,255,0.05)", border:`1px solid ${msg.role==="user"?BGOLD:BORDER}`, color:msg.role==="user"?TPRI:TSUB, fontSize:13, lineHeight:1.7, fontFamily:msg.role==="assistant"?"'Courier New',monospace":"sans-serif", whiteSpace:"pre-wrap" }}>
              {msg.content}
            </div>

            {/* Write proposal card — only on agent messages that carry a proposal */}
            {msg.role === "assistant" && msg.proposal && (
              <div style={{ maxWidth:"88%", width:"88%" }}>
                <WriteProposalCard
                  proposal={msg.proposal}
                  onApprove={() => approveWrite(i)}
                  onReject={() => rejectWrite(i)}
                />
              </div>
            )}
          </div>
        ))}
        {load && <div style={{ ...mono, fontSize:9, color:GOLDDM }}>TRANSMITTING...</div>}
        <div ref={bot} />
      </div>

      {/* ── Input (unchanged) ── */}
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

// ─── MORNING BRIEF ────────────────────────────────────────────────────────────

function MorningBrief() {
  const [brief,   setBrief]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const fetchBrief = async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/brief")
      const data = await res.json()
      setBrief(data)
    } catch {
      setBrief({ brief:"BRIEF UNAVAILABLE — Check API configuration.", date:new Date().toDateString() })
    }
    setLoading(false); setFetched(true)
  }

  return (
    <div style={{ background:BGCARD, border:`1px solid ${BGOLD}`, borderRadius:4, padding:"20px", position:"relative", marginBottom:20 }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <div style={{ ...mono, fontSize:8, color:GOLDDM, letterSpacing:"0.2em", marginBottom:4 }}>LORD CHANCELLOR / MORNING BRIEF</div>
          <div style={{ ...mono, fontWeight:700, fontSize:14, color:TPRI }}>{brief?.date || new Date().toLocaleDateString("en-US",{ weekday:"long", month:"long", day:"numeric" })}</div>
        </div>
        <button onClick={fetchBrief} disabled={loading} style={{ padding:"7px 14px", background:"rgba(212,151,12,0.1)", border:`1px solid ${BGOLD}`, borderRadius:3, color:loading?TDIM:GOLD, ...mono, fontSize:9, letterSpacing:"0.15em", cursor:loading?"not-allowed":"pointer" }}>
          {loading?"GENERATING...":fetched?"REFRESH":"GENERATE BRIEF"}
        </button>
      </div>
      {brief  && <div style={{ ...mono, fontSize:11, color:TSUB, lineHeight:1.9, whiteSpace:"pre-wrap", borderTop:`1px solid ${BORDER}`, paddingTop:12 }}>{brief.brief}</div>}
      {!brief && !loading && <div style={{ ...mono, fontSize:10, color:TDIM }}>Click GENERATE BRIEF to receive your daily operational summary from the Lord Chancellor.</div>}
    </div>
  )
}

// ─── WRITE LOG MODAL ─────────────────────────────────────────────────────────
// Shows all approved/rejected writes from the current session.

function WriteLogModal({ entries, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ width:560, maxHeight:"75vh", background:BGCARD, border:`1px solid ${BGOLD}`, borderRadius:4, display:"flex", flexDirection:"column", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BGOLD}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ ...mono, fontSize:11, color:GOLD, letterSpacing:"0.2em" }}>SOVEREIGN WRITE LOG</span>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${BORDER}`, borderRadius:3, color:TDIM, padding:"3px 8px", ...mono, fontSize:10, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:8, flex:1 }}>
          {entries.length === 0 && (
            <div style={{ ...mono, fontSize:10, color:TDIM, textAlign:"center", padding:"24px 0" }}>No write actions recorded this session.</div>
          )}
          {[...entries].reverse().map((e, i) => (
            <div key={i} style={{ border:`1px solid ${e.status==="approved"?"#2A6A2A":BCRIM}`, borderRadius:3, padding:"10px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ ...mono, fontSize:9, color:GOLDDM }}>{e.agent}</span>
                <span style={{ ...mono, fontSize:8, color:TDIM }}>→ {e.target}</span>
                <span style={{ ...mono, fontSize:8, color:e.status==="approved"?"#4CAF50":CRIM, letterSpacing:"0.12em" }}>{e.status==="approved"?"✓ APPROVED":"✕ REJECTED"}</span>
              </div>
              {e.content && <div style={{ ...mono, fontSize:10, color:TSUB, lineHeight:1.6, borderTop:`1px solid ${BORDER}`, paddingTop:6 }}>{e.content}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(TOKEN_KEY))

  const [nav, setNav]               = useState("dashboard")
  const [col, setCol]               = useState(false)
  const [sel, setSel]               = useState(null)
  const [councilOp, setCouncilOp]   = useState(null)
  const [time, setTime]             = useState(new Date())
  const [escalationCount, setEscalationCount] = useState(0)

  // ── Write log state ───────────────────────────────────────────────────────
  const [writeLog, setWriteLog]         = useState([])
  const [showWriteLog, setShowWriteLog] = useState(false)

  const handleWriteLogged = (entry) => {
    setWriteLog(prev => [...prev, entry])
  }

  const approvedWrites = writeLog.filter(e => e.status === "approved").length

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => {
    authFetch("/api/notion?action=escalations")
      .then(r => r.json())
      .then(d => { if (d && Array.isArray(d.results)) setEscalationCount(d.results.length) })
      .catch(() => {})
  }, [])

  const handleEscalate = async (agent) => {
    try {
      await authFetch("/api/notion?action=escalate", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ title:"Escalation from " + agent.name, agent: agent.name, details:"" }) })
      setEscalationCount(c => c + 1)
    } catch {}
  }

  const openAgent = (agent) => { setSel(agent) }

  const pageTitle = NAV.find(n => n.id === nav)?.label || nav.toUpperCase()

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />

  return (
    <>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } html,body,#root { height:100%; background:#060606; overflow:hidden; } ::-webkit-scrollbar { width:2px; } ::-webkit-scrollbar-thumb { background:#5A4418; } input::placeholder { color:#4A4440; }`}</style>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:BG, paddingRight:sel?420:0, transition:"padding-right 0.25s" }}>

        <Sidebar active={nav} setActive={v => { setNav(v); setSel(null) }} col={col} setCol={setCol} />

        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* TOPBAR */}
          <div style={{ height:52, flexShrink:0, borderBottom:`1px solid ${BGOLD}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"rgba(6,6,6,0.95)" }}>
            <div>
              <div style={{ ...mono, fontWeight:700, fontSize:14, color:TPRI, letterSpacing:"0.2em", textTransform:"uppercase" }}>{pageTitle}</div>
              <div style={{ ...mono, fontSize:8, color:TDIM, marginTop:2 }}>{time.toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" }).toUpperCase()} / {time.toLocaleTimeString([],{ hour:"2-digit", minute:"2-digit", second:"2-digit" })}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>

              {/* ── Write Log button — only shows when there are writes ── */}
              {writeLog.length > 0 && (
                <button onClick={() => setShowWriteLog(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:3, background:"rgba(42,106,42,0.15)", border:"1px solid #2A6A2A", cursor:"pointer" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:"#4CAF50" }} />
                  <span style={{ ...mono, fontSize:9, color:"#4CAF50" }}>{approvedWrites} WRITTEN</span>
                </button>
              )}

              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:3, background:escalationCount>0?"rgba(196,30,30,0.2)":"rgba(139,26,26,0.1)", border:`1px solid ${escalationCount>0?CRIM:BCRIM}` }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:escalationCount>0?CRIM:TDIM }} />
                <span style={{ ...mono, fontSize:9, color:escalationCount>0?CRIM:TDIM }}>{escalationCount} ESCALATIONS</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:3, background:"rgba(200,147,10,0.1)", border:`1px solid ${BGOLD}` }}>
                <span style={{ ...mono, fontSize:9, color:GOLD }}>♛ SOVEREIGN</span>
              </div>
            </div>
          </div>

          {/* KPI BAR */}
          <div style={{ flexShrink:0, padding:"10px 24px", borderBottom:`1px solid ${BORDER}`, display:"flex", gap:10 }}>
            <Kpi label="Total Agents"    value={43}                sub="DEPLOYED"   ac={GOLD}  />
            <Kpi label="Inner Council"   value={7}                 sub="ADVISORS"   ac={AMBER} />
            <Kpi label="Ministers"       value={12}                sub="TIER II"    ac={CYAN}  />
            <Kpi label="Operatives"      value={24}                sub="TIER III"   ac={PURPLE}/>
            <Kpi label="Escalations"     value={escalationCount}   sub="OPEN"       ac={escalationCount>0?CRIM:TDIM} />
          </div>

          {/* MAIN CONTENT */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

            {nav === "dashboard" && (
              <div>
                <MorningBrief />
                <SectionHeader label="FULL COUNCIL — QUICK ACCESS" count={43} />
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:24 }}>
                  {ALL_AGENTS.map(m => <AgentCard key={m.id} m={m} onClick={openAgent} sel={sel?.id===m.id} compact />)}
                </div>
              </div>
            )}

            {nav === "sovereign" && (
              <div>
                <SectionHeader label="TIER I — THE SOVEREIGN" ac={GOLD} sub="Human in Command · Final Authority" />
                <SovereignNode onClick={openAgent} sel={sel?.id==="sovereign"} />
                <div style={{ maxWidth:600, margin:"0 auto", background:BGCARD, border:`1px solid ${BGOLD}`, borderRadius:4, padding:"20px 24px" }}>
                  <div style={{ ...mono, fontSize:9, color:GOLDDM, letterSpacing:"0.15em", marginBottom:10 }}>SOVEREIGN MANDATE</div>
                  <div style={{ ...mono, fontSize:11, color:TSUB, lineHeight:1.8 }}>
                    You hold the ultimate vision and final veto on all decisions. No AI agent acts outside your intent. Your role is to set direction, resolve conflicts between ministers, and define what the kingdom stands for.{"\n\n"}The Council exists to serve your vision — not to replace your judgment.
                  </div>
                  <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {["Set kingdom vision & core values","Approve major initiatives","Break ties between ministers","Redefine agent mandates","Grant and revoke agent authority","Define what the kingdom stands for"].map(p => (
                      <div key={p} style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                        <span style={{ color:GOLDDM, fontSize:7, marginTop:3 }}>◆</span>
                        <span style={{ ...mono, fontSize:10, color:TSUB }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {nav === "council" && (
              <div>
                <SectionHeader label="INNER COUNCIL" count={7} ac={AMBER} sub="Direct Advisors to the Sovereign" />
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px, 1fr))", gap:10 }}>
                  {COUNCIL.map(m => <AgentCard key={m.id} m={m} onClick={openAgent} sel={sel?.id===m.id} />)}
                </div>
              </div>
            )}

            {nav === "ministers" && (
              <div>
                <SectionHeader label="TIER II — THE TWELVE MINISTERS" count={12} ac={CYAN} sub="Executive Domain Authorities" />
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px, 1fr))", gap:10 }}>
                  {MINISTERS.map(m => <AgentCard key={m.id} m={m} onClick={openAgent} sel={sel?.id===m.id} />)}
                </div>
              </div>
            )}

            {nav === "operatives" && (
              <div>
                <SectionHeader label="TIER III — 24 POLAR OPERATIVES" count={24} ac={PURPLE} sub="2 per Minister · Light & Dark Polarity" />
                <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:8, ...mono, padding:"2px 7px", borderRadius:2, background:"rgba(255,220,100,0.1)", border:"1px solid rgba(255,220,100,0.3)", color:"#FFD860" }}>☀ LIGHT</span>
                    <span style={{ ...mono, fontSize:9, color:TDIM }}>Offensive · Generative · Outward</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:8, ...mono, padding:"2px 7px", borderRadius:2, background:"rgba(120,80,200,0.1)", border:"1px solid rgba(120,80,200,0.3)", color:"#AA80FF" }}>🌑 DARK</span>
                    <span style={{ ...mono, fontSize:9, color:TDIM }}>Defensive · Protective · Inward</span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
                  {MINISTERS.map(m => <OperativePair key={m.id} minister={m} onClick={openAgent} sel={sel} />)}
                </div>
              </div>
            )}

            {nav === "ventures" && (
              <div>
                <SectionHeader label="ACTIVE KINGDOMS" count={1} />
                <div style={{ background:BGCARD, border:`1px solid ${BGOLD}`, borderRadius:4, padding:"24px", position:"relative", maxWidth:600 }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
                  <div style={{ ...mono, fontSize:8, color:TDIM, letterSpacing:"0.2em", marginBottom:8 }}>VENTURE CLASSIFICATION: PRIMARY</div>
                  <div style={{ ...mono, fontWeight:700, fontSize:18, color:TPRI, marginBottom:16 }}>KINGDOM ALPHA</div>
                  <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
                    {[["REVENUE","UNDISCLOSED",TSUB],["PROJECTION","$1.5B",GOLD],["AI AGENTS","43 DEPLOYED",CYAN],["STATUS","SCALING",AMBER]].map(([l,v,a]) => (
                      <div key={l}><div style={{ ...mono, fontSize:8, color:TDIM, marginBottom:4 }}>{l}</div><div style={{ ...mono, fontWeight:700, fontSize:13, color:a }}>{v}</div></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {nav === "intel" && (
              <div>
                <SectionHeader label="INTELLIGENCE FEED" count={0} ac={CRIM} />
                <div style={{ background:BGCARD, border:`1px solid ${BCRIM}`, borderRadius:4, padding:"32px", textAlign:"center" }}>
                  <div style={{ ...mono, color:TSUB, fontSize:11, marginBottom:6 }}>NO ACTIVE INTELLIGENCE BRIEFS</div>
                  <div style={{ ...mono, color:TDIM, fontSize:9, marginBottom:16 }}>DEPLOY THE MINISTER OF SHADOWS OR ANALYST TO BEGIN SURVEILLANCE OPERATIONS</div>
                  <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                    <button onClick={() => { setNav("ministers"); setTimeout(() => setSel(MINISTERS.find(m => m.id==="shadows")), 150) }} style={{ padding:"7px 18px", borderRadius:3, background:"rgba(196,30,30,0.1)", border:`1px solid ${BCRIM}`, color:CRIM, ...mono, fontSize:9, cursor:"pointer" }}>DEPLOY SHADOWS</button>
                    <button onClick={() => { setNav("operatives"); setTimeout(() => setSel(OPERATIVES.find(o => o.id==="analyst")), 150) }} style={{ padding:"7px 18px", borderRadius:3, background:"rgba(136,85,204,0.1)", border:`1px solid ${PURPLE}40`, color:PURPLE, ...mono, fontSize:9, cursor:"pointer" }}>DEPLOY ANALYST</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {sel && (
        <Chat
          m={sel}
          onClose={() => setSel(null)}
          onEscalate={handleEscalate}
          onCouncil={() => { setCouncilOp(sel.id); setSel(null) }}
          onWriteLogged={handleWriteLogged}
        />
      )}
      {councilOp && <CouncilSession primaryOperative={councilOp} onClose={() => setCouncilOp(null)} />}
      {showWriteLog && <WriteLogModal entries={writeLog} onClose={() => setShowWriteLog(false)} />}
    </>
  )
}
