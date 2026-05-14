// Список отчётов по офферу (заказчик)

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { EmployerReportListItem } from '../types/index.js';
import { reportStatusLabel } from '../utils/reportViewContent.js';

export async function createOfferReportsListPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offer-reports-list-page';

  let sortBy: 'submitted_at' | 'task_completed_at' = 'submitted_at';

  const render = async () => {
    page.innerHTML = `
      <div class="relative w-full">
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
          <div class="flex items-center gap-3 mb-3">
            <button type="button" id="back-btn" class="text-slate-500 p-1">←</button>
            <h1 class="text-xl font-bold">Отчёты по заданию</h1>
          </div>
          <div class="flex gap-2 pb-3">
            <label class="text-xs text-slate-600 flex items-center gap-1">
              Сортировка
              <select id="sort-select" class="text-sm border rounded px-2 py-1">
                <option value="submitted_at">По дате отчёта</option>
                <option value="task_completed_at">По дате выполнения</option>
              </select>
            </label>
          </div>
        </header>
        <main class="pb-28 px-4">
          <div id="loading" class="py-8 text-center text-slate-500">Загрузка…</div>
          <div id="list" class="hidden space-y-2"></div>
          <div id="empty" class="hidden text-center py-8 text-slate-500">Отчётов пока нет</div>
          <div id="err" class="hidden text-center py-8 text-red-600"></div>
        </main>
      </div>
    `;

    const sel = page.querySelector('#sort-select') as HTMLSelectElement;
    if (sel) sel.value = sortBy;
    sel?.addEventListener('change', () => {
      sortBy = sel.value as 'submitted_at' | 'task_completed_at';
      void load();
    });

    page.querySelector('#back-btn')?.addEventListener('click', () => {
      router.navigate(`/offers/${offerId}`);
    });

    const load = async () => {
      const loading = page.querySelector('#loading') as HTMLElement;
      const list = page.querySelector('#list') as HTMLElement;
      const empty = page.querySelector('#empty') as HTMLElement;
      const err = page.querySelector('#err') as HTMLElement;
      loading.classList.remove('hidden');
      list.classList.add('hidden');
      empty.classList.add('hidden');
      err.classList.add('hidden');
      try {
        const rows: EmployerReportListItem[] = await apiService.getEmployerOfferReports(offerId, sortBy);
        loading.classList.add('hidden');
        if (!rows.length) {
          empty.classList.remove('hidden');
          return;
        }
        list.innerHTML = rows
          .map((r) => {
            const d1 = r.submitted_at ? new Date(r.submitted_at).toLocaleString('ru-RU') : '—';
            const d2 = r.task_completed_at ? new Date(r.task_completed_at).toLocaleString('ru-RU') : '—';
            const exec = r.executor_label || 'Исполнитель';
            const execId = r.executor_user_id;
            const stRaw = r.report_status || '';
            const st = reportStatusLabel(stRaw);
            const stClass =
              stRaw === 'rejected'
                ? 'text-amber-900 bg-amber-50 border border-amber-200'
                : stRaw === 'pending_review'
                  ? 'text-slate-800 bg-slate-100 border border-slate-200'
                  : 'text-emerald-800 bg-emerald-50 border border-emerald-200';
            const profileBtn =
              execId != null && execId !== ''
                ? `<button type="button" class="report-exec-profile text-xs font-semibold text-primary px-2 py-0.5 rounded hover:bg-primary/5" data-uid="${escapeHtml(execId)}">Профиль</button>`
                : '';
            return `
            <div class="relative w-full text-left bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 report-row cursor-pointer" data-rid="${r.id}" role="button" tabindex="0">
              <div class="flex justify-between gap-2 items-start">
                <span class="font-medium text-slate-800 min-w-0 pr-2">${escapeHtml(exec)}</span>
                <span class="flex items-center gap-1 shrink-0">
                  ${profileBtn}
                  <span class="text-xs text-slate-500 whitespace-nowrap">${escapeHtml(d1)}</span>
                </span>
              </div>
              <div class="text-xs text-slate-500 mt-1">Выполнено: ${escapeHtml(d2)}</div>
              ${st ? `<div class="text-xs mt-1 px-2 py-1 rounded inline-block ${stClass}">${escapeHtml(st)}</div>` : ''}
            </div>`;
          })
          .join('');
        list.classList.remove('hidden');
        list.querySelectorAll('.report-row').forEach((row) => {
          const goReport = () => {
            const id = (row as HTMLElement).dataset.rid;
            if (id) router.navigate(`/my-offers/${offerId}/reports/${id}`);
          };
          row.addEventListener('click', goReport);
          row.addEventListener('keydown', (e: Event) => {
            const ke = e as KeyboardEvent;
            if (ke.key === 'Enter' || ke.key === ' ') {
              ke.preventDefault();
              goReport();
            }
          });
        });
        list.querySelectorAll('.report-exec-profile').forEach((btn) => {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const uid = (btn as HTMLElement).dataset.uid;
            if (uid) router.navigate(`/my-offers/${offerId}/executor/${uid}`);
          });
        });
      } catch (e: any) {
        loading.classList.add('hidden');
        err.textContent = e?.message || 'Ошибка загрузки';
        err.classList.remove('hidden');
      }
    };

    await load();
  };

  await render();
  return page;
}

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
