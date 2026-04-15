// Страница «Мои задачи» (кабинет заказчика)

import type { Offer } from '../types/index.js';
import { formatExecutorMoneyRewardShort } from '../utils/offerDisplay.js';
import { MAX_PARTICIPANTS_UNLIMITED } from '../config/offerLimits.js';
import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

export async function createMyOffersPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'my-offers-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
        <h1 class="text-2xl font-bold mb-4">Мои задачи</h1>
        <a id="create-offer-link" href="#" class="hidden inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          <span>+</span> Создать задачу
        </a>
      </header>
      <main class="pb-28">
        <div class="px-4 py-4">
          <div id="loading-state" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span class="ml-2 text-slate-600">Загрузка...</span>
          </div>
          <div id="error-state" class="hidden text-center py-8">
            <p class="text-slate-600 mb-4">Не удалось загрузить список</p>
            <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Повторить</button>
          </div>
          <div id="empty-state" class="hidden text-center py-8 text-slate-600">
            У вас пока нет задач. Создайте первую.
          </div>
          <div id="offers-container" class="space-y-4 hidden">
            <!-- Секция "Активные" (сверху, по умолчанию раскрыта) -->
            <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button id="active-section-header" class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <span class="font-semibold text-lg">Активные</span>
                <svg id="active-section-icon" class="w-5 h-5 text-slate-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div id="active-section-content" class="px-4 pb-4">
                <div id="active-offers" class="space-y-4"></div>
              </div>
            </div>
            <!-- Секция "Вышел срок" (снизу, по умолчанию скрыта) -->
            <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button id="expired-section-header" class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <span class="font-semibold text-lg">Вышел срок</span>
                <svg id="expired-section-icon" class="w-5 h-5 text-slate-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div id="expired-section-content" class="hidden px-4 pb-4">
                <div id="expired-offers" class="space-y-4"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  await loadOffers(page);
  setupEventHandlers(page);
  return page;
}

async function loadOffers(page: HTMLElement) {
  const loading = page.querySelector('#loading-state') as HTMLElement;
  const error = page.querySelector('#error-state') as HTMLElement;
  const empty = page.querySelector('#empty-state') as HTMLElement;
  const container = page.querySelector('#offers-container') as HTMLElement;

  try {
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    empty.classList.add('hidden');
    container.classList.add('hidden');

    const offers = await apiService.getMyOffers();
    loading.classList.add('hidden');

    if (offers.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    const activeOffers = offers.filter((o) => !isOfferExpired(o));
    const expiredOffers = offers.filter((o) => isOfferExpired(o));

    const activeContainer = page.querySelector('#active-offers') as HTMLElement;
    const expiredContainer = page.querySelector('#expired-offers') as HTMLElement;
    const activeContent = page.querySelector('#active-section-content') as HTMLElement;
    const expiredContent = page.querySelector('#expired-section-content') as HTMLElement;
    const activeIcon = page.querySelector('#active-section-icon') as HTMLElement;
    const expiredIcon = page.querySelector('#expired-section-icon') as HTMLElement;

    activeContainer.innerHTML = activeOffers.length > 0 ? activeOffers.map((o) => renderOfferCard(o, false)).join('') : '<p class="text-slate-500 text-center py-4">Нет активных задач</p>';
    expiredContainer.innerHTML = expiredOffers.length > 0 ? expiredOffers.map((o) => renderOfferCard(o, true)).join('') : '<p class="text-slate-500 text-center py-4">Нет задач с истёкшим сроком</p>';

    activeContent.classList.remove('hidden');
    if (activeIcon) activeIcon.style.transform = 'rotate(180deg)';
    expiredContent.classList.add('hidden');
    if (expiredIcon) expiredIcon.style.transform = 'rotate(0deg)';

    container.classList.remove('hidden');
  } catch (e) {
    console.error(e);
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }
}

function isOfferExpired(offer: Offer): boolean {
  if (!offer.end_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(offer.end_date).setHours(0, 0, 0, 0) < today.getTime();
}

function renderOfferCard(offer: Offer, isExpired: boolean): string {
  const start = offer.start_date ? new Date(offer.start_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const end = offer.end_date ? new Date(offer.end_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const price = formatExecutorMoneyRewardShort(offer);
  const slotsLabel =
    offer.max_participants === MAX_PARTICIPANTS_UNLIMITED
      ? `Исполнителей: ${Number(offer.current_participants ?? 0)} / без лимита`
      : `Исполнителей: ${Number(offer.current_participants ?? 0)} / ${Number(offer.max_participants ?? 0)}`;
  let status: string;
  let statusClass: string;
  if (isExpired) {
    status = 'Вышел срок';
    statusClass = 'text-sm text-red-600';
  } else {
    status = offer.is_active ? 'Активно' : 'Неактивно';
    statusClass = offer.is_active ? 'text-sm text-green-600' : 'text-sm text-slate-500';
  }
  const canEdit = offer.can_edit !== false;
  const editLink =
    canEdit && !isExpired
      ? `<a href="#" class="edit-offer-link px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200" data-offer-id="${offer.id}">Изменить</a>`
      : '';
  const actionsHtml = isExpired
    ? ''
    : `${editLink}
        <button type="button" class="delete-offer-btn px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100" data-offer-id="${offer.id}">Удалить</button>`;
  const actionsSection = actionsHtml ? `<div class="flex gap-2">${actionsHtml}</div>` : '';
  return `
    <div class="bg-white rounded-lg p-4 border border-slate-200" data-offer-id="${offer.id}">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-semibold">${offer.title || 'Без названия'}</h3>
        <span class="${statusClass}">${status}</span>
      </div>
      <p class="text-slate-600 text-sm mb-2 line-clamp-2">${offer.description || ''}</p>
      <div class="flex justify-between items-center text-sm text-slate-500 mb-2">
        <span>${start} — ${end}</span>
        <span class="font-semibold text-primary">${price}</span>
      </div>
      <div class="text-xs text-slate-400 mb-2">${slotsLabel}</div>
      ${actionsSection}
    </div>
  `;
}

function setupEventHandlers(page: HTMLElement) {
  const createLink = page.querySelector('#create-offer-link');
  createLink?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/my-offers/new');
  });

  page.querySelector('#retry-btn')?.addEventListener('click', () => loadOffers(page));

  const activeHeader = page.querySelector('#active-section-header');
  const activeContent = page.querySelector('#active-section-content');
  const activeIcon = page.querySelector('#active-section-icon') as HTMLElement;
  const expiredHeader = page.querySelector('#expired-section-header');
  const expiredContent = page.querySelector('#expired-section-content');
  const expiredIcon = page.querySelector('#expired-section-icon') as HTMLElement;
  activeHeader?.addEventListener('click', () => {
    if (activeContent && activeIcon) {
      activeContent.classList.toggle('hidden');
      activeIcon.style.transform = activeContent.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  });
  expiredHeader?.addEventListener('click', () => {
    if (expiredContent && expiredIcon) {
      expiredContent.classList.toggle('hidden');
      expiredIcon.style.transform = expiredContent.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  });

  page.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const editLink = target.closest('.edit-offer-link') as HTMLElement;
    const deleteBtn = target.closest('.delete-offer-btn') as HTMLElement;
    const card = target.closest('[data-offer-id]') as HTMLElement;
    if (editLink) {
      e.preventDefault();
      const id = editLink.dataset.offerId;
      if (id) router.navigate(`/my-offers/${id}/edit`);
      return;
    }
    if (deleteBtn) {
      e.preventDefault();
      const id = deleteBtn.dataset.offerId;
      if (id && confirm('Удалить эту задачу?')) {
        apiService.deleteOffer(id).then(() => loadOffers(page)).catch((err) => alert(err?.message || 'Ошибка удаления'));
      }
      return;
    }
    if (card && !editLink && !deleteBtn) {
      const id = card.dataset.offerId;
      if (id) router.navigate(`/offers/${id}`);
    }
  });
}
