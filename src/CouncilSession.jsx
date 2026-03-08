import { useState, useRef, useEffect } from "react"

const GOLD="#D4970C", GOLD2="#F0B000", GOLDDM="#A07020"
const CRIM="#E02020", CYAN="#00C8F0", AMBER="#E06A0A"
const TPRI="#F2ECD8", TSUB="#B0A888", TDIM="#6A6258"
const BG="#060606", BGCARD="#141414", BORDER="#2E2E2E"
const BGOLD="#5A4418", BCRIM="#4A1818"
const mono = { fontFamily:"'Courier New', monospace" }

const OPERATIVE_META = {
  cipher:    { name:"THE CIPHER",    role:"Chief of Staff",     ac:GOLD,  icon:"S"  },
  vault:     { name:"THE VAULT",     role:"CFO",                ac:GOLD2, icon:"V"  },
  oracle:    { name:"THE ORACLE",    role:"Chief Strategist",   ac:AMBER, icon:"O"  },
  shadow:    { name:"THE SHADOW",    role:"Chief Intelligence", ac:CRIM,  icon:"I"  },
  commander: { name:"COMMANDER",     role:"COO",                ac:CYAN,  icon:"C"  },
  director:  { name:"DIRECTOR",      role:"CMO",                ac:GOLD,  icon:"D"  },
  marshal:   { name:"MARSHAL",       role:"CRO",                ac:AMBER, icon:"M"  },
  operator:  { name:"OPERATOR",      role:"Creative Director",  ac:GOLD,  icon:"CR" },
  scriptor:  { name:"SCRIPTOR",      role:"Content & Copy",     ac:TSUB,  icon:"W"  },
  lens:      { name:"LENS",          role:"Visual Production",  ac:CYAN,  icon:"L"  },
  vanguard:  { name:"VANGUARD",      role:"Ad Strategy",        ac:AMBER, icon:"VG" },
  signal:    { name:"SIGNAL",        role:"Social Broadcast",   ac:GOLD,  icon:"SG" },
  reel:      { name:"REEL",          role:"Video Production",   ac:CRIM,  icon:"RL" },
  broker:    { name:"THE BROKER",    role:"Deal Executor",      ac:GOLD,  icon:"BK" },
  warden:    { name:"THE WARDEN",    role:"People & Culture",   ac:TSUB,  icon:"WD" },
  architect: { name:"THE ARCHITECT", role:"Systems Builder",    ac:CYAN,  icon:"AR" },
}

function OperativeTag({ id, pulse }) {
  const m = OPERATIVE_META[id]
  if (!m) return null
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:3,
      background:`rgba(6,6,6,0.8)`, border:`1px solid ${pulse ? m.ac : BORDER}`,
      boxShadow: pulse ? `0 0 8px ${m.ac}40` : "none", transition:"all 0.3s" }}>
      <div style={{ width:5, height:5, borderRadius:"50%", background: pulse ? m.ac : TDIM,
        boxShadow: pulse ? `0 0 5px ${m.ac}` : "none", transition:"all 0.3s" }} />
      <span style={{ ...mono, fontSize:8, color: pulse ? m.ac : TDIM, letterSpacing:"0.12em" }}>{m.name}</span>
    </div>
  )
}

function ResponseCard({ event }) {
  const m = OPERATIVE_META[event.operativeId]
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
          <div style={{ width:20, height:20, border:`1px solid ${ac}`, borderRadius:3,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ ...mono, fontSize:7, color:ac }}>{m?.icon || "?"}</span>
          </div>
          <span style={{ ...mono, fontWeight:700, fontSize:11, color:TPRI, letterSpacing:"0.12em" }}>{event.name}</span>
          {isSynthesis && <span style={{ ...mono, fontSize:8, color:GOLD, border:`1px solid ${BGOLD}`,
            padding:"1px 6px", borderRadius:2, letterSpacing:"0.1em" }}>SYNTHESIS</span>}
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

export default function CouncilSession({ primaryOperative, onClose }) {
  const [inp, setInp] = useState("")
  const [phase, setPhase] = useState("idle") // idle | running | done
  const [events, setEvents] = useState([])
  const [activeOps, setActiveOps] = useState([])
  const [history, setHistory] = useState([]) // past directives + results
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const bot = useRef(null)
  const m = OPERATIVE_META[primaryOperative]

  useEffect(() => {
    if (bot.current) bot.current.scrollIntoView({ behavior:"smooth" })
  }, [events, activeOps])

  const sendDirective = async () => {
    if (!inp.trim() || phase === "running") return
    const directive = inp.trim()
    setInp("")
    setPhase("running")
    setEvents([])
    setActiveOps([primaryOperative])
    setSaved(false)

    try {
      const res = await fetch("/api/council", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ operativeId: primaryOperative, directive })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream:true })
        const lines = buffer.split("\n")
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim()
            const dataLine = lines[lines.indexOf(line) + 1]
            if (dataLine?.startsWith("data: ")) {
              try {
                const data = JSON.parse(dataLine.slice(6))
                handleEvent(eventType, data)
              } catch {}
            }
          } else if (line.startsWith("data: ")) {
            // handle combined lines
          }
        }
      }

      // Re-parse properly using SSE format
      setPhase("done")
    } catch (err) {
      setEvents(e => [...e, { type:"error", name:"SYSTEM", operativeId: primaryOperative, content:`CONNECTION LOST: ${err.message}` }])
      setPhase("done")
    }
  }

  // Better SSE parsing
  const sendDirectiveSSE = async () => {
    if (!inp.trim() || phase === "running") return
    const directive = inp.trim()
    setInp("")
    setPhase("running")
    setEvents([])
    setActiveOps([primaryOperative])
    setSaved(false)

    const newEntry = { directive, responses: [] }

    try {
      const res = await fetch("/api/council", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ operativeId: primaryOperative, directive })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ""

      const processSSE = (chunk) => {
        const blocks = chunk.split("\n\n")
        for (const block of blocks) {
          const eventMatch = block.match(/^event: (\w+)/)
          const dataMatch = block.match(/^data: (.+)/m)
          if (!eventMatch || !dataMatch) continue
          const evtType = eventMatch[1]
          try {
            const data = JSON.parse(dataMatch[1])
            handleEvent(evtType, data, newEntry)
          } catch {}
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream:true })
        // Process complete SSE blocks
        const parts = raw.split("\n\n")
        raw = parts.pop() // keep incomplete block
        processSSE(parts.join("\n\n"))
      }
      if (raw) processSSE(raw)

    } catch (err) {
      setEvents(e => [...e, { type:"error", name:"SYSTEM", operativeId: primaryOperative, content:`ERROR: ${err.message}` }])
    }

    setPhase("done")
    setActiveOps([])
    setHistory(h => [...h, { directive, responses: [...events] }])
  }

  const handleEvent = (evtType, data, entry) => {
    if (evtType === "status") {
      if (data.phase === "council" && data.delegates) {
        setActiveOps([primaryOperative, ...data.delegates.map(n =>
          Object.entries(OPERATIVE_META).find(([,v]) => v.name === n)?.[0]
        ).filter(Boolean)])
      }
    } else if (evtType === "primary") {
      setEvents(e => [...e, { type:"primary", ...data }])
    } else if (evtType === "delegate") {
      setEvents(e => [...e, { type:"delegate", ...data }])
      setActiveOps(ops => [...new Set([...ops, data.operativeId])])
    } else if (evtType === "synthesis") {
      setEvents(e => [...e, { type:"synthesis", ...data }])
    } else if (evtType === "error") {
      setEvents(e => [...e, { type:"error", name:"SYSTEM", operativeId: primaryOperative, content: data.message }])
    }
  }

  const saveSession = async () => {
    if (saving || events.length === 0) return
    setSaving(true)
    const messages = [
      { role:"user", content: inp || "Council session" },
      ...events.map(e => ({ role:"assistant", content:`[${e.name}]\n${e.content}` }))
    ]
    try {
      const res = await fetch("/api/log", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ operativeId: primaryOperative, operativeName: m?.name, messages, type:"Conversation", venture:"Kingdom Alpha" })
      })
      const data = await res.json()
      setSaved(data.success)
    } catch { setSaved(false) }
    setSaving(false)
  }

  const allOps = Object.keys(OPERATIVE_META)

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", background:BG }}>

      {/* LEFT — Primary Operative Channel */}
      <div style={{ width:"42%", display:"flex", flexDirection:"column", borderRight:`1px solid ${BGOLD}` }}>
        {/* Header */}
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BGOLD}`, background:"rgba(200,147,10,0.04)", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:28, height:28, border:`1px solid ${m?.ac || GOLD}`, borderRadius:3,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ ...mono, fontSize:9, color:m?.ac || GOLD }}>{m?.icon}</span>
              </div>
              <div>
                <div style={{ ...mono, fontWeight:700, fontSize:13, color:TPRI, letterSpacing:"0.15em" }}>{m?.name}</div>
                <div style={{ ...mono, fontSize:8, color:TDIM, textTransform:"uppercase" }}>{m?.role} / COUNCIL COMMAND</div>
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
                background:"transparent", border:`1px solid ${BORDER}`, color:TDIM, cursor:"pointer" }}>X</button>
            </div>
          </div>
          {/* Active council indicator */}
          <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:5 }}>
            {activeOps.map(id => <OperativeTag key={id} id={id} pulse={phase === "running"} />)}
            {phase === "running" && activeOps.length === 0 &&
              <span style={{ ...mono, fontSize:8, color:GOLDDM }}>INITIALIZING...</span>}
          </div>
        </div>

        {/* Primary response area */}
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {events.length === 0 && phase === "idle" && (
            <div style={{ textAlign:"center", paddingTop:60 }}>
              <div style={{ ...mono, fontSize:10, color:TDIM, marginBottom:8 }}>COUNCIL SESSION ACTIVE</div>
              <div style={{ ...mono, fontSize:9, color:TDIM, lineHeight:1.8, maxWidth:320, margin:"0 auto" }}>
                Issue a directive below. {m?.name} will respond and automatically consult other operatives as needed.
              </div>
            </div>
          )}
          {phase === "running" && events.length === 0 && (
            <div style={{ ...mono, fontSize:9, color:GOLDDM, padding:8 }}>
              {m?.name} IS PROCESSING...
            </div>
          )}
          {events.filter(e => e.type === "primary" || e.type === "synthesis" || e.type === "error").map((e, i) => (
            <ResponseCard key={i} event={e} />
          ))}
          {phase === "running" && events.some(e => e.type === "primary") && !events.some(e => e.type === "synthesis") && (
            <div style={{ ...mono, fontSize:9, color:GOLDDM, padding:8 }}>
              CONSULTING COUNCIL...
            </div>
          )}
          <div ref={bot} />
        </div>

        {/* Input */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${BGOLD}`, flexShrink:0 }}>
          <div style={{ ...mono, fontSize:8, color:GOLDDM, letterSpacing:"0.15em", marginBottom:6 }}>ISSUE DIRECTIVE</div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={inp} onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendDirectiveSSE()}
              placeholder="Issue directive to the Council..."
              disabled={phase === "running"}
              style={{ flex:1, background:"rgba(255,255,255,0.03)", border:`1px solid ${BGOLD}`,
                borderRadius:3, padding:"9px 12px", color:TPRI, fontSize:12, outline:"none", ...mono,
                opacity: phase === "running" ? 0.5 : 1 }} />
            <button onClick={sendDirectiveSSE} disabled={phase === "running"}
              style={{ padding:"9px 16px", background:"rgba(200,147,10,0.12)", border:`1px solid ${BGOLD}`,
                borderRadius:3, color: phase === "running" ? TDIM : GOLD, fontSize:11, ...mono,
                cursor: phase === "running" ? "not-allowed" : "pointer" }}>
              {phase === "running" ? "..." : "SEND"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT — Council Feed */}
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BGOLD}`, background:"rgba(0,0,0,0.4)", flexShrink:0 }}>
          <div style={{ ...mono, fontWeight:700, fontSize:11, color:TPRI, letterSpacing:"0.2em", marginBottom:6 }}>
            COUNCIL FEED
          </div>
          {/* All operatives status grid */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {allOps.map(id => {
              const active = activeOps.includes(id)
              const responded = events.some(e => e.operativeId === id)
              const op = OPERATIVE_META[id]
              return (
                <div key={id} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 7px",
                  borderRadius:3, background: responded ? `${op.ac}15` : "transparent",
                  border:`1px solid ${responded ? op.ac : active ? `${op.ac}60` : BORDER}`,
                  transition:"all 0.3s" }}>
                  <div style={{ width:4, height:4, borderRadius:"50%",
                    background: responded ? op.ac : active ? `${op.ac}80` : BORDER,
                    boxShadow: active ? `0 0 4px ${op.ac}` : "none",
                    transition:"all 0.3s" }} />
                  <span style={{ ...mono, fontSize:7, color: responded ? op.ac : active ? `${op.ac}80` : TDIM,
                    letterSpacing:"0.1em" }}>{op.icon}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Delegate responses */}
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {events.length === 0 && (
            <div style={{ textAlign:"center", paddingTop:60 }}>
              <div style={{ ...mono, fontSize:9, color:TDIM, lineHeight:1.8 }}>
                Operative responses will appear here as the Council is consulted.
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
