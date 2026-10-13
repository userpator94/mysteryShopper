import { router } from '../../router/index.js';
import { apiService } from '../../services/api.js';
import {
  ADMIN_APPLICATIONS_PATH,
  ADMIN_DOCUMENTS_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_QUEUES_PATH
} from '../../utils/adminPaths.js';
import { clearRole } from '../../utils/auth.js';

type AdminNavKey = 'overview' | 'applications' | 'queues' | 'documents';

function navClass(active: boolean): string {
  return active
    ? 'text-sm font-semibold text-primary border-b-2 border-primary pb-1'
    : 'text-sm font-medium text-slate-500 hover:text-slate-800 pb-1';
}

/** Обёртка admin-страниц: верхняя навигация + кнопка выхода. */
export function wrapWithAdminShell(content: HTMLElement, active: AdminNavKey): HTMLElement {
  const page = document.createElement('div');
  page.className = 'admin-panel min-h-screen bg-slate-100';

  page.innerHTML = `
    <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-wide text-slate-400">Service panel</p>
          <h1 class="truncate text-lg font-bold text-slate-900">Админ-панель</h1>
        </div>
        <button
          type="button"
          id="admin-logout"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Выйти
        </button>
      </div>
      <nav class="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 pb-2">
        <a href="#" data-admin-nav="${ADMIN_OVERVIEW_PATH}" class="${navClass(active === 'overview')}">Обзор</a>
        <a href="#" data-admin-nav="${ADMIN_APPLICATIONS_PATH}" class="${navClass(active === 'applications')}">Заявки</a>
        <a href="#" data-admin-nav="${ADMIN_QUEUES_PATH}" class="${navClass(active === 'queues')}">Очереди</a>
        <a href="#" data-admin-nav="${ADMIN_DOCUMENTS_PATH}" class="${navClass(active === 'documents')}">Документы</a>
      </nav>
    </header>
    <main id="admin-shell-main" class="mx-auto max-w-5xl px-4 py-6"></main>
  `;

  const main = page.querySelector('#admin-shell-main') as HTMLElement;
  main.appendChild(content);

  page.querySelectorAll('[data-admin-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = (e.currentTarget as HTMLElement).getAttribute('data-admin-nav');
      if (path) router.navigate(path);
    });
  });

  page.querySelector('#admin-logout')?.addEventListener('click', async () => {
    try {
      await apiService.logout();
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      clearRole();
    }
    router.navigate(ADMIN_LOGIN_PATH, { replace: true });
  });

  return page;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
