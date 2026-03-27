// Просмотр одного отчёта заказчиком

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { ChecklistItem, EmployerReportListItem } from '../types/index.js';

export async function createOfferReportDetailPage(offerId: string, reportId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offer-report-detail-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <button type="button" id="back-btn" class="text-slate-500 p-1">←</button>
          <h1 class="text-xl font-bold">Отчёт</h1>
        </div>
      </header>
      <main class="pb-28 px-4 py-4">
        <div id="loading" class="py-8 text-center">Загрузка…</div>
        <div id="content" class="hidden space-y-4"></div>
        <div id="err" class="hidden text-red-600 text-center py-8"></div>
      </main>
    </div>
  `;

  page.querySelector('#back-btn')?.addEventListener('click', () => {
    router.navigate(`/my-offers/${offerId}/reports`);
  });

  const loading = page.querySelector('#loading') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;

  try {
    const r: EmployerReportListItem = await apiService.getEmployerOfferReport(offerId, reportId);
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    const parts: string[] = [];
    parts.push(`<p class="text-sm text-slate-600">${escapeHtml(r.executor_label)}</p>`);
    parts.push(`<p class="text-xs text-slate-500">Отчёт: ${fmt(r.submitted_at)} · Выполнено: ${fmt(r.task_completed_at)}</p>`);

    if (r.checklist_answers && r.checklist_schema_snapshot?.items) {
      parts.push('<h2 class="font-semibold text-slate-800">Ответы</h2>');
      const items = r.checklist_schema_snapshot.items as ChecklistItem[];
      for (const it of items) {
        const v = r.checklist_answers[it.id];
        parts.push(
          `<div class="bg-white border border-slate-200 rounded-lg p-3"><div class="text-sm font-medium text-slate-800">${escapeHtml(it.label)}</div><div class="text-slate-700 mt-1">${formatValue(it, v)}</div></div>`
        );
      }
    } else {
      parts.push('<h2 class="font-semibold text-slate-800">Стандартный отчёт</h2>');
      if (r.rating != null) parts.push(`<p>Оценка: ${r.rating} / 5</p>`);
      if (r.comments) parts.push(`<p class="whitespace-pre-wrap">${escapeHtml(r.comments)}</p>`);
    }

    content.innerHTML = parts.join('');
  } catch (e: any) {
    loading.classList.add('hidden');
    err.textContent = e?.message || 'Не удалось загрузить отчёт';
    err.classList.remove('hidden');
  }

  return page;
}

function fmt(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU');
}

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function formatValue(it: ChecklistItem, v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (it.type === 'boolean') return v ? 'Да' : 'Нет';
  return escapeHtml(String(v));
}
