// Страница списка предложений с фильтрами и сортировкой

// import type { Offer } from '../types/index.js';
import { router } from '../router/index.js';

export async function createOffersListPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offers-list-page';
  
  // Получаем параметры запроса
  const queryParams = router.getQueryParams();
  const category = queryParams.get('category');
  
  // Определяем заголовок страницы в зависимости от категории
  const categoryNames: Record<string, string> = {
    'clothing': 'Одежда',
    'shoes': 'Обувь',
    'electronics': 'Электроника',
    'food': 'Продукты',
    'sports': 'Спорт',
    'beauty': 'Красота'
  };
  
  const pageTitle = category && categoryNames[category] 
    ? `${categoryNames[category]} - Предложения`
    : 'Предложения';
  
  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <h1 class="text-2xl font-bold mb-4">${pageTitle}</h1>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="text-slate-500" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input class="w-full h-12 pl-10 pr-12 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="Поиск предложений..." type="text"/>
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
          <div class="px-4 py-4">
            <div class="grid grid-cols-1 gap-4">
              <div class="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="1">
                <div class="w-full h-48 bg-slate-200 rounded-lg mb-3"></div>
                <h3 class="font-semibold mb-2">Дегустация вин в ресторане "Сомелье"</h3>
                <p class="text-slate-600 text-sm mb-2">Уникальная возможность попробовать лучшие вина мира</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">2,500 ₽</span>
                  <span class="text-sm text-slate-500">⭐ 4.8 (127)</span>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="2">
                <div class="w-full h-48 bg-slate-200 rounded-lg mb-3"></div>
                <h3 class="font-semibold mb-2">Мастер-класс по приготовлению суши</h3>
                <p class="text-slate-600 text-sm mb-2">Научитесь готовить традиционные японские суши</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">1,800 ₽</span>
                  <span class="text-sm text-slate-500">⭐ 4.6 (89)</span>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="3">
                <div class="w-full h-48 bg-slate-200 rounded-lg mb-3"></div>
                <h3 class="font-semibold mb-2">Экскурсия по историческому центру</h3>
                <p class="text-slate-600 text-sm mb-2">Познакомьтесь с историей города</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">1,200 ₽</span>
                  <span class="text-sm text-slate-500">⭐ 4.7 (56)</span>
                </div>
              </div>
            </div>
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
  // Обработчики для карточек предложений
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
}

// function setupEventHandlers(page: HTMLElement) {
//   // Кнопка "Назад"
//   const backBtn = page.querySelector('#back-btn');
//   backBtn?.addEventListener('click', () => {
//     window.history.back();
//   });

//   // Переключение вида
//   const viewBtns = page.querySelectorAll('.view-btn');
//   viewBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//       viewBtns.forEach(b => b.classList.remove('view-btn--active'));
//       btn.classList.add('view-btn--active');
      
//       const view = (btn as HTMLElement).dataset.view;
//       if (view === 'map') {
//         // Переключение на карту
//         console.log('Switch to map view');
//       }
//     });
//   });

//   // Фильтры
//   const filterBtns = page.querySelectorAll('.filter-btn');
//   filterBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//       const filterType = (btn as HTMLElement).id.replace('-filter', '');
//       openFilterModal(filterType);
//     });
//   });

//   // Сортировка
//   const sortSelect = page.querySelector('#sort-select') as HTMLSelectElement;
//   sortSelect?.addEventListener('change', () => {
//     const [field, direction] = sortSelect.value.split('-');
//     applySorting(field, direction);
//   });

//   // Избранное
//   const favoriteBtns = page.querySelectorAll('.favorite-btn');
//   favoriteBtns.forEach(btn => {
//     btn.addEventListener('click', (e) => {
//       e.stopPropagation();
//       const offerId = (btn as HTMLElement).dataset.offer;
//       toggleFavorite(offerId!);
//     });
//   });

//   // Карточки предложений
//   const offerCards = page.querySelectorAll('.offer-card');
//   offerCards.forEach(card => {
//     card.addEventListener('click', () => {
//       const offerId = (card as HTMLElement).dataset.offer;
//       window.location.hash = `#/offers/${offerId}`;
//     });
//   });

//   // Модальные окна
//   setupModalHandlers(page);
// }

// function openFilterModal(filterType: string) {
//   const modal = document.getElementById(`${filterType}-modal`);
//   if (modal) {
//     modal.style.display = 'block';
//   }
// }

// function applySorting(field: string, direction: string) {
//   console.log('Apply sorting:', field, direction);
//   // Здесь будет логика сортировки
// }

// function toggleFavorite(offerId: string) {
//   console.log('Toggle favorite:', offerId);
//   // Здесь будет логика добавления/удаления из избранного
// }

// function setupModalHandlers(page: HTMLElement) {
//   // Закрытие модальных окон
//   const modalCloses = page.querySelectorAll('.modal-close');
//   modalCloses.forEach(closeBtn => {
//     closeBtn.addEventListener('click', () => {
//       const modal = closeBtn.closest('.modal') as HTMLElement;
//       modal.style.display = 'none';
//     });
//   });

//   // Применение фильтра категории
//   const categoryApply = page.querySelector('#category-apply');
//   categoryApply?.addEventListener('click', () => {
//     const selectedCategory = page.querySelector('input[name="category"]:checked') as HTMLInputElement;
//     if (selectedCategory) {
//       const url = new URL(window.location.href);
//       if (selectedCategory.value) {
//         url.searchParams.set('category', selectedCategory.value);
//       } else {
//         url.searchParams.delete('category');
//       }
//       window.location.href = url.toString();
//     }
//   });

//   // Отмена фильтра категории
//   const categoryCancel = page.querySelector('#category-cancel');
//   categoryCancel?.addEventListener('click', () => {
//     const modal = page.querySelector('#category-modal') as HTMLElement;
//     modal.style.display = 'none';
//   });
// }
