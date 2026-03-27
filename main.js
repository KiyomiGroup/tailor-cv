/**
 * main.js
 * App entry point — router + store subscriber
 */
import { store } from './utils/helpers.js';
import { renderOnboarding } from './pages/Onboarding.js';
import { renderInputPage } from './pages/InputPage.js';
import { renderConfirmPage } from './pages/ConfirmPage.js';

const app = document.getElementById('app');

// ── Toast container ───────────────────────────────────────────────────────────
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

// ── Router ────────────────────────────────────────────────────────────────────
function navigate(page) {
  // Scroll to top on navigation
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Clear and re-render
  app.innerHTML = '';

  switch (page) {
    case 'onboarding':
      renderOnboarding(app);
      break;
    case 'input':
      renderInputPage(app);
      break;
    case 'confirm':
      renderConfirmPage(app);
      break;
    default:
      renderOnboarding(app);
  }
}

// Subscribe to page changes
store.subscribe('currentPage', (page) => navigate(page));

// Initial render
navigate(store.get('currentPage'));
