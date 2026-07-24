// Профиль исполнителя (заказчик): маска, статистика, без PII

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { EmployerExecutorProfile, OfferApplicationRow } from '../types/index.js';
import { buildAppDecisionHtml, bindAppDecisionHandlers } from '../utils/employerApplicationDecision.js';
import {
  bindExecutorProfileCopyButtons,
  buildEmployerExecutorProfileHtml
} from '../utils/employerExecutorProfileUi.js';

export async function createEmployerExecutorProfilePage(offerId: string, executorUserId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'employer-executor-profile-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <button type="button" id="employer-executor-profile-back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 class="text-xl font-bold flex-1 min-w-0">Исполнитель</h1>
        </div>
      </header>
      <main class="pb-28 px-4 py-3">
        <div id="loading" class="py-8 text-center text-slate-500">Загрузка…</div>
        <div id="content" class="hidden space-y-3"></div>
        <div id="err" class="hidden text-red-600 text-center py-8"></div>
      </main>
    </div>
  `;

  const loading = page.querySelector('#loading') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;

  page.querySelector('#employer-executor-profile-back-btn')?.addEventListener('click', () => {
    router.back(`/offers/${offerId}`);
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

    const decisionHtml = pendingApp ? buildAppDecisionHtml() : '';

    content.innerHTML = buildEmployerExecutorProfileHtml(p) + decisionHtml;
    bindExecutorProfileCopyButtons(content);

    if (pendingApp) {
      bindAppDecisionHandlers(content, pendingApp.application_id, {
        onResolved: () => router.navigate(`/offers/${offerId}`)
      });
    }
  } catch (e: unknown) {
    loading.classList.add('hidden');
    err.textContent = e instanceof Error ? e.message : 'Не удалось загрузить профиль';
    err.classList.remove('hidden');
  }

  return page;
}
