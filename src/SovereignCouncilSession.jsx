import { useState, useRef, useEffect } from "react"

// ─── PALETTE (matches App.jsx) ────────────────────────────────────────────────
const GOLD   = "#D4970C"
const GOLD2  = "#F0B000"
const GOLDDM = "#A07020"
const CRIM   = "#E02020"
const CYAN   = "#00C8F0"
const AMBER  = "#E06A0A"
const GREEN  = "#60C890"
const PURPLE = "#8855CC"
const TPRI   = "#F2ECD8"
const TSUB   = "#B0A888"
const TDIM   = "#6A6258"
const BG     = "#060606"
const BGCARD = "#141414"
const BORDER = "#2E2E2E"
const BGOLD  = "#5A4418"
const mono   = { fontFamily: "'Courier New', monospace" }

// ─── AGENT META (for the 9 agents that speak in this session) ─────────────────
const AGENT_META = {
  chancellor:  { name: "LORD CHANCELLOR",      icon: "LC", ac: GOLD   },
  oracle:      { name: "THE ORACLE",           icon: "OR", ac: AMBER  },
  scribe:      { name: "ROYAL SCRIBE",         icon: "SC", ac: TSUB   },
  devil:       { name: "DEVIL'S ADVOCATE",     icon: "DA", ac: CRIM   },
  truthteller: { name: "TRUTH-TELLER",         icon: "TT", ac: CYAN   },
  inspector:   { name: "INSPECTOR GENERAL",    icon: "IG", ac: PURPLE },
  visionary:   { name: "THE VISIONARY",        icon: "VI", ac: GOLD2  },
  builder:     { name: "MASTER BUILDER",       icon: "MB", ac: CYAN   },
  knowledge:   { name: "MIN. OF KNOWLEDGE",    icon: "MK", ac: GREEN  },
}

const PHASE_ORDER = ['framing', 'deliberation', 'synthesis', 'artifact']
const PHASE_LABELS = {
  framing:      'FRAMING',
  deliberation: 'DELIBERATION',
  synthesis:    'SYNTHESIS',
  artifact:     'ARTIFACT',
}

const TYPE_META = {
  sop:              { label: 'SOP',    color: GREEN  },
  automation_spec:  { label: 'AUTO',   color: CYAN   },
  executable_code:  { label: 'CODE',   color: AMBER  },
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("kc_token") }
async function authFetch(url, opts = {}) {
  const token = getToken()
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

// ─── COUNCIL FEED CARD ────────────────────────────────────────────────────────
function FeedCard({ event }) {
  const m = AGENT_META[event.agent] || { name: event.name, icon: "??", ac: GOLD }
  const isSynthesis = event.type === 'synthesis'
  const isFrame = event.type === 'frame'

  return (
    <div style={{
      borderRadius: 4,
      border: `1px solid ${isSynthesis ? BGOLD : isFrame ? `${GOLD}40` : BORDER}`,
      background: isSynthesis ? "rgba(212,151,12,0.05)" : "rgba(20,20,20,0.8)",
      overflow: "hidden",
      marginBottom: 10,
    }}>
      <div style={{
        padding: "7px 12px",
        borderBottom: `1px solid ${isSynthesis ? BGOLD : BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: isSynthesis ? "rgba(212,151,12,0.06)" : "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, border: `1px solid ${m.ac}`,
            borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ ...mono, fontSize: 7, color: m.ac }}>{m.icon}</span>
          </div>
          <span style={{ ...mono, fontWeight: 700, fontSize: 10, color: TPRI, letterSpacing: "0.12em" }}>
            {m.name}
          </span>
          {isSynthesis && (
            <span style={{ ...mono, fontSize: 8, color: GOLD, border: `1px solid ${BGOLD}`, padding: "1px 6px", borderRadius: 2 }}>
              SYNTHESIS
            </span>
          )}
          {isFrame && (
            <span style={{ ...mono, fontSize: 8, color: GOLDDM, border: `1px solid ${BGOLD}40`, padding: "1px 6px", borderRadius: 2 }}>
              BRIEF
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: "10px 12px", ...mono, fontSize: 11, color: TSUB, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
        {event.content}
      </div>
    </div>
  )
}

// ─── ARTIFACT PANEL ───────────────────────────────────────────────────────────
function ArtifactPanel({ artifact, onApprove, onReject, storing, stored, isCodeSpec }) {
  if (!artifact) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...mono, fontSize: 9, color: TDIM, letterSpacing: "0.15em" }}>AWAITING SYNTHESIS</div>
        <div style={{ ...mono, fontSize: 8, color: TDIM, marginTop: 6, lineHeight: 1.8 }}>
          The process artifact will appear here once<br />the council completes deliberation.
        </div>
      </div>
    </div>
  )

  if (artifact.parseError) return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      <div style={{ ...mono, fontSize: 9, color: CRIM, marginBottom: 8 }}>ARTIFACT PARSE ERROR — RAW OUTPUT:</div>
      <div style={{ ...mono, fontSize: 10, color: TSUB, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{artifact.raw}</div>
    </div>
  )

  const tm = TYPE_META[artifact.content?.type] || TYPE_META.sop

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header */}
      <div style={{ background: BGCARD, border: `1px solid ${BGOLD}`, borderRadius: 4, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ ...mono, fontSize: 8, fontWeight: 700, color: tm.color, border: `1px solid ${tm.color}40`, padding: "2px 8px", borderRadius: 2, letterSpacing: "0.1em" }}>
            {tm.label}
          </span>
          {artifact.content?.domain && (
            <span style={{ ...mono, fontSize: 8, color: TDIM, border: `1px solid ${BORDER}`, padding: "2px 8px", borderRadius: 2 }}>
              {artifact.content.domain.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ ...mono, fontWeight: 700, fontSize: 14, color: TPRI, letterSpacing: "0.1em", marginBottom: 4 }}>
          {artifact.content?.title}
        </div>
        {artifact.content?.trigger && (
          <div style={{ ...mono, fontSize: 9, color: TDIM }}>
            TRIGGER: {artifact.content.trigger}
          </div>
        )}
        {artifact.content?.estimated_time && (
          <div style={{ ...mono, fontSize: 9, color: TDIM, marginTop: 2 }}>
            EST. TIME: {artifact.content.estimated_time}
          </div>
        )}
      </div>

      {/* Phases + Steps */}
      {artifact.content?.phases?.map(phase => (
        <div key={phase.id} style={{ background: BGCARD, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...mono, fontSize: 8, color: GOLD, border: `1px solid ${BGOLD}`, padding: "1px 6px", borderRadius: 2 }}>
              PHASE {phase.id}
            </span>
            <span style={{ ...mono, fontWeight: 700, fontSize: 10, color: TPRI, letterSpacing: "0.1em" }}>
              {phase.name?.toUpperCase()}
            </span>
          </div>
          {phase.objective && (
            <div style={{ padding: "6px 14px", ...mono, fontSize: 9, color: TDIM, borderBottom: `1px solid ${BORDER}` }}>
              {phase.objective}
            </div>
          )}
          <div style={{ padding: "8px 0" }}>
            {phase.steps?.map(step => {
              const isAuto = step.owner === 'automated'
              return (
                <div key={step.id} style={{
                  padding: "7px 14px", display: "flex", alignItems: "flex-start", gap: 10,
                  borderBottom: `1px solid ${BORDER}20`,
                }}>
                  <span style={{ ...mono, fontSize: 9, color: TDIM, flexShrink: 0, width: 24 }}>{step.id}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...mono, fontSize: 10, color: TPRI, lineHeight: 1.5 }}>{step.action}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{
                        ...mono, fontSize: 8,
                        color: isAuto ? CYAN : GOLD,
                        border: `1px solid ${isAuto ? `${CYAN}40` : `${GOLD}40`}`,
                        padding: "1px 6px", borderRadius: 2,
                      }}>
                        {isAuto ? "AUTOMATED" : "HUMAN"}
                      </span>
                      {step.tool && (
                        <span style={{ ...mono, fontSize: 8, color: TDIM, border: `1px solid ${BORDER}`, padding: "1px 6px", borderRadius: 2 }}>
                          {step.tool}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Automations */}
      {artifact.content?.automations?.length > 0 && (
        <div style={{ background: BGCARD, border: `1px solid ${CYAN}30`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${CYAN}30`, background: "rgba(0,200,240,0.03)" }}>
            <span style={{ ...mono, fontWeight: 700, fontSize: 10, color: CYAN, letterSpacing: "0.1em" }}>AUTOMATIONS</span>
          </div>
          {artifact.content.automations.map((a, i) => (
            <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ ...mono, fontSize: 8, color: CYAN, border: `1px solid ${CYAN}40`, padding: "1px 6px", borderRadius: 2 }}>
                  STEP {a.step}
                </span>
                <span style={{ ...mono, fontSize: 8, color: TDIM }}>{a.platform?.toUpperCase()}</span>
              </div>
              <div style={{ ...mono, fontSize: 10, color: TSUB, lineHeight: 1.6, marginBottom: 4 }}>{a.description}</div>
              {a.spec && (
                <div style={{ ...mono, fontSize: 9, color: TDIM, lineHeight: 1.6, marginTop: 4, whiteSpace: "pre-wrap" }}>{a.spec}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Success Criteria */}
      {artifact.content?.success_criteria?.length > 0 && (
        <div style={{ background: BGCARD, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "12px 14px" }}>
          <div style={{ ...mono, fontSize: 9, color: GOLDDM, letterSpacing: "0.12em", marginBottom: 8 }}>SUCCESS CRITERIA</div>
          {artifact.content.success_criteria.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ color: GREEN, fontSize: 8, marginTop: 2 }}>◆</span>
              <span style={{ ...mono, fontSize: 10, color: TSUB }}>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Approve / Reject */}
      {!stored && (
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button
            onClick={onApprove}
            disabled={storing}
            style={{
              flex: 1, padding: "10px", borderRadius: 3,
              background: "rgba(96,200,144,0.12)", border: "1px solid rgba(96,200,144,0.4)",
              color: storing ? TDIM : GREEN, ...mono, fontSize: 10, cursor: storing ? "not-allowed" : "pointer",
              letterSpacing: "0.12em",
            }}
          >
            {storing ? (isCodeSpec ? "STORING..." : "STORING...") : (isCodeSpec ? "✓ APPROVE & BUILD" : "✓ APPROVE & STORE")}
          </button>
          <button
            onClick={onReject}
            disabled={storing}
            style={{
              padding: "10px 18px", borderRadius: 3,
              background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.3)",
              color: CRIM, ...mono, fontSize: 10, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {stored && (
        <div style={{
          padding: "12px", borderRadius: 3, textAlign: "center",
          background: "rgba(96,200,144,0.08)", border: "1px solid rgba(96,200,144,0.3)",
        }}>
          <div style={{ ...mono, fontSize: 10, color: GREEN, letterSpacing: "0.12em" }}>✓ STORED IN PROCESS LIBRARY</div>
        </div>
      )}

    </div>
  )
}

// ─── PHASE PROGRESS BAR ───────────────────────────────────────────────────────
function PhaseBar({ currentPhase }) {
  return (
    <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
      {PHASE_ORDER.map((p, i) => {
        const idx = PHASE_ORDER.indexOf(currentPhase)
        const done = idx > i
        const active = idx === i
        return (
          <div key={p} style={{
            flex: 1, padding: "6px 12px", textAlign: "center",
            background: active ? "rgba(212,151,12,0.1)" : done ? "rgba(96,200,144,0.05)" : "transparent",
            borderRight: i < PHASE_ORDER.length - 1 ? `1px solid ${BGOLD}` : "none",
            borderBottom: `2px solid ${active ? GOLD : done ? GREEN : BORDER}`,
            transition: "all 0.3s",
          }}>
            <span style={{
              ...mono, fontSize: 8, letterSpacing: "0.12em",
              color: active ? GOLD : done ? GREEN : TDIM,
            }}>
              {done ? "✓ " : active ? "● " : ""}{PHASE_LABELS[p]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SovereignCouncilSession({ onClose, onStore }) {
  const [problem, setProblem] = useState("")
  const [phase, setPhase] = useState("idle") // idle | framing | deliberation | synthesis | artifact | done | error
  const [events, setEvents] = useState([])
  const [artifact, setArtifact] = useState(null)
  const [transcriptData, setTranscriptData] = useState([])
  const [statusMsg, setStatusMsg] = useState("")
  const [storing, setStoring] = useState(false)
  const [stored, setStored] = useState(false)
  const feedBot = useRef(null)

  useEffect(() => {
    if (feedBot.current) feedBot.current.scrollIntoView({ behavior: "smooth" })
  }, [events])

  const convene = async () => {
    if (!problem.trim() || phase === "running") return
    setEvents([])
    setArtifact(null)
    setStored(false)
    setPhase("framing")
    setStatusMsg("Lord Chancellor is framing the session...")
    setTranscriptData([])

    try {
      const res = await authFetch("/api/sovereign-council", {
        method: "POST",
        body: JSON.stringify({ problem: problem.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        setStatusMsg(`ERROR: ${err.error}`)
        setPhase("error")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ""

      const processSSE = (chunk) => {
        const blocks = chunk.split("\n\n")
        for (const block of blocks) {
          const evtMatch = block.match(/^event: (\w+)/m)
          const dataMatch = block.match(/^data: (.+)/m)
          if (!evtMatch || !dataMatch) continue
          const evtType = evtMatch[1]
          try {
            const data = JSON.parse(dataMatch[1])
            handleEvent(evtType, data)
          } catch {}
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
        const parts = raw.split("\n\n")
        raw = parts.pop()
        processSSE(parts.join("\n\n"))
      }
      if (raw) processSSE(raw)

    } catch (err) {
      setStatusMsg(`CONNECTION ERROR: ${err.message}`)
      setPhase("error")
    }
  }

  const handleEvent = (evtType, data) => {
    if (evtType === "status") {
      setPhase(data.phase)
      setStatusMsg(data.message || "")
    } else if (evtType === "frame") {
      setEvents(e => [...e, { type: "frame", ...data }])
    } else if (evtType === "council") {
      setEvents(e => [...e, { type: "council", ...data }])
    } else if (evtType === "synthesis") {
      setEvents(e => [...e, { type: "synthesis", ...data }])
    } else if (evtType === "artifact") {
      setArtifact(data)
    } else if (evtType === "done") {
      setPhase("done")
      setStatusMsg("")
      if (data.transcript) setTranscriptData(data.transcript)
    } else if (evtType === "error") {
      setStatusMsg(`ERROR: ${data.message}`)
      setPhase("error")
    }
  }

  const handleApprove = async () => {
    if (!artifact?.content || storing) return
    setStoring(true)
    try {
      const res = await authFetch("/api/processes", {
        method: "POST",
        body: JSON.stringify({
          title: artifact.content.title || artifact.title,
          type: artifact.content.type || artifact.type,
          domain: artifact.content.domain || artifact.domain,
          problem: artifact.content.problem || problem,
          artifact: artifact.content,
          transcript: transcriptData,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStored(true)
        if (onStore) onStore(data.process)
      }
    } catch {}
    setStoring(false)
  }

  const handleReject = () => {
    setArtifact(null)
    setPhase("idle")
    setEvents([])
    setStatusMsg("")
  }

  const isRunning = !["idle", "done", "error"].includes(phase)
  const showPhaseBar = phase !== "idle"

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", background: BG }}>

      {/* HEADER */}
      <div style={{ flexShrink: 0, padding: "14px 20px", borderBottom: `1px solid ${BGOLD}`, background: "rgba(200,147,10,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, filter: `drop-shadow(0 0 8px ${GOLD}80)` }}>♛</span>
          <div>
            <div style={{ ...mono, fontWeight: 700, fontSize: 13, color: TPRI, letterSpacing: "0.2em" }}>SOVEREIGN'S COUNCIL</div>
            <div style={{ ...mono, fontSize: 8, color: TDIM, letterSpacing: "0.15em" }}>
              PROCESS INTELLIGENCE SYSTEM · 43 AGENTS
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ ...mono, fontSize: 10, padding: "5px 12px", borderRadius: 3, background: "transparent", border: `1px solid ${BORDER}`, color: TDIM, cursor: "pointer" }}>
          ✕ CLOSE
        </button>
      </div>

      {/* PHASE BAR */}
      {showPhaseBar && <PhaseBar currentPhase={phase === "done" ? "artifact" : phase} />}

      {/* PROBLEM INPUT (shown when idle or done) */}
      <div style={{
        flexShrink: 0, padding: "14px 20px",
        borderBottom: `1px solid ${BGOLD}`,
        background: "rgba(0,0,0,0.3)",
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <div style={{ flex: 1 }}>
          {!isRunning && (
            <div style={{ ...mono, fontSize: 8, color: GOLDDM, letterSpacing: "0.15em", marginBottom: 6 }}>
              STATE THE UNDERTAKING
            </div>
          )}
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            disabled={isRunning}
            placeholder="Describe the problem, task, or undertaking you want the Council to build a process for..."
            rows={isRunning ? 1 : 3}
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)",
              border: `1px solid ${BGOLD}`, borderRadius: 3,
              padding: "9px 12px", color: TPRI, fontSize: 12,
              outline: "none", resize: "none", ...mono,
              opacity: isRunning ? 0.6 : 1,
              transition: "all 0.3s",
            }}
          />
        </div>
        <button
          onClick={convene}
          disabled={isRunning || !problem.trim()}
          style={{
            padding: "9px 20px", borderRadius: 3, flexShrink: 0,
            background: isRunning ? "transparent" : "rgba(200,147,10,0.15)",
            border: `1px solid ${isRunning ? BORDER : BGOLD}`,
            color: isRunning ? TDIM : GOLD, ...mono, fontSize: 10,
            cursor: isRunning || !problem.trim() ? "not-allowed" : "pointer",
            letterSpacing: "0.1em", marginTop: isRunning ? 0 : 22,
          }}
        >
          {isRunning ? "IN SESSION..." : phase === "done" ? "NEW SESSION" : "CONVENE COUNCIL"}
        </button>
      </div>

      {/* STATUS LINE */}
      {(isRunning || phase === "error") && statusMsg && (
        <div style={{
          flexShrink: 0, padding: "6px 20px",
          background: phase === "error" ? "rgba(224,32,32,0.08)" : "rgba(200,147,10,0.06)",
          borderBottom: `1px solid ${phase === "error" ? `${CRIM}40` : BGOLD}40`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {phase !== "error" && (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
          )}
          <span style={{ ...mono, fontSize: 9, color: phase === "error" ? CRIM : GOLDDM, letterSpacing: "0.1em" }}>
            {statusMsg}
          </span>
        </div>
      )}

      {/* MAIN CONTENT: two-panel layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — Council Deliberation Feed */}
        <div style={{ width: "45%", display: "flex", flexDirection: "column", borderRight: `1px solid ${BGOLD}` }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <span style={{ ...mono, fontWeight: 700, fontSize: 9, color: TSUB, letterSpacing: "0.18em" }}>
              COUNCIL DELIBERATION
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {events.length === 0 && phase === "idle" && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ ...mono, fontSize: 9, color: TDIM, lineHeight: 1.9, maxWidth: 280, margin: "0 auto" }}>
                  State your undertaking above and convene the Council.<br /><br />
                  The Lord Chancellor will frame the problem. The Inner Council will deliberate. The Master Builder will design the process. The Minister of Knowledge will produce the artifact.
                </div>
              </div>
            )}
            {events.length === 0 && isRunning && (
              <div style={{ ...mono, fontSize: 9, color: GOLDDM, padding: 8 }}>
                INITIALIZING COUNCIL SESSION...
              </div>
            )}
            {events.map((e, i) => <FeedCard key={i} event={e} />)}
            <div ref={feedBot} />
          </div>
        </div>

        {/* RIGHT — Process Artifact */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...mono, fontWeight: 700, fontSize: 9, color: TSUB, letterSpacing: "0.18em" }}>
              PROCESS ARTIFACT
            </span>
            {artifact?.content?.type && (
              <span style={{
                ...mono, fontSize: 8,
                color: TYPE_META[artifact.content.type]?.color || GOLD,
                border: `1px solid ${TYPE_META[artifact.content.type]?.color || GOLD}40`,
                padding: "2px 8px", borderRadius: 2, letterSpacing: "0.1em",
              }}>
                {TYPE_META[artifact.content.type]?.label || artifact.content.type.toUpperCase()}
              </span>
            )}
          </div>
          <ArtifactPanel
            artifact={artifact}
            onApprove={handleApprove}
            onReject={handleReject}
            storing={storing}
            stored={stored}
            isCodeSpec={artifact?.content?.type === "code_spec"}
          />
        </div>

      </div>
    </div>
  )
}
