// Страница «Мои задачи» (кабинет заказчика)

import type { Offer } from '../types/index.js';
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
          <div id="offers-list" class="space-y-4"></div>
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
  const list = page.querySelector('#offers-list') as HTMLElement;

  try {
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    empty.classList.add('hidden');
    list.classList.add('hidden');

    const offers = await apiService.getMyOffers();
    loading.classList.add('hidden');

    if (offers.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    list.innerHTML = offers.map((o) => renderOfferCard(o)).join('');
    list.classList.remove('hidden');
  } catch (e) {
    console.error(e);
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }
}

function renderOfferCard(offer: Offer): string {
  const start = offer.start_date ? new Date(offer.start_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const end = offer.end_date ? new Date(offer.end_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const price = offer.price ? `${Number(offer.price).toLocaleString()} ₽` : '';
  const status = offer.is_active ? 'Активно' : 'Неактивно';
  return `
    <div class="bg-white rounded-lg p-4 border border-slate-200" data-offer-id="${offer.id}">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-semibold">${offer.title || 'Без названия'}</h3>
        <span class="text-sm ${offer.is_active ? 'text-green-600' : 'text-slate-500'}">${status}</span>
      </div>
      <p class="text-slate-600 text-sm mb-2 line-clamp-2">${offer.description || ''}</p>
      <div class="flex justify-between items-center text-sm text-slate-500 mb-2">
        <span>${start} — ${end}</span>
        <span class="font-semibold text-primary">${price}</span>
      </div>
      <div class="flex gap-2">
        <a href="#" class="edit-offer-link px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200" data-offer-id="${offer.id}">Изменить</a>
        <button type="button" class="delete-offer-btn px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100" data-offer-id="${offer.id}">Удалить</button>
      </div>
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
