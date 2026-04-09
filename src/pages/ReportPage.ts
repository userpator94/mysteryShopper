// Страница отчёта о выполнении задания

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import { getUserId } from '../utils/auth.js';
import type { ChecklistItem, ChecklistSchema, Offer } from '../types/index.js';
import {
  escapeHtml,
  descriptionToParagraphsHtml,
  formatCompensationLines
} from '../utils/offerDisplay.js';

const REPORT_FORM_URL = 'https://forms.yandex.ru/cloud/692847d4d046889383c04c34';

const SUBMIT_REPORT_CONFIRM =
  'Отправить отчёт? Это необратимо: после отправки изменить отчёт будет нельзя.';

export async function createReportPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'report-page';

  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <div class="flex items-center gap-3">
            <button id="back-btn" class="text-slate-500">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 class="text-2xl font-bold">Отчёт</h1>
          </div>
        </header>
        
        <main class="pb-28">
          <div id="loading-state" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span class="ml-2 text-slate-600">Загрузка информации...</span>
          </div>
          
          <div id="error-state" class="hidden text-center py-8 px-4">
            <div class="text-red-500 mb-2">⚠️</div>
            <p class="text-slate-600 mb-4">Не удалось загрузить информацию о предложении</p>
            <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              Попробовать снова
            </button>
          </div>
          
          <div id="blocked-state" class="hidden text-center py-8 px-4">
            <p id="blocked-message" class="text-slate-700 mb-4"></p>
            <button id="blocked-view-report-btn" type="button" class="hidden w-full max-w-sm mx-auto mb-3 px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900">
              Просмотреть отчёт
            </button>
            <button id="blocked-back-btn" type="button" class="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300">
              Назад к заданию
            </button>
          </div>
          
          <div id="report-content" class="hidden">
            <div class="px-4 py-4">
              <!-- Информация о предложении -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <h2 id="offer-title" class="text-xl font-bold mb-2"></h2>
                <div id="offer-description" class="text-slate-600 text-sm mb-3"></div>
                <div class="mb-2">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Вознаграждение</span>
                  <div id="offer-compensation" class="text-sm text-slate-800 mt-1"></div>
                </div>
                <div class="flex justify-end">
                  <span id="offer-company" class="text-slate-600 text-sm"></span>
                </div>
              </div>
              
              <!-- Инструкции по отчёту -->
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <h3 class="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                  <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10A1,1 0 0,1 13,11V13A1,1 0 0,1 12,14A1,1 0 0,1 11,13V11A1,1 0 0,1 12,10Z"/>
                  </svg>
                  Инструкция
                </h3>
                <p class="text-blue-800 text-sm leading-relaxed">
                  Пожалуйста, заполните форму отчёта о выполнении задания. Убедитесь, что вы предоставили всю необходимую информацию и приложили все требуемые материалы.
                </p>
              </div>
              
              <!-- Форма отчёта (стандарт или чек-лист — заполняется после загрузки оффера) -->
              <div id="report-form-root" class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <h3 class="font-semibold mb-4">Форма отчёта</h3>
                <div id="report-form-inner" class="space-y-4"></div>
              </div>
              
              <!-- Кнопки действий -->
              <div class="space-y-3">
                <button 
                  id="submit-report-btn" 
                  class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Отправить отчёт
                </button>
                <button 
                  id="open-form-btn" 
                  class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Открыть форму Yandex
                </button>
                <button 
                  id="cancel-btn" 
                  class="w-full bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Загружаем данные предложения
  await loadOfferInfo(page, offerId);

  // Настраиваем обработчики событий
  setupEventHandlers(page, offerId);

  return page;
}

// Функция загрузки информации о предложении
async function loadOfferInfo(page: HTMLElement, offerId: string) {
  const loadingState = page.querySelector('#loading-state') as HTMLElement;
  const errorState = page.querySelector('#error-state') as HTMLElement;
  const blockedState = page.querySelector('#blocked-state') as HTMLElement;
  const reportContent = page.querySelector('#report-content') as HTMLElement;

  try {
    // Показываем состояние загрузки
    showState(loadingState, [errorState, reportContent, blockedState]);

    // Загружаем предложение из API
    const offer = await apiService.getOfferById(offerId);

    if (!offer) {
      throw new Error('Предложение не найдено');
    }

    const application = await apiService.getApplyByOfferId(offerId);
    if (!application) {
      hideState(loadingState);
      const msg = page.querySelector('#blocked-message') as HTMLElement;
      if (msg) msg.textContent = 'Нет активной заявки на это задание. Сначала примите участие.';
      page.querySelector('#blocked-view-report-btn')?.classList.add('hidden');
      showState(blockedState, [errorState, reportContent]);
      return;
    }
    if (application.has_report) {
      hideState(loadingState);
      const msg = page.querySelector('#blocked-message') as HTMLElement;
      if (msg) msg.textContent = 'Отчёт по этому заданию уже отправлен. Повторная отправка недоступна.';
      page.querySelector('#blocked-view-report-btn')?.classList.remove('hidden');
      showState(blockedState, [errorState, reportContent]);
      return;
    }

    // Скрываем состояние загрузки
    hideState(loadingState);

    // Отображаем данные предложения
    renderOfferInfo(offer, page);
    renderReportForm(offer, page);

    // Показываем контент
    showState(reportContent, [errorState, blockedState]);

  } catch (error) {
    console.error('Ошибка загрузки предложения:', error);
    
    // Скрываем состояние загрузки
    hideState(loadingState);
    
    // Показываем состояние ошибки
    showState(errorState, [reportContent, blockedState]);
  }
}

// Функция отображения информации о предложении
function renderOfferInfo(offer: Offer, page: HTMLElement) {
  const titleEl = page.querySelector('#offer-title') as HTMLElement;
  const descriptionEl = page.querySelector('#offer-description') as HTMLElement;
  const compensationEl = page.querySelector('#offer-compensation') as HTMLElement;
  const companyEl = page.querySelector('#offer-company') as HTMLElement;

  if (titleEl) titleEl.textContent = offer.title || 'Название не указано';
  if (descriptionEl) descriptionEl.innerHTML = descriptionToParagraphsHtml(offer.description || '');
  if (compensationEl) {
    const lines = formatCompensationLines(offer);
    compensationEl.innerHTML = lines.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  }
  if (companyEl) companyEl.textContent = offer.employer_company || 'Компания не указана';
}

function renderReportForm(offer: Offer, page: HTMLElement) {
  const root = page.querySelector('#report-form-inner') as HTMLElement;
  if (!root) return;
  const schema = offer.checklist_schema as ChecklistSchema | null | undefined;
  const hasChecklist = Boolean(schema?.items && schema.items.length > 0);
  root.innerHTML = hasChecklist ? buildChecklistHtml(schema!.items) : buildStandardReportHtml();
  root.dataset.checklistItems = hasChecklist ? JSON.stringify(schema!.items) : '';
}

function buildStandardReportHtml(): string {
  return `
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-2">Оценка (от 1 до 5)</label>
      <select id="report-rating" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
        <option value="5">5 - Отлично</option>
        <option value="4">4 - Хорошо</option>
        <option value="3">3 - Удовлетворительно</option>
        <option value="2">2 - Плохо</option>
        <option value="1">1 - Очень плохо</option>
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-2">Описание выполненной работы</label>
      <textarea id="report-description" class="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none" placeholder="Опишите, что вы сделали..."></textarea>
    </div>
  `;
}

function normalizeChecklistItemType(t: unknown): string {
  const s = String(t ?? '')
    .trim()
    .toLowerCase();
  if (s === 'bool' || s === 'boolean') return 'boolean';
  if (s === 'scale_1_5' || s === 'scale' || s === 'rating') return 'scale_1_5';
  if (s === 'text' || s === 'textarea') return 'text';
  if (s === 'single_choice' || s === 'choice') return 'single_choice';
  if (s === 'photo_text' || s === 'photo' || s === 'photo_with_caption') return 'photo_text';
  return s;
}

function buildChecklistHtml(items: ChecklistItem[]): string {
  return items
    .map((item) => {
      const req = item.required ? ' *' : '';
      const base = `data-item-id="${escapeAttr(item.id)}"`;
      const ty = normalizeChecklistItemType(item.type);
      if (ty === 'boolean') {
        return `<div class="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-b-0">
          <span class="text-sm text-slate-800 flex-1 min-w-0 pr-2">${escapeHtml(item.label)}${req}</span>
          <label class="checklist-bool-switch-label shrink-0" title="Да / Нет">
            <input type="checkbox" role="switch" class="checklist-bool" ${base} />
            <span class="android-switch-track" aria-hidden="true"></span>
          </label>
        </div>`;
      }
      if (ty === 'scale_1_5') {
        const opts = [1, 2, 3, 4, 5]
          .map(
            (n) =>
              `<label class="inline-flex items-center gap-1 mr-2"><input type="radio" name="scale-${escapeAttr(item.id)}" class="checklist-scale" value="${n}" ${base} /> ${n}</label>`
          )
          .join('');
        return `<div class="space-y-1"><span class="block text-sm font-medium text-slate-700">${escapeHtml(item.label)}${req}</span><div class="flex flex-wrap gap-1">${opts}</div></div>`;
      }
      if (ty === 'text') {
        return `<div>
          <label class="block text-sm font-medium text-slate-700 mb-1">${escapeHtml(item.label)}${req}</label>
          <textarea class="checklist-text w-full min-h-[80px] px-3 py-2 border border-slate-300 rounded-lg text-sm" ${base}></textarea>
        </div>`;
      }
      if (ty === 'single_choice' && item.options?.length) {
        const opts = item.options
          .map(
            (o, i) =>
              `<label class="flex items-center gap-2 py-1"><input type="radio" name="choice-${escapeAttr(item.id)}" class="checklist-choice" value="${escapeAttr(o)}" ${base} data-choice-index="${i}" />${escapeHtml(o)}</label>`
          )
          .join('');
        return `<div class="space-y-1"><span class="block text-sm font-medium text-slate-700">${escapeHtml(item.label)}${req}</span>${opts}</div>`;
      }
      if (ty === 'photo_text') {
        return `<div class="space-y-2 py-3 border-b border-slate-100 last:border-b-0">
          <p class="text-sm font-medium text-slate-800">${escapeHtml(item.label)}${req}</p>
          <div>
            <span class="text-xs text-slate-500">Фото</span>
            <input type="file" accept="image/*" class="checklist-photo-file block w-full text-sm mt-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-300 file:bg-white" ${base} />
          </div>
          <textarea class="checklist-photo-text w-full min-h-[80px] px-3 py-2 border border-slate-300 rounded-lg text-sm" ${base} placeholder="Пояснение к фото"></textarea>
        </div>`;
      }
      return '';
    })
    .join('');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function collectChecklistAnswers(page: HTMLElement): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  page.querySelectorAll('input.checklist-bool').forEach((el) => {
    const id = (el as HTMLElement).dataset.itemId;
    if (!id) return;
    const input = el as HTMLInputElement;
    if (input.type === 'radio') {
      if (input.checked) out[id] = input.value === '1';
    } else {
      /* checkbox: Android-switch — да = true, нет = false */
      out[id] = input.checked;
    }
  });
  page.querySelectorAll('.checklist-scale:checked').forEach((el) => {
    const id = (el as HTMLElement).dataset.itemId;
    if (id) out[id] = parseInt((el as HTMLInputElement).value, 10);
  });
  page.querySelectorAll('.checklist-text').forEach((el) => {
    const id = (el as HTMLElement).dataset.itemId;
    if (id) out[id] = (el as HTMLTextAreaElement).value.trim();
  });
  page.querySelectorAll('.checklist-choice:checked').forEach((el) => {
    const id = (el as HTMLElement).dataset.itemId;
    if (id) out[id] = (el as HTMLInputElement).value;
  });
  page.querySelectorAll('textarea.checklist-photo-text').forEach((el) => {
    const id = (el as HTMLElement).dataset.itemId;
    if (!id) return;
    const expl = (el as HTMLTextAreaElement).value.trim();
    const fileInput = [...page.querySelectorAll('input.checklist-photo-file')].find(
      (n) => (n as HTMLInputElement).dataset.itemId === id
    ) as HTMLInputElement | undefined;
    const hasFile = Boolean(fileInput?.files?.length);
    if (!hasFile && !expl) return;
    out[id] = { explanation: expl };
  });
  return out;
}

function collectChecklistPhotosInOrder(page: HTMLElement, items: ChecklistItem[]): {
  files: File[];
  itemIds: string[];
} {
  const files: File[] = [];
  const itemIds: string[] = [];
  for (const it of items) {
    if (normalizeChecklistItemType(it.type) !== 'photo_text') continue;
    const input = [...page.querySelectorAll('input.checklist-photo-file')].find(
      (n) => (n as HTMLInputElement).dataset.itemId === it.id
    ) as HTMLInputElement | undefined;
    const f = input?.files?.[0];
    if (f) {
      files.push(f);
      itemIds.push(it.id);
    }
  }
  return { files, itemIds };
}

function validateChecklistPhotoItems(page: HTMLElement, items: ChecklistItem[]): string | null {
  for (const it of items) {
    if (normalizeChecklistItemType(it.type) !== 'photo_text') continue;
    const input = [...page.querySelectorAll('input.checklist-photo-file')].find(
      (n) => (n as HTMLInputElement).dataset.itemId === it.id
    ) as HTMLInputElement | undefined;
    const textEl = [...page.querySelectorAll('textarea.checklist-photo-text')].find(
      (n) => (n as HTMLTextAreaElement).dataset.itemId === it.id
    ) as HTMLTextAreaElement | undefined;
    const expl = textEl?.value?.trim() ?? '';
    const hasFile = Boolean(input?.files?.length);
    if (!it.required) {
      if (!hasFile && !expl) continue;
      if (hasFile && !expl) return `Заполните пояснение к фото: ${it.label}`;
      if (!hasFile && expl) return `Прикрепите фото: ${it.label}`;
      continue;
    }
    if (!hasFile) return `Прикрепите фото: ${it.label}`;
    if (!expl) return `Заполните пояснение к фото: ${it.label}`;
  }
  return null;
}

// Функции управления состояниями
function showState(element: HTMLElement, hideElements: HTMLElement[]) {
  element.classList.remove('hidden');
  hideElements.forEach(el => el.classList.add('hidden'));
}

function hideState(element: HTMLElement) {
  element.classList.add('hidden');
}

function setupEventHandlers(page: HTMLElement, offerId: string) {
  page.querySelector('#back-btn')?.addEventListener('click', () => window.history.back());

  page.querySelector('#retry-btn')?.addEventListener('click', async () => {
    await loadOfferInfo(page, offerId);
  });

  page.querySelector('#blocked-back-btn')?.addEventListener('click', () => window.history.back());
  page.querySelector('#blocked-view-report-btn')?.addEventListener('click', () => {
    router.navigate(`/report/${offerId}/view`);
  });

  const submitBtn = page.querySelector('#submit-report-btn');
  submitBtn?.addEventListener('click', async () => {
    if (!confirm(SUBMIT_REPORT_CONFIRM)) return;

    const userId = getUserId();
    if (!userId) {
      alert('Войдите в систему заново.');
      window.location.href = '/login';
      return;
    }

    let applicationId: string | null = null;
    try {
      const application = await apiService.getApplyByOfferId(offerId);
      if (application?.application_id) applicationId = application.application_id;
      else {
        alert('Не найдена заявка по этому заданию.');
        return;
      }
    } catch {
      alert('Не удалось получить заявку.');
      return;
    }

    const formInner = page.querySelector('#report-form-inner') as HTMLElement | null;
    const isChecklist =
      formInner?.querySelector(
        '.checklist-bool, .checklist-scale, .checklist-text, .checklist-choice, .checklist-photo-file, .checklist-photo-text'
      ) != null;

    if (isChecklist && formInner) {
      let items: ChecklistItem[] = [];
      try {
        items = JSON.parse(formInner.dataset.checklistItems || '[]') as ChecklistItem[];
      } catch {
        items = [];
      }
      const photoErr = validateChecklistPhotoItems(page, items);
      if (photoErr) {
        alert(photoErr);
        return;
      }
    }

    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
    }

    try {
      if (isChecklist && formInner) {
        let items: ChecklistItem[] = [];
        try {
          items = JSON.parse(formInner.dataset.checklistItems || '[]') as ChecklistItem[];
        } catch {
          items = [];
        }
        const checklistAnswers = collectChecklistAnswers(page);
        const { files: photoFiles, itemIds: checklistPhotoItemIds } = collectChecklistPhotosInOrder(page, items);
        const response = await apiService.submitReport({
          applicationId,
          offerId,
          userId,
          feedback: {},
          photos: photoFiles,
          checklistAnswers,
          checklistPhotoItemIds: checklistPhotoItemIds.length ? checklistPhotoItemIds : undefined
        });
        if (response.success) {
          alert('Отчёт отправлен.');
          window.history.back();
        }
      } else {
        const description = (page.querySelector('#report-description') as HTMLTextAreaElement)?.value?.trim();
        const rating = parseInt((page.querySelector('#report-rating') as HTMLSelectElement)?.value || '5', 10);
        if (!description) {
          alert('Заполните описание выполненной работы.');
          return;
        }
        const response = await apiService.submitReport({
          applicationId,
          offerId,
          userId,
          rating,
          feedback: { comment: description },
          photos: []
        });
        if (response.success) {
          alert('Отчёт отправлен.');
          window.history.back();
        }
      }
    } catch (error: any) {
      alert(error?.message || 'Ошибка отправки отчёта.');
    } finally {
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить отчёт';
      }
    }
  });

  page.querySelector('#open-form-btn')?.addEventListener('click', () => {
    window.open(REPORT_FORM_URL, '_blank', 'noopener');
  });

  page.querySelector('#cancel-btn')?.addEventListener('click', () => window.history.back());
}

