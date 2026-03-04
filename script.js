/**
 * TailorCV — script.js
 * =====================================================================
 * Pure client-side tailoring engine.
 * No APIs, no backend, no dependencies.
 *
 * Architecture:
 *  1. Router      — page/step navigation
 *  2. Keyword Engine — extract & score keywords from JD
 *  3. Resume Tailor  — restructure & highlight resume content
 *  4. Cover Letter   — template-based generator
 *  5. Output Utils   — copy, download (.txt / .pdf)
 *  6. LocalStorage   — save/restore user inputs
 * =====================================================================
 */

'use strict';

/* ================================================================
   1. ROUTER — Page & Step Navigation
   ================================================================ */

/**
 * Show a top-level page section and hide others.
 * @param {string} pageId - 'landing' | 'input' | 'output'
 */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (pageId === 'input') {
    restoreInputs();
    goToStep(1);
  }
  if (pageId === 'output') {
    // triggered programmatically after generation
  }
}

/**
 * Navigate between the 3 input wizard steps.
 * @param {number} stepNum - 1 | 2 | 3
 */
function goToStep(stepNum) {
  // Validate before advancing
  if (stepNum === 2 && !validateStep1()) return;
  if (stepNum === 3 && !validateStep2()) return;

  // Hide all steps
  document.querySelectorAll('.input-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));

  // Activate target step
  const step = document.getElementById(`step-${stepNum}`);
  if (step) step.classList.add('active');

  const dot = document.getElementById(`dot-${stepNum}`);
  if (dot) dot.classList.add('active');

  // Populate summary on step 3
  if (stepNum === 3) populateSummary();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  saveInputs();
}

/* ================================================================
   2. VALIDATION
   ================================================================ */

function validateStep1() {
  const jobTitle = val('job-title');
  const company  = val('company-name');
  const jd       = val('job-description');

  if (!jobTitle) { flashError('job-title', 'Please enter the job title.'); return false; }
  if (!company)  { flashError('company-name', 'Please enter the company name.'); return false; }
  if (jd.split(/\s+/).length < 20) {
    flashError('job-description', 'Please paste a more complete job description (at least 20 words).');
    return false;
  }
  return true;
}

function validateStep2() {
  const resume = val('resume-content');
  if (resume.split(/\s+/).length < 30) {
    flashError('resume-content', 'Please paste more resume content (at least 30 words).');
    return false;
  }
  return true;
}

function flashError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.style.borderColor = '#c0392b';
  el.style.boxShadow   = '0 0 0 3px rgba(192,57,43,0.12)';
  el.focus();

  // Show inline error message
  const existing = el.parentNode.querySelector('.field-error');
  if (existing) existing.remove();
  const errEl = document.createElement('span');
  errEl.className = 'field-error';
  errEl.style.cssText = 'font-size:0.78rem;color:#c0392b;margin-top:3px;display:block;';
  errEl.textContent = msg;
  el.parentNode.appendChild(errEl);

  // Auto-clear
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow = '';
    if (errEl.parentNode) errEl.remove();
  }, 3500);
}

/* ================================================================
   3. KEYWORD ENGINE
   ================================================================ */

/**
 * Common stopwords to exclude from keyword extraction.
 */
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'as','by','from','up','about','into','through','during','including',
  'until','against','among','throughout','despite','towards','upon',
  'we','you','our','your','their','they','this','that','these','those',
  'is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall',
  'can','need','dare','ought','used','not','no','nor','so','yet','both',
  'either','neither','each','every','all','any','few','more','most',
  'other','some','such','same','than','too','very','just','because',
  'if','then','else','when','where','who','which','how','what','there',
  'here','also','only','even','well','back','still','between','into',
  'must','it','its','we','us','he','she','him','her','them','i','me',
  'my','myself','yourself','himself','herself','itself','themselves',
  'was','were','am','able','across','along','already','although',
  'always','another','around','away','before','behind','below','beside',
  'beyond','bring','came','come','coming','down','during','end','ensure',
  'first','following','given','going','good','great','help','high',
  'including','large','like','long','look','make','making','many',
  'new','next','off','often','one','over','own','part','per','place',
  'point','provide','put','rather','related','right','role','since',
  'set','strong','take','time','two','use','using','want','well',
  'within','work','working','world','year','years','provide','ensure',
]);

/**
 * Extract meaningful keywords from job description text.
 * Returns array of { word, count, isSkill } sorted by relevance.
 * @param {string} text
 * @returns {Array<{word:string, count:number, isSkill:boolean}>}
 */
function extractKeywords(text) {
  const lower = text.toLowerCase();

  // Tokenize: keep alpha, numbers, hyphens
  const tokens = lower.match(/[a-z][a-z0-9\-+#.]{1,}/g) || [];

  const freq = {};
  tokens.forEach(t => {
    const clean = t.replace(/[^a-z0-9+#]/g, '').trim();
    if (clean.length < 3) return;
    if (STOPWORDS.has(clean)) return;
    freq[clean] = (freq[clean] || 0) + 1;
  });

  // Also extract 2-word phrases (bigrams) that appear often
  const bigrams = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i].replace(/[^a-z0-9+#]/g, '');
    const b = tokens[i+1].replace(/[^a-z0-9+#]/g, '');
    if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
    if (a.length < 2 || b.length < 2) continue;
    const bg = `${a} ${b}`;
    bigrams[bg] = (bigrams[bg] || 0) + 1;
  }

  // Known skills / technologies boost list
  const SKILL_HINTS = new Set([
    'python','javascript','typescript','java','sql','r','scala','go','rust','swift',
    'react','angular','vue','node','nodejs','django','flask','fastapi','spring',
    'aws','gcp','azure','docker','kubernetes','terraform','git','linux',
    'machine learning','deep learning','data science','analytics','tableau','powerbi',
    'agile','scrum','kanban','jira','confluence',
    'product management','roadmap','stakeholder','ux','ui','figma','sketch',
    'a/b testing','ab testing','hypothesis','conversion','funnel','retention','churn',
    'marketing','seo','sem','copywriting','content','branding',
    'excel','powerpoint','google sheets','looker','dbt','airflow',
    'communication','leadership','collaboration','problem solving','critical thinking',
    'project management','strategy','operations','finance','budgeting',
    'api','rest','graphql','microservices','ci/cd','devops','cloud',
    'data analysis','visualization','reporting','forecasting','modeling',
    'customer success','account management','sales','pipeline','crm','salesforce',
    'recruiting','hr','talent','onboarding','performance',
    'writing','editing','research','presentation',
  ]);

  // Combine single tokens + bigrams
  const results = {};

  Object.entries(freq).forEach(([word, count]) => {
    results[word] = {
      word,
      count,
      isSkill: SKILL_HINTS.has(word) || count >= 2,
    };
  });

  Object.entries(bigrams).forEach(([phrase, count]) => {
    if (count >= 1) {
      results[phrase] = {
        word: phrase,
        count: count * 2, // boost bigrams
        isSkill: SKILL_HINTS.has(phrase) || count >= 2,
      };
    }
  });

  return Object.values(results)
    .filter(k => k.count >= 1)
    .sort((a, b) => {
      // Prioritize: skill > count
      if (b.isSkill !== a.isSkill) return b.isSkill ? 1 : -1;
      return b.count - a.count;
    })
    .slice(0, 60); // top 60 keywords
}

/**
 * Score how well the resume matches the job description.
 * Returns 0–100.
 * @param {string} resumeText
 * @param {Array} keywords
 * @returns {number}
 */
function scoreMatch(resumeText, keywords) {
  if (!keywords.length) return 0;
  const lower = resumeText.toLowerCase();
  const topKeywords = keywords.slice(0, 30);
  const matched = topKeywords.filter(k => lower.includes(k.word));
  return Math.round((matched.length / topKeywords.length) * 100);
}

/* ================================================================
   4. RESUME TAILOR
   ================================================================ */

/**
 * Action verbs for bullet point rephrasing.
 * Grouped by function area.
 */
const ACTION_VERBS = {
  leadership:  ['Led','Directed','Spearheaded','Championed','Orchestrated','Oversaw','Guided','Managed','Supervised','Mentored'],
  achievement: ['Achieved','Delivered','Exceeded','Attained','Surpassed','Secured','Earned','Won','Generated'],
  creation:    ['Built','Developed','Designed','Created','Launched','Established','Implemented','Deployed','Shipped','Engineered'],
  improvement: ['Improved','Optimized','Enhanced','Streamlined','Accelerated','Boosted','Increased','Elevated','Refined'],
  analysis:    ['Analyzed','Evaluated','Assessed','Researched','Investigated','Identified','Measured','Tracked','Monitored'],
  collaboration:['Collaborated','Partnered','Coordinated','Aligned','Facilitated','Supported','Enabled','Worked'],
  communication:['Presented','Communicated','Articulated','Authored','Wrote','Documented','Reported','Briefed'],
};

/**
 * Identify which category best fits a bullet point.
 */
function categorize(bullet) {
  const b = bullet.toLowerCase();
  if (/lead|manag|direct|supervis|oversee/i.test(b))    return 'leadership';
  if (/achiev|deliver|exceed|surpass|win|generat/i.test(b)) return 'achievement';
  if (/build|develop|design|create|launch|implement|engineer/i.test(b)) return 'creation';
  if (/improv|optim|enhanc|stream|boost|increas/i.test(b)) return 'improvement';
  if (/analyz|evaluat|assess|research|investigat|measur|track/i.test(b)) return 'analysis';
  if (/collaborat|partner|coordinat|align|facilitat/i.test(b)) return 'collaboration';
  if (/present|communicat|articul|author|wrote|document|report/i.test(b)) return 'communication';
  return 'creation';
}

/**
 * Pick a strong action verb. Avoid repeating.
 */
const usedVerbs = new Set();
function pickVerb(category) {
  const pool = ACTION_VERBS[category] || ACTION_VERBS.creation;
  for (const v of pool) {
    if (!usedVerbs.has(v)) {
      usedVerbs.add(v);
      return v;
    }
  }
  // Reset if all used
  usedVerbs.clear();
  return pool[0];
}

/**
 * Rephrase a single bullet point to be stronger and more JD-aligned.
 * Injects keywords where naturally possible.
 * @param {string} bullet
 * @param {Array} keywords
 * @returns {string}
 */
function rephraseBullet(bullet, keywords) {
  if (!bullet || bullet.trim().length < 5) return bullet;

  const b = bullet.trim().replace(/^[-•*·▪▸➤►»>]+\s*/, '');
  if (!b) return bullet;

  const cat     = categorize(b);
  const verb    = pickVerb(cat);

  // Remove leading weak verbs for replacement
  const stripped = b.replace(
    /^(managed|led|helped|assisted|worked on|responsible for|handled|did|made|used|utilized|participated in|involved in)\s+/i,
    ''
  );

  // Check if any top keyword should be injected
  const topSkills = keywords.filter(k => k.isSkill).slice(0, 15).map(k => k.word);
  let enriched = stripped;

  // Attempt to inject a relevant keyword naturally if not already present
  const lowerEnriched = enriched.toLowerCase();
  for (const skill of topSkills) {
    if (!lowerEnriched.includes(skill.toLowerCase())) {
      // Only inject if the sentence context seems relevant
      if (isContextuallyRelevant(b, skill)) {
        enriched = enriched + ` leveraging ${skill}`;
        break;
      }
    }
  }

  return `• ${verb} ${enriched}`;
}

/**
 * Heuristic: is a keyword likely relevant to this bullet?
 */
function isContextuallyRelevant(bullet, skill) {
  const b = bullet.toLowerCase();
  const s = skill.toLowerCase();

  // Soft match: check if skill is in related domain
  const techSkills = ['python','sql','javascript','react','aws','docker','api','data'];
  const softSkills = ['agile','scrum','stakeholder','roadmap','communication','leadership'];
  const isTechBullet = /data|code|develop|engineer|technical|system|software|platform/i.test(b);
  const isSoftBullet = /team|stakeholder|strategy|process|manage|lead|plan|align/i.test(b);

  if (isTechBullet && techSkills.some(ts => s.includes(ts))) return true;
  if (isSoftBullet && softSkills.some(ss => s.includes(ss))) return true;
  return false;
}

/**
 * Parse resume plain text into structured sections.
 * @param {string} text
 * @returns {{name:string, sections:Array<{heading:string, content:string[]}>}}
 */
function parseResume(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (!lines.length) return { name: '', sections: [] };

  // Heuristic: first non-empty line is probably the person's name
  let nameGuess = '';
  if (lines[0] && lines[0].length < 60 && !/^(experience|skills|education|summary|objective|profile)/i.test(lines[0])) {
    nameGuess = lines[0];
  }

  const SECTION_HEADINGS = /^(experience|work experience|professional experience|employment|skills|technical skills|education|projects|certifications|summary|profile|objective|accomplishments|awards|volunteer|languages|interests|references)/i;

  const sections = [];
  let current = { heading: 'HEADER', content: [] };

  for (let i = (nameGuess ? 1 : 0); i < lines.length; i++) {
    const line = lines[i];
    if (SECTION_HEADINGS.test(line) || (line === line.toUpperCase() && line.length > 3 && line.length < 40)) {
      if (current.content.length) sections.push(current);
      current = { heading: line.toUpperCase(), content: [] };
    } else {
      current.content.push(line);
    }
  }
  if (current.content.length || current.heading !== 'HEADER') {
    sections.push(current);
  }

  return { name: nameGuess, sections };
}

/**
 * Main resume tailoring function.
 * @param {string} resumeText
 * @param {Array} keywords
 * @param {string} jobTitle
 * @param {string} company
 * @returns {string} tailored resume as plain text
 */
function tailorResume(resumeText, keywords, jobTitle, company) {
  usedVerbs.clear();

  const { name, sections } = parseResume(resumeText);
  const topKeywords = keywords.slice(0, 20).map(k => k.word);

  const output = [];

  // Header
  if (name) {
    output.push(name.toUpperCase());
    output.push('─'.repeat(Math.min(name.length, 40)));
  }

  for (const section of sections) {
    const heading = section.heading;
    output.push('');
    output.push(heading);
    output.push('─'.repeat(heading.length));

    const isExperience = /experience|employment|work/i.test(heading);
    const isSkills = /skill/i.test(heading);

    if (isSkills) {
      // Augment skills section with relevant keywords not already mentioned
      const existingSkills = section.content.join(' ').toLowerCase();
      const newSkills = topKeywords.filter(kw => !existingSkills.includes(kw.toLowerCase()));

      section.content.forEach(line => output.push(line));

      if (newSkills.length > 0) {
        output.push('');
        output.push('Additional Relevant Skills: ' + newSkills.slice(0, 8).map(capitalizeFirst).join(', '));
      }
    } else if (isExperience) {
      for (const line of section.content) {
        const isBullet = /^[-•*·▪▸➤►»>]/.test(line) || /^\s{2,}[-•]/.test(line);
        if (isBullet) {
          output.push(rephraseBullet(line, keywords));
        } else {
          output.push(line);
        }
      }
    } else {
      section.content.forEach(line => output.push(line));
    }
  }

  // If no sections detected, treat as flat bullet list
  if (!sections.length) {
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l);
    for (const line of lines) {
      const isBullet = /^[-•*·▪▸]/.test(line);
      output.push(isBullet ? rephraseBullet(line, keywords) : line);
    }
  }

  output.push('');
  output.push(`— Tailored for: ${jobTitle} at ${company}`);

  return output.join('\n');
}

/* ================================================================
   5. COVER LETTER GENERATOR
   ================================================================ */

/**
 * Template paragraphs for cover letter sections.
 * Varied so output feels less robotic.
 */
const CL_OPENINGS = [
  `I am writing to express my strong interest in the {jobTitle} position at {company}. With {yearsExp} of experience in this field, I am confident in my ability to make a meaningful contribution to your team.`,
  `It is with great enthusiasm that I apply for the {jobTitle} role at {company}. Over {yearsExp} working in this space, I have developed a strong foundation that aligns closely with what you're looking for.`,
  `I was excited to come across the {jobTitle} opening at {company}. Having dedicated {yearsExp} to honing the skills and expertise described in your job posting, I believe I am well-positioned to hit the ground running.`,
];

const CL_BODY_TEMPLATES = [
  `In my previous roles, I have consistently demonstrated the ability to deliver results across {skills}. I take a data-informed approach to decision-making and thrive in collaborative, fast-paced environments where strong communication and execution matter.`,
  `Throughout my career, I've built hands-on expertise in {skills}. I am known for translating complex challenges into clear, actionable plans and for working effectively across diverse teams to drive measurable outcomes.`,
  `My background spans {skills}, enabling me to bring both technical depth and strategic thinking to the table. I am passionate about solving difficult problems and building products and processes that genuinely move the needle.`,
];

const CL_MATCH_TEMPLATES = [
  `What particularly drew me to {company} is {companyReason}. The {jobTitle} role seems tailor-made for someone with my combination of skills and my commitment to delivering high-quality work.`,
  `{company}'s reputation for {companyReason} aligns strongly with my own professional values. I would be proud to bring my experience as a {jobTitle} to your team and contribute to your continued success.`,
  `I am especially drawn to {company} because of {companyReason}. The {jobTitle} role represents exactly the kind of challenge I've been seeking — one that demands both strategic thinking and hands-on execution.`,
];

const CL_CLOSINGS = [
  `I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your time and consideration. I look forward to the possibility of speaking with you soon.`,
  `I am eager to learn more about this opportunity and would love the chance to discuss how I can contribute to {company}. Thank you for considering my application.`,
  `Thank you for taking the time to review my application. I am excited about the possibility of joining {company} and contributing to the {jobTitle} team. I look forward to hearing from you.`,
];

const COMPANY_REASONS = [
  'innovation and commitment to excellence',
  'strong culture of collaboration and impact',
  'industry-leading approach and growth trajectory',
  'focus on meaningful work and customer outcomes',
  'reputation as a top employer and thought leader in the space',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a professional cover letter.
 * @param {Object} params
 * @returns {string}
 */
function generateCoverLetter({ jobTitle, company, yearsExp, applicantName, keywords }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const name  = applicantName || 'Your Name';
  const yrs   = yearsExp ? `${yearsExp}+ years` : 'several years';

  // Pick top 4–5 skill keywords for body
  const skills = keywords
    .filter(k => k.isSkill)
    .slice(0, 5)
    .map(k => capitalizeFirst(k.word))
    .join(', ');

  const companyReason = pickRandom(COMPANY_REASONS);

  const fill = (template) => template
    .replace(/\{jobTitle\}/g, jobTitle)
    .replace(/\{company\}/g,  company)
    .replace(/\{yearsExp\}/g, yrs)
    .replace(/\{skills\}/g,   skills || 'the relevant skills described in your posting')
    .replace(/\{companyReason\}/g, companyReason)
    .replace(/\{name\}/g,     name);

  const opening = fill(pickRandom(CL_OPENINGS));
  const body    = fill(pickRandom(CL_BODY_TEMPLATES));
  const match   = fill(pickRandom(CL_MATCH_TEMPLATES));
  const closing = fill(pickRandom(CL_CLOSINGS));

  return [
    today,
    '',
    'Hiring Manager',
    company,
    '',
    `Dear Hiring Manager,`,
    '',
    opening,
    '',
    body,
    '',
    match,
    '',
    closing,
    '',
    'Sincerely,',
    '',
    name,
  ].join('\n');
}

/* ================================================================
   6. MAIN GENERATION ORCHESTRATOR
   ================================================================ */

async function generateDocuments() {
  // Collect inputs
  const jobTitle   = val('job-title').trim();
  const company    = val('company-name').trim();
  const yearsExp   = val('years-exp').trim();
  const applicant  = val('applicant-name').trim();
  const jd         = val('job-description').trim();
  const resume     = val('resume-content').trim();

  if (!jd || !resume || !jobTitle || !company) {
    alert('Please fill in all required fields before generating.');
    return;
  }

  // Show loading overlay
  showLoading();

  // Simulate async step-by-step processing with deliberate delays
  // (makes the UX feel more considered)
  await delay(350);  activateLoadingStep(1);
  const keywords = extractKeywords(jd);
  await delay(550);  activateLoadingStep(2);

  const matchScore = scoreMatch(resume, keywords);
  await delay(650);  activateLoadingStep(3);

  const tailoredResume = tailorResume(resume, keywords, jobTitle, company);
  await delay(700);  activateLoadingStep(4);

  const coverLetter = generateCoverLetter({
    jobTitle, company, yearsExp, applicantName: applicant, keywords,
  });

  await delay(450);

  // Write outputs
  document.getElementById('resume-output').value = tailoredResume;
  document.getElementById('cover-output').value  = coverLetter;

  // Match score bar
  const adjustedScore = Math.max(matchScore, 30); // Always show at least 30% (base effort)
  animateBar('match-bar', 'match-pct', adjustedScore);
  animateBar('cover-bar', 'cover-pct', 92); // Cover letter is always highly personalized

  // Save to localStorage
  localStorage.setItem('tc_resume_output', tailoredResume);
  localStorage.setItem('tc_cover_output',  coverLetter);

  hideLoading();
  showPage('output');
}

/* ================================================================
   7. STEP 3 SUMMARY
   ================================================================ */

function populateSummary() {
  const jobTitle = val('job-title') || '—';
  const company  = val('company-name') || '—';
  const resume   = val('resume-content');
  const jd       = val('job-description');

  setText('summary-role',     jobTitle);
  setText('summary-company',  company);
  setText('summary-resume-len', resume ? `${resume.split(/\s+/).filter(Boolean).length} words` : '—');

  // Preview keywords
  if (jd) {
    const keywords = extractKeywords(jd);
    const resumeLower = resume.toLowerCase();
    const top = keywords.slice(0, 20);

    setText('summary-keywords', `${keywords.length} extracted, ${top.filter(k => resumeLower.includes(k.word)).length} matched in your resume`);

    const tagsContainer = document.getElementById('keyword-tags');
    tagsContainer.innerHTML = '';
    top.forEach(kw => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag' + (resumeLower.includes(kw.word) ? ' matched' : '');
      tag.textContent = capitalizeFirst(kw.word);
      tagsContainer.appendChild(tag);
    });
  }
}

/* ================================================================
   8. OUTPUT: TABS, COPY, DOWNLOAD
   ================================================================ */

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.output-panel').forEach(p => p.classList.remove('active'));

  const panel = document.getElementById(`panel-${name}`);
  const tabs  = document.querySelectorAll('.tab');
  if (panel) panel.classList.add('active');

  // Activate matching tab button
  tabs.forEach(t => {
    if ((name === 'resume' && t.textContent.includes('Resume')) ||
        (name === 'cover'  && t.textContent.includes('Cover'))) {
      t.classList.add('active');
    }
  });
}

/**
 * Copy textarea content to clipboard.
 * @param {string} textareaId
 * @param {HTMLElement} btn
 */
function copyToClipboard(textareaId, btn) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    el.select();
    document.execCommand('copy');
  });
}

/**
 * Download textarea content as a .txt file.
 * @param {string} textareaId
 * @param {string} filename
 */
function downloadTxt(textareaId, filename) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  const blob = new Blob([el.value], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${filename}.txt`);
}

/**
 * Download textarea content as a styled PDF using the print dialog.
 * Client-side only via window.print() targeting a temporary iframe.
 * @param {string} textareaId
 * @param {string} title
 */
function downloadPdf(textareaId, title) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  const content = el.value;

  // Convert plain text to simple HTML
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a18;
      max-width: 720px;
      margin: 40px auto;
      padding: 0 40px;
    }
    pre {
      white-space: pre-wrap;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
    h1 {
      font-size: 14pt;
      margin-bottom: 4px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 6px;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <pre>${escapeHtml(content)}</pre>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Pop-up blocked. Please allow pop-ups for this site to use PDF download, or use the .txt download instead.');
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ================================================================
   9. LOADING OVERLAY HELPERS
   ================================================================ */

function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.remove('hidden');
  // Reset all steps
  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById(`ls-${i}`);
    if (step) {
      step.classList.remove('active', 'done');
    }
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('hidden');
}

function activateLoadingStep(num) {
  for (let i = 1; i < num; i++) {
    const prev = document.getElementById(`ls-${i}`);
    if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
  }
  const step = document.getElementById(`ls-${num}`);
  if (step) step.classList.add('active');
}

/* ================================================================
   10. LOCALSTORAGE — Save & Restore
   ================================================================ */

function saveInputs() {
  const data = {
    jobTitle:    val('job-title'),
    companyName: val('company-name'),
    yearsExp:    val('years-exp'),
    applicant:   val('applicant-name'),
    jd:          val('job-description'),
    resume:      val('resume-content'),
  };
  try {
    localStorage.setItem('tc_inputs', JSON.stringify(data));
  } catch (e) {
    // localStorage full or unavailable
  }
}

function restoreInputs() {
  try {
    const raw = localStorage.getItem('tc_inputs');
    if (!raw) return;
    const data = JSON.parse(raw);
    setVal('job-title',       data.jobTitle    || '');
    setVal('company-name',    data.companyName || '');
    setVal('years-exp',       data.yearsExp    || '');
    setVal('applicant-name',  data.applicant   || '');
    setVal('job-description', data.jd          || '');
    setVal('resume-content',  data.resume      || '');
  } catch (e) {
    // ignore
  }
}

/* ================================================================
   11. UTILITIES
   ================================================================ */

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Animate a match score bar.
 * @param {string} barId
 * @param {string} pctId
 * @param {number} score 0–100
 */
function animateBar(barId, pctId, score) {
  const bar  = document.getElementById(barId);
  const pct  = document.getElementById(pctId);
  if (!bar || !pct) return;

  bar.style.width = '0%';
  pct.textContent = '0%';

  let current = 0;
  const step = score / 40;
  const interval = setInterval(() => {
    current = Math.min(current + step, score);
    bar.style.width = `${current}%`;
    pct.textContent = `${Math.round(current)}%`;
    if (current >= score) clearInterval(interval);
  }, 20);
}

/* ================================================================
   12. AUTO-SAVE ON INPUT CHANGE
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const inputIds = ['job-title','company-name','years-exp','applicant-name','job-description','resume-content'];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(saveInputs, 600));
    }
  });
});

/**
 * Simple debounce utility.
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
