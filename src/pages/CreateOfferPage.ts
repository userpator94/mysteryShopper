// Страница создания задачи (заказчик)

import type { CreateOfferPayload } from '../types/index.js';
import { MAX_PARTICIPANTS_UNLIMITED } from '../config/offerLimits.js';
import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import { checklistSectionHtml, initChecklistBuilder, collectOfferChecklistFromPage } from '../utils/checklistOfferUi.js';

export async function createCreateOfferPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'create-offer-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
        <div class="flex items-center gap-3">
          <button id="back-btn" class="text-slate-500 p-1">←</button>
          <h1 class="text-2xl font-bold">Создать задачу</h1>
        </div>
      </header>
      <main class="pb-28">
        <form id="create-offer-form" class="px-4 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Название *</label>
            <input id="offer-title" name="title" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" placeholder="Название задачи" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Описание *</label>
            <textarea id="offer-description" name="description" required rows="4" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary resize-none" placeholder="Описание задачи"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Цена (₽) *</label>
            <input id="offer-price" name="price" type="number" min="0" step="1" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" placeholder="0" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Местоположение *</label>
            <input id="offer-location" name="location" required class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" placeholder="Адрес или город" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Требования *</label>
            <textarea id="offer-requirements" name="requirements" required rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary resize-none" placeholder="Условия участия"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Теги (через запятую)</label>
            <input id="offer-tags" name="tags" class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" placeholder="тег1, тег2" />
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
            <label class="block text-sm font-medium text-slate-700 mb-1">Число исполнителей</label>
            <div class="flex items-center gap-2 mb-2">
              <input id="offer-unlimited-participants" name="unlimited_participants" type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary" />
              <label for="offer-unlimited-participants" class="text-sm text-slate-700">Без ограничения</label>
            </div>
            <input id="offer-max-participants" name="max_participants" type="number" min="1" max="998" step="1" class="w-full h-12 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary" value="1" />
            <p class="text-xs text-slate-500 mt-1">Если лимит не нужен, отметьте «Без ограничения».</p>
          </div>
          <div class="flex items-center gap-2">
            <input id="offer-is-promo" name="is_promo" type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary" />
            <label for="offer-is-promo" class="text-sm text-slate-700">Промо-предложение</label>
          </div>
          ${checklistSectionHtml()}
          <div id="form-error" class="hidden text-red-600 text-sm"></div>
          <button type="submit" id="submit-btn" class="w-full h-14 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">Создать</button>
        </form>
      </main>
    </div>
  `;

  initChecklistBuilder(page, null);

  const unlimitedCb = page.querySelector('#offer-unlimited-participants') as HTMLInputElement;
  const maxInput = page.querySelector('#offer-max-participants') as HTMLInputElement;
  const syncMaxParticipantsUi = () => {
    const un = unlimitedCb?.checked ?? false;
    if (maxInput) {
      maxInput.disabled = un;
      maxInput.classList.toggle('opacity-50', un);
    }
  };
  unlimitedCb?.addEventListener('change', syncMaxParticipantsUi);
  syncMaxParticipantsUi();

  const form = page.querySelector('#create-offer-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (page.querySelector('#offer-title') as HTMLInputElement)?.value.trim();
    const description = (page.querySelector('#offer-description') as HTMLTextAreaElement)?.value.trim();
    const priceRaw = (page.querySelector('#offer-price') as HTMLInputElement)?.value;
    const location = (page.querySelector('#offer-location') as HTMLInputElement)?.value.trim();
    const requirements = (page.querySelector('#offer-requirements') as HTMLTextAreaElement)?.value.trim();
    const tags = (page.querySelector('#offer-tags') as HTMLInputElement)?.value.trim();
    const start_date = (page.querySelector('#offer-start-date') as HTMLInputElement)?.value;
    const end_date = (page.querySelector('#offer-end-date') as HTMLInputElement)?.value;
    const unlimited = (page.querySelector('#offer-unlimited-participants') as HTMLInputElement)?.checked ?? false;
    const max_participants = unlimited
      ? MAX_PARTICIPANTS_UNLIMITED
      : Math.min(998, Math.max(1, parseInt((page.querySelector('#offer-max-participants') as HTMLInputElement)?.value || '1', 10)));
    const is_promo = (page.querySelector('#offer-is-promo') as HTMLInputElement)?.checked ?? false;

    const price = priceRaw !== undefined && priceRaw !== '' ? Math.floor(Number(priceRaw)) : NaN;
    if (!title || !description || Number.isNaN(price) || price < 0 || !location || !requirements || !start_date || !end_date) {
      const errEl = page.querySelector('#form-error') as HTMLElement;
      if (errEl) { errEl.textContent = 'Заполните обязательные поля. Цена — целое число.'; errEl.classList.remove('hidden'); }
      return;
    }

    const cl = collectOfferChecklistFromPage(page);
    if (cl.mode === 'custom' && !cl.schema) {
      const errEl = page.querySelector('#form-error') as HTMLElement;
      if (errEl) {
        errEl.textContent = 'Заполните чек-лист или вернитесь к стандартному формату.';
        errEl.classList.remove('hidden');
      }
      return;
    }

    const payload: CreateOfferPayload = {
      title,
      description,
      price,
      location,
      requirements,
      tags: tags || '',
      start_date,
      end_date,
      max_participants,
      is_promo,
      checklist_schema: cl.mode === 'custom' ? cl.schema : null,
    };

    const btn = page.querySelector('#submit-btn') as HTMLButtonElement;
    const errEl = page.querySelector('#form-error') as HTMLElement;
    if (btn) btn.disabled = true;
    if (errEl) errEl.classList.add('hidden');

    try {
      await apiService.createOffer(payload);
      router.navigate('/my-offers');
    } catch (err: any) {
      if (errEl) { errEl.textContent = err?.message || 'Ошибка создания'; errEl.classList.remove('hidden'); }
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
