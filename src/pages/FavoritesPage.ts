// Страница избранного

import type { FavoriteOfferSummary } from '../types/index.js';
import { escapeHtml, formatExecutorRewardShort } from '../utils/offerDisplay.js';
import { listRowCardClasses, bindListRowCardHover } from '../utils/listRowUi.js';
import { apiService } from '../services/api.js';
import { devLog } from '../utils/logger.js';

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
            
            <div id="empty-favorites-state" class="hidden text-center py-8">
              <div id="cat-shrug-visualization" class="mb-4 flex justify-center items-center" style="height: 200px;">
                <img
                  src="/cat-shrug.png"
                  alt="Милый котик пожимает плечами"
                  class="max-h-full max-w-full object-contain"
                  width="200"
                  height="200"
                />
              </div>
              <p class="text-slate-600 mb-4">У вас пока нет избранных</p>
              <button id="explore-empty-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Найти задания
              </button>
            </div>
            
            <div id="empty-state" class="hidden text-center py-8">
              <div class="text-slate-400 mb-2">📭</div>
              <p class="text-slate-600 mb-4">У вас нет избранных заданий</p>
              <button id="explore-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Найти задания
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
  const emptyFavoritesState = page.querySelector('#empty-favorites-state') as HTMLElement;
  const favoritesContainer = page.querySelector('#favorites-container') as HTMLElement;

  try {
    // Показываем состояние загрузки
    showState(loadingState, [errorState, emptyState, emptyFavoritesState, favoritesContainer]);

    // Загружаем избранные предложения из API
    const favorites = await apiService.getFavorites();
    devLog.log('Загружено избранных:', favorites.length);

    // Скрываем состояние загрузки
    hideState(loadingState);

    if (favorites.length === 0) {
      // Показываем состояние пустого списка (404 или действительно пусто)
      devLog.log('Показываем состояние "нет избранных"');
      showState(emptyFavoritesState, [errorState, emptyState, favoritesContainer]);
    } else {
      // Отображаем избранные предложения
      renderFavorites(favoritesContainer, favorites);
      showState(favoritesContainer, [errorState, emptyState, emptyFavoritesState]);
    }

  } catch (error: any) {
    console.error('Ошибка загрузки избранного:', error);
    
    // Скрываем состояние загрузки
    hideState(loadingState);
    
    // Проверяем, является ли ошибка 404 (нет избранных)
    const is404 = error?.message?.includes('404') || error?.status === 404;
    
    if (is404) {
      // Для 404 показываем состояние "нет избранных"
      showState(emptyFavoritesState, [errorState, emptyState, favoritesContainer]);
    } else {
      // Для других ошибок показываем состояние ошибки
      showState(errorState, [emptyState, emptyFavoritesState, favoritesContainer]);
    }
  }
}

// Функция отображения избранных предложений
function renderFavorites(container: HTMLElement, favorites: FavoriteOfferSummary[]) {
  container.innerHTML = favorites.map(favorite => `
    <div class="${listRowCardClasses('p-4')}" data-offer-id="${escapeHtml(String(favorite.id))}">
      <h3 class="font-semibold mb-2">${escapeHtml(favorite.title || '')}</h3>
      <p class="text-slate-600 text-sm mb-2">${escapeHtml(favorite.description || '')}</p>
      <div class="flex justify-between items-center">
        <span class="text-primary font-bold">${formatExecutorRewardShort({ price: favorite.price })}</span>
        <button class="text-red-500 hover:text-red-700 p-1" data-remove-favorite="${escapeHtml(String(favorite.id))}" title="Удалить из избранного">
          <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  bindListRowCardHover(container);
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

  // Обработчик кнопки "Найти предложения" в пустом состоянии
  const exploreBtn = page.querySelector('#explore-btn');
  exploreBtn?.addEventListener('click', () => {
    window.location.hash = '#/offers';
  });

  // Обработчик кнопки "Найти предложения" для пустого избранного
  const exploreEmptyBtn = page.querySelector('#explore-empty-btn');
  exploreEmptyBtn?.addEventListener('click', () => {
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
  const removeBtn = page.querySelector(`[data-remove-favorite="${offerId}"]`) as HTMLElement;
  
  // Блокируем кнопку на время выполнения запроса
  if (removeBtn) {
    removeBtn.style.opacity = '0.5';
    removeBtn.style.pointerEvents = 'none';
  }
  
  try {
    const result = await apiService.removeFromFavorites(offerId);
    
    // Проверяем успешность удаления
    if (result.statusCode === 200 || result.statusCode === 204) {
      // Очищаем кэш для списка избранного, чтобы получить актуальные данные
      apiService.clearCache('/favorites');
      
      // Сразу удаляем элемент из DOM для лучшего UX
      const offerCard = page.querySelector(`[data-offer-id="${offerId}"]`) as HTMLElement;
      if (offerCard) {
        offerCard.style.transition = 'opacity 0.3s';
        offerCard.style.opacity = '0';
        setTimeout(() => {
          // Перезагружаем список избранного после визуального удаления
          loadFavorites(page);
        }, 300);
      } else {
        // Если элемент не найден, просто перезагружаем список
        await loadFavorites(page);
      }
      
      devLog.log('Предложение удалено из избранного');
    }
    
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error);
    
    // Восстанавливаем кнопку при ошибке
    if (removeBtn) {
      removeBtn.style.opacity = '1';
      removeBtn.style.pointerEvents = 'auto';
    }
    
    // Показываем состояние ошибки пользователю (можно добавить toast-уведомление)
    alert('Не удалось удалить задание из избранного. Попробуйте еще раз.');
  }
}

