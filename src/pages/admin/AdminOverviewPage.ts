import { apiService } from '../../services/api.js';
import type { AdminOverviewStats } from '../../types/index.js';
import { escapeHtml, wrapWithAdminShell } from './adminShell.js';

const PALETTE = [
  '#0f172a',
  '#334155',
  '#475569',
  '#64748b',
  '#94a3b8',
  '#cbd5e1',
  '#1d4ed8',
  '#0369a1',
  '#0f766e',
  '#a16207',
  '#b91c1c',
  '#7c3aed'
];

const ROLE_LABELS: Record<string, string> = {
  user: 'Исполнители',
  employer: 'Заказчики',
  admin: 'Админы'
};

const APP_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидают',
  approved: 'Одобрены',
  rejected: 'Отклонены',
  in_progress: 'В работе',
  completed: 'Завершены',
  cancelled: 'Отменены'
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'На проверке',
  paid: 'Одобрены / оплачены',
  rejected: 'Отклонены'
};

const WITHDRAW_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидают',
  processing: 'В обработке',
  paid: 'Выплачены',
  rejected: 'Отклонены',
  cancelled: 'Отменены'
};

function labelOf(map: Record<string, string>, key: string): string {
  return map[key] || key;
}

function pct(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function sortedEntries(map: Record<string, number>): Array<[string, number]> {
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

/** Кольцевая диаграмма (conic-gradient). */
function donutChart(
  title: string,
  entries: Array<[string, number]>,
  labels: Record<string, string>
): string {
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) {
    return panel(
      title,
      `<p class="py-10 text-center text-sm text-slate-500">Нет данных</p>`
    );
  }

  let acc = 0;
  const stops: string[] = [];
  const legend: string[] = [];
  entries.forEach(([key, value], i) => {
    const color = PALETTE[i % PALETTE.length];
    const start = (acc / total) * 360;
    acc += value;
    const end = (acc / total) * 360;
    stops.push(`${color} ${start}deg ${end}deg`);
    const p = pct(value, total);
    legend.push(`
      <li class="flex items-center justify-between gap-3 py-1.5">
        <span class="flex min-w-0 items-center gap-2 text-sm text-slate-700">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background:${color}"></span>
          <span class="truncate">${escapeHtml(labelOf(labels, key))}</span>
        </span>
        <span class="shrink-0 text-sm font-semibold tabular-nums text-slate-900">${value} <span class="font-normal text-slate-400">(${p}%)</span></span>
      </li>`);
  });

  return panel(
    title,
    `
    <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div class="relative h-40 w-40 shrink-0">
        <div
          class="h-full w-full rounded-full"
          style="background: conic-gradient(${stops.join(', ')})"
        ></div>
        <div class="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span class="text-2xl font-bold tabular-nums text-slate-900">${total}</span>
          <span class="text-[10px] uppercase tracking-wide text-slate-400">всего</span>
        </div>
      </div>
      <ul class="w-full min-w-0 flex-1 divide-y divide-slate-100">${legend.join('')}</ul>
    </div>`
  );
}

/** Горизонтальные бары. */
function barChart(
  title: string,
  entries: Array<[string, number]>,
  labels: Record<string, string>
): string {
  const max = Math.max(0, ...entries.map(([, v]) => v));
  if (!entries.length || max === 0) {
    return panel(title, `<p class="py-10 text-center text-sm text-slate-500">Нет данных</p>`);
  }

  const rows = entries
    .map(([key, value], i) => {
      const width = Math.max(2, (value / max) * 100);
      const color = PALETTE[i % PALETTE.length];
      return `
        <div class="space-y-1">
          <div class="flex items-baseline justify-between gap-2 text-sm">
            <span class="truncate text-slate-600">${escapeHtml(labelOf(labels, key))}</span>
            <span class="shrink-0 font-semibold tabular-nums text-slate-900">${value}</span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full transition-all" style="width:${width}%;background:${color}"></div>
          </div>
        </div>`;
    })
    .join('');

  return panel(title, `<div class="space-y-3">${rows}</div>`);
}

/** Вертикальные столбцы (сравнение). */
function columnChart(title: string, items: Array<{ label: string; value: number; color: string }>): string {
  const max = Math.max(1, ...items.map((i) => i.value));
  const cols = items
    .map(
      (item) => `
      <div class="flex flex-1 flex-col items-center gap-2">
        <span class="text-sm font-bold tabular-nums text-slate-900">${item.value}</span>
        <div class="flex h-36 w-full items-end justify-center rounded-lg bg-slate-50 px-2 pb-0 pt-2">
          <div
            class="w-full max-w-[3.5rem] rounded-t-md"
            style="height:${Math.max(4, (item.value / max) * 100)}%;background:${item.color}"
            title="${escapeHtml(item.label)}: ${item.value}"
          ></div>
        </div>
        <span class="text-center text-xs text-slate-500">${escapeHtml(item.label)}</span>
      </div>`
    )
    .join('');

  return panel(title, `<div class="flex items-end gap-3">${cols}</div>`);
}

/** Прогресс по доле от total. */
function progressCard(title: string, value: number, total: number, color: string): string {
  const p = pct(value, total);
  return `
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(title)}</p>
      <div class="mt-2 flex items-end justify-between gap-2">
        <p class="text-2xl font-bold tabular-nums text-slate-900">${value}</p>
        <p class="pb-0.5 text-sm font-semibold tabular-nums" style="color:${color}">${p}%</p>
      </div>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div class="h-full rounded-full" style="width:${Math.min(100, p)}%;background:${color}"></div>
      </div>
      <p class="mt-1.5 text-xs text-slate-400">из ${total}</p>
    </div>`;
}

function kpiCard(title: string, value: string | number, hint?: string): string {
  return `
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(title)}</p>
      <p class="mt-2 text-2xl font-bold tabular-nums text-slate-900">${escapeHtml(String(value))}</p>
      ${hint ? `<p class="mt-1 text-xs text-slate-500">${escapeHtml(hint)}</p>` : ''}
    </div>`;
}

function panel(title: string, body: string): string {
  return `
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 class="mb-4 text-sm font-semibold text-slate-800">${escapeHtml(title)}</h2>
      ${body}
    </div>`;
}

/** Упрощённая воронка заявок. */
function funnelChart(title: string, stages: Array<{ key: string; value: number; color: string }>): string {
  const max = Math.max(1, ...stages.map((s) => s.value));
  const rows = stages
    .map((s) => {
      const width = Math.max(18, (s.value / max) * 100);
      return `
        <div class="flex flex-col items-center gap-1">
          <div
            class="flex h-10 items-center justify-center rounded-md text-sm font-semibold text-white shadow-sm"
            style="width:${width}%;background:${s.color};min-width:5rem"
          >${s.value}</div>
          <span class="text-xs text-slate-500">${escapeHtml(s.key)}</span>
        </div>`;
    })
    .join('<div class="flex justify-center text-slate-300">↓</div>');

  return panel(title, `<div class="space-y-1">${rows}</div>`);
}

function renderStats(stats: AdminOverviewStats): string {
  const roles = sortedEntries(stats.users.by_role);
  const apps = sortedEntries(stats.applications.by_status);
  const reports = sortedEntries(stats.reports.by_payment_status);
  const withdraws = sortedEntries(stats.withdraws.by_status);

  const pending = stats.applications.by_status.pending ?? 0;
  const approved = stats.applications.by_status.approved ?? 0;
  const inProgress = stats.applications.by_status.in_progress ?? 0;
  const completed = stats.applications.by_status.completed ?? 0;

  return `
    <section class="space-y-6">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        ${kpiCard('Пользователи', stats.users.total)}
        ${kpiCard('Заявки', stats.applications.total)}
        ${kpiCard('Отчёты', stats.reports.total)}
        ${kpiCard('Офферы', stats.offers.total, `${stats.offers.active} активных`)}
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        ${donutChart('Пользователи по ролям', roles, ROLE_LABELS)}
        ${columnChart('Новые регистрации', [
          { label: '7 дней', value: stats.users.registered_last_7_days, color: '#0369a1' },
          { label: '30 дней', value: stats.users.registered_last_30_days, color: '#0f172a' }
        ])}
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        ${progressCard('Активные', stats.users.active, stats.users.total, '#0f766e')}
        ${progressCard('Email подтверждён', stats.users.email_verified, stats.users.total, '#1d4ed8')}
        ${progressCard('Офферы активны', stats.offers.active, stats.offers.total || 1, '#a16207')}
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        ${barChart(`Заявки по статусам (${stats.applications.total})`, apps, APP_STATUS_LABELS)}
        ${funnelChart('Воронка заявок', [
          { key: 'Pending', value: pending, color: '#a16207' },
          { key: 'Approved', value: approved, color: '#0369a1' },
          { key: 'In progress', value: inProgress, color: '#1d4ed8' },
          { key: 'Completed', value: completed, color: '#0f766e' }
        ])}
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        ${donutChart(`Отчёты (${stats.reports.total})`, reports, REPORT_STATUS_LABELS)}
        ${
          stats.withdraws.available
            ? `
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              ${kpiCard('Заявки на вывод', stats.withdraws.total)}
              ${kpiCard('Сумма pending', stats.withdraws.pending_amount)}
            </div>
            ${barChart('Выводы по статусам', withdraws, WITHDRAW_STATUS_LABELS)}
          </div>`
            : panel(
                'Выводы',
                `<p class="text-sm text-amber-800">Таблица withdraw_requests недоступна на этой БД.</p>`
              )
        }
      </div>
    </section>
  `;
}

export async function createAdminOverviewPage(): Promise<HTMLElement> {
  const content = document.createElement('div');
  content.innerHTML =
    '<div class="flex justify-center py-16"><div class="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700"></div></div>';

  const page = wrapWithAdminShell(content, 'overview');

  try {
    const stats = await apiService.getAdminStatsOverview();
    content.innerHTML = renderStats(stats);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
    content.innerHTML = `<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">${escapeHtml(msg)}</div>`;
  }

  return page;
}
