# ♔ King's Council

> A permanent AI operating system. 16 operatives. Full backend. One sovereign.

## Architecture

```
Browser Dashboard (React + Vite)
         ↓
  Vercel Serverless API
  ├── /api/chat      → Claude API (key stays server-side)
  ├── /api/notion    → Read/write Notion databases
  └── /api/brief     → Morning brief (Notion + Claude)
         ↓
  Claude API + Notion Databases
```

## File Structure

```
kings-council/
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
├── .env.example        ← copy to .env and fill in keys
├── api/
│   ├── chat.js         ← Claude API proxy (serverless)
│   ├── notion.js       ← Notion read/write (serverless)
│   └── brief.js        ← Morning brief generator (serverless)
└── src/
    ├── main.jsx
    └── App.jsx         ← Full dashboard
```

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "King's Council v1"
git remote add origin https://github.com/YOUR_USERNAME/kings-council.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
2. Framework: **Vite** (auto-detected)
3. Leave all build settings as default
4. Click **Deploy** (will fail until keys are added — that's fine)

### 3. Add Environment Variables
In Vercel → Your Project → **Settings → Environment Variables**, add:

| Variable | Value | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | ✅ Yes |
| `NOTION_TOKEN` | `secret_...` | Phase 2 |
| `NOTION_ESCALATION_DB_ID` | from Notion URL | Phase 2 |
| `NOTION_TASKS_DB_ID` | from Notion URL | Phase 2 |
| `NOTION_VENTURES_DB_ID` | from Notion URL | Phase 2 |
| `NOTION_DECISIONS_DB_ID` | from Notion URL | Phase 2 |

### 4. Redeploy
Vercel → Deployments → **Redeploy**. Council is live.

## Get Your Keys

**Anthropic API Key**
1. [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key

**Notion Token**
1. [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. New Integration → Internal → Copy token
3. Open each Notion database → Share → Invite your integration

**Notion Database IDs**
Open each database in Notion. The URL looks like:
`https://notion.so/workspace/abc123def456...`
The long string after the last `/` is your database ID.

## Local Development

```bash
npm install
cp .env.example .env
# Fill in your keys in .env
npm run dev
# Opens at http://localhost:5173
```

## The Council

| Operative | Role | Tier |
|---|---|---|
| THE CIPHER | Chief of Staff | Ancient Power |
| THE VAULT | CFO | Ancient Power |
| THE ORACLE | Chief Strategist | Ancient Power |
| THE SHADOW | Chief Intelligence | Ancient Power |
| COMMANDER | COO | Military |
| DIRECTOR | CMO | Military |
| MARSHAL | CRO | Military |
| OPERATOR | Creative Director | Military |
| SCRIPTOR | Content & Copy | Military |
| LENS | Visual Production | Military |
| VANGUARD | Ad Strategy | Military |
| SIGNAL | Social & Broadcast | Military |
| REEL | Video Production | Military |
| THE BROKER | Deal Executor | Special Forces |
| THE WARDEN | People & Culture | Special Forces |
| THE ARCHITECT | Systems Builder | Special Forces |
