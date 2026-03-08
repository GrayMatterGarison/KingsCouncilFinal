import { useState, useRef, useEffect } from "react"

const GOLD="#D4970C", GOLD2="#F0B000", GOLDDM="#A07020"
const CRIM="#E02020", CYAN="#00C8F0", AMBER="#E06A0A"
const TPRI="#F2ECD8", TSUB="#B0A888", TDIM="#6A6258"
const BG="#060606", BGCARD="#141414", BORDER="#2E2E2E"
const BGOLD="#5A4418", BCRIM="#4A1818"
const PURPLE="#8855CC", GREEN="#60C890"
const mono = { fontFamily:"'Courier New', monospace" }

// ─── V3 AGENT META ────────────────────────────────────────────────────────────

const AGENT_META = {
  // Tier I
  sovereign:    { name:"THE SOVEREIGN",          role:"Final Authority",        tier:"I",       ac:GOLD,   icon:"♛" },
  // Inner Council
  chancellor:   { name:"LORD CHANCELLOR",        role:"Chief of Staff",         tier:"C",       ac:GOLD,   icon:"⚖️" },
  oracle:       { name:"THE ORACLE",             role:"Research · Foresight",   tier:"C",       ac:AMBER,  icon:"🔮" },
  scribe:       { name:"ROYAL SCRIBE",           role:"Memory · Records",       tier:"C",       ac:TSUB,   icon:"📜" },
  devil:        { name:"DEVIL'S ADVOCATE",       role:"Risk · Challenge",       tier:"C",       ac:CRIM,   icon:"😈" },
  truthteller:  { name:"TRUTH-TELLER",           role:"Ground Reality",         tier:"C",       ac:CYAN,   icon:"🪞" },
  inspector:    { name:"INSPECTOR GENERAL",      role:"Agent Auditor",          tier:"C",       ac:AMBER,  icon:"🔎" },
  visionary:    { name:"THE VISIONARY",          role:"Strategic Reinvention",  tier:"C",       ac:PURPLE, icon:"🌌" },
  // Tier II — Ministers
  war:          { name:"MIN. OF WAR",            role:"Strategy · Defense",     tier:"II",      ac:CRIM,   icon:"⚔️" },
  economics:    { name:"MIN. OF ECONOMICS",      role:"Resources · Commerce",   tier:"II",      ac:GOLD,   icon:"💰" },
  justice:      { name:"LORD JUSTICE",           role:"Rules · Policy",         tier:"II",      ac:CYAN,   icon:"🏛️" },
  shadows:      { name:"MIN. OF SHADOWS",        role:"Intelligence · Covert",  tier:"II",      ac:PURPLE, icon:"🌑" },
  people:       { name:"MIN. OF PEOPLE",         role:"Culture · Loyalty",      tier:"II",      ac:GREEN,  icon:"👥" },
  herald:       { name:"ROYAL HERALD",           role:"Narrative · Messaging",  tier:"II",      ac:AMBER,  icon:"📣" },
  builder:      { name:"MASTER BUILDER",         role:"Projects · Systems",     tier:"II",      ac:GOLD2,  icon:"🏗️" },
  philosopher:  { name:"HIGH PHILOSOPHER",       role:"Values · Ideology",      tier:"II",      ac:PURPLE, icon:"🕯️" },
  foreign:      { name:"FOREIGN MINISTER",       role:"Alliances · Relations",  tier:"II",      ac:CYAN,   icon:"🌍" },
  continuity:   { name:"MIN. OF CONTINUITY",     role:"Resilience · Crisis",    tier:"II",      ac:GREEN,  icon:"⚕️" },
  pioneer:      { name:"MIN. OF FRONTIERS",      role:"Innovation · R&D",       tier:"II",      ac:AMBER,  icon:"🔭" },
  knowledge:    { name:"MIN. OF KNOWLEDGE",      role:"Learning · Wisdom",      tier:"II",      ac:GREEN,  icon:"📖" },
  // Tier III — Operatives
  tactician:    { name:"TACTICIAN",              role:"Attack · Campaign",      tier:"III",     ac:CRIM,   icon:"🗺️", polarity:"light" },
  sentinel:     { name:"SENTINEL",               role:"Protect · Fortify",      tier:"III",     ac:CRIM,   icon:"🛡️", polarity:"dark"  },
  trader:       { name:"TRADE ENVOY",            role:"Create · Grow",          tier:"III",     ac:GOLD,   icon:"🤝", polarity:"light" },
  auditor:      { name:"AUDITOR",                role:"Guard · Track",          tier:"III",     ac:GOLD,   icon:"📊", polarity:"dark"  },
  lawmaker:     { name:"LAWMAKER",               role:"Build Policy",           tier:"III",     ac:CYAN,   icon:"📋", polarity:"light" },
  enforcer:     { name:"ENFORCER",               role:"Comply · Adjudicate",    tier:"III",     ac:CYAN,   icon:"⚖️", polarity:"dark"  },
  analyst:      { name:"ANALYST",                role:"Gather · Synthesize",    tier:"III",     ac:PURPLE, icon:"🔍", polarity:"light" },
  counterintel: { name:"COUNTER-INTEL",          role:"Deceive · Protect",      tier:"III",     ac:PURPLE, icon:"🗡️", polarity:"dark"  },
  recruiter:    { name:"RECRUITER",              role:"Pull In · Build Tribe",  tier:"III",     ac:GREEN,  icon:"🌟", polarity:"light" },
  keeper:       { name:"KEEPER",                 role:"Hold Loyalty · Heal",    tier:"III",     ac:GREEN,  icon:"🔗", polarity:"dark"  },
  writer:       { name:"ROYAL WRITER",           role:"Build · Craft",          tier:"III",     ac:AMBER,  icon:"✍️", polarity:"light" },
  historian:    { name:"HISTORIAN",              role:"Guard Legacy · Archive", tier:"III",     ac:AMBER,  icon:"📚", polarity:"dark"  },
  architect:    { name:"ARCHITECT",              role:"Design · Blueprint",     tier:"III",     ac:GOLD2,  icon:"📐", polarity:"light" },
  engineer:     { name:"ENGINEER",               role:"Build · Maintain",       tier:"III",     ac:GOLD2,  icon:"⚙️", polarity:"dark"  },
  ethicist:     { name:"ROYAL ETHICIST",         role:"Apply Values",           tier:"III",     ac:PURPLE, icon:"⚜️", polarity:"light" },
  inquisitor:   { name:"INQUISITOR",             role:"Stress-Test Beliefs",    tier:"III",     ac:PURPLE, icon:"🔥", polarity:"dark"  },
  envoy:        { name:"ROYAL ENVOY",            role:"Project · Bridge",       tier:"III",     ac:CYAN,   icon:"✉️", polarity:"light" },
  watcher:      { name:"WATCHER",                role:"Monitor · Read World",   tier:"III",     ac:CYAN,   icon:"👁️", polarity:"dark"  },
  resilience:   { name:"RESILIENCE ARCH.",       role:"Build · Prevent",        tier:"III",     ac:GREEN,  icon:"🏰", polarity:"light" },
  crisis:       { name:"CRISIS COMMANDER",       role:"React · Stabilize",      tier:"III",     ac:GREEN,  icon:"🚨", polarity:"dark"  },
  scout:        { name:"SCOUT",                  role:"Explore · Map Unknown",  tier:"III",     ac:AMBER,  icon:"🧭", polarity:"light" },
  integrator:   { name:"INTEGRATOR",             role:"Pull In · Embed",        tier:"III",     ac:AMBER,  icon:"🔄", polarity:"dark"  },
  pedagogue:    { name:"PEDAGOGUE",              role:"Teach · Spread",         tier:"III",     ac:GREEN,  icon:"🎓", polarity:"light" },
  curator:      { name:"CURATOR",                role:"Capture · Protect",      tier:"III",     ac:GREEN,  icon:"🗄️", polarity:"dark"  },
}

// Grouped for the status grid
const TIER_GROUPS = [
  { label:"I",       ids:["sovereign"],                                                                               ac:GOLD   },
  { label:"COUNCIL", ids:["chancellor","oracle","scribe","devil","truthteller","inspector","visionary"],               ac:AMBER  },
  { label:"II",      ids:["war","economics","justice","shadows","people","herald","builder","philosopher","foreign","continuity","pioneer","knowledge"], ac:CYAN },
  { label:"III",     ids:["tactician","sentinel","trader","auditor","lawmaker","enforcer","analyst","counterintel","recruiter","keeper","writer","historian","architect","engineer","ethicist","inquisitor","envoy","watcher","resilience","crisis","scout","integrator","pedagogue","curator"], ac:PURPLE },
]

// ─── AGENT TAG ────────────────────────────────────────────────────────────────

function AgentTag({ id, pulse }) {
  const m = AGENT_META[id]
  if (!m) return null
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:3,
      background:"rgba(6,6,6,0.8)", border:`1px solid ${pulse ? m.ac : BORDER}`,
      boxShadow: pulse ? `0 0 8px ${m.ac}40` : "none", transition:"all 0.3s" }}>
      <div style={{ width:5, height:5, borderRadius:"50%", background: pulse ? m.ac : TDIM,
        boxShadow: pulse ? `0 0 5px ${m.ac}` : "none", transition:"all 0.3s" }} />
      <span style={{ fontSize:11 }}>{m.icon}</span>
      <span style={{ ...mono, fontSize:8, color: pulse ? m.ac : TDIM, letterSpacing:"0.12em" }}>{m.name}</span>
    </div>
  )
}

// ─── RESPONSE CARD ────────────────────────────────────────────────────────────

function ResponseCard({ event }) {
  const m = AGENT_META[event.agentId || event.operativeId]
  const isSynthesis = event.type === "synthesis"
  const ac = m?.ac || GOLD

  return (
    <div style={{ borderRadius:4, border:`1px solid ${isSynthesis ? BGOLD : BORDER}`,
      background: isSynthesis ? "rgba(212,151,12,0.05)" : "rgba(20,20,20,0.8)",
      overflow:"hidden", marginBottom:10 }}>
      {/* Header */}
      <div style={{ padding:"8px 14px", borderBottom:`1px solid ${isSynthesis ? BGOLD : BORDER}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background: isSynthesis ? "rgba(212,151,12,0.08)" : "rgba(255,255,255,0.02)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:22, height:22, border:`1px solid ${ac}`, borderRadius:3,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
            {m?.icon || "?"}
          </div>
          <span style={{ ...mono, fontWeight:700, fontSize:11, color:TPRI, letterSpacing:"0.12em" }}>{event.name || m?.name}</span>
          {m?.polarity && (
            <span style={{ fontSize:7, ...mono, letterSpacing:"0.5px", padding:"1px 4px", borderRadius:1,
              background:m.polarity==="light"?"rgba(255,220,100,0.08)":"rgba(120,80,200,0.1)",
              border:`1px solid ${m.polarity==="light"?"rgba(255,220,100,0.25)":"rgba(120,80,200,0.25)"}`,
              color:m.polarity==="light"?"#FFD860":"#AA80FF" }}>
              {m.polarity==="light"?"☀":"🌑"}
            </span>
          )}
          {isSynthesis && (
            <span style={{ ...mono, fontSize:8, color:GOLD, border:`1px solid ${BGOLD}`,
              padding:"1px 6px", borderRadius:2, letterSpacing:"0.1em" }}>SYNTHESIS</span>
          )}
          {event.type === "delegate" && (
            <span style={{ ...mono, fontSize:8, color:TDIM, border:`1px solid ${BORDER}`,
              padding:"1px 6px", borderRadius:2, letterSpacing:"0.1em" }}>
              TIER {m?.tier || "?"}
            </span>
          )}
        </div>
        <span style={{ ...mono, fontSize:8, color:TDIM }}>{m?.role}</span>
      </div>
      {/* Content */}
      <div style={{ padding:"12px 14px", ...mono, fontSize:11, color:TSUB, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
        {event.content}
      </div>
    </div>
  )
}

// ─── STATUS GRID ─────────────────────────────────────────────────────────────

function StatusGrid({ activeAgents, events }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {TIER_GROUPS.map(group => (
        <div key={group.label}>
          <div style={{ ...mono, fontSize:7, color:group.ac, letterSpacing:"0.15em", marginBottom:3, opacity:0.7 }}>
            TIER {group.label}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
            {group.ids.map(id => {
              const active   = activeAgents.includes(id)
              const responded = events.some(e => (e.agentId || e.operativeId) === id)
              const ag = AGENT_META[id]
              return (
                <div key={id} style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 6px",
                  borderRadius:3, background: responded ? `${ag.ac}15` : "transparent",
                  border:`1px solid ${responded ? ag.ac : active ? `${ag.ac}50` : BORDER}`,
                  transition:"all 0.3s" }}>
                  <div style={{ width:4, height:4, borderRadius:"50%",
                    background: responded ? ag.ac : active ? `${ag.ac}70` : BORDER,
                    boxShadow: active ? `0 0 4px ${ag.ac}` : "none",
                    transition:"all 0.3s" }} />
                  <span style={{ fontSize:9 }}>{ag.icon}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── COUNCIL SESSION ──────────────────────────────────────────────────────────

export default function CouncilSession({ primaryOperative, onClose }) {
  const [inp, setInp]           = useState("")
  const [phase, setPhase]       = useState("idle") // idle | running | done
  const [events, setEvents]     = useState([])
  const [activeAgents, setActiveAgents] = useState([])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const bot = useRef(null)
  const m = AGENT_META[primaryOperative]

  useEffect(() => {
    if (bot.current) bot.current.scrollIntoView({ behavior:"smooth" })
  }, [events, activeAgents])

  const sendDirective = async () => {
    if (!inp.trim() || phase === "running") return
    const directive = inp.trim()
    setInp("")
    setPhase("running")
    setEvents([])
    setActiveAgents([primaryOperative])
    setSaved(false)

    try {
      const res = await fetch("/api/council", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        // Support both v3 agentId and v1 operativeId for backward compat
        body: JSON.stringify({ agentId: primaryOperative, operativeId: primaryOperative, directive })
      })

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ""

      const processSSE = (chunk) => {
        const blocks = chunk.split("\n\n")
        for (const block of blocks) {
          const eventMatch = block.match(/^event: (\w+)/)
          const dataMatch  = block.match(/^data: (.+)/m)
          if (!eventMatch || !dataMatch) continue
          try {
            const data = JSON.parse(dataMatch[1])
            handleEvent(eventMatch[1], data)
          } catch {}
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream:true })
        const parts = raw.split("\n\n")
        raw = parts.pop()
        processSSE(parts.join("\n\n"))
      }
      if (raw) processSSE(raw)

    } catch (err) {
      setEvents(e => [...e, { type:"error", name:"SYSTEM", agentId:primaryOperative, content:`ERROR: ${err.message}` }])
    }

    setPhase("done")
    setActiveAgents([])
  }

  const handleEvent = (evtType, data) => {
    if (evtType === "status") {
      if (data.phase === "council" && data.delegates) {
        // resolve delegate IDs from names or pass-through IDs
        const ids = data.delegates.map(n =>
          Object.entries(AGENT_META).find(([k, v]) => v.name === n || k === n)?.[0]
        ).filter(Boolean)
        setActiveAgents(a => [...new Set([...a, ...ids])])
      }
    } else if (evtType === "primary") {
      setEvents(e => [...e, { type:"primary", ...data }])
    } else if (evtType === "delegate") {
      setEvents(e => [...e, { type:"delegate", ...data }])
      const id = data.agentId || data.operativeId
      if (id) setActiveAgents(a => [...new Set([...a, id])])
    } else if (evtType === "synthesis") {
      setEvents(e => [...e, { type:"synthesis", ...data }])
    } else if (evtType === "error") {
      setEvents(e => [...e, { type:"error", name:"SYSTEM", agentId:primaryOperative, content: data.message }])
    }
  }

  const saveSession = async () => {
    if (saving || events.length === 0) return
    setSaving(true)
    const messages = events.map(e => ({ role:"assistant", content:`[${e.name || AGENT_META[e.agentId]?.name}]\n${e.content}` }))
    try {
      const res  = await fetch("/api/log", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          agentId: primaryOperative,
          agentName: m?.name,
          // v1 compat
          operativeId: primaryOperative,
          operativeName: m?.name,
          messages, type:"Conversation", venture:"Kingdom Alpha"
        })
      })
      const data = await res.json()
      setSaved(data.success)
    } catch { setSaved(false) }
    setSaving(false)
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", background:BG }}>

      {/* ── LEFT — Primary Channel ── */}
      <div style={{ width:"42%", display:"flex", flexDirection:"column", borderRight:`1px solid ${BGOLD}` }}>

        {/* Header */}
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BGOLD}`, background:"rgba(200,147,10,0.04)", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, border:`1px solid ${m?.ac || GOLD}`, borderRadius:3,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                {m?.icon}
              </div>
              <div>
                <div style={{ ...mono, fontWeight:700, fontSize:13, color:TPRI, letterSpacing:"0.15em" }}>{m?.name}</div>
                <div style={{ ...mono, fontSize:8, color:TDIM, textTransform:"uppercase" }}>
                  {m?.role} / TIER {m?.tier} / COUNCIL COMMAND
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={saveSession} disabled={saving || events.length === 0}
                style={{ ...mono, fontSize:8, padding:"4px 8px", borderRadius:3, cursor:"pointer",
                  background: saved ? "rgba(0,100,0,0.2)" : "transparent",
                  border:`1px solid ${saved ? "#2A6A2A" : BGOLD}`,
                  color: saved ? "#4CAF50" : saving ? TDIM : GOLDDM }}>
                {saving ? "SAVING..." : saved ? "LOGGED" : "SAVE"}
              </button>
              <button onClick={onClose} style={{ ...mono, fontSize:10, padding:"4px 8px", borderRadius:3,
                background:"transparent", border:`1px solid ${BORDER}`, color:TDIM, cursor:"pointer" }}>✕</button>
            </div>
          </div>
          {/* Active council indicator */}
          <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:5 }}>
            {activeAgents.map(id => <AgentTag key={id} id={id} pulse={phase === "running"} />)}
            {phase === "running" && activeAgents.length === 0 &&
              <span style={{ ...mono, fontSize:8, color:GOLDDM }}>INITIALIZING...</span>}
          </div>
        </div>

        {/* Primary responses */}
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {events.length === 0 && phase === "idle" && (
            <div style={{ textAlign:"center", paddingTop:60 }}>
              <div style={{ ...mono, fontSize:10, color:TDIM, marginBottom:8 }}>COUNCIL SESSION ACTIVE</div>
              <div style={{ ...mono, fontSize:9, color:TDIM, lineHeight:1.8, maxWidth:320, margin:"0 auto" }}>
                Issue a directive. {m?.name} will respond and automatically consult other agents as needed.
              </div>
            </div>
          )}
          {phase === "running" && events.length === 0 && (
            <div style={{ ...mono, fontSize:9, color:GOLDDM, padding:8 }}>{m?.name} PROCESSING...</div>
          )}
          {events.filter(e => e.type === "primary" || e.type === "synthesis" || e.type === "error").map((e, i) => (
            <ResponseCard key={i} event={e} />
          ))}
          {phase === "running" && events.some(e => e.type === "primary") && !events.some(e => e.type === "synthesis") && (
            <div style={{ ...mono, fontSize:9, color:GOLDDM, padding:8 }}>CONSULTING COUNCIL...</div>
          )}
          <div ref={bot} />
        </div>

        {/* Input */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${BGOLD}`, flexShrink:0 }}>
          <div style={{ ...mono, fontSize:8, color:GOLDDM, letterSpacing:"0.15em", marginBottom:6 }}>ISSUE DIRECTIVE</div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={inp} onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendDirective()}
              placeholder="Issue directive to the Council..."
              disabled={phase === "running"}
              style={{ flex:1, background:"rgba(255,255,255,0.03)", border:`1px solid ${BGOLD}`,
                borderRadius:3, padding:"9px 12px", color:TPRI, fontSize:12, outline:"none", ...mono,
                opacity: phase === "running" ? 0.5 : 1 }} />
            <button onClick={sendDirective} disabled={phase === "running"}
              style={{ padding:"9px 16px", background:"rgba(200,147,10,0.12)", border:`1px solid ${BGOLD}`,
                borderRadius:3, color: phase === "running" ? TDIM : GOLD, fontSize:11, ...mono,
                cursor: phase === "running" ? "not-allowed" : "pointer" }}>
              {phase === "running" ? "..." : "SEND"}
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Council Feed ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>

        {/* Header with status grid */}
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BGOLD}`, background:"rgba(0,0,0,0.4)", flexShrink:0 }}>
          <div style={{ ...mono, fontWeight:700, fontSize:11, color:TPRI, letterSpacing:"0.2em", marginBottom:10 }}>
            COUNCIL FEED — 43 AGENTS
          </div>
          <StatusGrid activeAgents={activeAgents} events={events} />
        </div>

        {/* Delegate responses */}
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {events.filter(e => e.type !== "primary" && e.type !== "synthesis").length === 0 && (
            <div style={{ textAlign:"center", paddingTop:60 }}>
              <div style={{ ...mono, fontSize:9, color:TDIM, lineHeight:1.8 }}>
                Delegate responses appear here as the Council is consulted.
              </div>
            </div>
          )}
          {events.filter(e => e.type === "delegate").map((e, i) => (
            <ResponseCard key={i} event={e} />
          ))}
          {phase === "running" && events.some(e => e.type === "delegate") && (
            <div style={{ ...mono, fontSize:9, color:GOLDDM, padding:8 }}>
              {m?.name} SYNTHESIZING COUNCIL INPUT...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
