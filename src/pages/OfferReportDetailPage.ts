// Просмотр одного отчёта заказчиком

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { EmployerReportListItem } from '../types/index.js';
import {
  buildReportReadOnlyBodyHtml,
  buildReportStatusAndDisclaimerHtml
} from '../utils/reportViewContent.js';

export async function createOfferReportDetailPage(offerId: string, reportId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offer-report-detail-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 flex-wrap">
          <button type="button" id="back-btn" class="text-slate-500 p-1">←</button>
          <h1 class="text-xl font-bold flex-1 min-w-0">Отчёт</h1>
          <button type="button" id="pdf-btn" class="text-sm font-semibold text-primary px-3 py-1.5 rounded-lg border border-primary/40 hover:bg-primary/5">
            Скачать PDF
          </button>
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
    router.navigate(`/my-offers/${offerId}/reports`);
  });

  const loading = page.querySelector('#loading') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;
  const pdfBtn = page.querySelector('#pdf-btn') as HTMLButtonElement;

  let loadedReport: EmployerReportListItem | null = null;

  pdfBtn?.addEventListener('click', async () => {
    if (!loadedReport) return;
    pdfBtn.disabled = true;
    try {
      await apiService.downloadEmployerReportPdf(offerId, loadedReport.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Не удалось скачать PDF');
    } finally {
      pdfBtn.disabled = false;
    }
  });

  try {
    const r: EmployerReportListItem = await apiService.getEmployerOfferReport(offerId, reportId);
    loadedReport = r;
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    const body = buildReportReadOnlyBodyHtml(r, { showExecutorLabel: true });
    const meta = buildReportStatusAndDisclaimerHtml(r);
    const profileBtn =
      r.executor_user_id != null && String(r.executor_user_id).length > 0
        ? `<p class="pt-2"><button type="button" id="exec-profile-link" class="text-sm font-semibold text-primary hover:underline">Профиль исполнителя</button></p>`
        : '';
    content.innerHTML = `<div class="read-only-report space-y-3">${profileBtn}${body}${meta}</div>`;
    content.querySelector('#exec-profile-link')?.addEventListener('click', () => {
      router.navigate(`/my-offers/${offerId}/executor/${r.executor_user_id}`);
    });
  } catch (e: unknown) {
    loading.classList.add('hidden');
    err.textContent = e instanceof Error ? e.message : 'Не удалось загрузить отчёт';
    err.classList.remove('hidden');
  }

  return page;
}
