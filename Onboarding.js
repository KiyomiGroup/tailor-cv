/**
 * pages/Onboarding.js
 * Landing / entry-flow screen
 */
import { store, iconUpload, iconSparkle } from '../utils/helpers.js';

export function renderOnboarding(container) {
  container.innerHTML = `
    <div class="onboarding-page">
      <!-- Header -->
      <header class="ob-header">
        <div class="ob-logo">
          <span class="ob-logo-mark">R</span>
          <span class="ob-logo-text">ResumeAI</span>
        </div>
        <span class="badge badge-accent">Sprint 1 · Beta</span>
      </header>

      <!-- Hero -->
      <main class="ob-main container">
        <div class="ob-hero fade-in">
          <p class="label mb-3">AI-powered career tools</p>
          <h1 class="display-1 ob-title">
            Craft your story.<br/>
            <em>Land the role.</em>
          </h1>
          <p class="ob-subtitle">
            Paste your experience, drop in a job description — and let AI tailor a resume
            and cover letter that actually gets noticed.
          </p>
        </div>

        <!-- Entry Cards -->
        <div class="ob-cards bento-grid grid-2 fade-in fade-in-2">

          <!-- Upload Card -->
          <button class="ob-card card" id="ob-upload-btn">
            <div class="ob-card-icon ob-card-icon--upload">
              ${iconUpload()}
            </div>
            <div class="ob-card-body">
              <h3 class="ob-card-title">Upload Resume</h3>
              <p class="ob-card-desc">
                Import your existing PDF or DOCX — we'll parse and enhance it for any role.
              </p>
            </div>
            <div class="ob-card-footer">
              <span class="badge badge-green">Fastest start</span>
            </div>
          </button>

          <!-- AI Chat Card -->
          <button class="ob-card card" id="ob-chat-btn">
            <div class="ob-card-icon ob-card-icon--ai">
              ${iconSparkle()}
            </div>
            <div class="ob-card-body">
              <h3 class="ob-card-title">Start with AI Assistant</h3>
              <p class="ob-card-desc">
                Tell us about your experience in plain English — our AI will structure it for you.
              </p>
            </div>
            <div class="ob-card-footer">
              <span class="badge badge-accent">AI-guided</span>
            </div>
          </button>

        </div>

        <!-- Manual fallback -->
        <p class="ob-manual-link fade-in fade-in-3">
          Prefer to fill out a form?
          <button class="ob-link" id="ob-manual-btn">Enter details manually</button>
        </p>

        <!-- Trust strip -->
        <div class="ob-trust fade-in fade-in-4">
          <div class="ob-trust-item">
            <span class="ob-trust-dot"></span>
            <span>No account required</span>
          </div>
          <div class="ob-trust-sep"></div>
          <div class="ob-trust-item">
            <span class="ob-trust-dot"></span>
            <span>Your data stays private</span>
          </div>
          <div class="ob-trust-sep"></div>
          <div class="ob-trust-item">
            <span class="ob-trust-dot"></span>
            <span>Free during beta</span>
          </div>
        </div>
      </main>
    </div>
  `;

  // Wire up buttons
  document.getElementById('ob-upload-btn').addEventListener('click', () => {
    store.set('inputMethod', 'upload');
    store.set('currentPage', 'input');
  });

  document.getElementById('ob-chat-btn').addEventListener('click', () => {
    store.set('inputMethod', 'chat');
    store.set('currentPage', 'input');
  });

  document.getElementById('ob-manual-btn').addEventListener('click', () => {
    store.set('inputMethod', 'manual');
    store.set('currentPage', 'input');
  });

  // Inject page styles
  injectOnboardingStyles();
}

function injectOnboardingStyles() {
  if (document.getElementById('ob-styles')) return;
  const s = document.createElement('style');
  s.id = 'ob-styles';
  s.textContent = `
    .onboarding-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .ob-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 28px;
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,0.6);
      backdrop-filter: var(--blur);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .ob-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ob-logo-mark {
      width: 34px;
      height: 34px;
      background: var(--accent);
      color: #fff;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .ob-logo-text {
      font-family: var(--font-display);
      font-size: 1.2rem;
      color: var(--ink);
    }

    .ob-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 60px;
      padding-bottom: 60px;
    }

    .ob-hero {
      text-align: center;
      max-width: 640px;
      margin-bottom: 40px;
    }

    .ob-title {
      margin-bottom: 18px;
      color: var(--ink);
    }

    .ob-title em {
      color: var(--accent);
      font-style: italic;
    }

    .ob-subtitle {
      font-size: 1.05rem;
      color: var(--ink-2);
      max-width: 480px;
      margin: 0 auto;
      line-height: 1.7;
    }

    .ob-cards {
      width: 100%;
      max-width: 680px;
    }

    .ob-card {
      all: unset;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 28px;
      cursor: pointer;
      text-align: left;
      border-radius: var(--r-lg);
      background: var(--surface);
      backdrop-filter: var(--blur);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-card);
      transition: box-shadow 0.25s var(--ease), transform 0.25s var(--ease), border-color 0.2s;
    }

    .ob-card:hover {
      box-shadow: var(--shadow-float);
      transform: translateY(-3px);
      border-color: var(--accent);
    }

    .ob-card-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--r-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ob-card-icon--upload {
      background: var(--accent-light);
      color: var(--accent);
    }

    .ob-card-icon--ai {
      background: #fef3e2;
      color: #d97706;
    }

    .ob-card-title {
      font-family: var(--font-display);
      font-size: 1.25rem;
      color: var(--ink);
      margin-bottom: 6px;
    }

    .ob-card-desc {
      font-size: 0.88rem;
      color: var(--ink-2);
      line-height: 1.6;
    }

    .ob-card-footer { margin-top: auto; }

    .ob-manual-link {
      margin-top: 24px;
      font-size: 0.88rem;
      color: var(--ink-3);
    }

    .ob-link {
      all: unset;
      color: var(--accent);
      cursor: pointer;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .ob-link:hover { opacity: 0.8; }

    .ob-trust {
      margin-top: 44px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .ob-trust-item {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.82rem;
      color: var(--ink-3);
    }

    .ob-trust-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green);
    }

    .ob-trust-sep {
      width: 1px;
      height: 14px;
      background: var(--border-strong);
    }

    @media (max-width: 600px) {
      .ob-cards { grid-template-columns: 1fr; }
      .ob-trust-sep { display: none; }
    }
  `;
  document.head.appendChild(s);
}
