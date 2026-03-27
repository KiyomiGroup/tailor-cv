# ResumeAI — Sprint 1

> AI-powered resume and cover letter builder · Static frontend · GitHub Pages ready

## 🚀 Quick Start

1. **Clone / download** this repo
2. Open `index.html` in a browser (or serve locally):
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
3. No build step needed for Sprint 1 — pure ES modules.

---

## 🔧 Configuration

### Supabase (optional — data falls back to localStorage without it)

Edit `index.html`:
```html
<script>
  window.__ENV__ = {
    SUPABASE_URL: 'https://xxxx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIs...',
  };
</script>
```

### Supabase Table Schema

Run in your Supabase SQL editor:

```sql
-- profiles table
create table profiles (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  name text,
  skills jsonb,
  experience jsonb,
  education jsonb,
  raw_text text,
  created_at timestamptz default now()
);

-- job_analyses table
create table job_analyses (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  title text,
  company text,
  required_skills jsonb,
  keywords jsonb,
  responsibilities jsonb,
  raw_text text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table job_analyses enable row level security;

-- Allow anonymous inserts
create policy "Allow anon insert" on profiles for insert with check (true);
create policy "Allow anon insert" on job_analyses for insert with check (true);
```

---

## 📁 Project Structure

```
resumeai/
├── index.html                  # Entry point
└── src/
    ├── main.js                 # Router + app bootstrap
    ├── styles/
    │   └── main.css            # Soft Bento Glass design system
    ├── pages/
    │   ├── Onboarding.js       # Landing / entry-flow
    │   ├── InputPage.js        # Resume + Job bento grid
    │   └── ConfirmPage.js      # Success / Sprint 2 placeholder
    ├── components/
    │   ├── ResumeInput.js      # Upload / Manual / Chat tabs
    │   └── JobInput.js         # JD input + analysis
    ├── services/
    │   ├── ai.js               # parseResumeWithAI() + analyzeJobDescription()
    │   └── supabase.js         # saveProfile() + saveJobAnalysis()
    └── utils/
        └── helpers.js          # store, toasts, icons, file extraction
```

---

## 🤖 AI Integration (Sprint 2)

`src/services/ai.js` contains stub functions ready to be replaced:

```js
// Replace bodies of these two functions with real API calls:
export async function parseResumeWithAI(rawText) { ... }
export async function analyzeJobDescription(rawText, title, company) { ... }
```

Example OpenAI replacement:
```js
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_PROXY_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: PROMPT + rawText }],
  }),
});
```

> ⚠️ Never expose API keys in client-side code. Use a serverless proxy (Supabase Edge Functions, Cloudflare Workers, etc.).

---

## 🚢 GitHub Pages Deployment

1. Push to `main` branch
2. Go to **Settings → Pages → Source: Deploy from branch** → `main` / `/ (root)`
3. Done — no build step required.

---

## 📦 Optional CDN Libraries

Uncomment in `index.html` to enable:

| Library | Purpose |
|---|---|
| PDF.js | Rich PDF text extraction |
| Mammoth.js | DOCX text extraction |
| Supabase JS | Already included |

---

## 🗺 Roadmap

| Sprint | Features |
|---|---|
| **1 ✅** | Input system · Parsing · Supabase storage |
| 2 | AI resume generation · Match scoring |
| 3 | Cover letter generation · Export (PDF/DOCX) |
| 4 | Auth · History · Multiple versions |
