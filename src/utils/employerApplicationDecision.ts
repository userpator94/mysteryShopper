import { apiService } from '../services/api.js';
import { refreshEmployerInboxBadge } from './employerInboxBadge.js';

export function buildAppDecisionHtml(): string {
  return `<div id="app-decision" class="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
    <p class="text-sm font-semibold text-amber-950">Заявка на эту задачу ожидает вашего решения</p>
    <button type="button" id="app-approve-btn" class="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700">Одобрить</button>
    <div class="space-y-1">
      <label class="text-xs font-medium text-slate-700" for="app-reject-text">Комментарий при отклонении (не менее 10 слов)</label>
      <textarea id="app-reject-text" class="w-full min-h-[88px] border border-slate-300 rounded-lg p-2 text-sm" placeholder="Поясните причину отказа..."></textarea>
    </div>
    <button type="button" id="app-reject-btn" class="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700">Отклонить заявку</button>
    <p id="app-decision-err" class="hidden text-sm text-red-600"></p>
  </div>`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function bindAppDecisionHandlers(
  root: HTMLElement,
  applicationId: string,
  options?: { onResolved?: () => void }
): void {
  const errEl = root.querySelector('#app-decision-err') as HTMLElement | null;
  const showDecErr = (m: string) => {
    if (!errEl) return;
    errEl.textContent = m;
    errEl.classList.remove('hidden');
  };

  root.querySelector('#app-approve-btn')?.addEventListener('click', async () => {
    const btn = root.querySelector('#app-approve-btn') as HTMLButtonElement;
    const btn2 = root.querySelector('#app-reject-btn') as HTMLButtonElement | null;
    errEl?.classList.add('hidden');
    try {
      btn.disabled = true;
      if (btn2) btn2.disabled = true;
      await apiService.patchApplicationStatus(applicationId, { status: 'approved' });
      void refreshEmployerInboxBadge(true);
      options?.onResolved?.();
    } catch (ex: unknown) {
      showDecErr(ex instanceof Error ? ex.message : 'Ошибка');
    } finally {
      btn.disabled = false;
      if (btn2) btn2.disabled = false;
    }
  });

  root.querySelector('#app-reject-btn')?.addEventListener('click', async () => {
    const ta = root.querySelector('#app-reject-text') as HTMLTextAreaElement;
    const c = (ta?.value || '').trim();
    if (countWords(c) < 10) {
      showDecErr('Укажите комментарий не короче 10 слов.');
      return;
    }
    const btn = root.querySelector('#app-reject-btn') as HTMLButtonElement;
    const btn2 = root.querySelector('#app-approve-btn') as HTMLButtonElement | null;
    errEl?.classList.add('hidden');
    try {
      btn.disabled = true;
      if (btn2) btn2.disabled = true;
      await apiService.patchApplicationStatus(applicationId, { status: 'rejected', comment: c });
      void refreshEmployerInboxBadge(true);
      options?.onResolved?.();
    } catch (ex: unknown) {
      showDecErr(ex instanceof Error ? ex.message : 'Ошибка');
    } finally {
      btn.disabled = false;
      if (btn2) btn2.disabled = false;
    }
  });
}
