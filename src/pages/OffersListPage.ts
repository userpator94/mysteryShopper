// Страница списка предложений с фильтрами и сортировкой

import { Offer, FilterOptions, SortOptions } from '../types/index.js';

export async function createOffersListPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offers-list-page';
  
  // Получаем параметры из URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search') || '';
  const categoryFilter = urlParams.get('category') || '';
  const quickFilter = urlParams.get('filter') || '';

  // Моковые данные
  const offers: Offer[] = [
    {
      id: '1',
      title: 'Дегустация вин в ресторане "Сомелье"',
      description: 'Уникальная возможность попробовать лучшие вина мира с профессиональным сомелье',
      price: 2500,
      currency: 'RUB',
      images: ['/images/wine-tasting.jpg'],
      location: { address: 'ул. Арбат, 15', city: 'Москва', coordinates: { lat: 55.7558, lng: 37.6176 } },
      category: 'Рестораны',
      rating: 4.8,
      reviewsCount: 127,
      isFavorite: false,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      conditions: ['Возраст 18+', 'Предварительная запись'],
      tags: ['вино', 'дегустация', 'ресторан']
    },
    {
      id: '2',
      title: 'Мастер-класс по приготовлению суши',
      description: 'Научитесь готовить традиционные японские суши под руководством опытного шеф-повара',
      price: 1800,
      currency: 'RUB',
      images: ['/images/sushi-class.jpg'],
      location: { address: 'пр. Мира, 45', city: 'Москва', coordinates: { lat: 55.7558, lng: 37.6176 } },
      category: 'Рестораны',
      rating: 4.6,
      reviewsCount: 89,
      isFavorite: true,
      createdAt: '2024-01-14',
      updatedAt: '2024-01-14',
      conditions: ['Предварительная запись', 'Все ингредиенты включены'],
      tags: ['суши', 'мастер-класс', 'японская кухня']
    }
  ];

  page.innerHTML = `
    <div class="offers-list-page__header">
      <div class="page-header">
        <button class="back-btn" id="back-btn">
          <span class="icon">←</span>
          Назад
        </button>
        <h1 class="page-title">Предложения</h1>
        <div class="view-toggle">
          <button class="view-btn view-btn--active" data-view="list" id="list-view">
            <span class="icon">☰</span>
          </button>
          <button class="view-btn" data-view="map" id="map-view">
            <span class="icon">🗺️</span>
          </button>
        </div>
      </div>
    </div>

    <div class="offers-list-page__filters">
      <div class="filters-bar">
        <div class="search-filter">
          <input type="text" class="filter-input" placeholder="Поиск предложений..." value="${searchQuery}" id="search-filter">
        </div>
        
        <div class="filter-controls">
          <button class="filter-btn" id="category-filter">
            <span class="icon">📂</span>
            Категория
          </button>
          <button class="filter-btn" id="price-filter">
            <span class="icon">💰</span>
            Цена
          </button>
          <button class="filter-btn" id="rating-filter">
            <span class="icon">⭐</span>
            Рейтинг
          </button>
          <button class="filter-btn" id="location-filter">
            <span class="icon">📍</span>
            Местоположение
          </button>
        </div>

        <div class="sort-controls">
          <select class="sort-select" id="sort-select">
            <option value="createdAt-desc">По дате (новые)</option>
            <option value="price-asc">По цене (дешевые)</option>
            <option value="price-desc">По цене (дорогие)</option>
            <option value="rating-desc">По рейтингу</option>
            <option value="title-asc">По названию</option>
          </select>
        </div>
      </div>
    </div>

    <div class="offers-list-page__content">
      <div class="results-info">
        <span class="results-count">Найдено: ${offers.length} предложений</span>
        <div class="active-filters" id="active-filters">
          ${searchQuery ? `<span class="filter-tag">Поиск: "${searchQuery}"</span>` : ''}
          ${categoryFilter ? `<span class="filter-tag">Категория: ${categoryFilter}</span>` : ''}
          ${quickFilter ? `<span class="filter-tag">Фильтр: ${quickFilter}</span>` : ''}
        </div>
      </div>

      <div class="offers-container" id="offers-container">
        <div class="offers-grid">
          ${offers.map(offer => `
            <div class="offer-card" data-offer="${offer.id}">
              <div class="offer-image">
                <img src="${offer.images[0]}" alt="${offer.title}" onerror="this.src='/placeholder-image.jpg'">
                <button class="favorite-btn ${offer.isFavorite ? 'favorite-btn--active' : ''}" data-offer="${offer.id}">
                  ❤️
                </button>
              </div>
              <div class="offer-content">
                <h3 class="offer-title">${offer.title}</h3>
                <p class="offer-description">${offer.description}</p>
                <div class="offer-meta">
                  <span class="offer-price">${offer.price} ${offer.currency}</span>
                  <div class="offer-rating">
                    <span class="rating-stars">⭐ ${offer.rating}</span>
                    <span class="rating-count">(${offer.reviewsCount})</span>
                  </div>
                </div>
                <div class="offer-location">📍 ${offer.location.address}</div>
                <div class="offer-tags">
                  ${offer.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pagination">
        <button class="pagination-btn" disabled>←</button>
        <span class="pagination-info">Страница 1 из 1</span>
        <button class="pagination-btn" disabled>→</button>
      </div>
    </div>

    <!-- Модальные окна для фильтров -->
    <div class="modal" id="category-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Выберите категорию</h3>
          <button class="modal-close" id="category-modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="category-list">
            <label class="category-option">
              <input type="radio" name="category" value="" ${!categoryFilter ? 'checked' : ''}>
              <span>Все категории</span>
            </label>
            <label class="category-option">
              <input type="radio" name="category" value="restaurants" ${categoryFilter === 'restaurants' ? 'checked' : ''}>
              <span>🍽️ Рестораны</span>
            </label>
            <label class="category-option">
              <input type="radio" name="category" value="shops" ${categoryFilter === 'shops' ? 'checked' : ''}>
              <span>🛍️ Магазины</span>
            </label>
            <label class="category-option">
              <input type="radio" name="category" value="entertainment" ${categoryFilter === 'entertainment' ? 'checked' : ''}>
              <span>🎭 Развлечения</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" id="category-cancel">Отмена</button>
          <button class="btn btn--primary" id="category-apply">Применить</button>
        </div>
      </div>
    </div>
  `;

  setupEventHandlers(page);
  return page;
}

function setupEventHandlers(page: HTMLElement) {
  // Кнопка "Назад"
  const backBtn = page.querySelector('#back-btn');
  backBtn?.addEventListener('click', () => {
    window.history.back();
  });

  // Переключение вида
  const viewBtns = page.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('view-btn--active'));
      btn.classList.add('view-btn--active');
      
      const view = (btn as HTMLElement).dataset.view;
      if (view === 'map') {
        // Переключение на карту
        console.log('Switch to map view');
      }
    });
  });

  // Фильтры
  const filterBtns = page.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterType = (btn as HTMLElement).id.replace('-filter', '');
      openFilterModal(filterType);
    });
  });

  // Сортировка
  const sortSelect = page.querySelector('#sort-select') as HTMLSelectElement;
  sortSelect?.addEventListener('change', () => {
    const [field, direction] = sortSelect.value.split('-');
    applySorting(field, direction);
  });

  // Избранное
  const favoriteBtns = page.querySelectorAll('.favorite-btn');
  favoriteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const offerId = (btn as HTMLElement).dataset.offer;
      toggleFavorite(offerId!);
    });
  });

  // Карточки предложений
  const offerCards = page.querySelectorAll('.offer-card');
  offerCards.forEach(card => {
    card.addEventListener('click', () => {
      const offerId = (card as HTMLElement).dataset.offer;
      window.location.hash = `#/offers/${offerId}`;
    });
  });

  // Модальные окна
  setupModalHandlers(page);
}

function openFilterModal(filterType: string) {
  const modal = document.getElementById(`${filterType}-modal`);
  if (modal) {
    modal.style.display = 'block';
  }
}

function applySorting(field: string, direction: string) {
  console.log('Apply sorting:', field, direction);
  // Здесь будет логика сортировки
}

function toggleFavorite(offerId: string) {
  console.log('Toggle favorite:', offerId);
  // Здесь будет логика добавления/удаления из избранного
}

function setupModalHandlers(page: HTMLElement) {
  // Закрытие модальных окон
  const modalCloses = page.querySelectorAll('.modal-close');
  modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      const modal = closeBtn.closest('.modal') as HTMLElement;
      modal.style.display = 'none';
    });
  });

  // Применение фильтра категории
  const categoryApply = page.querySelector('#category-apply');
  categoryApply?.addEventListener('click', () => {
    const selectedCategory = page.querySelector('input[name="category"]:checked') as HTMLInputElement;
    if (selectedCategory) {
      const url = new URL(window.location.href);
      if (selectedCategory.value) {
        url.searchParams.set('category', selectedCategory.value);
      } else {
        url.searchParams.delete('category');
      }
      window.location.href = url.toString();
    }
  });

  // Отмена фильтра категории
  const categoryCancel = page.querySelector('#category-cancel');
  categoryCancel?.addEventListener('click', () => {
    const modal = page.querySelector('#category-modal') as HTMLElement;
    modal.style.display = 'none';
  });
}
