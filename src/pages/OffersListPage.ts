// Страница списка предложений с фильтрами и сортировкой

import type { Offer, SearchParams, Application } from '../types/index.js';
import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

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
  
  // Создаем базовую структуру страницы
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
            <input id="search-input" class="w-full h-12 pl-10 pr-12 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="Поиск предложений..." type="text"/>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <button id="filter-btn" class="text-slate-500">
                <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div id="loading-state" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span class="ml-2 text-slate-600">Загрузка предложений...</span>
            </div>
            
            <div id="error-state" class="hidden text-center py-8">
              <div class="text-red-500 mb-2">⚠️</div>
              <p class="text-slate-600 mb-4">Не удалось загрузить предложения</p>
              <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Попробовать снова
              </button>
            </div>
            
            <div id="empty-state" class="hidden text-center py-8">
              <div class="text-slate-400 mb-2">📭</div>
              <p class="text-slate-600">Предложения не найдены</p>
            </div>
            
            <div id="offers-container" class="space-y-4">
              <!-- Секция "Принятые" -->
              <div id="accepted-section" class="bg-white rounded-lg border border-slate-200 overflow-hidden transition-colors">
                <button id="accepted-section-header" class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <span class="font-semibold text-lg">Принятые</span>
                  <svg id="accepted-section-icon" class="w-5 h-5 text-slate-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div id="accepted-section-content" class="hidden px-4 pb-4">
                  <div id="accepted-offers" class="grid grid-cols-1 gap-4">
                    <!-- Принятые предложения будут загружены динамически -->
                  </div>
                </div>
              </div>
              
              <!-- Секция "Доступные" -->
              <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <button id="available-section-header" class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <span class="font-semibold text-lg">Доступные</span>
                  <svg id="available-section-icon" class="w-5 h-5 text-slate-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div id="available-section-content" class="hidden px-4 pb-4">
                  <div id="available-offers" class="grid grid-cols-1 gap-4">
                    <!-- Доступные предложения будут загружены динамически -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Загружаем предложения
  await loadOffers(page, category);

  // Настраиваем обработчики событий
  setupEventHandlers(page);

  return page;
}

// Функция загрузки предложений
async function loadOffers(page: HTMLElement, category?: string | null) {
  const loadingState = page.querySelector('#loading-state') as HTMLElement;
  const errorState = page.querySelector('#error-state') as HTMLElement;
  const emptyState = page.querySelector('#empty-state') as HTMLElement;
  const offersContainer = page.querySelector('#offers-container') as HTMLElement;

  try {
    // Сбрасываем кэш списка предложений, чтобы видеть актуальные данные
    apiService.clearCache('/offers');
    // Показываем состояние загрузки
    showState(loadingState, [errorState, emptyState, offersContainer]);

    // Получаем параметры из URL
    const queryParams = router.getQueryParams();
    const searchQuery = queryParams.get('query');

    // Подготавливаем параметры поиска
    const searchParams: SearchParams = {};
    
    if (searchQuery) {
      searchParams.query = searchQuery;
    }
    
    if (category) {
      searchParams.filters = { category };
    }

    // Обновляем поле поиска, если есть параметр в URL
    const searchInput = page.querySelector('#search-input') as HTMLInputElement;
    if (searchInput && searchQuery !== null) {
      searchInput.value = searchQuery;
    }

    // 1. Загружаем предложения из API
    const offers = await apiService.getOffers(searchParams);
    
    // 2. Загружаем заявки из API
    let applications: Application[] = [];
    try {
      const appliesResponse = await apiService.getApplies();
      applications = appliesResponse.data;
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      // Продолжаем работу даже если заявки не загрузились
    }

    // Скрываем состояние загрузки
    hideState(loadingState);

    // 3. Фильтруем предложения по алгоритму
    // Принятые: заявка на рассмотрении (pending) или уже принята (approved)
    const acceptedOfferIds = new Set(
      applications
        .filter(app => app.status === 'pending' || app.status === 'approved')
        .map(app => app.offer_id)
    );
    
    const doneOfferIds = new Set(
      applications
        .filter(app => app.status === 'done')
        .map(app => app.offer_id)
    );

    const acceptedOffers = offers.filter(offer => acceptedOfferIds.has(offer.id));
    
    // Доступные: офферы, по которым нет заявки или заявка отклонена (не pending, не approved, не done)
    const availableOffers = offers.filter(offer => 
      !acceptedOfferIds.has(offer.id) && !doneOfferIds.has(offer.id)
    );

    // Отображаем предложения
    renderOffers(page, acceptedOffers, availableOffers);
    showState(offersContainer, [errorState, emptyState]);

  } catch (error) {
    console.error('Ошибка загрузки предложений:', error);
    
    // Скрываем состояние загрузки
    hideState(loadingState);
    
    // Показываем состояние ошибки
    showState(errorState, [emptyState, offersContainer]);
  }
}

// Функция отображения предложений
function renderOffers(page: HTMLElement, acceptedOffers: Offer[], availableOffers: Offer[]) {
  const acceptedSection = page.querySelector('#accepted-section') as HTMLElement;
  const acceptedContainer = page.querySelector('#accepted-offers') as HTMLElement;
  const availableContainer = page.querySelector('#available-offers') as HTMLElement;
  const acceptedContent = page.querySelector('#accepted-section-content') as HTMLElement;
  const availableContent = page.querySelector('#available-section-content') as HTMLElement;
  const acceptedIcon = page.querySelector('#accepted-section-icon') as HTMLElement;
  const availableIcon = page.querySelector('#available-section-icon') as HTMLElement;

  // Лёгкий полутон у секции «Принятые», если в ней есть заявки
  if (acceptedSection) {
    acceptedSection.classList.toggle('bg-primary/5', acceptedOffers.length > 0);
    acceptedSection.classList.toggle('bg-white', acceptedOffers.length === 0);
  }

  // Рендерим принятые предложения
  if (acceptedOffers.length > 0) {
    acceptedContainer.innerHTML = acceptedOffers.map(offer => `
      <div class="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="${offer.id}">
        <h3 class="font-semibold mb-2">${offer.title}</h3>
        <p class="text-slate-600 text-sm mb-2">${offer.description}</p>
        <div class="flex justify-between items-center">
          <span class="text-primary font-bold">${parseFloat(offer.price).toLocaleString()} ₽</span>
        </div>
      </div>
    `).join('');
    
    // Разворачиваем секцию, если есть предложения
    acceptedContent.classList.remove('hidden');
    acceptedIcon.style.transform = 'rotate(180deg)';
  } else {
    acceptedContainer.innerHTML = '<p class="text-slate-500 text-center py-4">Нет принятых предложений</p>';
  }

  // Рендерим доступные предложения
  if (availableOffers.length > 0) {
    availableContainer.innerHTML = availableOffers.map(offer => `
      <div class="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="${offer.id}">
        <h3 class="font-semibold mb-2">${offer.title}</h3>
        <p class="text-slate-600 text-sm mb-2">${offer.description}</p>
        <div class="flex justify-between items-center">
          <span class="text-primary font-bold">${parseFloat(offer.price).toLocaleString()} ₽</span>
        </div>
      </div>
    `).join('');
    
    // Разворачиваем секцию, если есть предложения
    availableContent.classList.remove('hidden');
    availableIcon.style.transform = 'rotate(180deg)';
  } else {
    availableContainer.innerHTML = '<p class="text-slate-500 text-center py-4">Нет доступных предложений</p>';
  }
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
  // Обработчик поиска
  const searchInput = page.querySelector('#search-input') as HTMLInputElement;
  let searchTimeout: number;
  
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const query = searchInput.value.trim();
      const queryParams = router.getQueryParams();
      const category = queryParams.get('category');
      
      // Обновляем URL с параметром поиска
      const url = new URL(window.location.href);
      if (query) {
        url.searchParams.set('query', query);
      } else {
        url.searchParams.delete('query');
      }
      window.history.replaceState({}, '', url.toString());
      
      // Перезагружаем предложения
      await loadOffers(page, category);
    }, 500);
  });

  // Обработчик кнопки повтора
  const retryBtn = page.querySelector('#retry-btn');
  retryBtn?.addEventListener('click', async () => {
    const queryParams = router.getQueryParams();
    const category = queryParams.get('category');
    await loadOffers(page, category);
  });

  // Обработчики для expandable секций
  const acceptedHeader = page.querySelector('#accepted-section-header');
  const availableHeader = page.querySelector('#available-section-header');
  const acceptedContent = page.querySelector('#accepted-section-content');
  const availableContent = page.querySelector('#available-section-content');
  const acceptedIcon = page.querySelector('#accepted-section-icon') as HTMLElement;
  const availableIcon = page.querySelector('#available-section-icon') as HTMLElement;

  acceptedHeader?.addEventListener('click', () => {
    if (acceptedContent && acceptedIcon) {
      acceptedContent.classList.toggle('hidden');
      const isExpanded = !acceptedContent.classList.contains('hidden');
      acceptedIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  });

  availableHeader?.addEventListener('click', () => {
    if (availableContent && availableIcon) {
      availableContent.classList.toggle('hidden');
      const isExpanded = !availableContent.classList.contains('hidden');
      availableIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  });

  // Обработчики для карточек предложений
  page.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    
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
