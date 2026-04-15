// Профиль исполнителя (заказчик): маска, статистика, без PII

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { EmployerExecutorProfile } from '../types/index.js';

function formatLocalDate(iso: string | undefined): string {
  if (iso == null || String(iso).trim() === '') return '—';
  const raw = typeof iso === 'string' ? iso : String(iso);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function escapeHtml(s: string): string {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

async function copyToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? '');
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fallback below
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

export async function createEmployerExecutorProfilePage(offerId: string, executorUserId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'employer-executor-profile-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-3">
          <button type="button" id="back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 class="text-xl font-bold flex-1 min-w-0">Исполнитель</h1>
        </div>
      </header>
      <main class="pb-28 px-4 py-4">
        <div id="loading" class="py-12 text-center text-slate-500">Загрузка…</div>
        <div id="content" class="hidden space-y-4"></div>
        <div id="err" class="hidden text-red-600 text-center py-8"></div>
      </main>
    </div>
  `;

  const loading = page.querySelector('#loading') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;

  page.querySelector('#back-btn')?.addEventListener('click', () => {
    router.navigate(`/offers/${offerId}`);
  });

  try {
    const p: EmployerExecutorProfile = await apiService.getEmployerExecutorProfile(offerId, executorUserId);
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    const avatarBlock = p.avatar_url
      ? `<img src="${escapeHtml(p.avatar_url)}" alt="" class="w-20 h-20 rounded-full object-cover border border-slate-200" />`
      : `<div class="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl font-semibold border border-slate-200" aria-hidden="true">?</div>`;

    const badge = p.worked_with_this_employer
      ? `<span class="inline-flex items-center rounded-full bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-1 border border-emerald-200">Уже работал с вами</span>`
      : '';

    const tzLine =
      p.executor_timezone != null && String(p.executor_timezone).trim() !== ''
        ? `<p class="text-xs text-slate-500 mt-2">Часовой пояс исполнителя: ${escapeHtml(String(p.executor_timezone))}</p>`
        : '';

    content.innerHTML = `
      <div class="flex flex-col items-start text-left gap-2">
        ${avatarBlock}
        <p class="text-lg font-semibold text-slate-900">${escapeHtml(p.masked_name)}</p>
        <button type="button" class="inline-flex items-center gap-1 text-xs text-primary hover:underline px-0 py-0 bg-transparent" data-copy-text="${escapeHtml(p.user_id)}" aria-label="Скопировать ID">
          <span class="font-mono break-all">${escapeHtml(p.user_id)}</span>
          <svg class="w-3.5 h-3.5 text-primary/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9h10v10H9V9z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        ${badge ? `<div class="pt-1">${badge}</div>` : ''}
        ${tzLine}
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 class="text-sm font-semibold text-slate-800">По платформе</h2>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt class="text-slate-600">Регистрация</dt>
            <dd class="text-slate-900 font-medium text-right">${escapeHtml(formatLocalDate(p.registered_at))}</dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt class="text-slate-600">В работе без отчёта</dt>
            <dd class="text-slate-900 font-medium">${p.stats.active_tasks_without_report}</dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-slate-100 pb-2">
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

    content.querySelectorAll<HTMLElement>('[data-copy-text]').forEach((el) => {
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
  } catch (e: unknown) {
    loading.classList.add('hidden');
    err.textContent = e instanceof Error ? e.message : 'Не удалось загрузить профиль';
    err.classList.remove('hidden');
  }

  return page;
}
