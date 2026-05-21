import type { EmployerExecutorProfile } from '../types/index.js';
import { buildExecutorAvatarHtml } from './executorAvatar.js';

export function escapeHtml(s: string): string {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

export function formatLocalDate(iso: string | undefined): string {
  if (iso == null || String(iso).trim() === '') return '—';
  const d = new Date(typeof iso === 'string' ? iso : String(iso));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? '');
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.left = '-1000px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function buildEmployerExecutorProfileHtml(p: EmployerExecutorProfile): string {
  const avatarBlock = buildExecutorAvatarHtml({
    avatar_url: p.avatar_url,
    avatar_emoji: p.avatar_emoji
  });

  const badge = p.worked_with_this_employer
    ? `<span class="inline-flex items-center rounded-full bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-1 border border-emerald-200">Уже работал с вами</span>`
    : '';

  const tzLine =
    p.executor_timezone != null && String(p.executor_timezone).trim() !== ''
      ? `<p class="text-xs text-slate-500 mt-1">Часовой пояс исполнителя: ${escapeHtml(String(p.executor_timezone))}</p>`
      : '';

  return `
    <div class="flex items-start gap-3 text-left">
      <div class="shrink-0 w-16">${avatarBlock}</div>
      <div class="min-w-0 flex-1 flex flex-col items-start gap-1.5">
        <p class="text-lg font-semibold text-slate-900 leading-tight tracking-wide">${escapeHtml(p.masked_name)}</p>
        <button type="button" id="employer-executor-profile-copy-user-id" class="inline-flex items-center gap-1 text-xs text-primary hover:underline px-0 py-0 bg-transparent max-w-full" data-copy-text="${escapeHtml(p.user_id)}" aria-label="Скопировать ID">
          <span class="font-mono break-all">${escapeHtml(p.user_id)}</span>
          <svg class="w-3.5 h-3.5 shrink-0 text-primary/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9h10v10H9V9z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        ${badge ? `<div>${badge}</div>` : ''}
        ${tzLine}
      </div>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <h2 class="text-sm font-semibold text-slate-800">По платформе</h2>
      <dl class="grid gap-1.5 text-sm">
        <div class="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
          <dt class="text-slate-600">Регистрация</dt>
          <dd class="text-slate-900 font-medium text-right">${escapeHtml(formatLocalDate(p.registered_at))}</dd>
        </div>
        <div class="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
          <dt class="text-slate-600">В работе без отчёта</dt>
          <dd class="text-slate-900 font-medium">${p.stats.active_tasks_without_report}</dd>
        </div>
        <div class="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
          <dt class="text-slate-600">Задач с отчётом</dt>
          <dd class="text-slate-900 font-medium">${p.stats.completed_tasks_with_report}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-slate-600">Отказы исполнителя</dt>
          <dd class="text-slate-900 font-medium">${p.stats.executor_self_cancellations}</dd>
        </div>
      </dl>
    </div>
  `;
}

export function bindExecutorProfileCopyButtons(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-copy-text]').forEach((el) => {
    el.addEventListener('click', async () => {
      const text = el.getAttribute('data-copy-text') ?? '';
      const ok = await copyToClipboard(text);
      if (!ok) {
        alert('Не удалось скопировать');
        return;
      }
      el.classList.add('opacity-70');
      setTimeout(() => el.classList.remove('opacity-70'), 600);
    });
  });
}
