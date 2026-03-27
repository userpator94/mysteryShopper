// Страница редактирования задачи (заказчик)

import type { Offer, UpdateOfferPayload } from '../types/index.js';
import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import { formatTagsForDisplay } from '../utils/formatTags.js';
import { checklistSectionHtml, initChecklistBuilder, collectOfferChecklistFromPage } from '../utils/checklistOfferUi.js';

export async function createEditOfferPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'edit-offer-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
        <div class="flex items-center gap-3">
          <button id="back-btn" class="text-slate-500 p-1">←</button>
          <h1 class="text-2xl font-bold">Редактировать задачу</h1>
        </div>
      </header>
      <main class="pb-28">
        <div id="loading-state" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div id="error-state" class="hidden text-center py-8">
          <p class="text-slate-600 mb-4">Не удалось загрузить задачу</p>
          <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg">Повторить</button>
        </div>
        <div id="locked-state" class="hidden text-center py-8 px-4">
          <p class="text-slate-600 mb-4">
            Редактирование недоступно: по задаче есть отчёт или заявка исполнителя в работе (принята, выполняется или завершена).
          </p>
          <button type="button" id="locked-back-btn" class="px-4 py-2 bg-primary text-white rounded-lg">К моим задачам</button>
        </div>
        <form id="edit-offer-form" class="hidden px-4 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Название *</label>
            <input id="offer-title" name="title" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Описание *</label>
            <textarea id="offer-description" name="description" required rows="4" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Цена (₽) *</label>
            <input id="offer-price" name="price" type="number" min="0" step="1" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Местоположение *</label>
            <input id="offer-location" name="location" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Требования *</label>
            <textarea id="offer-requirements" name="requirements" required rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Теги</label>
            <input id="offer-tags" name="tags" class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Дата начала *</label>
              <input id="offer-start-date" name="start_date" type="date" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Дата окончания *</label>
              <input id="offer-end-date" name="end_date" type="date" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Макс. участников *</label>
            <input id="offer-max-participants" name="max_participants" type="number" min="1" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" />
          </div>
          <div class="flex items-center gap-2">
            <input id="offer-is-promo" name="is_promo" type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary" />
            <label for="offer-is-promo" class="text-sm text-slate-700">Промо</label>
          </div>
          <div class="flex items-center gap-2">
            <input id="offer-is-active" name="is_active" type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary" checked />
            <label for="offer-is-active" class="text-sm text-slate-700">Активно</label>
          </div>
          ${checklistSectionHtml()}
          <div id="form-error" class="hidden text-red-600 text-sm"></div>
          <button type="submit" id="submit-btn" class="w-full h-14 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">Сохранить</button>
        </form>
      </main>
    </div>
  `;

  const loading = page.querySelector('#loading-state') as HTMLElement;
  const error = page.querySelector('#error-state') as HTMLElement;
  const locked = page.querySelector('#locked-state') as HTMLElement;
  const form = page.querySelector('#edit-offer-form') as HTMLFormElement;

  try {
    const offer = await apiService.getOfferById(offerId);
    loading.classList.add('hidden');
    error.classList.add('hidden');
    if (offer.can_edit === false) {
      locked?.classList.remove('hidden');
      form?.classList.add('hidden');
    } else {
      locked?.classList.add('hidden');
      form?.classList.remove('hidden');
      fillForm(page, offer);
      initChecklistBuilder(page, offer.checklist_schema ?? null);
    }
  } catch (e) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
    page.querySelector('#retry-btn')?.addEventListener('click', () => router.navigate(`/my-offers/${offerId}/edit`));
  }

  page.querySelector('#locked-back-btn')?.addEventListener('click', () => router.navigate('/my-offers'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cl = collectOfferChecklistFromPage(page);
    if (cl.mode === 'custom' && !cl.schema) {
      const errEl = page.querySelector('#form-error') as HTMLElement;
      if (errEl) {
        errEl.textContent = 'Заполните чек-лист или выберите стандартный формат.';
        errEl.classList.remove('hidden');
      }
      return;
    }
    const payload: UpdateOfferPayload = {
      title: (page.querySelector('#offer-title') as HTMLInputElement)?.value.trim(),
      description: (page.querySelector('#offer-description') as HTMLTextAreaElement)?.value.trim(),
      price: (() => {
        const v = (page.querySelector('#offer-price') as HTMLInputElement)?.value;
        return v !== undefined && v !== '' ? Math.floor(Number(v)) : undefined;
      })(),
      location: (page.querySelector('#offer-location') as HTMLInputElement)?.value.trim(),
      requirements: (page.querySelector('#offer-requirements') as HTMLTextAreaElement)?.value.trim(),
      tags: (page.querySelector('#offer-tags') as HTMLInputElement)?.value.trim(),
      start_date: (page.querySelector('#offer-start-date') as HTMLInputElement)?.value,
      end_date: (page.querySelector('#offer-end-date') as HTMLInputElement)?.value,
      max_participants: parseInt((page.querySelector('#offer-max-participants') as HTMLInputElement)?.value || '1', 10),
      is_promo: (page.querySelector('#offer-is-promo') as HTMLInputElement)?.checked ?? false,
      is_active: (page.querySelector('#offer-is-active') as HTMLInputElement)?.checked ?? true,
      checklist_schema: cl.mode === 'custom' ? cl.schema : null,
    };

    const btn = page.querySelector('#submit-btn') as HTMLButtonElement;
    const errEl = page.querySelector('#form-error') as HTMLElement;
    if (btn) btn.disabled = true;
    if (errEl) errEl.classList.add('hidden');
    try {
      await apiService.updateOffer(offerId, payload);
      router.navigate('/my-offers');
    } catch (err: any) {
      if (errEl) { errEl.textContent = err?.message || 'Ошибка сохранения'; errEl.classList.remove('hidden'); }
      if (btn) btn.disabled = false;
    }
  });

  page.querySelector('#back-btn')?.addEventListener('click', () => router.navigate('/my-offers'));

  const priceInput = page.querySelector('#offer-price') as HTMLInputElement;
  priceInput?.addEventListener('input', () => {
    const raw = priceInput.value;
    if (/[^\d]/.test(raw)) {
      const n = Math.floor(Number(raw));
      priceInput.value = Number.isNaN(n) || n < 0 ? '' : String(n);
    }
  });

  return page;
}

function fillForm(page: HTMLElement, offer: Offer) {
  (page.querySelector('#offer-title') as HTMLInputElement).value = offer.title || '';
  (page.querySelector('#offer-description') as HTMLTextAreaElement).value = offer.description || '';
  (page.querySelector('#offer-price') as HTMLInputElement).value = offer.price != null ? String(Math.floor(Number(offer.price))) : '';
  (page.querySelector('#offer-location') as HTMLInputElement).value = offer.location || '';
  (page.querySelector('#offer-requirements') as HTMLTextAreaElement).value = offer.requirements || '';
  (page.querySelector('#offer-tags') as HTMLInputElement).value = formatTagsForDisplay(offer.tags);
  (page.querySelector('#offer-max-participants') as HTMLInputElement).value = String(offer.max_participants ?? 1);
  (page.querySelector('#offer-is-promo') as HTMLInputElement).checked = offer.is_promo ?? false;
  (page.querySelector('#offer-is-active') as HTMLInputElement).checked = offer.is_active ?? true;
  if (offer.start_date) {
    const d = new Date(offer.start_date);
    (page.querySelector('#offer-start-date') as HTMLInputElement).value = d.toISOString().slice(0, 10);
  }
  if (offer.end_date) {
    const d = new Date(offer.end_date);
    (page.querySelector('#offer-end-date') as HTMLInputElement).value = d.toISOString().slice(0, 10);
  }
}
