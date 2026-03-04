# TailorCV

**Tailor your resume & cover letter to any job — instantly, privately, for free.**

TailorCV is a fully client-side web application that helps job seekers quickly adapt their resume and cover letter to a specific job description. No AI API. No backend. No signup. Everything runs in your browser.

---

## Features

- **Keyword Extraction** — Automatically identifies the most important skills and terms from the job description
- **Resume Tailoring** — Restructures bullet points with strong action verbs and injects relevant keywords
- **Cover Letter Generation** — Produces a professional, personalized cover letter using template-based logic
- **Keyword Match Score** — Shows how well your resume matches the job description
- **Editable Outputs** — Edit the generated resume and cover letter directly in the browser
- **Copy to Clipboard** — One-click copy for both documents
- **Download as .txt** — Save outputs locally
- **Download as PDF** — Client-side PDF via browser print dialog
- **Auto-save Inputs** — Your inputs are saved to localStorage so you don't lose work on refresh
- **Mobile Responsive** — Works on phones, tablets, and desktops
- **No Dependencies** — Pure HTML, CSS, and vanilla JavaScript

---

## How It Works

TailorCV uses rule-based natural language processing — no AI API required.

### Step 1: Keyword Extraction
The app tokenizes the job description into individual words and bigrams (two-word phrases), filters out stopwords, and ranks the remaining terms by frequency and relevance. It also uses a curated list of known skills (Python, SQL, Agile, Figma, etc.) to give extra weight to recognized keywords.

### Step 2: Resume Matching
The app scores how many of the top extracted keywords are already present in the user's resume. This produces the Keyword Match Score (0–100%).

### Step 3: Resume Tailoring
The app parses the resume into sections (Experience, Skills, Education, etc.) and for each bullet point:
- Strips weak action verbs (e.g., "helped", "responsible for")
- Replaces them with strong, varied action verbs from a curated list (Led, Developed, Optimized, etc.)
- Injects relevant keywords from the job description where contextually appropriate
- Augments the Skills section with job description keywords not already present

### Step 4: Cover Letter Generation
Using template-based logic, the app generates a cover letter that includes:
- The specific job title and company name
- The applicant's years of experience
- Top matched skills from the job description
- Company-specific personalization language
- Multiple template variants to avoid repetition

---

## Tech Stack

| Layer       | Technology            |
|-------------|----------------------|
| Markup      | HTML5                |
| Styling     | CSS3 (no frameworks) |
| Logic       | Vanilla JavaScript   |
| Persistence | localStorage         |
| Hosting     | GitHub Pages         |
| Fonts       | Google Fonts (DM Serif Display, DM Sans) |

**Zero external dependencies.** No npm, no bundler, no build step.

---

## File Structure

```
/tailorcv
 ├── index.html       ← Main entry point
 ├── style.css        ← All styles
 ├── script.js        ← All logic
 ├── README.md        ← This file
 └── /assets
     └── placeholder.png
```

---

## How to Deploy on GitHub Pages

Follow these steps to deploy TailorCV for free on GitHub Pages:

### Step 1: Create a GitHub Repository
1. Go to [github.com](https://github.com) and sign in
2. Click **New** to create a new repository
3. Name it `tailorcv` (or any name you prefer)
4. Set it to **Public**
5. Click **Create repository**

### Step 2: Upload Your Files
**Option A — Via GitHub Web UI (easiest):**
1. On your new repo page, click **Add file → Upload files**
2. Drag and drop all TailorCV files: `index.html`, `style.css`, `script.js`, `README.md`, and the `/assets` folder
3. Click **Commit changes**

**Option B — Via Git CLI:**
```bash
cd tailorcv
git init
git add .
git commit -m "Initial commit: TailorCV MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tailorcv.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** (top tab)
3. In the left sidebar, scroll to **Pages**
4. Under **Source**, select **Deploy from a branch**
5. Set branch to **main** and folder to **/ (root)**
6. Click **Save**

### Step 4: Access Your Site
After 1–2 minutes, your site will be live at:
```
https://YOUR_USERNAME.github.io/tailorcv/
```

GitHub will show the URL in the Pages settings section.

### Step 5: (Optional) Custom Domain
1. In GitHub Pages settings, enter your custom domain under **Custom domain**
2. Update your domain's DNS with a CNAME record pointing to `YOUR_USERNAME.github.io`
3. Check **Enforce HTTPS**

---

## Local Development

No build step required. Simply open `index.html` in a browser:

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a local server (avoids any CORS quirks)
npx serve .
# or
python3 -m http.server 8080
```

---

## Limitations of the MVP

TailorCV is a rule-based system, not an AI. Here's what to keep in mind:

| Limitation | Details |
|---|---|
| **No true NLP** | Keyword matching is lexical, not semantic. Synonyms aren't matched (e.g., "manage" ≠ "oversee") |
| **Template-based cover letter** | The cover letter uses templates — it will need personalization before sending |
| **Plain text only** | Resume input must be plain text; .docx or .pdf upload is not supported |
| **No formatting preservation** | Output is plain text; rich formatting (bold, columns, tables) is not preserved |
| **Keyword injection is conservative** | The app only adds keywords where a basic heuristic deems it relevant; manual editing is recommended |
| **Privacy** | Inputs are saved to localStorage only — they stay on your device. Clearing browser data clears them. |
| **No version history** | Only the most recent output is saved |
| **PDF quality** | PDF export uses the browser's print dialog — formatting is basic prose, not a designed resume layout |

---

## Roadmap (Future Ideas)

- [ ] Resume file upload (.txt, .docx)
- [ ] Multiple resume templates with designed PDF export
- [ ] Semantic keyword matching (synonyms, related terms)
- [ ] Side-by-side diff view (original vs tailored resume)
- [ ] ATS (Applicant Tracking System) compatibility score
- [ ] Export to Google Docs
- [ ] Dark mode

---

## License

MIT License — free to use, fork, and modify.

---

*Built with ❤️ and zero dependencies. TailorCV is a tool to help you put your best foot forward — always review and personalize before submitting.*
