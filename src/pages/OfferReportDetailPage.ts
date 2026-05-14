// Просмотр одного отчёта заказчиком

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import type { EmployerReportListItem } from '../types/index.js';
import {
  buildReportReadOnlyBodyHtml,
  buildReportStatusAndDisclaimerHtml
} from '../utils/reportViewContent.js';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

async function renderReportInto(
  container: HTMLElement,
  offerId: string,
  reportId: string,
  r: EmployerReportListItem,
  pdfBtn: HTMLButtonElement,
  reportRef: { current: EmployerReportListItem | null }
): Promise<void> {
  reportRef.current = r;
  const body = buildReportReadOnlyBodyHtml(r, { showExecutorLabel: true });
  const meta = buildReportStatusAndDisclaimerHtml(r);
  const profileBtn =
    r.executor_user_id != null && String(r.executor_user_id).length > 0
      ? `<p class="pt-2"><button type="button" id="exec-profile-link" class="text-sm font-semibold text-primary hover:underline">Профиль исполнителя</button></p>`
      : '';

  const reviewPanel =
    r.report_status === 'pending_review'
      ? `<div id="employer-review" class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 mt-4">
          <p class="text-sm font-semibold text-slate-800">Решение по отчёту</p>
          <p class="text-xs text-slate-600">При отклонении укажите комментарий не короче 10 слов.</p>
          <label class="block text-xs font-medium text-slate-600" for="reject-comment">Комментарий при отклонении</label>
          <textarea id="reject-comment" class="w-full min-h-[100px] border border-slate-300 rounded-lg p-2 text-sm" placeholder="Поясните, что не устроило..."></textarea>
          <div class="flex gap-2 flex-wrap">
            <button type="button" id="btn-approve" class="flex-1 min-w-[120px] bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700">Принять</button>
            <button type="button" id="btn-reject" class="flex-1 min-w-[120px] bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700">Отклонить</button>
          </div>
          <p id="review-err" class="hidden text-sm text-red-600"></p>
        </div>`
      : '';

  container.innerHTML = `<div class="read-only-report space-y-3">${profileBtn}${body}${reviewPanel}${meta}</div>`;

  container.querySelector('#exec-profile-link')?.addEventListener('click', () => {
    router.navigate(`/my-offers/${offerId}/executor/${r.executor_user_id}`);
  });

  const reviewErr = container.querySelector('#review-err') as HTMLElement | null;
  const showReviewErr = (msg: string) => {
    if (!reviewErr) return;
    reviewErr.textContent = msg;
    reviewErr.classList.remove('hidden');
  };
  const hideReviewErr = () => reviewErr?.classList.add('hidden');

  const busy = (btn: HTMLButtonElement | null, v: boolean) => {
    if (!btn) return;
    btn.disabled = v;
  };

  container.querySelector('#btn-approve')?.addEventListener('click', async () => {
    hideReviewErr();
    const btn = container.querySelector('#btn-approve') as HTMLButtonElement | null;
    const btn2 = container.querySelector('#btn-reject') as HTMLButtonElement | null;
    busy(btn, true);
    busy(btn2, true);
    try {
      const next = await apiService.reviewEmployerOfferReport(offerId, reportId, { decision: 'approve' });
      await renderReportInto(container, offerId, reportId, next, pdfBtn, reportRef);
    } catch (e: unknown) {
      showReviewErr(e instanceof Error ? e.message : 'Не удалось сохранить решение');
    } finally {
      busy(btn, false);
      busy(btn2, false);
    }
  });

  container.querySelector('#btn-reject')?.addEventListener('click', async () => {
    hideReviewErr();
    const ta = container.querySelector('#reject-comment') as HTMLTextAreaElement | null;
    const comment = (ta?.value || '').trim();
    if (countWords(comment) < 10) {
      showReviewErr('Комментарий при отклонении должен содержать не менее 10 слов.');
      return;
    }
    const btn = container.querySelector('#btn-approve') as HTMLButtonElement | null;
    const btn2 = container.querySelector('#btn-reject') as HTMLButtonElement | null;
    busy(btn, true);
    busy(btn2, true);
    try {
      const next = await apiService.reviewEmployerOfferReport(offerId, reportId, {
        decision: 'reject',
        comment
      });
      await renderReportInto(container, offerId, reportId, next, pdfBtn, reportRef);
    } catch (e: unknown) {
      showReviewErr(e instanceof Error ? e.message : 'Не удалось сохранить решение');
    } finally {
      busy(btn, false);
      busy(btn2, false);
    }
  });
}

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

  const reportRef: { current: EmployerReportListItem | null } = { current: null };

  pdfBtn?.addEventListener('click', async () => {
    if (!reportRef.current) return;
    pdfBtn.disabled = true;
    try {
      await apiService.downloadEmployerReportPdf(offerId, reportRef.current.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Не удалось скачать PDF');
    } finally {
      pdfBtn.disabled = false;
    }
  });

  try {
    const r: EmployerReportListItem = await apiService.getEmployerOfferReport(offerId, reportId);
    reportRef.current = r;
    loading.classList.add('hidden');
    content.classList.remove('hidden');
    await renderReportInto(content, offerId, reportId, r, pdfBtn, reportRef);
  } catch (e: unknown) {
    loading.classList.add('hidden');
    err.textContent = e instanceof Error ? e.message : 'Не удалось загрузить отчёт';
    err.classList.remove('hidden');
  }

  return page;
}
