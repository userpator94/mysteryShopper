// Главный экран с поиском и фильтрами

// import { Offer, Category } from '../types/index.js';

export async function createHomePage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'home-page';
  
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
            <input class="w-full h-12 pl-10 pr-12 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="Поиск в Москве" type="text"/>
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
          <div class="p-4">
            <div class="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
              <div class="flex flex-col gap-3 w-[85vw] shrink-0">
                <div class="flex gap-3">
                  <div class="flex-1 rounded-lg bg-slate-200 h-24 flex items-end p-3 bg-cover bg-center">
                    <span class="font-semibold text-white text-shadow">Одежда</span>
                  </div>
                  <div class="flex-1 rounded-lg bg-slate-200 h-24 flex items-end p-3 bg-cover bg-center">
                    <span class="font-semibold text-white text-shadow">Обувь</span>
                  </div>
                </div>
                <div class="rounded-lg bg-slate-200 h-24 flex items-end p-3 bg-cover bg-center">
                  <span class="font-semibold text-white text-shadow">Электроника</span>
                </div>
              </div>
              <div class="flex flex-col gap-3 w-[85vw] shrink-0">
                <div class="rounded-lg bg-slate-200 h-24 flex items-end p-3 bg-cover bg-center">
                  <span class="font-semibold text-white text-shadow">Продукты</span>
                </div>
                <div class="flex gap-3">
                  <div class="flex-1 rounded-lg bg-slate-200 h-24 flex items-end p-3 bg-cover bg-center">
                    <span class="font-semibold text-white text-shadow">Спорт</span>
                  </div>
                  <div class="flex-1 rounded-lg bg-slate-200 h-24 flex items-end p-3 bg-cover bg-center">
                    <span class="font-semibold text-white text-shadow">Красота</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="px-4 py-2">
            <div class="w-full bg-slate-800 rounded-xl h-28 flex items-center justify-center p-4">
              <p class="text-white text-center text-lg font-medium">Место для вашей рекламы</p>
            </div>
          </div>
          
          <div class="flex gap-3 px-4 py-3">
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
          
          <div class="px-4 pt-4 space-y-4">
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
