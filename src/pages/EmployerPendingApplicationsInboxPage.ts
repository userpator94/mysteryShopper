// Входящие заявки заказчика (ожидают согласования)

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import { buildAppDecisionHtml, bindAppDecisionHandlers } from '../utils/employerApplicationDecision.js';
import {
  bindExecutorProfileCopyButtons,
  buildEmployerExecutorProfileHtml,
  escapeHtml,
  formatLocalDate
} from '../utils/employerExecutorProfileUi.js';
import type { InboxApplicationRow } from '../types/index.js';

function formatAppliedAt(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function createEmployerPendingApplicationsInboxPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'employer-inbox-applications-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-3">
          <button type="button" id="employer-pending-applications-back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 id="inbox-applications-title" class="text-xl font-bold flex-1 min-w-0">Заявки на согласование</h1>
        </div>
        <p id="inbox-applications-subtitle" class="text-sm text-slate-600 pb-3">Отклики исполнителей по вашим задачам, ожидающие решения</p>
      </header>
      <main class="pb-28 px-4">
        <div id="list-view">
          <div id="loading" class="py-8 text-center text-slate-500">Загрузка…</div>
          <div id="list" class="hidden space-y-2"></div>
          <div id="empty" class="hidden text-center py-8 text-slate-500">Нет заявок, ожидающих согласования</div>
          <div id="err" class="hidden text-center py-8 text-red-600"></div>
        </div>
        <div id="detail-view" class="hidden">
          <button type="button" id="inbox-app-detail-back-btn" class="mb-4 text-sm font-semibold text-primary hover:underline">← К списку заявок</button>
          <div id="detail-loading" class="py-8 text-center text-slate-500">Загрузка…</div>
          <div id="detail-content" class="hidden space-y-4"></div>
          <div id="detail-err" class="hidden text-center py-8 text-red-600"></div>
        </div>
      </main>
    </div>
  `;

  let rows: InboxApplicationRow[] = [];

  const loading = page.querySelector('#loading') as HTMLElement;
  const list = page.querySelector('#list') as HTMLElement;
  const empty = page.querySelector('#empty') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;
  const listView = page.querySelector('#list-view') as HTMLElement;
  const detailView = page.querySelector('#detail-view') as HTMLElement;
  const detailLoading = page.querySelector('#detail-loading') as HTMLElement;
  const detailContent = page.querySelector('#detail-content') as HTMLElement;
  const detailErr = page.querySelector('#detail-err') as HTMLElement;
  const titleEl = page.querySelector('#inbox-applications-title') as HTMLElement;
  const subtitleEl = page.querySelector('#inbox-applications-subtitle') as HTMLElement;

  const showList = () => {
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
    titleEl.textContent = 'Заявки на согласование';
    subtitleEl.textContent = 'Отклики исполнителей по вашим задачам, ожидающие решения';
    subtitleEl.classList.remove('hidden');
  };

  const showDetail = () => {
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    titleEl.textContent = 'Согласование заявки';
    subtitleEl.classList.add('hidden');
  };

  const renderList = () => {
    if (!rows.length) {
      list.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    list.innerHTML = rows
      .map((row) => {
        const aid = escapeHtml(row.application_id);
        const exec = row.executor_label || 'Исполнитель';
        return `
          <article
            id="pending-app-row-${aid}"
            class="inbox-app-row bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
            role="button"
            tabindex="0"
            data-app-id="${aid}"
            data-offer-id="${escapeHtml(row.offer_id)}"
            data-user-id="${escapeHtml(row.user_id)}"
          >
            <p class="font-semibold text-slate-900">${escapeHtml(row.offer_title || 'Задача')}</p>
            <p class="text-sm text-slate-700 mt-1">${escapeHtml(exec)}</p>
            <p class="text-xs text-slate-500 mt-1">Отклик: ${escapeHtml(formatAppliedAt(row.applied_at))}</p>
          </article>
        `;
      })
      .join('');
    list.classList.remove('hidden');

    list.querySelectorAll('.inbox-app-row').forEach((el) => {
      const article = el as HTMLElement;
      const open = () => {
        const appId = article.dataset.appId;
        const row = rows.find((r) => r.application_id === appId);
        if (row) void openApplicationDetail(row);
      };
      article.addEventListener('click', open);
      article.addEventListener('keydown', (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') {
          ke.preventDefault();
          open();
        }
      });
    });
  };

  const openApplicationDetail = async (row: InboxApplicationRow) => {
    showDetail();
    detailContent.classList.add('hidden');
    detailErr.classList.add('hidden');
    detailLoading.classList.remove('hidden');

    const period =
      row.offer_start_date || row.offer_end_date
        ? `${formatLocalDate(row.offer_start_date)} — ${formatLocalDate(row.offer_end_date)}`
        : '—';

    try {
      const profile = await apiService.getEmployerExecutorProfile(row.offer_id, row.user_id);
      detailLoading.classList.add('hidden');
      detailContent.classList.remove('hidden');

      detailContent.innerHTML = `
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Задача</p>
          <button type="button" id="inbox-detail-offer-link" class="text-left font-semibold text-primary hover:underline text-base">
            ${escapeHtml(row.offer_title || 'Задача')}
          </button>
          <p class="text-sm text-slate-600">${escapeHtml(period)}</p>
        </div>
        ${buildEmployerExecutorProfileHtml(profile)}
        ${buildAppDecisionHtml()}
      `;

      bindExecutorProfileCopyButtons(detailContent);

      detailContent.querySelector('#inbox-detail-offer-link')?.addEventListener('click', () => {
        router.navigate(`/offers/${row.offer_id}`);
      });

      bindAppDecisionHandlers(detailContent, row.application_id, {
        onResolved: () => {
          rows = rows.filter((r) => r.application_id !== row.application_id);
          showList();
          renderList();
        }
      });
    } catch (e: unknown) {
      detailLoading.classList.add('hidden');
      detailErr.textContent = e instanceof Error ? e.message : 'Не удалось загрузить заявку';
      detailErr.classList.remove('hidden');
    }
  };

  page.querySelector('#employer-pending-applications-back-btn')?.addEventListener('click', () => {
    if (!detailView.classList.contains('hidden')) {
      showList();
      return;
    }
    router.back('/profile');
  });

  page.querySelector('#inbox-app-detail-back-btn')?.addEventListener('click', showList);

  try {
    rows = await apiService.getEmployerPendingApplicationsInbox();
    loading.classList.add('hidden');
    renderList();
  } catch (e: unknown) {
    loading.classList.add('hidden');
    err.textContent = e instanceof Error ? e.message : 'Ошибка загрузки';
    err.classList.remove('hidden');
  }

  return page;
}
