import { apiService } from '../../services/api.js';
import type { AdminApplicationRow } from '../../types/index.js';
import { escapeHtml, formatDateTime, wrapWithAdminShell } from './adminShell.js';

const STATUSES = [
  '',
  'pending',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'cancelled'
];

function renderTable(rows: AdminApplicationRow[]): string {
  if (!rows.length) {
    return '<p class="py-8 text-center text-sm text-slate-500">Нет заявок</p>';
  }
  const body = rows
    .map((r) => {
      const name = [r.user_name, r.user_surname].filter(Boolean).join(' ') || '—';
      return `
        <tr class="border-b border-slate-100 align-top">
          <td class="px-3 py-2 text-xs text-slate-500">${escapeHtml(formatDateTime(r.applied_at))}</td>
          <td class="px-3 py-2 text-sm font-medium text-slate-800">${escapeHtml(r.status)}</td>
          <td class="px-3 py-2 text-sm text-slate-700">
            <div>${escapeHtml(r.offer_title || '—')}</div>
            <div class="text-xs text-slate-400">${escapeHtml(r.employer_company || '')}</div>
          </td>
          <td class="px-3 py-2 text-sm text-slate-700">
            <div>${escapeHtml(name)}</div>
            <div class="text-xs text-slate-400">${escapeHtml(r.user_email || '')}</div>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full text-left">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2 font-medium">Дата</th>
            <th class="px-3 py-2 font-medium">Статус</th>
            <th class="px-3 py-2 font-medium">Задание</th>
            <th class="px-3 py-2 font-medium">Исполнитель</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

export async function createAdminApplicationsPage(): Promise<HTMLElement> {
  const content = document.createElement('div');
  content.className = 'space-y-4';
  content.innerHTML = `
    <div class="flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-slate-500">Статус</span>
        <select id="admin-app-status" class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">
          ${STATUSES.map(
            (s) => `<option value="${s}">${s === '' ? 'Все' : s}</option>`
          ).join('')}
        </select>
      </label>
      <button
        type="button"
        id="admin-app-refresh"
        class="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
      >Обновить</button>
    </div>
    <p id="admin-app-meta" class="text-xs text-slate-500"></p>
    <div id="admin-app-table">
      <div class="flex justify-center py-16"><div class="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700"></div></div>
    </div>
  `;

  const page = wrapWithAdminShell(content, 'applications');
  const statusSelect = content.querySelector('#admin-app-status') as HTMLSelectElement;
  const tableEl = content.querySelector('#admin-app-table') as HTMLElement;
  const metaEl = content.querySelector('#admin-app-meta') as HTMLElement;

  const load = async () => {
    tableEl.innerHTML =
      '<div class="flex justify-center py-16"><div class="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700"></div></div>';
    try {
      const status = statusSelect.value || undefined;
      const result = await apiService.getAdminApplications({ status, limit: 100, offset: 0 });
      metaEl.textContent = `Показано ${result.data.length} из ${result.pagination.total}`;
      tableEl.innerHTML = renderTable(result.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
      tableEl.innerHTML = `<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">${escapeHtml(msg)}</div>`;
      metaEl.textContent = '';
    }
  };

  content.querySelector('#admin-app-refresh')?.addEventListener('click', () => void load());
  statusSelect.addEventListener('change', () => void load());
  void load();

  return page;
}
