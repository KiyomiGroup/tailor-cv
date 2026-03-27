/**
 * pages/InputPage.js
 * Main input screen — bento grid with Resume + Job cards + Continue button
 */
import { store, showToast, iconArrowRight, iconCheck } from '../utils/helpers.js';
import { renderResumeInput } from '../components/ResumeInput.js';
import { renderJobInput } from '../components/JobInput.js';
import { saveProfile, saveJobAnalysis } from '../services/supabase.js';

export function renderInputPage(container) {
  container.innerHTML = `
    <div class="input-page">
      <!-- Top nav -->
      <header class="ip-header">
        <div class="ob-logo">
          <span class="ob-logo-mark">R</span>
          <span class="ob-logo-text">ResumeAI</span>
        </div>

        <!-- Progress bar -->
        <div class="progress-bar" id="ip-progress">
          <div class="progress-step done">
            <div class="step-circle">${iconCheck()}</div>
            <span class="step-label hide-mobile">Start</span>
          </div>
          <div class="step-line done"></div>
          <div class="progress-step active">
            <div class="step-circle">2</div>
            <span class="step-label hide-mobile">Input</span>
          </div>
          <div class="step-line"></div>
          <div class="progress-step">
            <div class="step-circle">3</div>
            <span class="step-label hide-mobile">Generate</span>
          </div>
        </div>

        <button class="btn btn-ghost btn-sm" id="ip-back-btn">← Back</button>
      </header>

      <!-- Main content -->
      <main class="ip-main container">

        <!-- Page title -->
        <div class="ip-title-area fade-in">
          <h1 class="display-2">Tell us about yourself and the role.</h1>
          <p class="text-muted mt-2">Fill in at least one section below, then click Continue.</p>
        </div>

        <!-- Bento grid -->
        <div class="bento-grid ip-grid fade-in fade-in-1">

          <!-- Resume card slot -->
          <div id="resume-card-slot"></div>

          <!-- Job card slot -->
          <div id="job-card-slot"></div>

        </div>

        <!-- Continue / Save CTA -->
        <div class="ip-cta fade-in fade-in-2">
          <div class="ip-cta-hint" id="ip-cta-hint">
            <span id="ip-check-resume" class="cta-check">○ Parse your resume</span>
            <span class="cta-sep">·</span>
            <span id="ip-check-job" class="cta-check">○ Analyze a job description</span>
          </div>
          <button class="btn btn-primary btn-lg" id="continue-btn" disabled>
            Save & Continue ${iconArrowRight()}
          </button>
        </div>

      </main>
    </div>
  `;

  // ── Mount sub-components ──────────────────────────────────────────────────
  renderResumeInput(document.getElementById('resume-card-slot'));
  renderJobInput(document.getElementById('job-card-slot'));

  // ── Reactive checks ───────────────────────────────────────────────────────
  function updateContinueButton() {
    const hasResume = !!store.get('parsedResume');
    const hasJob = !!store.get('parsedJob');

    const resumeCheck = document.getElementById('ip-check-resume');
    const jobCheck = document.getElementById('ip-check-job');
    const continueBtn = document.getElementById('continue-btn');

    if (resumeCheck) {
      resumeCheck.textContent = hasResume ? '✓ Resume parsed' : '○ Parse your resume';
      resumeCheck.style.color = hasResume ? 'var(--green)' : 'var(--ink-3)';
      resumeCheck.style.fontWeight = hasResume ? '600' : '400';
    }

    if (jobCheck) {
      jobCheck.textContent = hasJob ? '✓ Job analyzed' : '○ Analyze a job description';
      jobCheck.style.color = hasJob ? 'var(--green)' : 'var(--ink-3)';
      jobCheck.style.fontWeight = hasJob ? '600' : '400';
    }

    if (continueBtn) {
      continueBtn.disabled = !(hasResume || hasJob);
    }
  }

  // Subscribe to store changes
  store.subscribe('parsedResume', updateContinueButton);
  store.subscribe('parsedJob', updateContinueButton);
  updateContinueButton(); // initial

  // ── Continue / Save ───────────────────────────────────────────────────────
  document.getElementById('continue-btn').addEventListener('click', async () => {
    const btn = document.getElementById('continue-btn');
    const sessionId = store.get('sessionId');

    try {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Saving…`;

      const saves = [];

      const parsedResume = store.get('parsedResume');
      if (parsedResume) saves.push(saveProfile(parsedResume, sessionId));

      const parsedJob = store.get('parsedJob');
      if (parsedJob) saves.push(saveJobAnalysis(parsedJob, sessionId));

      const results = await Promise.all(saves);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length) {
        console.warn('[Save] Some saves had errors:', errors);
        showToast('Saved locally (Supabase not configured)', 'default');
      } else {
        showToast('Data saved successfully!', 'success');
      }

      // Navigate to confirm/next stage
      store.set('currentPage', 'confirm');

    } catch (err) {
      console.error('[Save]', err);
      showToast('Error saving data. Please try again.', 'error');
      btn.disabled = false;
      btn.innerHTML = `Save & Continue ${iconArrowRight()}`;
    }
  });

  // ── Back button ───────────────────────────────────────────────────────────
  document.getElementById('ip-back-btn').addEventListener('click', () => {
    store.set('currentPage', 'onboarding');
  });

  injectInputPageStyles();
}

function injectInputPageStyles() {
  if (document.getElementById('ip-styles')) return;
  const s = document.createElement('style');
  s.id = 'ip-styles';
  s.textContent = `
    .input-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .ip-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 28px;
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,0.6);
      backdrop-filter: var(--blur);
      position: sticky;
      top: 0;
      z-index: 100;
      gap: 16px;
    }

    /* Reuse .ob-logo styles from Onboarding */
    .ob-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .ob-logo-mark {
      width: 32px; height: 32px;
      background: var(--accent); color: #fff;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 1rem;
    }
    .ob-logo-text { font-family: var(--font-display); font-size: 1.1rem; color: var(--ink); }

    #ip-progress {
      margin: 0 auto;
      flex: 1;
      max-width: 340px;
      justify-content: center;
    }

    .btn-sm { padding: 8px 14px; font-size: 0.82rem; }

    .ip-main {
      flex: 1;
      padding-top: 36px;
      padding-bottom: 48px;
    }

    .ip-title-area { margin-bottom: 28px; }

    .ip-grid {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }

    .ip-cta {
      margin-top: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .ip-cta-hint {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .cta-check {
      font-size: 0.85rem;
      color: var(--ink-3);
      transition: color 0.2s;
    }

    .cta-sep { color: var(--border-strong); }

    @media (max-width: 768px) {
      .ip-grid { grid-template-columns: 1fr; }
      .ip-cta { flex-direction: column; align-items: flex-start; }
      .ip-cta .btn { width: 100%; justify-content: center; }
      .ip-header { padding: 12px 16px; }
    }
  `;
  document.head.appendChild(s);
}
