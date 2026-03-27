/**
 * services/ai.js
 * AI parsing service — placeholder implementations.
 *
 * Replace the bodies of parseResumeWithAI() and analyzeJobDescription()
 * with real API calls (OpenAI / Claude) when ready.
 *
 * Environment variable (for future use):
 *   VITE_AI_API_KEY  (never expose this in client-side code — use a proxy)
 */

// ── Internal: rule-based local parser (Sprint 1 mock) ─────────────────────────

/**
 * Extracts skill-like tokens from text using a simple heuristic list.
 */
function extractSkillsFromText(text) {
  const knownSkills = [
    'javascript','typescript','python','java','c++','c#','go','rust','swift','kotlin','ruby','php',
    'react','vue','angular','svelte','next.js','nuxt','node.js','express','django','flask','fastapi',
    'sql','postgresql','mysql','mongodb','redis','firebase','supabase','graphql','rest','api',
    'docker','kubernetes','aws','gcp','azure','terraform','ci/cd','git','github','linux',
    'figma','photoshop','illustrator','sketch','ux','ui','html','css','sass','tailwind',
    'machine learning','deep learning','ai','nlp','data analysis','excel','tableau','power bi',
    'project management','agile','scrum','leadership','communication','problem solving',
  ];

  const lower = text.toLowerCase();
  return knownSkills.filter(skill => lower.includes(skill));
}

/**
 * Split text into rough bullet points / sentences.
 */
function extractBullets(text, maxItems = 5) {
  return text
    .split(/[\n\r•\-–|]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300)
    .slice(0, maxItems);
}

/**
 * Extract name: try first two capitalized words at top of text.
 */
function extractName(text) {
  const firstLine = text.split('\n')[0].trim();
  const titleCase = /^([A-Z][a-z]+ ){1,2}[A-Z][a-z]+/.exec(firstLine);
  return titleCase ? titleCase[0] : 'Candidate';
}

/**
 * Extract education blocks: look for "university", "bachelor", "master", etc.
 */
function extractEducation(text) {
  const eduKeywords = /university|college|bachelor|master|phd|diploma|degree|b\.sc|m\.sc|b\.eng|mba/i;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const hits = lines.filter(l => eduKeywords.test(l)).slice(0, 3);
  return hits.length
    ? hits.map(h => ({ institution: h, degree: '', year: '' }))
    : [{ institution: 'Not specified', degree: '', year: '' }];
}

/**
 * Extract experience blocks from text.
 */
function extractExperience(text) {
  const bullets = extractBullets(text, 4);
  return bullets.length
    ? bullets.map(b => ({ role: '', company: '', description: b }))
    : [{ role: '', company: '', description: 'Experience not detected — please use the manual form.' }];
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * parseResumeWithAI(rawText: string): Promise<ParsedResume>
 *
 * SPRINT 1: Local heuristic parser (mock).
 * FUTURE: Replace with fetch() to OpenAI / Anthropic API.
 *
 * Returns:
 * {
 *   name: string,
 *   skills: string[],
 *   experience: { role, company, description }[],
 *   education: { institution, degree, year }[],
 *   raw_text: string
 * }
 */
export async function parseResumeWithAI(rawText) {
  // Simulate async AI call latency
  await delay(900);

  // TODO: Replace this block with real AI API call
  // Example (OpenAI):
  // const res = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${PROXY_TOKEN}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     model: 'gpt-4o-mini',
  //     messages: [{ role: 'user', content: PARSE_RESUME_PROMPT + rawText }]
  //   })
  // });
  // const json = await res.json();
  // return JSON.parse(json.choices[0].message.content);

  const parsed = {
    name: extractName(rawText),
    skills: extractSkillsFromText(rawText),
    experience: extractExperience(rawText),
    education: extractEducation(rawText),
    raw_text: rawText,
  };

  console.log('[AI] parseResumeWithAI result:', parsed);
  return parsed;
}

/**
 * analyzeJobDescription(rawText: string, title?: string, company?: string): Promise<ParsedJob>
 *
 * SPRINT 1: Local heuristic parser (mock).
 * FUTURE: Replace with real AI call.
 *
 * Returns:
 * {
 *   title: string,
 *   company: string,
 *   required_skills: string[],
 *   keywords: string[],
 *   responsibilities: string[],
 *   raw_text: string
 * }
 */
export async function analyzeJobDescription(rawText, title = '', company = '') {
  await delay(700);

  // TODO: Replace with real AI API call

  const skills = extractSkillsFromText(rawText);

  // Keywords: nouns / important phrases (simple heuristic — take 10 unique significant words)
  const stopWords = new Set(['the','a','an','in','on','at','to','for','of','and','or','with','is','are','will','you','your','our','be','we','this','that','have','has','can','as','by','from','it','its']);
  const words = rawText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);

  const responsibilities = extractBullets(rawText, 5);

  const parsed = {
    title: title || extractTitle(rawText),
    company: company || extractCompany(rawText),
    required_skills: skills,
    keywords,
    responsibilities,
    raw_text: rawText,
  };

  console.log('[AI] analyzeJobDescription result:', parsed);
  return parsed;
}

/**
 * convertChatToResume(messages: {role, text}[]): Promise<string>
 * Converts a chat conversation into a raw resume-like text for further parsing.
 */
export async function convertChatToResume(messages) {
  await delay(600);

  // TODO: Replace with AI summary
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.text)
    .join('\n');

  return userMessages;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractTitle(text) {
  const patterns = [
    /(?:position|role|title|job title)[:\s]+([^\n,\.]{3,50})/i,
    /^([A-Z][a-zA-Z\s\/\-]{5,40})(?:\n|$)/m,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return m[1].trim();
  }
  return 'Open Position';
}

function extractCompany(text) {
  const m = /(?:company|at|employer)[:\s]+([A-Z][a-zA-Z\s&,\.]{2,40})/i.exec(text);
  return m ? m[1].trim() : 'Company';
}

export default { parseResumeWithAI, analyzeJobDescription, convertChatToResume };
