// Главный экран с поиском и фильтрами

import { Offer, Category } from '../types/index.js';

export async function createHomePage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'home-page';
  
  // Моковые данные для демонстрации
  const categories: Category[] = [
    { id: '1', name: 'Рестораны', icon: '🍽️', color: '#FF6B6B' },
    { id: '2', name: 'Магазины', icon: '🛍️', color: '#4ECDC4' },
    { id: '3', name: 'Развлечения', icon: '🎭', color: '#45B7D1' },
    { id: '4', name: 'Услуги', icon: '🔧', color: '#96CEB4' },
    { id: '5', name: 'Спорт', icon: '⚽', color: '#FFEAA7' },
    { id: '6', name: 'Красота', icon: '💄', color: '#DDA0DD' }
  ];

  const featuredOffers: Offer[] = [
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
    }
  ];

  page.innerHTML = `
    <div class="home-page__hero">
      <div class="hero__content">
        <h1 class="hero__title">Найдите лучшие предложения в вашем городе</h1>
        <p class="hero__subtitle">Станьте тайным покупателем и получите уникальный опыт</p>
        
        <div class="search-section">
          <div class="search-bar">
            <input type="text" class="search-input" placeholder="Поиск предложений..." id="search-input">
            <button class="search-btn" id="search-btn">
              <span class="icon">🔍</span>
            </button>
          </div>
          
          <div class="quick-filters">
            <button class="filter-chip" data-filter="nearby">📍 Рядом</button>
            <button class="filter-chip" data-filter="popular">🔥 Популярные</button>
            <button class="filter-chip" data-filter="new">✨ Новые</button>
            <button class="filter-chip" data-filter="discount">💰 Со скидкой</button>
          </div>
        </div>
      </div>
    </div>

    <div class="home-page__content">
      <section class="categories-section">
        <h2 class="section-title">Категории</h2>
        <div class="categories-grid">
          ${categories.map(category => `
            <div class="category-card" data-category="${category.id}">
              <div class="category-icon" style="background-color: ${category.color}">
                ${category.icon}
              </div>
              <span class="category-name">${category.name}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="featured-section">
        <h2 class="section-title">Рекомендуемые предложения</h2>
        <div class="offers-grid">
          ${featuredOffers.map(offer => `
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
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="banner-section">
        <div class="banner">
          <div class="banner-content">
            <h3>Станьте тайным покупателем</h3>
            <p>Получайте деньги за посещение заведений и оставление отзывов</p>
            <button class="btn btn--primary">Начать работу</button>
          </div>
        </div>
      </section>
    </div>
  `;

  // Обработчики событий
  setupEventHandlers(page);

  return page;
}

function setupEventHandlers(page: HTMLElement) {
  // Поиск
  const searchInput = page.querySelector('#search-input') as HTMLInputElement;
  const searchBtn = page.querySelector('#search-btn');
  
  const performSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      // Переход на страницу предложений с поисковым запросом
      window.location.hash = `#/offers?search=${encodeURIComponent(query)}`;
    }
  };

  searchBtn?.addEventListener('click', performSearch);
  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Быстрые фильтры
  const filterChips = page.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = (chip as HTMLElement).dataset.filter;
      // Переход на страницу предложений с фильтром
      window.location.hash = `#/offers?filter=${filter}`;
    });
  });

  // Категории
  const categoryCards = page.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const categoryId = (card as HTMLElement).dataset.category;
      // Переход на страницу предложений с категорией
      window.location.hash = `#/offers?category=${categoryId}`;
    });
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
      // Переход на детальную страницу предложения
      window.location.hash = `#/offers/${offerId}`;
    });
  });
}

function toggleFavorite(offerId: string) {
  // Здесь будет логика добавления/удаления из избранного
  console.log('Toggle favorite:', offerId);
}
