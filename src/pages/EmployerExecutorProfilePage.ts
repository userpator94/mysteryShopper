// Профиль исполнителя (заказчик): маска, статистика, без PII

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { EmployerExecutorProfile, OfferApplicationRow } from '../types/index.js';

function formatLocalDate(iso: string | undefined): string {
  if (iso == null || String(iso).trim() === '') return '—';
  const raw = typeof iso === 'string' ? iso : String(iso);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
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
    router.navigate(`/my-offers/${offerId}`);
  });

  try {
    const [p, applications]: [EmployerExecutorProfile, OfferApplicationRow[]] = await Promise.all([
      apiService.getEmployerExecutorProfile(offerId, executorUserId),
      apiService.getOfferApplications(offerId).catch(() => [] as OfferApplicationRow[])
    ]);
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    const pendingApp = applications.find(
      (a) => a.user_id === executorUserId && String(a.status || '').toLowerCase() === 'pending'
    );

    const decisionHtml = pendingApp
      ? `<div id="app-decision" class="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p class="text-sm font-semibold text-amber-950">Заявка на эту задачу ожидает вашего решения</p>
          <button type="button" id="app-approve-btn" class="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700">Одобрить</button>
          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-700" for="app-reject-text">Комментарий при отклонении (не менее 10 слов)</label>
            <textarea id="app-reject-text" class="w-full min-h-[88px] border border-slate-300 rounded-lg p-2 text-sm" placeholder="Поясните причину отказа..."></textarea>
          </div>
          <button type="button" id="app-reject-btn" class="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700">Отклонить заявку</button>
          <p id="app-decision-err" class="hidden text-sm text-red-600"></p>
        </div>`
      : '';

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
      ${decisionHtml}
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

    if (pendingApp) {
      const errEl = content.querySelector('#app-decision-err') as HTMLElement | null;
      const showDecErr = (m: string) => {
        if (!errEl) return;
        errEl.textContent = m;
        errEl.classList.remove('hidden');
      };

      content.querySelector('#app-approve-btn')?.addEventListener('click', async () => {
        const btn = content.querySelector('#app-approve-btn') as HTMLButtonElement;
        const btn2 = content.querySelector('#app-reject-btn') as HTMLButtonElement | null;
        errEl?.classList.add('hidden');
        try {
          btn.disabled = true;
          if (btn2) btn2.disabled = true;
          await apiService.patchApplicationStatus(pendingApp.application_id, { status: 'approved' });
          alert('Заявка одобрена.');
          router.navigate(`/my-offers/${offerId}`);
        } catch (ex: unknown) {
          showDecErr(ex instanceof Error ? ex.message : 'Ошибка');
        } finally {
          btn.disabled = false;
          if (btn2) btn2.disabled = false;
        }
      });

      content.querySelector('#app-reject-btn')?.addEventListener('click', async () => {
        const ta = content.querySelector('#app-reject-text') as HTMLTextAreaElement;
        const c = (ta?.value || '').trim();
        if (countWords(c) < 10) {
          showDecErr('Укажите комментарий не короче 10 слов.');
          return;
        }
        const btn = content.querySelector('#app-reject-btn') as HTMLButtonElement;
        const btn2 = content.querySelector('#app-approve-btn') as HTMLButtonElement | null;
        errEl?.classList.add('hidden');
        try {
          btn.disabled = true;
          if (btn2) btn2.disabled = true;
          await apiService.patchApplicationStatus(pendingApp.application_id, { status: 'rejected', comment: c });
          alert('Заявка отклонена.');
          router.navigate(`/my-offers/${offerId}`);
        } catch (ex: unknown) {
          showDecErr(ex instanceof Error ? ex.message : 'Ошибка');
        } finally {
          btn.disabled = false;
          if (btn2) btn2.disabled = false;
        }
      });
    }
  } catch (e: unknown) {
    loading.classList.add('hidden');
    err.textContent = e instanceof Error ? e.message : 'Не удалось загрузить профиль';
    err.classList.remove('hidden');
  }

  return page;
}
