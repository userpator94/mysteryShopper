// Страница избранного

import { Offer } from '../types/index.js';

export async function createFavoritesPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'favorites-page';
  
  // Моковые данные избранных предложений
  const favoriteOffers: Offer[] = [
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
      isFavorite: true,
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
    },
    {
      id: '3',
      title: 'Экскурсия по историческому центру',
      description: 'Пешеходная экскурсия по самым интересным местам исторического центра города',
      price: 1200,
      currency: 'RUB',
      images: ['/images/city-tour.jpg'],
      location: { address: 'Красная площадь, 1', city: 'Москва', coordinates: { lat: 55.7539, lng: 37.6208 } },
      category: 'Развлечения',
      rating: 4.7,
      reviewsCount: 156,
      isFavorite: true,
      createdAt: '2024-01-13',
      updatedAt: '2024-01-13',
      conditions: ['Продолжительность 2 часа', 'Группа до 15 человек'],
      tags: ['экскурсия', 'история', 'пешеходная']
    }
  ];

  page.innerHTML = `
    <div class="favorites-page__header">
      <h1 class="page-title">Избранное</h1>
      <div class="header-actions">
        <button class="btn btn--secondary" id="clear-all-btn">
          Очистить все
        </button>
        <div class="sort-controls">
          <select class="sort-select" id="sort-select">
            <option value="added-desc">По дате добавления (новые)</option>
            <option value="added-asc">По дате добавления (старые)</option>
            <option value="price-asc">По цене (дешевые)</option>
            <option value="price-desc">По цене (дорогие)</option>
            <option value="rating-desc">По рейтингу</option>
            <option value="title-asc">По названию</option>
          </select>
        </div>
      </div>
    </div>

    <div class="favorites-page__content">
      ${favoriteOffers.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__icon">💔</div>
          <h2 class="empty-state__title">Нет избранных предложений</h2>
          <p class="empty-state__description">
            Добавьте предложения в избранное, чтобы они отображались здесь
          </p>
          <button class="btn btn--primary" id="explore-btn">
            Найти предложения
          </button>
        </div>
      ` : `
        <div class="favorites-stats">
          <div class="stat-item">
            <span class="stat-value">${favoriteOffers.length}</span>
            <span class="stat-label">предложений</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${Math.round(favoriteOffers.reduce((sum, offer) => sum + offer.price, 0) / favoriteOffers.length)}</span>
            <span class="stat-label">средняя цена</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${Math.round(favoriteOffers.reduce((sum, offer) => sum + offer.rating, 0) / favoriteOffers.length * 10) / 10}</span>
            <span class="stat-label">средний рейтинг</span>
          </div>
        </div>

        <div class="favorites-grid">
          ${favoriteOffers.map(offer => `
            <div class="favorite-card" data-offer="${offer.id}">
              <div class="favorite-card__image">
                <img src="${offer.images[0]}" alt="${offer.title}" onerror="this.src='/placeholder-image.jpg'">
                <button class="remove-favorite-btn" data-offer="${offer.id}" title="Удалить из избранного">
                  ❌
                </button>
              </div>
              <div class="favorite-card__content">
                <h3 class="favorite-card__title">${offer.title}</h3>
                <p class="favorite-card__description">${offer.description}</p>
                <div class="favorite-card__meta">
                  <span class="favorite-card__price">${offer.price} ${offer.currency}</span>
                  <div class="favorite-card__rating">
                    <span class="rating-stars">⭐ ${offer.rating}</span>
                    <span class="rating-count">(${offer.reviewsCount})</span>
                  </div>
                </div>
                <div class="favorite-card__location">📍 ${offer.location.address}</div>
                <div class="favorite-card__category">${offer.category}</div>
                <div class="favorite-card__actions">
                  <button class="btn btn--primary btn--small" data-offer="${offer.id}">
                    Подробнее
                  </button>
                  <button class="btn btn--secondary btn--small" data-offer="${offer.id}">
                    Забронировать
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div class="modal" id="confirm-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Удалить из избранного?</h3>
        </div>
        <div class="modal-body">
          <p>Вы уверены, что хотите удалить это предложение из избранного?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" id="confirm-cancel">Отмена</button>
          <button class="btn btn--danger" id="confirm-delete">Удалить</button>
        </div>
      </div>
    </div>
  `;

  setupEventHandlers(page, favoriteOffers);
  return page;
}

function setupEventHandlers(page: HTMLElement, offers: Offer[]) {
  // Сортировка
  const sortSelect = page.querySelector('#sort-select') as HTMLSelectElement;
  sortSelect?.addEventListener('change', () => {
    const [field, direction] = sortSelect.value.split('-');
    applySorting(field, direction, offers);
  });

  // Очистить все
  const clearAllBtn = page.querySelector('#clear-all-btn');
  clearAllBtn?.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите удалить все предложения из избранного?')) {
      clearAllFavorites();
    }
  });

  // Удаление из избранного
  const removeBtns = page.querySelectorAll('.remove-favorite-btn');
  removeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const offerId = (btn as HTMLElement).dataset.offer;
      showConfirmModal(offerId!);
    });
  });

  // Кнопки действий на карточках
  const actionBtns = page.querySelectorAll('.favorite-card__actions .btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const offerId = (btn as HTMLElement).dataset.offer;
      const action = btn.textContent?.trim();
      
      if (action === 'Подробнее') {
        window.location.hash = `#/offers/${offerId}`;
      } else if (action === 'Забронировать') {
        // Здесь будет логика бронирования
        console.log('Book offer:', offerId);
      }
    });
  });

  // Клик по карточке
  const favoriteCards = page.querySelectorAll('.favorite-card');
  favoriteCards.forEach(card => {
    card.addEventListener('click', () => {
      const offerId = (card as HTMLElement).dataset.offer;
      window.location.hash = `#/offers/${offerId}`;
    });
  });

  // Кнопка "Найти предложения"
  const exploreBtn = page.querySelector('#explore-btn');
  exploreBtn?.addEventListener('click', () => {
    window.location.hash = '#/offers';
  });

  // Модальное окно подтверждения
  setupConfirmModal(page);
}

function applySorting(field: string, direction: string, offers: Offer[]) {
  console.log('Apply sorting:', field, direction);
  // Здесь будет логика сортировки и перерисовки карточек
}

function clearAllFavorites() {
  console.log('Clear all favorites');
  // Здесь будет логика очистки всех избранных предложений
}

function showConfirmModal(offerId: string) {
  const modal = document.getElementById('confirm-modal') as HTMLElement;
  modal.style.display = 'block';
  
  // Сохраняем ID предложения для удаления
  modal.dataset.offerId = offerId;
}

function setupConfirmModal(page: HTMLElement) {
  const modal = page.querySelector('#confirm-modal') as HTMLElement;
  const cancelBtn = page.querySelector('#confirm-cancel');
  const deleteBtn = page.querySelector('#confirm-delete');

  cancelBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  deleteBtn?.addEventListener('click', () => {
    const offerId = modal.dataset.offerId;
    if (offerId) {
      removeFromFavorites(offerId);
      modal.style.display = 'none';
    }
  });

  // Закрытие по клику вне модального окна
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function removeFromFavorites(offerId: string) {
  console.log('Remove from favorites:', offerId);
  // Здесь будет логика удаления из избранного
}
