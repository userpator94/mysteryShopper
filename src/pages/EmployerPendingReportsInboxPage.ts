// Входящие отчёты заказчика (ожидают одобрения)

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export async function createEmployerPendingReportsInboxPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'employer-inbox-reports-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-3">
          <button type="button" id="employer-pending-reports-back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 class="text-xl font-bold flex-1 min-w-0">Отчёты на проверку</h1>
        </div>
        <p class="text-sm text-slate-600 pb-3">Отчёты исполнителей, ожидающие вашего решения</p>
      </header>
      <main class="pb-28 px-4">
        <div id="loading" class="py-8 text-center text-slate-500">Загрузка…</div>
        <div id="list" class="hidden space-y-2"></div>
        <div id="empty" class="hidden text-center py-8 text-slate-500">Нет отчётов на проверке</div>
        <div id="err" class="hidden text-center py-8 text-red-600"></div>
      </main>
    </div>
  `;

  page.querySelector('#employer-pending-reports-back-btn')?.addEventListener('click', () => router.back('/profile'));

  const loading = page.querySelector('#loading') as HTMLElement;
  const list = page.querySelector('#list') as HTMLElement;
  const empty = page.querySelector('#empty') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;

  try {
    const rows = await apiService.getEmployerPendingReportsInbox();
    loading.classList.add('hidden');
    if (!rows.length) {
      empty.classList.remove('hidden');
      return page;
    }
    list.innerHTML = rows
      .map((r) => {
        const d1 = r.submitted_at ? new Date(r.submitted_at).toLocaleString('ru-RU') : '—';
        const exec = r.executor_label || 'Исполнитель';
        const oid = escapeHtml(r.offer_id);
        const rid = escapeHtml(r.id);
        return `
          <div class="report-row bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer" data-offer-id="${oid}" data-report-id="${rid}" role="button" tabindex="0">
            <button type="button" id="pending-report-offer-link-${rid}" class="offer-link block text-left font-semibold text-primary hover:underline mb-1" data-offer-id="${oid}">
              ${escapeHtml(r.offer_title || 'Задача')}
            </button>
            <div class="flex justify-between gap-2 items-start">
              <span class="text-sm text-slate-800">${escapeHtml(exec)}</span>
              <span class="text-xs text-slate-500 shrink-0">${escapeHtml(d1)}</span>
            </div>
          </div>
        `;
      })
      .join('');
    list.classList.remove('hidden');

    list.querySelectorAll('.report-row').forEach((row) => {
      const el = row as HTMLElement;
      const go = () => {
        const oid = el.dataset.offerId;
        const rid = el.dataset.reportId;
        if (oid && rid) router.navigate(`/my-offers/${oid}/reports/${rid}`);
      };
      el.addEventListener('click', (ev) => {
        if ((ev.target as HTMLElement).closest('.offer-link')) return;
        go();
      });
      el.addEventListener('keydown', (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') {
          ke.preventDefault();
          go();
        }
      });
    });

    list.querySelectorAll('.offer-link').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const oid = (btn as HTMLElement).dataset.offerId;
        if (oid) router.navigate(`/offers/${oid}`);
      });
    });
  } catch (e: unknown) {
    loading.classList.add('hidden');
    err.textContent = e instanceof Error ? e.message : 'Ошибка загрузки';
    err.classList.remove('hidden');
  }

  return page;
}
