// Главный экран с поиском и фильтрами

// import { Offer, Category } from '../types/index.js';
import { getCurrentLocation, formatCityName } from '../utils/geolocation.js';

export async function createHomePage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'home-page';
  
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
            <input class="w-full h-12 pl-10 pr-12 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="Определяем местоположение..." type="text" disabled/>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          </div>
        </header>
        
        <main class="pb-28">
          <div class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p class="text-slate-600">Определяем ваше местоположение...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;
  
  // Получаем информацию о местоположении
  let cityName = 'Москва'; // Значение по умолчанию
  try {
    const locationInfo = await getCurrentLocation();
    cityName = formatCityName(locationInfo);
  } catch (error) {
    console.error('Не удалось определить местоположение:', error);
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
            <input class="w-full h-12 pl-10 pr-12 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="Поиск в ${cityName}" type="text"/>
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
                    <svg class="w-8 h-8 text-green-700 mb-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V6C20 4.9 19.1 4 18 4H6ZM6 6H18V18H6V6ZM8 8C7.4 8 7 8.4 7 9V15C7 15.6 7.4 16 8 16H10C10.6 16 11 15.6 11 15V9C11 8.4 10.6 8 10 8H8ZM13 8C12.4 8 12 8.4 12 9V15C12 15.6 12.4 16 13 16H15C15.6 16 16 15.6 16 15V9C16 8.4 15.6 8 15 8H13ZM8 10H10V14H8V10ZM13 10H15V14H13V10Z"/>
                    </svg>
                    <span class="font-semibold text-green-800 text-shadow text-sm">Обувь</span>
                  </button>
                </div>
                <button id="electronics-button" class="rounded-lg bg-gradient-to-br from-purple-200 to-purple-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="electronics">
                  <svg class="w-8 h-8 text-purple-700 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6C2.9 6 2 6.9 2 8V16C2 17.1 2.9 18 4 18H20C21.1 18 22 17.1 22 16V8C22 6.9 21.1 6 20 6H4ZM4 8H20V16H4V8ZM6 10V14H18V10H6Z"/>
                  </svg>
                  <span class="font-semibold text-purple-800 text-shadow text-sm">Электроника</span>
                </button>
              </div>
              <div class="flex flex-col gap-3 w-[60vw] shrink-0">
                <button id="food-button" class="rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="food">
                  <svg class="w-8 h-8 text-orange-700 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 4V2C7 1.45 7.45 1 8 1S9 1.45 9 2V4H15V2C15 1.45 15.45 1 16 1S17 1.45 17 2V4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4H7ZM5 6V20H19V6H5ZM7 8H9V10H7V8ZM11 8H13V10H11V8ZM15 8H17V10H15V8ZM7 12H9V14H7V12ZM11 12H13V14H11V12ZM15 12H17V14H15V12ZM7 16H9V18H7V16ZM11 16H13V18H11V16ZM15 16H17V18H15V16Z"/>
                  </svg>
                  <span class="font-semibold text-orange-800 text-shadow text-sm">Продукты</span>
                </button>
                <div class="flex gap-3">
                  <button id="sports-button" class="flex-1 rounded-lg bg-gradient-to-br from-red-200 to-red-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="sports">
                    <svg class="w-8 h-8 text-red-700 mb-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10S9.79 14 12 14 16 12.21 16 10 14.21 6 12 6ZM12 12C10.9 12 10 11.1 10 10S10.9 8 12 8 14 8.9 14 10 13.1 12 12 12Z"/>
                    </svg>
                    <span class="font-semibold text-red-800 text-shadow text-sm">Спорт</span>
                  </button>
                  <button id="beauty-button" class="flex-1 rounded-lg bg-gradient-to-br from-pink-200 to-pink-300 h-24 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-md transition-shadow" data-category="beauty">
                    <svg class="w-8 h-8 text-pink-700 mb-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V7.5C15 8.3 14.3 9 13.5 9S12 8.3 12 7.5V6.5L6 7V9L12 8.5V9.5C12 10.3 12.7 11 13.5 11S15 10.3 15 9.5V8.5L21 9ZM12 12C13.1 12 14 12.9 14 14C14 15.1 13.1 16 12 16C10.9 16 10 15.1 10 14C10 12.9 10.9 12 12 12ZM21 19V17L15 16.5V17.5C15 18.3 14.3 19 13.5 19S12 18.3 12 17.5V16.5L6 17V19L12 18.5V19.5C12 20.3 12.7 21 13.5 21S15 20.3 15 19.5V18.5L21 19Z"/>
                    </svg>
                    <span class="font-semibold text-pink-800 text-shadow text-sm">Красота</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div id="advertisement-section" class="px-4 py-2">
            <div class="w-full bg-slate-800 rounded-xl h-28 flex items-center justify-center p-4">
              <p class="text-white text-center text-lg font-medium">Место для вашей рекламы</p>
            </div>
          </div>
          
          <div id="filters-section" class="flex gap-3 px-4 py-3">
            <button class="flex-1 h-12 shrink-0 rounded-lg bg-primary/10 px-4 flex items-center justify-center gap-2">
              <p class="text-primary text-sm font-semibold">Большая скидка</p>
            </button>
            <button class="flex-1 h-12 shrink-0 rounded-lg bg-primary/10 px-4 flex items-center justify-center gap-2">
              <p class="text-primary text-sm font-semibold">Высокий доход</p>
            </button>
            <button class="flex-1 h-12 shrink-0 rounded-lg bg-primary/10 px-4 flex items-center justify-center gap-2">
              <p class="text-primary text-sm font-semibold">На карте</p>
            </button>
          </div>
          
          <div id="offers-section" class="px-4 pt-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="4">
                <div class="w-full aspect-square bg-slate-200 rounded-lg"></div>
                <div class="flex justify-between items-start">
                  <h3 class="text-slate-900 text-sm font-semibold leading-tight">Продажа в Магазине Одежды</h3>
                  <span class="text-primary text-sm font-bold">20%</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded">Популярно</span>
                  <span class="bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded">Новое</span>
                </div>
              </div>
              <div class="space-y-2 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="5">
                <div class="w-full aspect-square bg-slate-200 rounded-lg"></div>
                <div class="flex justify-between items-start">
                  <h3 class="text-slate-900 text-sm font-semibold leading-tight">Продажа в Магазине Обуви</h3>
                  <span class="text-primary text-sm font-bold">15%</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded">Популярно</span>
                </div>
              </div>
            </div>
            <button class="w-full h-12 bg-primary text-white rounded-lg font-semibold" data-action="all-offers">Все предложения</button>
          </div>
        </main>
      </div>
    </div>
  `;

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

  // Обработчик для кнопки "Все предложения"
  const allOffersBtn = page.querySelector('[data-action="all-offers"]');
  allOffersBtn?.addEventListener('click', () => {
    window.location.hash = '#/offers';
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
