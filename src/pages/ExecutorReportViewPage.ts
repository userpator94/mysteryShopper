// Просмотр своего отчёта исполнителем (read-only)

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { EmployerReportListItem } from '../types/index.js';
import {
  buildReportReadOnlyBodyHtml,
  buildReportStatusAndDisclaimerHtml
} from '../utils/reportViewContent.js';

export async function createExecutorReportViewPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'executor-report-view-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <button type="button" id="back-btn" class="text-slate-500 p-1">←</button>
          <h1 class="text-xl font-bold">Мой отчёт</h1>
        </div>
      </header>
      <main class="pb-28 px-4 py-4">
        <div id="loading" class="py-8 text-center">Загрузка…</div>
        <div id="content" class="hidden space-y-4"></div>
        <div id="err" class="hidden text-red-600 text-center py-8"></div>
      </main>
    </div>
  `;

  page.querySelector('#back-btn')?.addEventListener('click', () => {
    router.navigate(`/offers/${offerId}`);
  });

  const loading = page.querySelector('#loading') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;

  try {
    const r: EmployerReportListItem = await apiService.getMyOfferReport(offerId);
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    const body = buildReportReadOnlyBodyHtml(r, { showExecutorLabel: false });
    const meta = buildReportStatusAndDisclaimerHtml(r);
    content.innerHTML = `<div class="read-only-report space-y-3">${body}${meta}</div>`;
  } catch (e: unknown) {
    loading.classList.add('hidden');
    const msg = e instanceof Error ? e.message : 'Не удалось загрузить отчёт';
    err.textContent = msg;
    err.classList.remove('hidden');
  }

  return page;
}
