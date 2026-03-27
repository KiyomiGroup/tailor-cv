/**
 * pages/ConfirmPage.js
 * Sprint 1 — placeholder for next stage (resume generation)
 */
import { store, iconArrowRight, iconCheck } from '../utils/helpers.js';

export function renderConfirmPage(container) {
  const resume = store.get('parsedResume');
  const job = store.get('parsedJob');

  container.innerHTML = `
    <div class="confirm-page">
      <header class="ip-header">
        <div class="ob-logo">
          <span class="ob-logo-mark">R</span>
          <span class="ob-logo-text">ResumeAI</span>
        </div>
        <div class="progress-bar" style="flex:1;max-width:340px;margin:0 auto;justify-content:center">
          <div class="progress-step done">
            <div class="step-circle">${iconCheck()}</div>
            <span class="step-label hide-mobile">Start</span>
          </div>
          <div class="step-line done"></div>
          <div class="progress-step done">
            <div class="step-circle">${iconCheck()}</div>
            <span class="step-label hide-mobile">Input</span>
          </div>
          <div class="step-line"></div>
          <div class="progress-step active">
            <div class="step-circle">3</div>
            <span class="step-label hide-mobile">Generate</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="conf-back-btn">← Back</button>
      </header>

      <main class="container" style="padding-top:60px;padding-bottom:60px">
        <div class="confirm-hero fade-in">
          <div class="confirm-icon">🎉</div>
          <h1 class="display-2 mt-4">You're all set!</h1>
          <p class="text-muted mt-2" style="max-width:480px;margin:8px auto 0">
            Your data has been parsed and saved. The resume generation engine is coming in Sprint 2.
          </p>
        </div>

        <div class="bento-grid grid-2 confirm-cards fade-in fade-in-1">

          ${resume ? `
          <div class="card p-5 confirm-data-card">
            <p class="label mb-3">Parsed Resume</p>
            <div class="confirm-row">
              <span class="text-sm text-muted">Name</span>
              <span class="font-medium">${resume.name}</span>
            </div>
            <div class="confirm-row">
              <span class="text-sm text-muted">Skills</span>
              <span class="font-medium">${resume.skills.length} detected</span>
            </div>
            <div class="confirm-row">
              <span class="text-sm text-muted">Experience</span>
              <span class="font-medium">${resume.experience.length} entries</span>
            </div>
            <div class="confirm-row">
              <span class="text-sm text-muted">Education</span>
              <span class="font-medium">${resume.education.length} entries</span>
            </div>
            <div class="mt-3">
              <span class="badge badge-green">✓ Saved to profiles</span>
            </div>
          </div>
          ` : ''}

          ${job ? `
          <div class="card p-5 confirm-data-card">
            <p class="label mb-3">Analyzed Job</p>
            <div class="confirm-row">
              <span class="text-sm text-muted">Role</span>
              <span class="font-medium">${job.title}</span>
            </div>
            <div class="confirm-row">
              <span class="text-sm text-muted">Company</span>
              <span class="font-medium">${job.company || '—'}</span>
            </div>
            <div class="confirm-row">
              <span class="text-sm text-muted">Required Skills</span>
              <span class="font-medium">${job.required_skills.length} found</span>
            </div>
            <div class="confirm-row">
              <span class="text-sm text-muted">Keywords</span>
              <span class="font-medium">${job.keywords.length} extracted</span>
            </div>
            <div class="mt-3">
              <span class="badge badge-green">✓ Saved to job_analyses</span>
            </div>
          </div>
          ` : ''}

        </div>

        <!-- Sprint 2 placeholder -->
        <div class="sprint2-placeholder card fade-in fade-in-2">
          <div class="sp2-inner">
            <div>
              <p class="label mb-2">Coming in Sprint 2</p>
              <h3 class="display-2" style="font-size:1.4rem">AI Resume & Cover Letter Generation</h3>
              <p class="text-sm text-muted mt-2">
                Match your experience to the job description and generate a tailored resume
                and cover letter with one click.
              </p>
            </div>
            <button class="btn btn-primary btn-lg" disabled style="opacity:0.4;cursor:not-allowed">
              Generate Resume ${iconArrowRight()}
            </button>
          </div>
        </div>

        <div class="text-center mt-4 fade-in fade-in-3">
          <button class="btn btn-ghost" id="conf-restart-btn">Start over</button>
        </div>
      </main>
    </div>
  `;

  document.getElementById('conf-back-btn').addEventListener('click', () => {
    store.set('currentPage', 'input');
  });

  document.getElementById('conf-restart-btn').addEventListener('click', () => {
    store.set('parsedResume', null);
    store.set('parsedJob', null);
    store.set('rawResumeText', '');
    store.set('inputMethod', null);
    store.set('currentPage', 'onboarding');
  });

  injectConfirmStyles();
}

function injectConfirmStyles() {
  if (document.getElementById('conf-styles')) return;
  const s = document.createElement('style');
  s.id = 'conf-styles';
  s.textContent = `
    .confirm-page { min-height: 100vh; }

    .confirm-hero {
      text-align: center;
      margin-bottom: 36px;
    }

    .confirm-icon {
      font-size: 3rem;
      line-height: 1;
    }

    .confirm-cards {
      margin-bottom: 24px;
    }

    .confirm-data-card {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .confirm-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 0;
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }

    .confirm-row:last-of-type { border-bottom: none; }

    .sprint2-placeholder {
      padding: 28px 32px;
      border: 1.5px dashed var(--border-strong);
      background: var(--bg-alt);
    }

    .sp2-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    }

    @media (max-width: 600px) {
      .sp2-inner { flex-direction: column; align-items: flex-start; }
    }
  `;
  document.head.appendChild(s);
}
