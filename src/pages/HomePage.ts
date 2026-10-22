// Главный экран с поиском и фильтрами

import type { Offer } from '../types/index.js';
import { isMapsLocationUiEnabled } from '../config/yandexMaps.js';
import { getCurrentLocation, formatCityName } from '../utils/geolocation.js';
import { escapeHtml, formatExecutorRewardNumber } from '../utils/offerDisplay.js';
import { devLog } from '../utils/logger.js';

// Кэш для промо-предложений
let promoOffersCache: { data: Offer[]; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 секунд

// Функция для получения промо-предложений из API
async function fetchPromoOffers(): Promise<Offer[]> {
  try {
    // Проверяем кэш
    if (promoOffersCache && Date.now() - promoOffersCache.timestamp < CACHE_DURATION) {
      devLog.log('Используем кэшированные промо-предложения');
      return promoOffersCache.data;
    }

    // В development используем прокси Vite, в production - прямой URL
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isDevelopment 
      ? '/api/promo-offers' // Используем прокси Vite
      : 'https://77-222-43-250.swtest.ru/api/promo-offers';
    
    devLog.log('Запрос к API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    devLog.log('Ответ API:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const responseData = await response.json();
    devLog.log('Полученные данные:', responseData);
    
    // Обрабатываем структуру ответа API
    let offers: Offer[] = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      offers = responseData.data;
    } else if (Array.isArray(responseData)) {
      offers = responseData;
    } else {
      console.warn('Неожиданная структура ответа API:', responseData);
      offers = [];
    }

    // Кэшируем результат
    promoOffersCache = { data: offers, timestamp: Date.now() };
    
    return offers;
  } catch (error) {
    console.error('Ошибка при получении промо-предложений:', error);
    console.error('Тип ошибки:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    return [];
  }
}

/** Промо-карточка задания в сетке 2 колонки на главной. */
function generateOfferCard(offer: any): string {
  const priceLabel = formatExecutorRewardNumber({ price: offer.price });
  const safeTitle = escapeHtml(String(offer.title || 'Без названия'));
  const safeId = escapeHtml(String(offer.id || ''));
  return `
    <button
      type="button"
      class="group flex h-full min-h-[7.5rem] w-full flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md active:translate-y-0"
      data-offer-id="${safeId}"
    >
      <h3 class="line-clamp-3 text-sm font-semibold leading-snug text-slate-900">${safeTitle}</h3>
      <span class="inline-flex w-fit items-center rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
        ${escapeHtml(priceLabel)}
      </span>
    </button>
  `;
}

export async function createHomePage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'home-page';

  // [AGENT] Геолокация/город в поиске скрыты вместе с картами (см. MAPS_LOCATION_UI_ENABLED).
  // Вкл.: MAPS_LOCATION_UI_ENABLED = true + VITE_YANDEX_MAPS_API_KEY — больше правок не нужно.
  const mapsLocationUi = isMapsLocationUiEnabled();
  
  // Сначала показываем страницу с индикатором загрузки
  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="text-slate-500" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input class="w-full h-12 pl-10 pr-12 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="${mapsLocationUi ? 'Определяем местоположение...' : 'Поиск'}" type="text" disabled/>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          </div>
        </header>
        
        <main class="pb-28">
          <div class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p class="text-slate-600">${mapsLocationUi ? 'Определяем ваше местоположение...' : 'Загрузка…'}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;
  
  let cityName = mapsLocationUi ? 'Москва' : ''; // город в placeholder только при включённой локации
  let promoOffers: Offer[] = [];
  
  // Важно: геолокация может зависнуть/долго отвечать во встроенных webview.
  // Не блокируем рендер — берём город по умолчанию и обновим позже, если получится.
  const offersPromise = fetchPromoOffers().catch(() => []);
  const locationPromise = mapsLocationUi
    ? (async () => {
        // уменьшаем ожидание до 1.5с, иначе UX ощущается «приложение зависло»
        const timeoutMs = 1500;
        const t = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
        const loc = await Promise.race([getCurrentLocation().catch(() => null), t]);
        return loc;
      })()
    : Promise.resolve(null);

  try {
    const offers = await offersPromise;
    promoOffers = offers.slice(0, 2); // Берем только первые два предложения
  } catch (error) {
    console.error('Ошибка при загрузке промо-предложений:', error);
  }
  
  // Обновляем страницу с полученным городом
  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="text-slate-500" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input class="w-full h-12 pl-10 pr-12 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="${mapsLocationUi && cityName ? `Поиск в ${cityName}` : 'Поиск'}" type="text"/>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <button class="text-slate-500">
                <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        <main class="pb-28">
          <div id="categories-section" class="p-4">
            <div class="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
              <div class="flex flex-col gap-3 w-[60vw] shrink-0">
                <div class="flex gap-3">
                  <button id="clothing-button" class="flex-1 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="clothing">
                    <svg class="w-8 h-8 text-blue-700 mb-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V6H6C4.9 6 4 6.9 4 8V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8C20 6.9 19.1 6 18 6H16V4ZM10 4H14V6H10V4ZM18 8H6V20H18V8Z"/>
                    </svg>
                    <span class="font-semibold text-blue-800 text-shadow text-sm">Одежда</span>
                  </button>
                  <button id="shoes-button" class="flex-1 rounded-lg bg-gradient-to-br from-green-200 to-green-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="shoes">
                    <svg class="w-8 h-8 text-green-700 mb-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill-rule="evenodd" d="M4 13.6v3.2c0 .9.7 1.6 1.6 1.6h14.2c.8 0 1.4-.8 1.2-1.6l-.8-3.2c-.2-.8-.9-1.3-1.7-1.3h-3l-1.1-3.1c-.3-.8-1-1.3-1.8-1.3H9.3c-.8 0-1.5.5-1.8 1.2L6 11.1H5.5c-.8 0-1.5.6-1.5 1.4v1.1zm2.4-.4 1.2-2.6h1.5l.6 1.6h1.4l.5-1.4h1.3l.8 2.4h2.6l.5 2H6.2l.2-2z"/>
                    </svg>
                    <span class="font-semibold text-green-800 text-shadow text-sm">Одежда</span>
                  </button>
                </div>
                <button id="electronics-button" class="rounded-lg bg-gradient-to-br from-purple-200 to-purple-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="electronics">
                  <svg class="w-8 h-8 text-purple-700 mb-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8 2.2h8c1.2 0 2.2 1 2.2 2.2v15.2c0 1.2-1 2.2-2.2 2.2H8c-1.2 0-2.2-1-2.2-2.2V4.4c0-1.2 1-2.2 2.2-2.2zm1.4 3.2v11h5.2v-11H9.4zm1.4 12.5h2.4v1.2h-2.4v-1.2z"/>
                  </svg>
                  <span class="font-semibold text-purple-800 text-shadow text-sm">Электроника</span>
                </button>
              </div>
              <div class="flex flex-col gap-3 w-[60vw] shrink-0">
                <button id="food-button" class="rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="food">
                  <svg class="w-8 h-8 text-orange-700 mb-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 9.1V7.4a4 4 0 0 1 8 0v1.7h1.6V7.4a5.6 5.6 0 0 0-11.2 0v1.7H8z"/>
                    <path fill-rule="evenodd" d="M4.4 9.4h15.2l-1.3 10.1c-.1.8-.8 1.4-1.6 1.4H7.3c-.8 0-1.5-.6-1.6-1.4L4.4 9.4zm4.2 2.1h1.5v6.6H8.6v-6.6zm4.3 0h1.5v6.6h-1.5v-6.6z"/>
                  </svg>
                  <span class="font-semibold text-orange-800 text-shadow text-sm">Продукты</span>
                </button>
                <div class="flex gap-3">
                  <button id="sports-button" class="flex-1 rounded-lg bg-gradient-to-br from-red-200 to-red-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="sports">
                    <svg class="w-8 h-8 text-red-700 mb-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill-rule="evenodd" d="M6.8 1.1c-2.5 0-4.3 2.9-4.3 6.5s1.8 6.5 4.3 6.5 4.3-2.9 4.3-6.5-1.8-6.5-4.3-6.5zm0 2.2c1.2 0 2 1.8 2 4.3s-.8 4.3-2 4.3-2-1.8-2-4.3.8-4.3 2-4.3z"/>
                      <path d="M5.15 5.9h3.3v1.05H5.15zm0 2.35h3.3V9.3H5.15zM6.28 4.4h1.05v5.5H6.28z"/>
                      <path d="M5.95 13.2h1.7v7.1c0 .55-.4 1-.95 1-.55 0-.95-.45-.95-1v-7.1z"/>
                      <path d="M5.55 20.3h2.5v1.2c0 .28-.28.5-.65.5h-1.2c-.37 0-.65-.22-.65-.5v-1.2z"/>
                      <circle cx="17.3" cy="5.6" r="2.85"/>
                      <circle cx="17.3" cy="12.5" r="2.85"/>
                    </svg>
                    <span class="font-semibold text-red-800 text-shadow text-sm">Спорт</span>
                  </button>
                  <button id="beauty-button" class="flex-1 rounded-lg bg-gradient-to-br from-pink-200 to-pink-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="beauty">
                    <svg class="w-8 h-8 text-pink-700 mb-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3.8a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8zM16.1 6.8a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8zM14.5 11.6a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8zM9.5 11.6a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8zM7.9 6.8a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8zM12 9.95a2.05 2.05 0 1 0 .01 0z"/>
                    </svg>
                    <span class="font-semibold text-pink-800 text-shadow text-sm">Красота</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div id="advertisement-section" class="grid grid-cols-2 gap-3 px-4 py-1">
            <a href="https://iliamartynenko.com/" target="_blank" rel="noopener noreferrer" class="ad-link-flicker flex h-12 items-center justify-center rounded-xl bg-slate-800 px-3 text-center text-sm font-medium text-white transition-colors hover:bg-slate-700">
              Разработчик
            </a>
            <a href="https://oldos-shop.ru/" target="_blank" rel="noopener noreferrer" class="ad-link-flicker ad-link-flicker--delay flex h-12 items-center justify-center rounded-xl bg-slate-800 px-3 text-center text-sm font-medium text-white transition-colors hover:bg-slate-700">
              Бизнес-партнёр
            </a>
          </div>
          
          <div id="filters-section" class="flex gap-3 px-4 py-3">
            <button type="button" data-perk="discount" class="flex-1 h-12 shrink-0 rounded-lg bg-primary/10 px-4 flex items-center justify-center gap-2 cursor-pointer">
              <p class="text-primary text-sm font-semibold">Большая скидка</p>
            </button>
            <button type="button" data-perk="high_income" class="flex-1 h-12 shrink-0 rounded-lg bg-primary/10 px-4 flex items-center justify-center gap-2 cursor-pointer">
              <p class="text-primary text-sm font-semibold">Высокий доход</p>
            </button>
            ${
              /* [AGENT] Кнопка «На карте» скрыта. Вкл.: MAPS_LOCATION_UI_ENABLED + VITE_YANDEX_MAPS_API_KEY. */
              mapsLocationUi
                ? `<button type="button" class="flex-1 h-12 shrink-0 rounded-lg bg-primary/10 px-4 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed" disabled>
              <p class="text-primary text-sm font-semibold">На карте</p>
            </button>`
                : `<!-- [AGENT] «На карте» скрыто. Вкл.: MAPS_LOCATION_UI_ENABLED + VITE_YANDEX_MAPS_API_KEY -->`
            }
          </div>
          
          <div id="offers-section" class="px-4 pt-4 space-y-4">
            <div class="grid grid-cols-2 items-stretch gap-3">
              ${promoOffers.length > 0 ? promoOffers.map(offer => generateOfferCard(offer)).join('') : `
                <button type="button" class="group flex h-full min-h-[7.5rem] w-full flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" data-offer-id="4">
                  <h3 class="line-clamp-3 text-sm font-semibold leading-snug text-slate-900">Продажа в Магазине Одежды</h3>
                  <span class="inline-flex w-fit items-center rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold tabular-nums text-primary">20%</span>
                </button>
                <button type="button" class="group flex h-full min-h-[7.5rem] w-full flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" data-offer-id="5">
                  <h3 class="line-clamp-3 text-sm font-semibold leading-snug text-slate-900">Продажа в Магазине Обуви</h3>
                  <span class="inline-flex w-fit items-center rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold tabular-nums text-primary">15%</span>
                </button>
              `}
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Догружаем местоположение «в фоне», без блокировки UI (только если UI локации включён)
  if (mapsLocationUi) {
    locationPromise
      .then((locationInfo) => {
        if (!locationInfo) return;
        const nextCity = formatCityName(locationInfo);
        const input = page.querySelector('header input') as HTMLInputElement | null;
        if (input) input.placeholder = `Поиск в ${nextCity}`;
      })
      .catch(() => {});
  }

  // Настраиваем обработчики событий
  setupEventHandlers(page);

  return page;
}

function setupEventHandlers(page: HTMLElement) {
  // Обработчики для карточек предложений (space-y-2)
  const offerCards = page.querySelectorAll('[data-offer-id]');
  offerCards.forEach(card => {
    card.addEventListener('click', () => {
      const offerId = (card as HTMLElement).dataset.offerId;
      if (offerId) {
        // Используем роутер для навигации
        window.location.hash = `#/offers/${offerId}`;
      }
    });
  });

  // Обработчики для кнопок категорий
  const categoryButtons = page.querySelectorAll('[data-category]');
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = (button as HTMLElement).dataset.category;
      if (category) {
        // Переходим на страницу предложений с фильтром категории
        window.location.hash = `#/offers?category=${category}`;
      }
    });
  });

  const perkButtons = page.querySelectorAll('[data-perk]');
  perkButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const perk = (button as HTMLElement).dataset.perk;
      if (perk === 'high_income') {
        window.location.hash = '#/offers?sort=price_desc&perk=high_income';
      } else if (perk === 'discount') {
        window.location.hash = '#/offers?perk=discount';
      }
    });
  });

}

// function setupEventHandlers(page: HTMLElement) {
//   // Поиск
//   const searchInput = page.querySelector('#search-input') as HTMLInputElement;
//   
//   const performSearch = () => {
//     const query = searchInput.value.trim();
//     if (query) {
//       // Переход на страницу предложений с поисковым запросом
//       window.location.hash = `#/offers?search=${encodeURIComponent(query)}`;
//     }
//   };

//   searchInput?.addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') {
//       performSearch();
//     }
//   });

//   // Фильтры
//   const filterButtons = page.querySelectorAll('[data-filter]');
//   filterButtons.forEach(button => {
//     button.addEventListener('click', () => {
//       const filter = (button as HTMLElement).dataset.filter;
//       // Переход на страницу предложений с фильтром
//       window.location.hash = `#/offers?filter=${filter}`;
//     });
//   });

//   // Категории
//   const categoryCards = page.querySelectorAll('[data-category]');
//   categoryCards.forEach(card => {
//     card.addEventListener('click', () => {
//       const categoryId = (card as HTMLElement).dataset.category;
//       // Переход на страницу предложений с категорией
//       window.location.hash = `#/offers?category=${categoryId}`;
//     });
//   });

//   // Карточки предложений
//   const offerCards = page.querySelectorAll('[data-offer]');
//   offerCards.forEach(card => {
//     card.addEventListener('click', () => {
//       const offerId = (card as HTMLElement).dataset.offer;
//       // Переход на детальную страницу предложения
//       window.location.hash = `#/offers/${offerId}`;
//     });
//   });

//   // Кнопка "Все предложения"
//   const allOffersBtn = page.querySelector('#all-offers-btn');
//   allOffersBtn?.addEventListener('click', () => {
//     window.location.hash = '#/offers';
//   });
// }
