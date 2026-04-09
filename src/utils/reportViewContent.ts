import type { ChecklistItem, EmployerReportListItem } from '../types/index.js';

export function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/** Дата/время без секунд (для строки «Отчёт от …»). */
export function fmtReportSubmittedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function parseReportPhotoIds(photos: unknown): string[] {
  if (photos == null) return [];
  if (Array.isArray(photos)) return photos.map((x) => String(x));
  if (typeof photos === 'string') {
    try {
      const p = JSON.parse(photos) as unknown;
      return Array.isArray(p) ? p.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function reportStatusLabel(status: string | undefined): string {
  if (status === 'accepted_auto') return 'Принят автоматически';
  return status ? status : '—';
}

export function formatChecklistAnswerHtml(it: ChecklistItem, v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (it.type === 'boolean') return v ? 'Да' : 'Нет';
  if (it.type === 'photo_text' && typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    const expl = typeof o.explanation === 'string' ? o.explanation : '';
    const urlRaw = o.photo_url ?? o.image_url ?? o.url;
    const url = typeof urlRaw === 'string' ? urlRaw.trim() : '';
    const safeUrl =
      url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/')) ? url : '';
    const parts: string[] = [];
    if (expl) parts.push(`<p class="whitespace-pre-wrap">${escapeHtml(expl)}</p>`);
    if (safeUrl) {
      parts.push(
        `<p class="mt-2"><img src="${escapeHtml(safeUrl)}" alt="" class="max-w-full rounded border border-slate-200" loading="lazy" /></p>`
      );
    }
    if (parts.length === 0) return '—';
    return parts.join('');
  }
  return escapeHtml(String(v));
}

/** Тело просмотра отчёта (read-only): метки дат, исполнитель (если есть), ответы */
export function buildReportReadOnlyBodyHtml(
  r: EmployerReportListItem,
  options?: { showExecutorLabel?: boolean }
): string {
  const showExec = options?.showExecutorLabel !== false && r.executor_label;
  const parts: string[] = [];
  if (showExec) {
    parts.push(`<p class="text-sm text-slate-600">${escapeHtml(r.executor_label!)}</p>`);
  }
  parts.push(
    `<p class="text-xs text-slate-500">Отчёт от ${escapeHtml(fmtReportSubmittedAt(r.submitted_at))}</p>`
  );

  if (r.checklist_answers && r.checklist_schema_snapshot?.items) {
    parts.push('<h2 class="font-semibold text-slate-800">Ответы</h2>');
    const items = r.checklist_schema_snapshot.items as ChecklistItem[];
    for (const it of items) {
      const v = r.checklist_answers[it.id];
      parts.push(
        `<div class="bg-white border border-slate-200 rounded-lg p-3"><div class="text-sm font-medium text-slate-800">${escapeHtml(it.label)}</div><div class="text-slate-700 mt-1">${formatChecklistAnswerHtml(it, v)}</div></div>`
      );
    }
  } else {
    parts.push('<h2 class="font-semibold text-slate-800">Стандартный отчёт</h2>');
    if (r.rating != null) parts.push(`<p>Оценка: ${r.rating} / 5</p>`);
    if (r.comments) parts.push(`<p class="whitespace-pre-wrap">${escapeHtml(r.comments)}</p>`);
    const photoIds = parseReportPhotoIds(r.photos);
    if (photoIds.length > 0) {
      parts.push('<p class="text-sm font-medium text-slate-700 mt-3">Фотографии</p>');
      for (const pid of photoIds) {
        const src = `/api/images/${encodeURIComponent(pid)}`;
        parts.push(
          `<p class="mt-2"><img src="${escapeHtml(src)}" alt="" class="max-w-full rounded border border-slate-200" loading="lazy" /></p>`
        );
      }
    }
  }

  return parts.join('');
}

export function buildReportStatusAndDisclaimerHtml(r: EmployerReportListItem): string {
  const statusLine = `<p class="text-sm text-slate-700 mt-3"><span class="font-medium">Статус:</span> ${escapeHtml(reportStatusLabel(r.report_status))}</p>`;
  const disc = `<p class="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3">Отчёт будет архивирован и станет недоступен для просмотра через 3 месяца с даты предоставления отчёта.</p>`;
  return statusLine + disc;
}
