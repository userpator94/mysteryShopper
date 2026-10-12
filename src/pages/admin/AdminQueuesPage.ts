import { apiService } from '../../services/api.js';
import type { AdminQueuesPayload } from '../../types/index.js';
import { escapeHtml, formatDateTime, wrapWithAdminShell } from './adminShell.js';

function queueSection(title: string, count: number, bodyHtml: string): string {
  return `
    <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="text-base font-semibold text-slate-800">${escapeHtml(title)}</h2>
        <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">${count}</span>
      </div>
      ${bodyHtml}
    </section>
  `;
}

function renderQueues(data: AdminQueuesPayload): string {
  const apps =
    data.pending_applications.length === 0
      ? '<p class="text-sm text-slate-500">Пусто</p>'
      : `<ul class="divide-y divide-slate-100">${data.pending_applications
          .map((a) => {
            const name = [a.user_name, a.user_surname].filter(Boolean).join(' ') || a.user_email || '—';
            return `<li class="py-2">
              <p class="text-sm font-medium text-slate-800">${escapeHtml(a.offer_title || '—')}</p>
              <p class="text-xs text-slate-500">${escapeHtml(name)} · ${escapeHtml(a.employer_company || '')} · ${escapeHtml(formatDateTime(a.applied_at))}</p>
            </li>`;
          })
          .join('')}</ul>`;

  const reports =
    data.pending_reports.length === 0
      ? '<p class="text-sm text-slate-500">Пусто</p>'
      : `<ul class="divide-y divide-slate-100">${data.pending_reports
          .map(
            (r) => `<li class="py-2">
              <p class="text-sm font-medium text-slate-800">${escapeHtml(r.offer_title || '—')}</p>
              <p class="text-xs text-slate-500">${escapeHtml(r.user_email || '')} · ${escapeHtml(r.employer_company || '')} · ${escapeHtml(formatDateTime(r.submitted_at))}</p>
            </li>`
          )
          .join('')}</ul>`;

  const withdraws =
    data.pending_withdraws.length === 0
      ? '<p class="text-sm text-slate-500">Пусто</p>'
      : `<ul class="divide-y divide-slate-100">${data.pending_withdraws
          .map(
            (w) => `<li class="py-2">
              <p class="text-sm font-medium text-slate-800">${w.amount} · ${escapeHtml(w.status)} · ${escapeHtml(w.method)}</p>
              <p class="text-xs text-slate-500">${escapeHtml(w.user_email || '')} · ${escapeHtml(formatDateTime(w.created_at))}</p>
            </li>`
          )
          .join('')}</ul>`;

  return `
    <div class="space-y-4">
      ${queueSection('Заявки pending', data.pending_applications.length, apps)}
      ${queueSection('Отчёты на модерации', data.pending_reports.length, reports)}
      ${queueSection('Выводы pending / processing', data.pending_withdraws.length, withdraws)}
    </div>
  `;
}

export async function createAdminQueuesPage(): Promise<HTMLElement> {
  const content = document.createElement('div');
  content.innerHTML =
    '<div class="flex justify-center py-16"><div class="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700"></div></div>';

  const page = wrapWithAdminShell(content, 'queues');

  try {
    const data = await apiService.getAdminQueues(50);
    content.innerHTML = renderQueues(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
    content.innerHTML = `<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">${escapeHtml(msg)}</div>`;
  }

  return page;
}
