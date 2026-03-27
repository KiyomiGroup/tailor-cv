/**
 * components/ResumeInput.js
 * Bento card: Resume input — upload / manual / chat tabs
 */
import {
  store, showToast, extractTextFromFile, formatFileSize,
  iconUpload, iconEdit, iconSparkle, iconSend, iconPlus, iconX
} from '../utils/helpers.js';
import { parseResumeWithAI, convertChatToResume } from '../services/ai.js';

export function renderResumeInput(container) {
  const method = store.get('inputMethod') || 'upload';
  const activeTab = method === 'chat' ? 'chat' : method === 'manual' ? 'manual' : 'upload';

  container.innerHTML = `
    <div class="card ri-card p-6">
      <!-- Card Header -->
      <div class="ri-header mb-4">
        <div>
          <p class="label">Step 1</p>
          <h2 class="display-2 mt-2">Your Resume</h2>
        </div>
        <div id="ri-status" class="ri-status hidden"></div>
      </div>

      <!-- Tabs -->
      <div class="tabs mb-4" id="ri-tabs">
        <button class="tab-btn ${activeTab === 'upload' ? 'active' : ''}" data-tab="upload">
          ${iconUpload()} Upload
        </button>
        <button class="tab-btn ${activeTab === 'manual' ? 'active' : ''}" data-tab="manual">
          ${iconEdit()} Manual
        </button>
        <button class="tab-btn ${activeTab === 'chat' ? 'active' : ''}" data-tab="chat">
          ${iconSparkle()} AI Chat
        </button>
      </div>

      <!-- Tab Panels -->
      <div id="ri-panels">
        <!-- Upload Panel -->
        <div id="tab-upload" class="ri-panel ${activeTab === 'upload' ? '' : 'hidden'}">
          <div class="drop-zone" id="drop-zone">
            <div class="drop-icon">${iconUpload()}</div>
            <p class="font-medium mb-2">Drop your resume here</p>
            <p class="text-sm text-muted mb-3">PDF or DOCX · up to 5MB</p>
            <button class="btn btn-secondary" id="browse-btn">Browse files</button>
            <input type="file" id="file-input" accept=".pdf,.docx,.txt" class="hidden" />
          </div>
          <div id="file-info" class="file-info hidden mt-3"></div>
        </div>

        <!-- Manual Panel -->
        <div id="tab-manual" class="ri-panel ${activeTab === 'manual' ? '' : 'hidden'}">
          <div class="ri-form">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input class="form-input" id="m-name" type="text" placeholder="e.g. Adaeze Okonkwo" />
            </div>

            <div class="form-group">
              <label class="form-label">Skills</label>
              <div class="skill-tag-input-row">
                <input class="form-input" id="m-skill-input" type="text" placeholder="Type a skill and press Enter" />
                <button class="btn btn-secondary" id="m-add-skill">${iconPlus()} Add</button>
              </div>
              <div class="skill-tags" id="m-skills-container"></div>
            </div>

            <div class="form-group">
              <label class="form-label">Work Experience</label>
              <textarea class="form-textarea" id="m-experience" rows="4"
                placeholder="Describe your most recent roles, responsibilities, and achievements…"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Education</label>
              <textarea class="form-textarea" id="m-education" rows="2"
                placeholder="e.g. BSc Computer Science, University of Lagos, 2020"></textarea>
            </div>
          </div>
        </div>

        <!-- Chat Panel -->
        <div id="tab-chat" class="ri-panel ${activeTab === 'chat' ? '' : 'hidden'}">
          <div class="chat-container" id="chat-container">
            <div class="chat-bubble ai">
              👋 Hi! Tell me about your professional background. What kind of work have you done,
              and what are your main skills? I'll structure it into a resume for you.
            </div>
          </div>
          <div class="chat-input-row">
            <input class="form-input" id="chat-input" type="text"
              placeholder="Describe your experience…" />
            <button class="btn btn-primary" id="chat-send">
              ${iconSend()}
            </button>
          </div>
          <p class="text-xs text-muted mt-2">Press Enter or click Send. Type "done" when finished.</p>
        </div>
      </div>

      <!-- Parse Button -->
      <div class="mt-4">
        <button class="btn btn-primary btn-full" id="parse-resume-btn">
          Parse Resume with AI
        </button>
      </div>

      <!-- Parsed Preview -->
      <div id="ri-preview" class="hidden mt-4"></div>
    </div>
  `;

  // ── State ────────────────────────────────────────────────────────────────
  let currentTab = activeTab;
  let uploadedFile = null;
  let manualSkills = [];
  let chatMessages = [];

  // ── Tab switching ────────────────────────────────────────────────────────
  document.querySelectorAll('#ri-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      currentTab = tab;
      document.querySelectorAll('#ri-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.ri-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`tab-${tab}`).classList.remove('hidden');
    });
  });

  // ── Upload logic ─────────────────────────────────────────────────────────
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  document.getElementById('browse-btn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    if (!file) return;
    const allowed = ['pdf', 'docx', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      showToast('Please upload a PDF, DOCX, or TXT file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File must be under 5MB', 'error');
      return;
    }
    uploadedFile = file;
    const info = document.getElementById('file-info');
    info.classList.remove('hidden');
    info.innerHTML = `
      <div class="file-info-inner">
        <div class="file-icon">📄</div>
        <div>
          <p class="font-medium text-sm">${file.name}</p>
          <p class="text-xs text-muted">${formatFileSize(file.size)} · ${ext.toUpperCase()}</p>
        </div>
        <button class="btn btn-ghost file-remove" id="file-remove">Remove</button>
      </div>
    `;
    document.getElementById('file-remove').addEventListener('click', () => {
      uploadedFile = null;
      info.classList.add('hidden');
      fileInput.value = '';
    });
    showToast(`${file.name} ready`, 'success', 2000);
  }

  // ── Manual skills ────────────────────────────────────────────────────────
  function addSkill(skill) {
    const s = skill.trim();
    if (!s || manualSkills.includes(s)) return;
    manualSkills.push(s);
    renderSkillTags();
  }

  function renderSkillTags() {
    const c = document.getElementById('m-skills-container');
    c.innerHTML = manualSkills.map(s => `
      <span class="skill-tag">
        ${s}
        <button class="remove-tag" data-skill="${s}">×</button>
      </span>
    `).join('');
    c.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        manualSkills = manualSkills.filter(sk => sk !== btn.dataset.skill);
        renderSkillTags();
      });
    });
  }

  const skillInput = document.getElementById('m-skill-input');
  skillInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput.value); skillInput.value = ''; }
  });
  document.getElementById('m-add-skill').addEventListener('click', () => {
    addSkill(skillInput.value); skillInput.value = '';
  });

  // ── Chat logic ───────────────────────────────────────────────────────────
  const chatContainer = document.getElementById('chat-container');
  const chatInputEl = document.getElementById('chat-input');

  const AI_PROMPTS = [
    "Great! Now tell me about your education — where did you study and what did you study?",
    "What are the top 3–5 skills you'd say define your professional profile?",
    "Any notable achievements or projects you'd like to highlight?",
    "Got it! Type 'done' whenever you're ready, and I'll structure everything into a resume.",
  ];
  let aiPromptIndex = 0;

  function appendBubble(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendChat() {
    const text = chatInputEl.value.trim();
    if (!text) return;
    chatInputEl.value = '';
    appendBubble(text, 'user');
    chatMessages.push({ role: 'user', text });

    if (text.toLowerCase() === 'done') {
      appendBubble("Perfect! Click 'Parse Resume with AI' below to process your answers.", 'ai');
      return;
    }

    // AI follow-up
    await delay(600);
    const nextPrompt = AI_PROMPTS[aiPromptIndex] || "Thanks! Anything else to add, or type 'done' to continue.";
    aiPromptIndex = Math.min(aiPromptIndex + 1, AI_PROMPTS.length - 1);
    appendBubble(nextPrompt, 'ai');
    chatMessages.push({ role: 'ai', text: nextPrompt });
  }

  document.getElementById('chat-send').addEventListener('click', sendChat);
  chatInputEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  // ── Parse button ─────────────────────────────────────────────────────────
  document.getElementById('parse-resume-btn').addEventListener('click', async () => {
    const btn = document.getElementById('parse-resume-btn');
    let rawText = '';

    try {
      if (currentTab === 'upload') {
        if (!uploadedFile) { showToast('Please upload a file first', 'error'); return; }
        rawText = await extractTextFromFile(uploadedFile);

      } else if (currentTab === 'manual') {
        const name = document.getElementById('m-name').value.trim();
        if (!name) { showToast('Please enter your name', 'error'); return; }
        const exp = document.getElementById('m-experience').value.trim();
        const edu = document.getElementById('m-education').value.trim();
        rawText = `${name}\n\nSkills: ${manualSkills.join(', ')}\n\nExperience:\n${exp}\n\nEducation:\n${edu}`;

      } else if (currentTab === 'chat') {
        if (chatMessages.filter(m => m.role === 'user').length === 0) {
          showToast('Please chat with the AI assistant first', 'error'); return;
        }
        rawText = await convertChatToResume(chatMessages);
      }

      // Parsing state
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Parsing…`;
      store.set('isParsingResume', true);

      const parsed = await parseResumeWithAI(rawText);
      store.set('parsedResume', parsed);
      store.set('rawResumeText', rawText);

      // Show status badge
      const statusEl = document.getElementById('ri-status');
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = `<span class="badge badge-green">✓ Parsed</span>`;

      // Show preview
      showParsedPreview(parsed);
      showToast('Resume parsed successfully!', 'success');

    } catch (err) {
      console.error(err);
      showToast('Error parsing resume. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Re-parse Resume';
      store.set('isParsingResume', false);
    }
  });

  function showParsedPreview(parsed) {
    const preview = document.getElementById('ri-preview');
    preview.classList.remove('hidden');
    preview.innerHTML = `
      <div class="parsed-preview">
        <p class="parsed-section-title">Parsed Preview</p>
        <div class="parsed-section">
          <p class="text-xs text-muted">Name</p>
          <p class="font-medium">${parsed.name}</p>
        </div>
        <div class="parsed-section">
          <p class="text-xs text-muted">Skills detected (${parsed.skills.length})</p>
          <div class="skill-tags">
            ${parsed.skills.slice(0, 8).map(s => `<span class="skill-tag">${s}</span>`).join('')}
            ${parsed.skills.length > 8 ? `<span class="text-xs text-muted">+${parsed.skills.length - 8} more</span>` : ''}
          </div>
        </div>
        <div class="parsed-section">
          <p class="text-xs text-muted">Experience entries</p>
          <p class="text-sm">${parsed.experience.length} found</p>
        </div>
        <div class="parsed-section">
          <p class="text-xs text-muted">Education</p>
          <p class="text-sm">${parsed.education.map(e => e.institution).join(', ')}</p>
        </div>
      </div>
    `;
  }

  injectResumeInputStyles();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function injectResumeInputStyles() {
  if (document.getElementById('ri-styles')) return;
  const s = document.createElement('style');
  s.id = 'ri-styles';
  s.textContent = `
    .ri-card { height: 100%; }
    .ri-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .ri-status { display: flex; align-items: center; }
    .ri-form { display: flex; flex-direction: column; gap: 14px; }
    .skill-tag-input-row { display: flex; gap: 8px; }
    .skill-tag-input-row .form-input { flex: 1; }

    .file-info-inner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
    }

    .file-icon { font-size: 1.4rem; }
    .file-remove { margin-left: auto; padding: 6px 12px; font-size: 0.82rem; }

    .tabs .tab-btn { display: flex; align-items: center; gap: 5px; font-size: 0.82rem; }

    @media (max-width: 480px) {
      .tabs { flex-wrap: wrap; }
    }
  `;
  document.head.appendChild(s);
}
