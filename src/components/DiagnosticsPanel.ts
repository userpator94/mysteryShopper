// Панель выгрузки клиентской диагностики. Не участвует в авторизации.

import {
  buildDiagnosticsReport,
  clearDiagnostics,
  copyDiagnostics,
  deliverDiagnostics,
  downloadDiagnostics,
  type DiagnosticsReport,
  type DiagEvent,
} from '../utils/diagnostics.js';

const PANEL_ID = 'ms-diagnostics-panel';
let escapeBound = false;

function formatEventLine(ev: DiagEvent): string {
  const time = new Date(ev.wall).toLocaleTimeString('ru-RU', { hour12: false });
  if (!ev.data) return `${time}  ${ev.type}`;
  const parts: string[] = [];
  try {
    for (const [key, value] of Object.entries(ev.data)) {
      if (value == null || value === '') continue;
      const rendered = typeof value === 'object' ? JSON.stringify(value) : String(value);
      parts.push(`${key}=${rendered}`);
      if (parts.join(', ').length > 220) break;
    }
  } catch { /* показываем хотя бы тип */ }
  const extra = parts.length ? ` — ${parts.join(', ')}` : '';
  const line = `${time}  ${ev.type}${extra}`;
  return line.length > 360 ? `${line.slice(0, 360)}…` : line;
}

function formatStarted(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso || '—';
  return new Date(ms).toLocaleString('ru-RU', { hour12: false });
}

function bundleLabel(moduleScript: string): string {
  if (!moduleScript) return '—';
  try {
    const path = new URL(moduleScript, location.origin).pathname;
    return path.split('/').pop() || moduleScript;
  } catch {
    return moduleScript;
  }
}

function statusText(result: 'shared' | 'uploaded' | 'downloaded' | 'cancelled'): string {
  if (result === 'shared') return 'Откройте «Поделиться» и отправьте файл разработчику';
  if (result === 'uploaded') return 'Отчёт отправлен на сервер';
  if (result === 'cancelled') return 'Отправка отменена';
  return 'Файл скачан — отправьте его разработчику';
}

function render(root: HTMLElement): void {
  let report: DiagnosticsReport;
  try {
    report = buildDiagnosticsReport();
  } catch {
    root.replaceChildren();
    const fail = document.createElement('p');
    fail.className = 'm-4 text-sm text-slate-700';
    fail.textContent = 'Не удалось собрать отчёт';
    root.appendChild(fail);
    return;
  }

  root.replaceChildren();
  const card = document.createElement('div');
  card.className = 'flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-xl bg-white p-4 text-slate-900 shadow-xl';
  card.addEventListener('click', (ev) => ev.stopPropagation());

  const header = document.createElement('div');
  header.className = 'flex items-start justify-between gap-3';
  const title = document.createElement('h2');
  title.className = 'text-lg font-semibold';
  title.textContent = 'Диагностика';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'text-sm font-medium text-slate-500 underline';
  close.textContent = 'Закрыть';
  close.addEventListener('click', () => root.remove());
  header.append(title, close);

  const summary = document.createElement('dl');
  summary.className = 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs';
  const rows: Array<[string, string]> = [
    ['Сессия', report.sessionId],
    ['Старт', formatStarted(report.app.startedAt)],
    ['Событий', String(report.events.length)],
    ['Сеть', report.network.onLine ? 'online' : 'offline'],
    ['Сборка', bundleLabel(report.app.moduleScript)],
  ];
  for (const [label, value] of rows) {
    const dt = document.createElement('dt');
    dt.className = 'text-slate-500';
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.className = 'break-all font-mono';
    dd.textContent = value;
    summary.append(dt, dd);
  }

  const summaryLine = document.createElement('p');
  summaryLine.className = 'break-all text-xs text-slate-500';
  summaryLine.textContent = report.summary;

  const actions = document.createElement('div');
  actions.className = 'flex flex-wrap gap-2';
  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'inline-flex h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white';
  downloadBtn.textContent = 'Скачать JSON';
  const sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.className = 'inline-flex h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold';
  sendBtn.textContent = 'Отправить';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'inline-flex h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold';
  copyBtn.textContent = 'Скопировать';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'inline-flex h-11 items-center px-3 text-sm font-medium text-red-700';
  clearBtn.textContent = 'Очистить';
  actions.append(downloadBtn, sendBtn, copyBtn, clearBtn);

  const status = document.createElement('p');
  status.className = 'min-h-5 text-xs text-slate-600';
  status.setAttribute('aria-live', 'polite');

  const listHeading = document.createElement('p');
  listHeading.className = 'text-sm font-medium';
  listHeading.textContent = 'Последние события';
  const list = document.createElement('ul');
  list.className = 'max-h-64 overflow-y-auto rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs';
  const recent = report.events.slice(-20);
  if (!recent.length) {
    const empty = document.createElement('li');
    empty.className = 'text-slate-500';
    empty.textContent = 'Журнал пуст';
    list.appendChild(empty);
  } else {
    for (const ev of recent) {
      const li = document.createElement('li');
      li.className = 'border-b border-slate-200 py-1 break-all last:border-0';
      li.textContent = formatEventLine(ev);
      list.appendChild(li);
    }
  }

  const note = document.createElement('p');
  note.className = 'text-xs text-slate-500';
  note.textContent = 'Пароли и токены не записываются, email маскируется.';

  downloadBtn.addEventListener('click', () => {
    try {
      downloadDiagnostics();
      status.textContent = 'Файл скачан. Если загрузка не началась, нажмите ещё раз.';
    } catch {
      status.textContent = 'Не удалось скачать';
    }
  });
  sendBtn.addEventListener('click', () => {
    sendBtn.disabled = true;
    void deliverDiagnostics()
      .then((result) => {
        status.textContent = statusText(result);
      })
      .catch(() => {
        status.textContent = 'Не удалось отправить';
      })
      .finally(() => {
        sendBtn.disabled = false;
      });
  });
  copyBtn.addEventListener('click', () => {
    void copyDiagnostics()
      .then(() => {
        status.textContent = 'Скопировано';
      })
      .catch(() => {
        status.textContent = 'Не удалось скопировать';
      });
  });
  clearBtn.addEventListener('click', () => {
    if (!window.confirm('Очистить журнал диагностики?')) return;
    clearDiagnostics();
    render(root);
    const next = root.querySelector('[aria-live="polite"]');
    if (next) next.textContent = 'Журнал очищен';
  });

  card.append(header, summary, summaryLine, actions, status, listHeading, list, note);
  root.appendChild(card);
}

export function mountDiagnosticsPanel(): void {
  let root = document.getElementById(PANEL_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = PANEL_ID;
    root.className = 'fixed inset-0 z-[11000] flex items-end justify-center bg-black/40 p-4 sm:items-center';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Диагностика');
    root.addEventListener('click', () => root?.remove());
    document.body.appendChild(root);
  }
  if (!escapeBound) {
    escapeBound = true;
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      document.getElementById(PANEL_ID)?.remove();
    });
  }
  render(root);
}
