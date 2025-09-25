// Детальная страница предложения

import { Offer } from '../types/index.js';

export async function createOfferDetailPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offer-detail-page';
  
  // Моковые данные для конкретного предложения
  const offer: Offer = {
    id: offerId,
    title: 'Дегустация вин в ресторане "Сомелье"',
    description: 'Уникальная возможность попробовать лучшие вина мира с профессиональным сомелье. Вас ждет увлекательное путешествие по винным регионам Франции, Италии и Испании. Вы узнаете секреты правильной дегустации, научитесь различать ароматы и вкусы, а также получите рекомендации по выбору вин для разных случаев.',
    price: 2500,
    currency: 'RUB',
    images: [
      '/images/wine-tasting-1.jpg',
      '/images/wine-tasting-2.jpg',
      '/images/wine-tasting-3.jpg'
    ],
    videos: ['/videos/wine-tasting-preview.mp4'],
    location: { 
      address: 'ул. Арбат, 15, Москва', 
      city: 'Москва', 
      coordinates: { lat: 55.7558, lng: 37.6176 } 
    },
    category: 'Рестораны',
    rating: 4.8,
    reviewsCount: 127,
    isFavorite: false,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    conditions: [
      'Возраст 18+',
      'Предварительная запись обязательна',
      'Продолжительность: 2 часа',
      'Включены закуски к винам',
      'Максимум 8 человек в группе'
    ],
    tags: ['вино', 'дегустация', 'ресторан', 'сомелье', 'французские вина']
  };

  const similarOffers: Offer[] = [
    {
      id: '2',
      title: 'Мастер-класс по приготовлению суши',
      description: 'Научитесь готовить традиционные японские суши',
      price: 1800,
      currency: 'RUB',
      images: ['/images/sushi-class.jpg'],
      location: { address: 'пр. Мира, 45', city: 'Москва', coordinates: { lat: 55.7558, lng: 37.6176 } },
      category: 'Рестораны',
      rating: 4.6,
      reviewsCount: 89,
      isFavorite: false,
      createdAt: '2024-01-14',
      updatedAt: '2024-01-14',
      conditions: ['Предварительная запись'],
      tags: ['суши', 'мастер-класс']
    }
  ];

  page.innerHTML = `
    <div class="offer-detail-page__header">
      <button class="back-btn" id="back-btn">
        <span class="icon">←</span>
        Назад
      </button>
      <div class="header-actions">
        <button class="share-btn" id="share-btn">
          <span class="icon">📤</span>
          Поделиться
        </button>
        <button class="favorite-btn ${offer.isFavorite ? 'favorite-btn--active' : ''}" id="favorite-btn">
          ❤️
        </button>
      </div>
    </div>

    <div class="offer-detail-page__content">
      <div class="offer-gallery">
        <div class="gallery-main">
          <img src="${offer.images[0]}" alt="${offer.title}" id="main-image">
          <button class="gallery-play" id="play-video" style="display: ${offer.videos ? 'block' : 'none'}">
            <span class="icon">▶️</span>
          </button>
        </div>
        <div class="gallery-thumbnails">
          ${offer.images.map((image, index) => `
            <img src="${image}" alt="Изображение ${index + 1}" class="thumbnail ${index === 0 ? 'thumbnail--active' : ''}" data-index="${index}">
          `).join('')}
        </div>
      </div>

      <div class="offer-info">
        <div class="offer-header">
          <h1 class="offer-title">${offer.title}</h1>
          <div class="offer-rating">
            <div class="rating-stars">
              ${'⭐'.repeat(Math.floor(offer.rating))}
            </div>
            <span class="rating-value">${offer.rating}</span>
            <span class="rating-count">(${offer.reviewsCount} отзывов)</span>
          </div>
        </div>

        <div class="offer-price">
          <span class="price-value">${offer.price} ${offer.currency}</span>
          <span class="price-note">за человека</span>
        </div>

        <div class="offer-description">
          <h3>Описание</h3>
          <p>${offer.description}</p>
        </div>

        <div class="offer-conditions">
          <h3>Условия</h3>
          <ul class="conditions-list">
            ${offer.conditions.map(condition => `
              <li class="condition-item">${condition}</li>
            `).join('')}
          </ul>
        </div>

        <div class="offer-location">
          <h3>Местоположение</h3>
          <div class="location-info">
            <div class="location-address">
              <span class="icon">📍</span>
              ${offer.location.address}
            </div>
            <div class="location-map" id="location-map">
              <div class="map-placeholder">
                <span class="icon">🗺️</span>
                <span>Карта</span>
              </div>
            </div>
          </div>
        </div>

        <div class="offer-tags">
          <h3>Теги</h3>
          <div class="tags-list">
            ${offer.tags.map(tag => `
              <span class="tag">${tag}</span>
            `).join('')}
          </div>
        </div>

        <div class="offer-actions">
          <button class="btn btn--primary btn--large" id="book-btn">
            Забронировать
          </button>
          <button class="btn btn--secondary btn--large" id="contact-btn">
            Связаться
          </button>
        </div>
      </div>
    </div>

    <div class="offer-detail-page__reviews">
      <div class="reviews-section">
        <h2>Отзывы</h2>
        <div class="reviews-summary">
          <div class="rating-breakdown">
            <div class="rating-item">
              <span>5⭐</span>
              <div class="rating-bar">
                <div class="rating-fill" style="width: 80%"></div>
              </div>
              <span>102</span>
            </div>
            <div class="rating-item">
              <span>4⭐</span>
              <div class="rating-bar">
                <div class="rating-fill" style="width: 15%"></div>
              </div>
              <span>19</span>
            </div>
            <div class="rating-item">
              <span>3⭐</span>
              <div class="rating-bar">
                <div class="rating-fill" style="width: 3%"></div>
              </div>
              <span>4</span>
            </div>
            <div class="rating-item">
              <span>2⭐</span>
              <div class="rating-bar">
                <div class="rating-fill" style="width: 1%"></div>
              </div>
              <span>1</span>
            </div>
            <div class="rating-item">
              <span>1⭐</span>
              <div class="rating-bar">
                <div class="rating-fill" style="width: 1%"></div>
              </div>
              <span>1</span>
            </div>
          </div>
        </div>
        
        <div class="reviews-list">
          <div class="review-item">
            <div class="review-header">
              <div class="reviewer-info">
                <div class="reviewer-avatar">А</div>
                <div class="reviewer-details">
                  <span class="reviewer-name">Анна К.</span>
                  <div class="review-rating">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <span class="review-date">15 января 2024</span>
            </div>
            <p class="review-text">Потрясающий опыт! Сомелье очень профессиональный, объяснил все тонкости дегустации. Вина были отличного качества.</p>
          </div>
          
          <div class="review-item">
            <div class="review-header">
              <div class="reviewer-info">
                <div class="reviewer-avatar">М</div>
                <div class="reviewer-details">
                  <span class="reviewer-name">Михаил С.</span>
                  <div class="review-rating">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <span class="review-date">12 января 2024</span>
            </div>
            <p class="review-text">Очень рекомендую! Узнал много нового о винах. Атмосфера в ресторане замечательная.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="offer-detail-page__similar">
      <div class="similar-section">
        <h2>Похожие предложения</h2>
        <div class="similar-offers">
          ${similarOffers.map(similarOffer => `
            <div class="similar-offer-card" data-offer="${similarOffer.id}">
              <div class="similar-offer-image">
                <img src="${similarOffer.images[0]}" alt="${similarOffer.title}" onerror="this.src='/placeholder-image.jpg'">
              </div>
              <div class="similar-offer-content">
                <h3 class="similar-offer-title">${similarOffer.title}</h3>
                <div class="similar-offer-price">${similarOffer.price} ${similarOffer.currency}</div>
                <div class="similar-offer-rating">⭐ ${similarOffer.rating}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  setupEventHandlers(page, offer);
  return page;
}

function setupEventHandlers(page: HTMLElement, offer: Offer) {
  // Кнопка "Назад"
  const backBtn = page.querySelector('#back-btn');
  backBtn?.addEventListener('click', () => {
    window.history.back();
  });

  // Избранное
  const favoriteBtn = page.querySelector('#favorite-btn');
  favoriteBtn?.addEventListener('click', () => {
    toggleFavorite(offer.id);
    favoriteBtn.classList.toggle('favorite-btn--active');
  });

  // Поделиться
  const shareBtn = page.querySelector('#share-btn');
  shareBtn?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: offer.title,
        text: offer.description,
        url: window.location.href
      });
    } else {
      // Fallback для браузеров без поддержки Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена');
    }
  });

  // Галерея изображений
  const thumbnails = page.querySelectorAll('.thumbnail');
  const mainImage = page.querySelector('#main-image') as HTMLImageElement;
  
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
      const index = parseInt((thumbnail as HTMLElement).dataset.index!);
      const newImageSrc = offer.images[index];
      
      mainImage.src = newImageSrc;
      
      thumbnails.forEach(t => t.classList.remove('thumbnail--active'));
      thumbnail.classList.add('thumbnail--active');
    });
  });

  // Воспроизведение видео
  const playVideoBtn = page.querySelector('#play-video');
  playVideoBtn?.addEventListener('click', () => {
    // Здесь будет логика воспроизведения видео
    console.log('Play video:', offer.videos?.[0]);
  });

  // Кнопки действий
  const bookBtn = page.querySelector('#book-btn');
  bookBtn?.addEventListener('click', () => {
    // Здесь будет логика бронирования
    console.log('Book offer:', offer.id);
  });

  const contactBtn = page.querySelector('#contact-btn');
  contactBtn?.addEventListener('click', () => {
    // Здесь будет логика связи с организатором
    console.log('Contact organizer for offer:', offer.id);
  });

  // Похожие предложения
  const similarCards = page.querySelectorAll('.similar-offer-card');
  similarCards.forEach(card => {
    card.addEventListener('click', () => {
      const offerId = (card as HTMLElement).dataset.offer;
      window.location.hash = `#/offers/${offerId}`;
    });
  });
}

function toggleFavorite(offerId: string) {
  console.log('Toggle favorite:', offerId);
  // Здесь будет логика добавления/удаления из избранного
}
