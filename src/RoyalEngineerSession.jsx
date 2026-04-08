import { useState, useRef, useEffect } from "react"

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const GOLD   = "#D4970C"
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

function getToken() { return localStorage.getItem("kc_token") }
async function authFetch(url, opts = {}) {
  const token = getToken()
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
}

const PHASES = ['reading', 'planning', 'engineering', 'done']
const PHASE_LABELS = { reading: 'READING', planning: 'PLANNING', engineering: 'ENGINEERING', done: 'REVIEW' }

// ─── PHASE BAR ────────────────────────────────────────────────────────────────
function PhaseBar({ phase }) {
  return (
    <div style={{ display: "flex", flexShrink: 0 }}>
      {PHASES.map((p, i) => {
        const idx = PHASES.indexOf(phase === 'done' ? 'done' : phase)
        const done = idx > i
        const active = idx === i || (phase === 'done' && p === 'done')
        return (
          <div key={p} style={{ flex: 1, padding: "6px 10px", textAlign: "center",
            background: active ? "rgba(212,151,12,0.1)" : done ? "rgba(96,200,144,0.05)" : "transparent",
            borderRight: i < PHASES.length - 1 ? `1px solid ${BGOLD}` : "none",
            borderBottom: `2px solid ${active ? GOLD : done ? GREEN : BORDER}`, transition: "all 0.3s" }}>
            <span style={{ ...mono, fontSize: 8, letterSpacing: "0.12em", color: active ? GOLD : done ? GREEN : TDIM }}>
              {done ? "✓ " : active ? "● " : ""}{PHASE_LABELS[p]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── CODE VIEWER ─────────────────────────────────────────────────────────────
function CodeViewer({ file }) {
  if (!file) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...mono, fontSize: 9, color: TDIM }}>SELECT A FILE TO VIEW</span>
    </div>
  )
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#080808" }}>
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8, background: BGCARD }}>
        <span style={{ ...mono, fontSize: 8, color: file.action === 'create' ? GREEN : AMBER,
          border: `1px solid ${file.action === 'create' ? `${GREEN}40` : `${AMBER}40`}`, padding: "1px 6px", borderRadius: 2 }}>
          {file.action === 'create' ? 'NEW' : 'MODIFIED'}
        </span>
        <span style={{ ...mono, fontSize: 10, color: TPRI }}>{file.path}</span>
        <span style={{ ...mono, fontSize: 8, color: TDIM, marginLeft: "auto" }}>
          {file.content ? `${file.content.split('\n').length} lines` : 'generating...'}
        </span>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", ...mono, fontSize: 11, color: TSUB, lineHeight: 1.7,
        whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {file.content || <span style={{ color: GOLDDM }}>Engineer is writing this file...</span>}
      </pre>
    </div>
  )
}

// ─── SPEC OVERVIEW ───────────────────────────────────────────────────────────
function SpecOverview({ codeSpec, planContent, statusMsg, filesRead }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Title + complexity */}
      <div style={{ background: BGCARD, border: `1px solid ${BGOLD}`, borderRadius: 4, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
        <div style={{ ...mono, fontSize: 8, color: GOLDDM, letterSpacing: "0.12em", marginBottom: 4 }}>BUILDING</div>
        <div style={{ ...mono, fontWeight: 700, fontSize: 13, color: TPRI, marginBottom: 6 }}>{codeSpec.title}</div>
        <div style={{ ...mono, fontSize: 9, color: TSUB, lineHeight: 1.7 }}>{codeSpec.problem}</div>
        {codeSpec.estimated_complexity && (
          <div style={{ marginTop: 8, display: "inline-block", ...mono, fontSize: 8,
            color: codeSpec.estimated_complexity === 'high' ? CRIM : codeSpec.estimated_complexity === 'medium' ? AMBER : GREEN,
            border: `1px solid currentColor`, padding: "1px 8px", borderRadius: 2 }}>
            {codeSpec.estimated_complexity.toUpperCase()} COMPLEXITY
          </div>
        )}
      </div>

      {/* Files to create */}
      {codeSpec.files_to_create?.length > 0 && (
        <div style={{ background: BGCARD, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "7px 12px", borderBottom: `1px solid ${BORDER}`, background: "rgba(96,200,144,0.04)" }}>
            <span style={{ ...mono, fontSize: 8, color: GREEN, letterSpacing: "0.12em" }}>NEW FILES ({codeSpec.files_to_create.length})</span>
          </div>
          {codeSpec.files_to_create.map((f, i) => (
            <div key={i} style={{ padding: "8px 12px", borderBottom: i < codeSpec.files_to_create.length - 1 ? `1px solid ${BORDER}20` : "none" }}>
              <div style={{ ...mono, fontSize: 10, color: GREEN, marginBottom: 3 }}>{f.path}</div>
              <div style={{ ...mono, fontSize: 9, color: TDIM, lineHeight: 1.6 }}>{f.purpose}</div>
            </div>
          ))}
        </div>
      )}

      {/* Files to modify */}
      {codeSpec.files_to_modify?.length > 0 && (
        <div style={{ background: BGCARD, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "7px 12px", borderBottom: `1px solid ${BORDER}`, background: "rgba(224,106,10,0.04)" }}>
            <span style={{ ...mono, fontSize: 8, color: AMBER, letterSpacing: "0.12em" }}>MODIFIED FILES ({codeSpec.files_to_modify.length})</span>
          </div>
          {codeSpec.files_to_modify.map((f, i) => (
            <div key={i} style={{ padding: "8px 12px", borderBottom: i < codeSpec.files_to_modify.length - 1 ? `1px solid ${BORDER}20` : "none" }}>
              <div style={{ ...mono, fontSize: 10, color: AMBER, marginBottom: 3 }}>{f.path}</div>
              <div style={{ ...mono, fontSize: 9, color: TDIM, lineHeight: 1.6 }}>{f.change_summary}</div>
            </div>
          ))}
        </div>
      )}

      {/* New env vars */}
      {codeSpec.new_env_vars?.length > 0 && (
        <div style={{ background: BGCARD, border: `1px solid ${PURPLE}40`, borderRadius: 4, padding: "10px 12px" }}>
          <div style={{ ...mono, fontSize: 8, color: PURPLE, letterSpacing: "0.12em", marginBottom: 6 }}>NEW ENV VARS REQUIRED</div>
          {codeSpec.new_env_vars.map((v, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <span style={{ ...mono, fontSize: 9, color: TPRI }}>{v.name}</span>
              <span style={{ ...mono, fontSize: 9, color: TDIM }}> — {v.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Files read */}
      {filesRead.length > 0 && (
        <div style={{ background: BGCARD, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "10px 12px" }}>
          <div style={{ ...mono, fontSize: 8, color: TDIM, letterSpacing: "0.12em", marginBottom: 6 }}>CODEBASE READ</div>
          {filesRead.map((f, i) => (
            <div key={i} style={{ ...mono, fontSize: 9, color: TDIM, marginBottom: 2 }}>✓ {f.path} ({f.lines} lines)</div>
          ))}
        </div>
      )}

      {/* Architect plan */}
      {planContent && (
        <div style={{ background: BGCARD, border: `1px solid ${BGOLD}40`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "7px 12px", borderBottom: `1px solid ${BGOLD}40` }}>
            <span style={{ ...mono, fontSize: 8, color: GOLDDM, letterSpacing: "0.12em" }}>ARCHITECT'S PLAN</span>
          </div>
          <div style={{ padding: "10px 12px", ...mono, fontSize: 10, color: TSUB, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {planContent}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RoyalEngineerSession({ process: proc, onClose }) {
  const codeSpec = proc?.artifact

  const [phase, setPhase]             = useState('idle')
  const [statusMsg, setStatusMsg]     = useState('')
  const [filesRead, setFilesRead]     = useState([])
  const [planContent, setPlanContent] = useState('')
  const [files, setFiles]             = useState([]) // [{path, action, content}]
  const [activeFile, setActiveFile]   = useState(null) // path string
  const [newEnvVars, setNewEnvVars]   = useState([])
  const [deploying, setDeploying]     = useState(false)
  const [deployed, setDeployed]       = useState(null) // { branch, branchUrl }
  const [error, setError]             = useState('')

  const isRunning = !['idle', 'done', 'error'].includes(phase)

  const run = async () => {
    if (isRunning) return
    setPhase('reading')
    setFilesRead([])
    setPlanContent('')
    setFiles([])
    setActiveFile(null)
    setNewEnvVars([])
    setDeployed(null)
    setError('')

    try {
      const res = await authFetch('/api/royal-engineer', {
        method: 'POST',
        body: JSON.stringify({ codeSpec }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Unknown error')
        setPhase('error')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ''

      const processSSE = (chunk) => {
        const blocks = chunk.split('\n\n')
        for (const block of blocks) {
          const evtMatch = block.match(/^event: (\w+)/m)
          const dataMatch = block.match(/^data: (.+)/m)
          if (!evtMatch || !dataMatch) continue
          try {
            const data = JSON.parse(dataMatch[1])
            handleEvent(evtMatch[1], data)
          } catch {}
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
        const parts = raw.split('\n\n')
        raw = parts.pop()
        processSSE(parts.join('\n\n'))
      }
      if (raw) processSSE(raw)

    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  const handleEvent = (evtType, data) => {
    if (evtType === 'status') {
      setPhase(data.phase || phase)
      setStatusMsg(data.message || '')
    } else if (evtType === 'file_read') {
      setFilesRead(prev => [...prev, data])
    } else if (evtType === 'plan') {
      setPlanContent(data.content)
      setPhase('engineering')
    } else if (evtType === 'file_start') {
      setFiles(prev => [...prev, { path: data.path, action: data.action, content: '' }])
      setActiveFile(data.path)
    } else if (evtType === 'file_complete') {
      setFiles(prev => prev.map(f => f.path === data.path ? { ...f, content: data.content } : f))
      setActiveFile(data.path)
    } else if (evtType === 'build_proposal') {
      setNewEnvVars(data.newEnvVars || [])
    } else if (evtType === 'done') {
      setPhase('done')
      setStatusMsg('')
    } else if (evtType === 'error') {
      setError(data.message)
      setPhase('error')
    }
  }

  const deploy = async () => {
    if (deploying || !files.length) return
    setDeploying(true)
    try {
      const res = await authFetch('/api/royal-engineer-deploy', {
        method: 'POST',
        body: JSON.stringify({ files, title: codeSpec?.title }),
      })
      const data = await res.json()
      if (data.success || data.branch) {
        setDeployed(data)
      } else {
        setError(data.error || data.message || 'Deploy failed')
      }
    } catch (err) {
      setError(err.message)
    }
    setDeploying(false)
  }

  if (!codeSpec) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...mono, color: TDIM, fontSize: 11, marginBottom: 8 }}>NO CODE SPEC LOADED</div>
        <button onClick={onClose} style={{ ...mono, fontSize: 9, padding: "6px 14px", border: `1px solid ${BORDER}`, background: "transparent", color: TDIM, cursor: "pointer", borderRadius: 3 }}>CLOSE</button>
      </div>
    </div>
  )

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", background: BG }}>

      {/* HEADER */}
      <div style={{ flexShrink: 0, padding: "12px 20px", borderBottom: `1px solid ${BGOLD}`, background: "rgba(0,200,240,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, border: `1px solid ${CYAN}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ ...mono, fontSize: 9, color: CYAN }}>RE</span>
          </div>
          <div>
            <div style={{ ...mono, fontWeight: 700, fontSize: 13, color: TPRI, letterSpacing: "0.18em" }}>ROYAL ENGINEER</div>
            <div style={{ ...mono, fontSize: 8, color: TDIM, letterSpacing: "0.12em" }}>{codeSpec.title?.toUpperCase()}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ ...mono, fontSize: 10, padding: "5px 12px", borderRadius: 3, background: "transparent", border: `1px solid ${BORDER}`, color: TDIM, cursor: "pointer" }}>✕ CLOSE</button>
      </div>

      {/* PHASE BAR */}
      {phase !== 'idle' && <PhaseBar phase={phase} />}

      {/* STATUS LINE */}
      {(isRunning || error) && (
        <div style={{ flexShrink: 0, padding: "5px 20px", background: error ? "rgba(224,32,32,0.06)" : "rgba(0,200,240,0.05)", borderBottom: `1px solid ${error ? `${CRIM}30` : `${CYAN}30`}`, display: "flex", alignItems: "center", gap: 8 }}>
          {!error && <div style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, boxShadow: `0 0 5px ${CYAN}` }} />}
          <span style={{ ...mono, fontSize: 9, color: error ? CRIM : CYAN, letterSpacing: "0.1em" }}>{error || statusMsg}</span>
        </div>
      )}

      {/* MAIN — two panels */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — Spec + Plan */}
        <div style={{ width: "35%", display: "flex", flexDirection: "column", borderRight: `1px solid ${BGOLD}` }}>
          <div style={{ padding: "9px 14px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...mono, fontWeight: 700, fontSize: 9, color: TSUB, letterSpacing: "0.15em" }}>SPEC & PLAN</span>
            {phase === 'idle' && (
              <button onClick={run}
                style={{ ...mono, fontSize: 9, padding: "4px 12px", borderRadius: 3, background: "rgba(0,200,240,0.1)", border: `1px solid ${CYAN}40`, color: CYAN, cursor: "pointer", letterSpacing: "0.1em" }}>
                ▶ BUILD
              </button>
            )}
          </div>
          <SpecOverview codeSpec={codeSpec} planContent={planContent} statusMsg={statusMsg} filesRead={filesRead} />
        </div>

        {/* RIGHT — Generated files */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* File tabs */}
          {files.length > 0 && (
            <div style={{ flexShrink: 0, display: "flex", overflowX: "auto", borderBottom: `1px solid ${BORDER}`, background: BGCARD }}>
              {files.map(f => (
                <button key={f.path} onClick={() => setActiveFile(f.path)}
                  style={{ ...mono, fontSize: 9, padding: "8px 14px", border: "none", borderRight: `1px solid ${BORDER}`,
                    borderBottom: activeFile === f.path ? `2px solid ${f.action === 'create' ? GREEN : AMBER}` : "2px solid transparent",
                    background: activeFile === f.path ? "rgba(255,255,255,0.04)" : "transparent",
                    color: activeFile === f.path ? TPRI : TDIM, cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: f.action === 'create' ? GREEN : AMBER, fontSize: 7 }}>
                    {f.content ? '●' : '○'}
                  </span>
                  {f.path.split('/').pop()}
                </button>
              ))}
            </div>
          )}

          {/* Code view or idle state */}
          {files.length === 0 && phase === 'idle' && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12, filter: `drop-shadow(0 0 12px ${CYAN}40)` }}>⚙</div>
                <div style={{ ...mono, fontSize: 10, color: TSUB, marginBottom: 6 }}>ROYAL ENGINEER STANDING BY</div>
                <div style={{ ...mono, fontSize: 9, color: TDIM, lineHeight: 1.8, maxWidth: 320, textAlign: "center" }}>
                  The Engineer will read the codebase, plan the implementation, and generate each file. You review and approve before anything is pushed.
                </div>
              </div>
              <button onClick={run} style={{ ...mono, fontSize: 10, padding: "10px 28px", borderRadius: 3, background: "rgba(0,200,240,0.1)", border: `1px solid ${CYAN}40`, color: CYAN, cursor: "pointer", letterSpacing: "0.12em" }}>
                ▶ START BUILD SESSION
              </button>
            </div>
          )}

          {files.length === 0 && isRunning && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ ...mono, fontSize: 9, color: CYAN, letterSpacing: "0.1em" }}>● {statusMsg || 'WORKING...'}</div>
            </div>
          )}

          {files.length > 0 && <CodeViewer file={files.find(f => f.path === activeFile)} />}

        </div>
      </div>

      {/* BOTTOM BAR — approve / deploy */}
      {(phase === 'done' || deployed) && (
        <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: `1px solid ${BGOLD}`, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 12 }}>

          {!deployed ? (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ ...mono, fontSize: 9, color: TSUB }}>
                  {files.length} file{files.length !== 1 ? 's' : ''} ready · {files.filter(f => f.action === 'create').length} new · {files.filter(f => f.action === 'modify').length} modified
                </div>
                {newEnvVars.length > 0 && (
                  <div style={{ ...mono, fontSize: 8, color: PURPLE, marginTop: 3 }}>
                    ⚠ Add to Vercel before deploying: {newEnvVars.map(v => v.name).join(', ')}
                  </div>
                )}
              </div>
              <button onClick={deploy} disabled={deploying}
                style={{ ...mono, fontSize: 10, padding: "9px 22px", borderRadius: 3, background: "rgba(0,200,240,0.12)", border: `1px solid ${CYAN}40`, color: deploying ? TDIM : CYAN, cursor: deploying ? "not-allowed" : "pointer", letterSpacing: "0.12em" }}>
                {deploying ? 'PUSHING...' : '▶ APPROVE & PUSH TO PREVIEW'}
              </button>
            </>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ ...mono, fontSize: 10, color: GREEN, marginBottom: 4 }}>✓ PUSHED TO GITHUB</div>
              <div style={{ ...mono, fontSize: 9, color: TSUB, marginBottom: 4 }}>
                Branch: <span style={{ color: CYAN }}>{deployed.branch}</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <a href={deployed.branchUrl} target="_blank" rel="noreferrer"
                  style={{ ...mono, fontSize: 9, padding: "5px 14px", borderRadius: 3, border: `1px solid ${CYAN}40`, color: CYAN, textDecoration: "none", background: "rgba(0,200,240,0.08)" }}>
                  VIEW BRANCH ON GITHUB ↗
                </a>
                <div style={{ ...mono, fontSize: 8, color: TDIM, display: "flex", alignItems: "center" }}>
                  Vercel is building your preview — check the Vercel dashboard for the preview URL
                </div>
              </div>
              {deployed.failed > 0 && (
                <div style={{ ...mono, fontSize: 9, color: CRIM, marginTop: 6 }}>
                  ⚠ {deployed.failed} file{deployed.failed !== 1 ? 's' : ''} failed to push — check GitHub token permissions
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  )
}
