// Страница избранного

import type { FavoriteOfferSummary } from '../types/index.js';
import { apiService } from '../services/api.js';

export async function createFavoritesPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'favorites-page';
  
  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <h1 class="text-2xl font-bold">Избранное</h1>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div id="loading-state" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span class="ml-2 text-slate-600">Загрузка избранного...</span>
            </div>
            
            <div id="error-state" class="hidden text-center py-8">
              <div class="text-red-500 mb-2">⚠️</div>
              <p class="text-slate-600 mb-4">Не удалось загрузить избранное</p>
              <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Попробовать снова
              </button>
            </div>
            
            <div id="empty-state" class="hidden text-center py-8">
              <div class="text-slate-400 mb-2">📭</div>
              <p class="text-slate-600 mb-4">У вас нет избранных предложений</p>
              <button id="explore-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Найти предложения
              </button>
            </div>
            
            <div id="favorites-container" class="grid grid-cols-1 gap-4">
              <!-- Избранные предложения будут загружены динамически -->
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Загружаем избранные предложения
  await loadFavorites(page);

  // Настраиваем обработчики событий
  setupEventHandlers(page);

  return page;
}

// Функция загрузки избранных предложений
async function loadFavorites(page: HTMLElement) {
  const loadingState = page.querySelector('#loading-state') as HTMLElement;
  const errorState = page.querySelector('#error-state') as HTMLElement;
  const emptyState = page.querySelector('#empty-state') as HTMLElement;
  const favoritesContainer = page.querySelector('#favorites-container') as HTMLElement;

  try {
    // Показываем состояние загрузки
    showState(loadingState, [errorState, emptyState, favoritesContainer]);

    // Загружаем избранные предложения из API
    const favorites = await apiService.getFavorites();

    // Скрываем состояние загрузки
    hideState(loadingState);

    if (favorites.length === 0) {
      // Показываем состояние пустого списка
      showState(emptyState, [errorState, favoritesContainer]);
    } else {
      // Отображаем избранные предложения
      renderFavorites(favoritesContainer, favorites);
      showState(favoritesContainer, [errorState, emptyState]);
    }

  } catch (error) {
    console.error('Ошибка загрузки избранного:', error);
    
    // Скрываем состояние загрузки
    hideState(loadingState);
    
    // Показываем состояние ошибки
    showState(errorState, [emptyState, favoritesContainer]);
  }
}

// Функция отображения избранных предложений
function renderFavorites(container: HTMLElement, favorites: FavoriteOfferSummary[]) {
  container.innerHTML = favorites.map(favorite => `
    <div class="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="${favorite.id}">
      <div class="w-full h-48 bg-slate-200 rounded-lg mb-3"></div>
      <h3 class="font-semibold mb-2">${favorite.title}</h3>
      <p class="text-slate-600 text-sm mb-2">${favorite.description}</p>
      <div class="flex justify-between items-center">
        <span class="text-primary font-bold">${parseFloat(favorite.price).toLocaleString()} ₽</span>
        <button class="text-red-500 hover:text-red-700 p-1" data-remove-favorite="${favorite.id}" title="Удалить из избранного">
          <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Функции управления состояниями
function showState(element: HTMLElement, hideElements: HTMLElement[]) {
  element.classList.remove('hidden');
  hideElements.forEach(el => el.classList.add('hidden'));
}

function hideState(element: HTMLElement) {
  element.classList.add('hidden');
}

function setupEventHandlers(page: HTMLElement) {
  // Обработчик кнопки повтора
  const retryBtn = page.querySelector('#retry-btn');
  retryBtn?.addEventListener('click', async () => {
    await loadFavorites(page);
  });

  // Обработчик кнопки "Найти предложения"
  const exploreBtn = page.querySelector('#explore-btn');
  exploreBtn?.addEventListener('click', () => {
    window.location.hash = '#/offers';
  });

  // Обработчики для карточек предложений и кнопок удаления
  page.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    
    // Проверяем, кликнули ли на кнопку удаления
    const removeBtn = target.closest('[data-remove-favorite]') as HTMLElement;
    if (removeBtn) {
      e.stopPropagation(); // Предотвращаем переход к детальной странице
      const offerId = removeBtn.dataset.removeFavorite;
      if (offerId) {
        await removeFromFavorites(page, offerId);
      }
      return;
    }

    // Проверяем, кликнули ли на карточку предложения
    const offerCard = target.closest('[data-offer-id]') as HTMLElement;
    if (offerCard) {
      const offerId = offerCard.dataset.offerId;
      if (offerId) {
        window.location.hash = `#/offers/${offerId}`;
      }
    }
  });
}

// Функция удаления из избранного
async function removeFromFavorites(page: HTMLElement, offerId: string) {
  try {
    await apiService.removeFromFavorites(offerId);
    
    // Перезагружаем список избранного
    await loadFavorites(page);
    
    // Показываем уведомление об успехе (опционально)
    console.log('Предложение удалено из избранного');
    
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error);
    // Можно показать уведомление об ошибке
  }
}

