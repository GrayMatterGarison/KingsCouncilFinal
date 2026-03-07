import { useState, useEffect, useRef } from "react"

// ── DESIGN TOKENS ─────────────────────────────────────────────
const T = {
  bg:"#060606", bgCard:"#141414", bgHov:"#1C1C1C",
  border:"#2E2E2E", bGold:"#5A4418", bCrim:"#4A1818",
  gold:"#D4970C", goldBr:"#F0B000", goldDm:"#A07020",
  crim:"#E02020", cyan:"#00C8F0", amber:"#E06A0A",
  tPri:"#F2ECD8", tSub:"#B0A888", tDim:"#6A6258",
}

// ── ROSTER ────────────────────────────────────────────────────
const ROSTER = {
  strategic:[
    {id:"cipher",    name:"THE CIPHER",    role:"Chief of Staff",     tier:"ANCIENT POWER", ac:T.gold,   icon:"◈"},
    {id:"vault",     name:"THE VAULT",     role:"CFO",                tier:"ANCIENT POWER", ac:T.goldBr, icon:"⬡"},
    {id:"oracle",    name:"THE ORACLE",    role:"Chief Strategist",   tier:"ANCIENT POWER", ac:T.amber,  icon:"◉"},
    {id:"shadow",    name:"THE SHADOW",    role:"Chief Intelligence", tier:"ANCIENT POWER", ac:T.crim,   icon:"◎"},
  ],
  command:[
    {id:"commander", name:"COMMANDER", role:"COO", tier:"MILITARY", ac:T.cyan,  icon:"▲"},
    {id:"director",  name:"DIRECTOR",  role:"CMO", tier:"MILITARY", ac:T.gold,  icon:"▶"},
    {id:"marshal",   name:"MARSHAL",   role:"CRO", tier:"MILITARY", ac:T.amber, icon:"◆"},
  ],
  corps:[
    {id:"operator", name:"OPERATOR", role:"Creative Director",  tier:"MILITARY", ac:T.gold,  icon:"⊕"},
    {id:"scriptor", name:"SCRIPTOR", role:"Content & Copy",     tier:"MILITARY", ac:T.tSub,  icon:"≡"},
    {id:"lens",     name:"LENS",     role:"Visual Production",  tier:"MILITARY", ac:T.cyan,  icon:"⊙"},
    {id:"vanguard", name:"VANGUARD", role:"Ad Strategy",        tier:"MILITARY", ac:T.amber, icon:"◁"},
    {id:"signal",   name:"SIGNAL",   role:"Social & Broadcast", tier:"MILITARY", ac:T.gold,  icon:"∿"},
    {id:"reel",     name:"REEL",     role:"Video Production",   tier:"MILITARY", ac:T.crim,  icon:"⊡"},
  ],
  special:[
    {id:"broker",    name:"THE BROKER",    role:"Deal Executor",    tier:"SPECIAL FORCES", ac:T.gold, icon:"⋈"},
    {id:"warden",    name:"THE WARDEN",    role:"People & Culture", tier:"SPECIAL FORCES", ac:T.tSub, icon:"⊞"},
    {id:"architect", name:"THE ARCHITECT", role:"Systems Builder",  tier:"SPECIAL FORCES", ac:T.cyan, icon:"⌘"},
  ],
}

const ALL = [...ROSTER.strategic,...ROSTER.command,...ROSTER.corps,...ROSTER.special]

const PROMPTS = {
  cipher:`You are THE CIPHER, Chief of Staff. Protect the Sovereign's time with absolute precision. Domain: briefings, inbox triage, priority queue. The Sovereign commands a $1.5B operation with 7 personnel. Be surgical and direct. Lead with what demands action TODAY.`,
  vault:`You are THE VAULT, CFO. Protect and multiply Kingdom capital. Domain: revenue architecture, cash flow, deal economics, financial risk. $1.5B projection, 7 personnel. Lead with financial status: GREEN / YELLOW / RED. Think in 90-day horizons.`,
  oracle:`You are THE ORACLE, Chief Strategist. Position the Kingdom for permanent dominance. Domain: competitive intelligence, long-range positioning, expansion vectors. Think in decades. Be precise and bold. Address as "Sovereign".`,
  shadow:`You are THE SHADOW, Chief of Intelligence. Nothing moves undetected. Domain: competitor surveillance, market signals, threat detection. Classify all intel: LOW / MEDIUM / HIGH / CRITICAL. Address as "Sovereign".`,
  commander:`You are COMMANDER, COO. Operational dominance. Domain: execution, team deployment (7 personnel), process optimization, bottleneck elimination. Provide operational status + recommended actions. Address as "Sir".`,
  director:`You are DIRECTOR, CMO. Market dominance and brand authority. Domain: brand strategy, campaign architecture, market positioning. Be bold and growth-obsessed. Address as "Sir".`,
  marshal:`You are MARSHAL, CRO. Revenue at all costs. Domain: sales pipeline, deal velocity, partnership economics, revenue forecasting. Be relentless. Address as "Sir".`,
  operator:`You are OPERATOR, Creative Director. Visual dominance. Domain: design systems, brand standards, visual identity, Figma/Canva briefs. Address as "Sir".`,
  scriptor:`You are SCRIPTOR, Content & Copy. The Kingdom's written voice. Domain: copy, email sequences, scripts, brand voice. Be persuasive and precise. Address as "Sir".`,
  lens:`You are LENS, Visual Production. Imagery that commands attention. Domain: AI image prompts for DALL-E, Midjourney, Flux. Deliver 3 prompt variations per request. Address as "Sir".`,
  vanguard:`You are VANGUARD, Ad Strategy. Deploy the Kingdom's message at maximum scale. Domain: paid campaigns, ad copy, audience targeting, ROAS. Address as "Sir".`,
  signal:`You are SIGNAL, Social & Broadcast. The Kingdom's reach. Domain: platform-native content, posting cadence, community. Be trend-intelligent. Address as "Sir".`,
  reel:`You are REEL, Video Production. Motion content that converts. Domain: video scripts, storyboards, short-form briefs, YouTube strategy. Address as "Sir".`,
  broker:`You are THE BROKER, Deal Executor. Structure and close deals that expand the Kingdom. Domain: term sheets, deal structuring, negotiation, M&A. Address as "Sovereign".`,
  warden:`You are THE WARDEN, People & Culture. Protect the Kingdom's 7 personnel. Domain: performance management, culture, hiring, retention. Address as "Sovereign".`,
  architect:`You are THE ARCHITECT, Systems Builder. Build the Kingdom's technical infrastructure. Domain: n8n automation, API architecture, integrations. Be technical and efficiency-obsessed. Address as "Sovereign".`,
}

// ── BACKGROUND ────────────────────────────────────────────────
function BG() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext("2d")
    let raf, t = 0
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)
    const draw = () => {
      t += 0.002
      const { width: w, height: h } = c
      ctx.fillStyle = "#060606"; ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = "rgba(212,151,12,0.07)"; ctx.lineWidth = 0.5
      for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
      ctx.strokeStyle = "rgba(212,151,12,0.3)"; ctx.lineWidth = 1.5
      [[0,0,1,1],[w,0,-1,1],[0,h,1,-1],[w,h,-1,-1]].forEach(([x,y,dx,dy]) => {
        ctx.beginPath(); ctx.moveTo(x+dx*50,y); ctx.lineTo(x,y); ctx.lineTo(x,y+dy*50); ctx.stroke()
      })
      const gx = w*0.7+Math.sin(t)*80, gy = h*0.3+Math.cos(t*0.7)*40
      const g1 = ctx.createRadialGradient(gx,gy,0,gx,gy,w*0.4)
      g1.addColorStop(0,"rgba(212,151,12,0.08)"); g1.addColorStop(1,"transparent")
      ctx.fillStyle = g1; ctx.fillRect(0,0,w,h)
      const g2 = ctx.createRadialGradient(w*0.1,h*0.8,0,w*0.1,h*0.8,w*0.3)
      g2.addColorStop(0,"rgba(196,30,30,0.1)"); g2.addColorStop(1,"transparent")
      ctx.fillStyle = g2; ctx.fillRect(0,0,w,h)
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}} />
}

// ── SIDEBAR ───────────────────────────────────────────────────
const NAV = [
  {id:"dashboard", label:"DASHBOARD",         icon:"♔"},
  {id:"strategic", label:"STRATEGIC COUNCIL", icon:"◈"},
  {id:"command",   label:"EXEC COMMAND",       icon:"▲"},
  {id:"corps",     label:"PRODUCTION CORPS",   icon:"⊕"},
  {id:"special",   label:"SPECIAL FORCES",     icon:"⋈"},
  {id:"ventures",  label:"VENTURES",           icon:"⬡"},
  {id:"intel",     label:"INTEL FEED",         icon:"◎"},
]

function Sidebar({ active, setActive, col, setCol }) {
  const s = { fontFamily:"'Courier New',monospace" }
  return (
    <nav style={{position:"relative",zIndex:10,height:"100vh",flexShrink:0,width:col?52:212,transition:"width 0.25s",background:"rgba(6,6,6,0.97)",borderRight:`1px solid ${T.bGold}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"20px 0 16px",borderBottom:`1px solid ${T.bGold}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 14px"}}>
          <div style={{width:26,height:26,borderRadius:4,border:`1px solid ${T.goldDm}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:T.gold,flexShrink:0}}>♔</div>
          {!col && <div>
            <div style={{...s,fontWeight:700,fontSize:11,color:T.tPri,letterSpacing:"0.2em"}}>KING'S</div>
            <div style={{...s,fontSize:11,color:T.goldDm,letterSpacing:"0.2em"}}>COUNCIL</div>
          </div>}
        </div>
      </div>
      {!col && <div style={{padding:"9px 14px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:T.gold,boxShadow:`0 0 7px ${T.gold}`}} />
          <span style={{...s,fontSize:9,color:T.goldDm,letterSpacing:"0.15em"}}>SYSTEMS OPERATIONAL</span>
        </div>
      </div>}
      <div style={{flex:1,padding:"6px 0",display:"flex",flexDirection:"column",gap:1,overflowY:"auto"}}>
        {NAV.map(n => {
          const on = active === n.id
          return (
            <button key={n.id} onClick={() => setActive(n.id)} style={{position:"relative",display:"flex",alignItems:"center",gap:10,padding:"9px 14px",border:"none",background:on?"rgba(200,147,10,0.08)":"transparent",width:"100%",transition:"all 0.15s",cursor:"pointer"}}>
              {on && <div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:2,height:20,background:`linear-gradient(180deg,${T.gold},${T.amber})`,boxShadow:`0 0 6px ${T.gold}`}} />}
              <span style={{fontSize:13,flexShrink:0,color:on?T.gold:T.tSub,fontFamily:"monospace"}}>{n.icon}</span>
              {!col && <span style={{...s,fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:on?T.gold:T.tSub,textTransform:"uppercase",whiteSpace:"nowrap"}}>{n.label}</span>}
            </button>
          )
        })}
      </div>
      <button onClick={() => setCol(!col)} style={{borderTop:`1px solid ${T.bGold}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",cursor:"pointer",width:"100%"}}>
        <span style={{fontSize:11,color:T.goldDm,transform:col?"rotate(180deg)":"none",transition:"transform 0.25s",fontFamily:"monospace"}}>«</span>
        {!col && <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:T.tDim,letterSpacing:"0.1em"}}>COLLAPSE</span>}
      </button>
    </nav>
  )
}

// ── KPI CARD ──────────────────────────────────────────────────
function Kpi({ label, value, sub, ac }) {
  return (
    <div style={{padding:"13px 16px",borderRadius:4,background:T.bgCard,border:`1px solid ${T.border}`,position:"relative",overflow:"hidden",minWidth:110,flex:1}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${ac||T.gold}80,transparent)`}} />
      <div style={{fontFamily:"'Courier New',monospace",fontSize:9,color:T.tSub,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:22,color:ac||T.gold}}>{value}</div>
      {sub && <div style={{fontFamily:"'Courier New',monospace",fontSize:8,color:T.tDim,letterSpacing:"0.1em",marginTop:3}}>{sub}</div>}
    </div>
  )
}

// ── SECTION DIVIDER ───────────────────────────────────────────
function Div({ label, count, ac }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,marginTop:4}}>
      <div style={{width:16,height:1.5,background:ac||T.gold}} />
      <span style={{fontFamily:"'Courier New',monospace",fontSize:10,color:ac||T.gold,letterSpacing:"0.2em",textTransform:"uppercase",fontWeight:700}}>{label}</span>
      <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:T.tSub,border:`1px solid ${T.border}`,padding:"1px 7px",borderRadius:2}}>{count}</span>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg,${T.bGold},transparent)`}} />
    </div>
  )
}

// ── OPERATIVE CARD ────────────────────────────────────────────
function Card({ m, onClick, sel }) {
  const [hov, setHov] = useState(false)
  const s = { fontFamily:"'Courier New',monospace" }
  return (
    <div onClick={() => onClick(m)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{position:"relative",borderRadius:4,padding:"14px 16px",cursor:"pointer",overflow:"hidden",
        background:sel?"#151208":hov?T.bgHov:T.bgCard,
        border:`1px solid ${sel?T.bGold:hov?"#2A2A2A":T.border}`,transition:"all 0.15s",
        boxShadow:sel?`inset 0 0 20px rgba(200,147,10,0.05),0 2px 12px rgba(0,0,0,0.6)`:"none"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:sel?`linear-gradient(90deg,transparent,${m.ac}80,transparent)`:"transparent"}} />
      {sel && <>
        <div style={{position:"absolute",top:4,left:4,width:8,height:8,borderTop:`1px solid ${T.gold}`,borderLeft:`1px solid ${T.gold}`}} />
        <div style={{position:"absolute",top:4,right:4,width:8,height:8,borderTop:`1px solid ${T.gold}`,borderRight:`1px solid ${T.gold}`}} />
        <div style={{position:"absolute",bottom:4,left:4,width:8,height:8,borderBottom:`1px solid ${T.gold}`,borderLeft:`1px solid ${T.gold}`}} />
        <div style={{position:"absolute",bottom:4,right:4,width:8,height:8,borderBottom:`1px solid ${T.gold}`,borderRight:`1px solid ${T.gold}`}} />
      </>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{...s,fontSize:9,color:T.tDim,letterSpacing:"0.15em",textTransform:"uppercase"}}>{m.tier}</span>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:sel?T.gold:T.tDim,boxShadow:sel?`0 0 5px ${T.gold}`:"none"}} />
          <span style={{...s,fontSize:8,color:sel?T.goldDm:T.tDim,letterSpacing:"0.1em"}}>STANDBY</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
        <span style={{fontSize:18,color:sel?m.ac:T.tSub}}>{m.icon}</span>
        <span style={{...s,fontWeight:700,fontSize:13,color:sel?m.ac:T.tPri,letterSpacing:"0.12em",textTransform:"uppercase"}}>{m.name}</span>
      </div>
      <div style={{...s,fontSize:10,color:sel?T.tSub:T.tDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,paddingLeft:26}}>{m.role}</div>
      <button onClick={e => { e.stopPropagation(); onClick(m) }} style={{width:"100%",padding:"5px 0",background:sel?`rgba(200,147,10,0.1)`:"transparent",border:`1px solid ${sel?T.bGold:T.border}`,borderRadius:3,color:sel?T.gold:T.tDim,...s,fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",transition:"all 0.15s",cursor:"pointer"}}>
        {sel ? "▶ CHANNEL OPEN" : "OPEN CHANNEL"}
      </button>
    </div>
  )
}

// ── CHAT PANEL ────────────────────────────────────────────────
function Chat({ m, onClose, onEscalate }) {
  const [msgs, setMsgs] = useState([{role:"assistant", content:`${m.name} online. ${m.tier} operative standing by. Awaiting directive, Sovereign.`}])
  const [inp, setInp] = useState("")
  const [load, setLoad] = useState(false)
  const bot = useRef(null)
  const s = { fontFamily:"'Courier New',monospace" }
  useEffect(() => { bot.current?.scrollIntoView({ behavior:"smooth" }) }, [msgs])

  const send = async () => {
    if (!inp.trim() || load) return
    const um = { role:"user", content:inp }
    const next = [...msgs, um]
    setMsgs(next); setInp(""); setLoad(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          systemPrompt: PROMPTS[m.id] || `You are ${m.name}, ${m.role} of the King's Council.`,
          messages: next.map(x => ({ role:x.role, content:x.content }))
        })
      })
      const data = await res.json()
      setMsgs(p => [...p, { role:"assistant", content: data.content || data.error || "No response." }])
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"SIGNAL LOST. Check API configuration." }])
    }
    setLoad(false)
  }

  return (
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:420,zIndex:50,background:"rgba(6,6,6,0.98)",borderLeft:`1px solid ${T.bGold}`,display:"flex",flexDirection:"column",boxShadow:`-8px 0 32px rgba(0,0,0,0.8)`}}>
      <div style={{padding:"16px 18px 14px",borderBottom:`1px solid ${T.bGold}`,background:`linear-gradient(135deg,rgba(200,147,10,0.06),transparent)`,flexShrink:0,position:"relative"}}>
        <div style={{position:"absolute",top:6,left:6,width:10,height:10,borderTop:`1px solid ${T.gold}`,borderLeft:`1px solid ${T.gold}`}} />
        <div style={{position:"absolute",top:6,right:6,width:10,height:10,borderTop:`1px solid ${T.gold}`,borderRight:`1px solid ${T.gold}`}} />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:18,color:m.ac}}>{m.icon}</span>
              <span style={{...s,fontWeight:700,fontSize:13,color:T.tPri,letterSpacing:"0.15em"}}>{m.name}</span>
            </div>
            <div style={{...s,fontSize:9,color:T.tDim,letterSpacing:"0.12em",textTransform:"uppercase",paddingLeft:26}}>{m.role} · {m.tier}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={() => onEscalate && onEscalate(m)} style={{background:"transparent",border:`1px solid ${T.bCrim}`,borderRadius:3,color:T.crim,padding:"4px 8px",...s,fontSize:8,letterSpacing:"0.1em",cursor:"pointer"}}>ESCALATE</button>
            <button onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:3,color:T.tDim,padding:"4px 8px",...s,fontSize:10,cursor:"pointer"}}>✕</button>
          </div>
        </div>
        <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:T.gold,boxShadow:`0 0 5px ${T.gold}`}} />
          <span style={{...s,fontSize:8,color:T.goldDm,letterSpacing:"0.15em"}}>SECURE CHANNEL ESTABLISHED</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((msg, i) => (
          <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
            {msg.role==="assistant" && <span style={{fontSize:10,color:T.goldDm,marginRight:6,marginTop:2,fontFamily:"monospace",flexShrink:0}}>{m.icon}</span>}
            <div style={{maxWidth:"88%",padding:"10px 13px",borderRadius:3,
              background:msg.role==="user"?"rgba(212,151,12,0.1)":"rgba(255,255,255,0.05)",
              border:`1px solid ${msg.role==="user"?T.bGold:T.border}`,
              color:msg.role==="user"?T.tPri:T.tSub,fontSize:13,lineHeight:1.7,
              fontFamily:msg.role==="assistant"?"'Courier New',monospace":"sans-serif",
              whiteSpace:"pre-wrap"}}>
              {msg.content}
            </div>
          </div>
        ))}
        {load && <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:18}}>
          <span style={{...s,fontSize:9,color:T.goldDm,letterSpacing:"0.1em"}}>TRANSMITTING</span>
          {[0,1,2].map(i => <div key={i} style={{width:4,height:4,borderRadius:"50%",background:T.gold,animation:"kc-pulse 1s ease-in-out infinite",animationDelay:`${i*0.2}s`}} />)}
        </div>}
        <div ref={bot} />
      </div>
      <div style={{padding:"12px 16px",borderTop:`1px solid ${T.bGold}`,flexShrink:0}}>
        <div style={{...s,fontSize:8,color:T.goldDm,letterSpacing:"0.15em",marginBottom:6}}>DIRECTIVE INPUT</div>
        <div style={{display:"flex",gap:8}}>
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Enter directive..."
            style={{flex:1,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.bGold}`,borderRadius:3,padding:"9px 12px",color:T.tPri,fontSize:12,outline:"none",...s}} />
          <button onClick={send} style={{padding:"9px 16px",background:"rgba(200,147,10,0.12)",border:`1px solid ${T.bGold}`,borderRadius:3,color:T.gold,fontSize:11,...s,letterSpacing:"0.05em",cursor:"pointer"}}>SEND</button>
        </div>
      </div>
    </div>
  )
}

// ── MORNING BRIEF ─────────────────────────────────────────────
function MorningBrief() {
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const s = { fontFamily:"'Courier New',monospace" }

  const fetchBrief = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/brief")
      const data = await res.json()
      setBrief(data)
    } catch {
      setBrief({ brief:"BRIEF UNAVAILABLE — Check API configuration.", date:"Unknown", counts:{} })
    }
    setLoading(false)
    setFetched(true)
  }

  return (
    <div style={{background:T.bgCard,border:`1px solid ${T.bGold}`,borderRadius:4,padding:"20px",position:"relative",marginBottom:20}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`}} />
      <div style={{position:"absolute",top:5,left:5,width:10,height:10,borderTop:`1px solid ${T.gold}`,borderLeft:`1px solid ${T.gold}`}} />
      <div style={{position:"absolute",bottom:5,right:5,width:10,height:10,borderBottom:`1px solid ${T.gold}`,borderRight:`1px solid ${T.gold}`}} />
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{...s,fontSize:8,color:T.goldDm,letterSpacing:"0.2em",marginBottom:4}}>THE CIPHER · MORNING BRIEF</div>
          <div style={{...s,fontWeight:700,fontSize:14,color:T.tPri,letterSpacing:"0.1em"}}>
            {brief?.date || new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </div>
        </div>
        <button onClick={fetchBrief} disabled={loading}
          style={{padding:"7px 14px",background:"rgba(212,151,12,0.1)",border:`1px solid ${T.bGold}`,borderRadius:3,color:loading?T.tDim:T.gold,...s,fontSize:9,letterSpacing:"0.15em",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "GENERATING..." : fetched ? "↻ REFRESH" : "▶ GENERATE BRIEF"}
        </button>
      </div>
      {brief && <div style={{...s,fontSize:11,color:T.tSub,lineHeight:1.9,whiteSpace:"pre-wrap",borderTop:`1px solid ${T.border}`,paddingTop:12}}>
        {brief.brief}
      </div>}
      {!brief && !loading && <div style={{...s,fontSize:10,color:T.tDim,letterSpacing:"0.08em"}}>
        Click GENERATE BRIEF to receive your daily operational summary from THE CIPHER.
      </div>}
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [nav, setNav] = useState("dashboard")
  const [col, setCol] = useState(false)
  const [sel, setSel] = useState(null)
  const [time, setTime] = useState(new Date())
  const [escalationCount, setEscalationCount] = useState(0)
  const s = { fontFamily:"'Courier New',monospace" }

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch escalation count on load
  useEffect(() => {
    fetch("/api/notion?action=escalations")
      .then(r => r.json())
      .then(d => setEscalationCount(d.results?.length || 0))
      .catch(() => {})
  }, [])

  const handleEscalate = async (operative) => {
    const lastMsg = "Escalation from " + operative.name
    await fetch("/api/notion?action=escalate", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ title: lastMsg, operative: operative.name, details: "" })
    })
    setEscalationCount(c => c + 1)
  }

  const sections = {
    strategic:{ members:ROSTER.strategic, label:"STRATEGIC COUNCIL", ac:T.gold },
    command:  { members:ROSTER.command,   label:"EXEC COMMAND",      ac:T.cyan },
    corps:    { members:ROSTER.corps,     label:"PRODUCTION CORPS",  ac:T.amber },
    special:  { members:ROSTER.special,   label:"SPECIAL FORCES",    ac:T.crim },
  }
  const cur = sections[nav]

  return (
    <>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body,#root { height:100%; background:#060606; overflow:hidden; }
        ::-webkit-scrollbar { width:2px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#5A4418; border-radius:1px; }
        input::placeholder { color:#4A4440; }
        button { cursor:pointer; }
        @keyframes kc-pulse {
          0%,100% { opacity:0.2; transform:scale(0.7); }
          50%      { opacity:1;   transform:scale(1); }
        }
        @keyframes kc-in {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .kc-grid>*            { animation:kc-in 0.25s ease both; }
        .kc-grid>*:nth-child(1){ animation-delay:.03s }
        .kc-grid>*:nth-child(2){ animation-delay:.07s }
        .kc-grid>*:nth-child(3){ animation-delay:.11s }
        .kc-grid>*:nth-child(4){ animation-delay:.15s }
        .kc-grid>*:nth-child(5){ animation-delay:.19s }
        .kc-grid>*:nth-child(6){ animation-delay:.23s }
        .kc-grid>*:nth-child(7){ animation-delay:.27s }
      `}</style>

      <BG />

      <div style={{position:"relative",zIndex:1,display:"flex",height:"100vh",overflow:"hidden",paddingRight:sel?420:0,transition:"padding-right 0.25s"}}>
        <Sidebar active={nav} setActive={v => { setNav(v); setSel(null) }} col={col} setCol={setCol} />

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* TOPBAR */}
          <div style={{height:52,flexShrink:0,borderBottom:`1px solid ${T.bGold}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",background:"rgba(6,6,6,0.95)"}}>
            <div>
              <div style={{...s,fontWeight:700,fontSize:15,color:T.tPri,letterSpacing:"0.2em",textTransform:"uppercase"}}>
                {cur?.label || nav.toUpperCase()}
              </div>
              <div style={{...s,fontSize:8,color:T.tDim,letterSpacing:"0.12em",marginTop:2}}>
                {time.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase()} · {time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:3,
                background:escalationCount>0?"rgba(196,30,30,0.2)":"rgba(139,26,26,0.15)",
                border:`1px solid ${escalationCount>0?T.crim:T.bCrim}`}}>
                {escalationCount>0 && <div style={{width:5,height:5,borderRadius:"50%",background:T.crim,boxShadow:`0 0 6px ${T.crim}`}} />}
                {escalationCount===0 && <div style={{width:4,height:4,borderRadius:"50%",background:T.tDim}} />}
                <span style={{...s,fontSize:9,color:escalationCount>0?T.crim:T.tDim,letterSpacing:"0.12em"}}>{escalationCount} ESCALATIONS</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:3,background:"rgba(200,147,10,0.1)",border:`1px solid ${T.bGold}`}}>
                <span style={{...s,fontSize:9,color:T.gold,letterSpacing:"0.12em"}}>♔ SOVEREIGN</span>
              </div>
            </div>
          </div>

          {/* KPI BAR */}
          <div style={{flexShrink:0,padding:"10px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:10}}>
            <Kpi label="Council Strength" value={ALL.length}  sub="OPERATIVES"    ac={T.gold} />
            <Kpi label="Active Ventures"  value="1"           sub="KINGDOMS"      ac={T.goldBr} />
            <Kpi label="Revenue Target"   value="$1.5B"       sub="PROJECTION"    ac={T.amber} />
            <Kpi label="Personnel"        value="7"           sub="OPERATORS"     ac={T.cyan} />
            <Kpi label="Escalations"      value={escalationCount} sub="OPEN"      ac={escalationCount>0?T.crim:T.tDim} />
          </div>

          {/* CONTENT */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

            {/* DASHBOARD */}
            {nav==="dashboard" && (
              <div>
                <MorningBrief />
                <Div label="FULL COUNCIL" count={ALL.length} />
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {ALL.map(m => (
                    <button key={m.id} onClick={() => setSel(m)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:3,
                      background:sel?.id===m.id?"rgba(200,147,10,0.1)":"transparent",
                      border:`1px solid ${sel?.id===m.id?T.bGold:T.border}`,
                      color:sel?.id===m.id?T.gold:T.tSub,...s,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",transition:"all 0.15s"}}>
                      <span style={{color:m.ac}}>{m.icon}</span>
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VENTURES */}
            {nav==="ventures" && (
              <div>
                <Div label="ACTIVE KINGDOMS" count={1} />
                <div style={{background:T.bgCard,border:`1px solid ${T.bGold}`,borderRadius:4,padding:"20px",position:"relative"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`}} />
                  <div style={{position:"absolute",top:5,left:5,width:10,height:10,borderTop:`1px solid ${T.gold}`,borderLeft:`1px solid ${T.gold}`}} />
                  <div style={{position:"absolute",bottom:5,right:5,width:10,height:10,borderBottom:`1px solid ${T.gold}`,borderRight:`1px solid ${T.gold}`}} />
                  <div style={{...s,fontSize:8,color:T.tDim,letterSpacing:"0.2em",marginBottom:8}}>VENTURE CLASSIFICATION: PRIMARY</div>
                  <div style={{...s,fontWeight:700,fontSize:18,color:T.tPri,letterSpacing:"0.1em",marginBottom:16}}>KINGDOM ALPHA</div>
                  <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
                    {[["REVENUE","— UNDISCLOSED",T.tSub],["PROJECTION","$1.5B",T.gold],["PERSONNEL","7 OPERATORS",T.cyan],["STATUS","SCALING",T.amber]].map(([l,v,a]) => (
                      <div key={l}>
                        <div style={{...s,fontSize:8,color:T.tDim,letterSpacing:"0.15em",marginBottom:4}}>{l}</div>
                        <div style={{...s,fontWeight:700,fontSize:13,color:a}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INTEL */}
            {nav==="intel" && (
              <div>
                <Div label="INTELLIGENCE FEED" count={0} ac={T.crim} />
                <div style={{background:T.bgCard,border:`1px solid ${T.bCrim}`,borderRadius:4,padding:"32px",textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:10,color:T.crim}}>◎</div>
                  <div style={{...s,color:T.tSub,fontSize:11,letterSpacing:"0.1em",marginBottom:6}}>NO ACTIVE INTELLIGENCE BRIEFS</div>
                  <div style={{...s,color:T.tDim,fontSize:9,letterSpacing:"0.1em",marginBottom:16}}>DEPLOY THE SHADOW TO BEGIN SURVEILLANCE OPERATIONS</div>
                  <button onClick={() => { setNav("strategic"); setTimeout(() => setSel(ROSTER.strategic.find(m => m.id==="shadow")), 150) }}
                    style={{padding:"7px 18px",borderRadius:3,background:"rgba(196,30,30,0.1)",border:`1px solid ${T.bCrim}`,color:T.crim,...s,fontSize:9,letterSpacing:"0.15em",cursor:"pointer"}}>
                    ▶ DEPLOY THE SHADOW
                  </button>
                </div>
              </div>
            )}

            {/* COUNCIL SECTIONS */}
            {cur && (
              <div>
                <Div label={cur.label} count={cur.members.length} ac={cur.ac} />
                <div className="kc-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                  {cur.members.map(m => <Card key={m.id} m={m} onClick={setSel} sel={sel?.id===m.id} />)}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {sel && <Chat m={sel} onClose={() => setSel(null)} onEscalate={handleEscalate} />}
    </>
  )
}
