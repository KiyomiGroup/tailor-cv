/**
 * utils/helpers.js
 * General utility functions
 */

// ── Session ID ─────────────────────────────────────────────────────────────
export function getSessionId() {
  let id = sessionStorage.getItem('resumeai_session');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('resumeai_session', id);
  }
  return id;
}

// ── Toast notifications ────────────────────────────────────────────────────
export function showToast(message, type = 'default', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${type === 'success' ? iconCheck() : type === 'error' ? iconX() : iconInfo()}
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

// ── File text extraction ───────────────────────────────────────────────────
/**
 * Extract raw text from PDF or DOCX file.
 * Sprint 1: basic text extraction placeholder.
 * For real PDF parsing, integrate PDF.js or pdfmake.
 */
export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt') {
    return await file.text();
  }

  if (ext === 'pdf') {
    // Use PDF.js if available (loaded via CDN)
    if (window.pdfjsLib) {
      return await extractTextPDF(file);
    }
    // Fallback: return placeholder
    return await readFileAsText(file).catch(() =>
      `[PDF] ${file.name} — PDF parsing requires PDF.js. Raw extraction attempted.`
    );
  }

  if (ext === 'docx') {
    // Use mammoth.js if available
    if (window.mammoth) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    return `[DOCX] ${file.name} — DOCX parsing requires mammoth.js.`;
  }

  return await file.text().catch(() => `[${ext.toUpperCase()}] ${file.name}`);
}

async function extractTextPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── Formatting ─────────────────────────────────────────────────────────────
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function truncate(str, n = 80) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── State store (simple observable) ───────────────────────────────────────
const _listeners = {};

export const store = {
  _data: {
    currentPage: 'onboarding', // onboarding | input | confirm
    inputMethod: null,         // upload | manual | chat
    rawResumeText: '',
    parsedResume: null,
    parsedJob: null,
    isParsingResume: false,
    isParsingJob: false,
    sessionId: getSessionId(),
  },

  get(key) { return this._data[key]; },

  set(key, value) {
    this._data[key] = value;
    ((_listeners[key] || []).concat(_listeners['*'] || [])).forEach(fn => fn(value, key));
  },

  subscribe(key, fn) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(fn);
    return () => { _listeners[key] = _listeners[key].filter(f => f !== fn); };
  },
};

// ── Simple icons (SVG strings) ──────────────────────────────────────────────
export function iconUpload() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
}
export function iconSparkle() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
}
export function iconEdit() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
}
export function iconCheck() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
}
export function iconX() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}
export function iconInfo() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
}
export function iconArrowRight() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
}
export function iconBriefcase() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
}
export function iconSend() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
}
export function iconPlus() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
}
