/**
 * components/JobInput.js
 * Bento card: Job description input + AI analysis
 */
import { store, showToast, iconBriefcase } from '../utils/helpers.js';
import { analyzeJobDescription } from '../services/ai.js';

export function renderJobInput(container) {
  container.innerHTML = `
    <div class="card ji-card p-6">
      <!-- Header -->
      <div class="ji-header mb-4">
        <div>
          <p class="label">Step 2</p>
          <h2 class="display-2 mt-2">Target Job</h2>
        </div>
        <div id="ji-status" class="ji-status hidden"></div>
      </div>

      <!-- Optional meta fields -->
      <div class="bento-grid grid-2 mb-4" id="ji-meta">
        <div class="form-group">
          <label class="form-label">Job Title <span class="text-muted">(optional)</span></label>
          <input class="form-input" id="ji-title" type="text" placeholder="e.g. Senior Frontend Engineer" />
        </div>
        <div class="form-group">
          <label class="form-label">Company <span class="text-muted">(optional)</span></label>
          <input class="form-input" id="ji-company" type="text" placeholder="e.g. Paystack" />
        </div>
      </div>

      <!-- JD textarea -->
      <div class="form-group mb-4">
        <label class="form-label">Job Description *</label>
        <textarea class="form-textarea ji-textarea" id="ji-description"
          placeholder="Paste the full job description here — requirements, responsibilities, qualifications…"></textarea>
        <p class="text-xs text-muted mt-2" id="ji-char-count">0 characters</p>
      </div>

      <!-- Quick tips -->
      <div class="ji-tips mb-4">
        <p class="text-xs text-muted">
          💡 Include the full JD for best results — requirements, responsibilities, and qualifications.
        </p>
      </div>

      <!-- Analyze button -->
      <button class="btn btn-primary btn-full" id="analyze-jd-btn">
        Analyze Job Description
      </button>

      <!-- Parsed preview -->
      <div id="ji-preview" class="hidden mt-4"></div>
    </div>
  `;

  // ── Character count ───────────────────────────────────────────────────────
  const textarea = document.getElementById('ji-description');
  const charCount = document.getElementById('ji-char-count');

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    charCount.textContent = `${len} character${len !== 1 ? 's' : ''}`;
    charCount.style.color = len > 100 ? 'var(--green)' : 'var(--ink-3)';
  });

  // ── Analyze button ────────────────────────────────────────────────────────
  document.getElementById('analyze-jd-btn').addEventListener('click', async () => {
    const rawText = textarea.value.trim();
    if (!rawText || rawText.length < 50) {
      showToast('Please paste a job description (at least 50 characters)', 'error');
      return;
    }

    const title = document.getElementById('ji-title').value.trim();
    const company = document.getElementById('ji-company').value.trim();
    const btn = document.getElementById('analyze-jd-btn');

    try {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Analyzing…`;
      store.set('isParsingJob', true);

      const parsed = await analyzeJobDescription(rawText, title, company);
      store.set('parsedJob', parsed);

      // Status badge
      const statusEl = document.getElementById('ji-status');
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = `<span class="badge badge-green">✓ Analyzed</span>`;

      // Preview
      showParsedJobPreview(parsed);
      showToast('Job description analyzed!', 'success');

    } catch (err) {
      console.error(err);
      showToast('Error analyzing job description. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Re-analyze';
      store.set('isParsingJob', false);
    }
  });

  function showParsedJobPreview(parsed) {
    const preview = document.getElementById('ji-preview');
    preview.classList.remove('hidden');
    preview.innerHTML = `
      <div class="parsed-preview">
        <p class="parsed-section-title">Analysis Preview</p>
        <div class="parsed-section">
          <p class="text-xs text-muted">Position</p>
          <p class="font-medium">${parsed.title}${parsed.company ? ` · ${parsed.company}` : ''}</p>
        </div>
        <div class="parsed-section">
          <p class="text-xs text-muted">Required Skills (${parsed.required_skills.length})</p>
          <div class="skill-tags">
            ${parsed.required_skills.slice(0, 8).map(s => `<span class="skill-tag">${s}</span>`).join('')}
            ${parsed.required_skills.length > 8 ? `<span class="text-xs text-muted">+${parsed.required_skills.length - 8} more</span>` : ''}
            ${parsed.required_skills.length === 0 ? '<span class="text-xs text-muted">None detected</span>' : ''}
          </div>
        </div>
        <div class="parsed-section">
          <p class="text-xs text-muted">Key Keywords</p>
          <div class="skill-tags">
            ${parsed.keywords.slice(0, 6).map(k => `<span class="skill-tag" style="background:var(--amber-light);color:#92400e">${k}</span>`).join('')}
          </div>
        </div>
        <div class="parsed-section">
          <p class="text-xs text-muted">Responsibilities (${parsed.responsibilities.length})</p>
          ${parsed.responsibilities.length
            ? `<ul class="ji-resp-list">${parsed.responsibilities.map(r => `<li class="text-sm">${r}</li>`).join('')}</ul>`
            : '<p class="text-sm text-muted">None extracted</p>'
          }
        </div>
      </div>
    `;
  }

  injectJobInputStyles();
}

function injectJobInputStyles() {
  if (document.getElementById('ji-styles')) return;
  const s = document.createElement('style');
  s.id = 'ji-styles';
  s.textContent = `
    .ji-card { height: 100%; }
    .ji-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .ji-status { display: flex; align-items: center; }

    .ji-textarea {
      min-height: 180px;
      font-size: 0.88rem;
      line-height: 1.7;
    }

    .ji-tips {
      padding: 10px 14px;
      background: var(--accent-light);
      border-radius: var(--r-sm);
      border-left: 3px solid var(--accent);
    }

    .ji-resp-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 0;
    }

    .ji-resp-list li {
      padding-left: 14px;
      position: relative;
      color: var(--ink-2);
      line-height: 1.5;
    }

    .ji-resp-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--ink-3);
      font-size: 0.8rem;
    }
  `;
  document.head.appendChild(s);
}
