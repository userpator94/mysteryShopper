// Страница истории заказов

import { Order, Offer } from '../types/index.js';

export async function createOrderHistoryPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'order-history-page';
  
  // Моковые данные заказов
  const orders: Order[] = [
    {
      id: '1',
      offerId: '1',
      offer: {
        id: '1',
        title: 'Дегустация вин в ресторане "Сомелье"',
        description: 'Уникальная возможность попробовать лучшие вина мира',
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
        conditions: ['Возраст 18+'],
        tags: ['вино', 'дегустация']
      },
      status: 'completed',
      createdAt: '2024-01-10',
      completedAt: '2024-01-15',
      rating: 5,
      review: 'Отличная дегустация! Очень профессиональный сомелье.'
    },
    {
      id: '2',
      offerId: '2',
      offer: {
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
      },
      status: 'completed',
      createdAt: '2024-01-08',
      completedAt: '2024-01-14',
      rating: 4,
      review: 'Интересный мастер-класс, научился готовить суши.'
    },
    {
      id: '3',
      offerId: '3',
      offer: {
        id: '3',
        title: 'Экскурсия по историческому центру',
        description: 'Пешеходная экскурсия по историческому центру',
        price: 1200,
        currency: 'RUB',
        images: ['/images/city-tour.jpg'],
        location: { address: 'Красная площадь, 1', city: 'Москва', coordinates: { lat: 55.7539, lng: 37.6208 } },
        category: 'Развлечения',
        rating: 4.7,
        reviewsCount: 156,
        isFavorite: false,
        createdAt: '2024-01-13',
        updatedAt: '2024-01-13',
        conditions: ['Продолжительность 2 часа'],
        tags: ['экскурсия', 'история']
      },
      status: 'pending',
      createdAt: '2024-01-20',
      completedAt: undefined,
      rating: undefined,
      review: undefined
    }
  ];

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalEarnings: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.offer.price, 0)
  };

  page.innerHTML = `
    <div class="order-history-page__header">
      <button class="back-btn" id="back-btn">
        <span class="icon">←</span>
        Назад
      </button>
      <h1 class="page-title">История заказов</h1>
      <div class="header-actions">
        <div class="filter-controls">
          <select class="filter-select" id="status-filter">
            <option value="">Все заказы</option>
            <option value="completed">Завершенные</option>
            <option value="pending">В процессе</option>
            <option value="cancelled">Отмененные</option>
          </select>
        </div>
      </div>
    </div>

    <div class="order-history-page__content">
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <span class="stat-value">${stats.total}</span>
              <span class="stat-label">Всего заказов</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <span class="stat-value">${stats.completed}</span>
              <span class="stat-label">Завершено</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
              <span class="stat-value">${stats.pending}</span>
              <span class="stat-label">В процессе</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <span class="stat-value">${stats.totalEarnings} ₽</span>
              <span class="stat-label">Заработано</span>
            </div>
          </div>
        </div>
      </div>

      <div class="orders-section">
        <div class="orders-list" id="orders-list">
          ${orders.map(order => `
            <div class="order-card" data-order="${order.id}">
              <div class="order-card__image">
                <img src="${order.offer.images[0]}" alt="${order.offer.title}" onerror="this.src='/placeholder-image.jpg'">
                <div class="order-status order-status--${order.status}">
                  ${getStatusText(order.status)}
                </div>
              </div>
              <div class="order-card__content">
                <h3 class="order-title">${order.offer.title}</h3>
                <div class="order-meta">
                  <span class="order-price">${order.offer.price} ${order.offer.currency}</span>
                  <span class="order-date">${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-location">📍 ${order.offer.location.address}</div>
                
                ${order.status === 'completed' ? `
                  <div class="order-review">
                    <div class="review-rating">
                      <span class="rating-stars">${'⭐'.repeat(order.rating || 0)}</span>
                      <span class="rating-value">${order.rating}/5</span>
                    </div>
                    <p class="review-text">${order.review}</p>
                  </div>
                ` : ''}
                
                <div class="order-actions">
                  ${order.status === 'completed' ? `
                    <button class="btn btn--secondary btn--small" data-action="repeat" data-order="${order.id}">
                      Повторить заказ
                    </button>
                    <button class="btn btn--primary btn--small" data-action="review" data-order="${order.id}">
                      Редактировать отзыв
                    </button>
                  ` : order.status === 'pending' ? `
                    <button class="btn btn--secondary btn--small" data-action="cancel" data-order="${order.id}">
                      Отменить
                    </button>
                    <button class="btn btn--primary btn--small" data-action="details" data-order="${order.id}">
                      Подробности
                    </button>
                  ` : `
                    <button class="btn btn--primary btn--small" data-action="repeat" data-order="${order.id}">
                      Повторить заказ
                    </button>
                  `}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Модальное окно для редактирования отзыва -->
    <div class="modal" id="review-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Редактировать отзыв</h3>
          <button class="modal-close" id="review-modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="review-form">
            <div class="rating-input">
              <label>Оценка:</label>
              <div class="rating-stars-input">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button class="star-btn" data-rating="${star}">⭐</button>
                `).join('')}
              </div>
            </div>
            <div class="review-text-input">
              <label for="review-text">Отзыв:</label>
              <textarea id="review-text" placeholder="Оставьте ваш отзыв..." rows="4"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" id="review-cancel">Отмена</button>
          <button class="btn btn--primary" id="review-save">Сохранить</button>
        </div>
      </div>
    </div>
  `;

  setupEventHandlers(page, orders);
  return page;
}

function getStatusText(status: string): string {
  const statusTexts: { [key: string]: string } = {
    'completed': 'Завершен',
    'pending': 'В процессе',
    'cancelled': 'Отменен'
  };
  return statusTexts[status] || status;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function setupEventHandlers(page: HTMLElement, orders: Order[]) {
  // Кнопка "Назад"
  const backBtn = page.querySelector('#back-btn');
  backBtn?.addEventListener('click', () => {
    window.history.back();
  });

  // Фильтр по статусу
  const statusFilter = page.querySelector('#status-filter') as HTMLSelectElement;
  statusFilter?.addEventListener('change', () => {
    const selectedStatus = statusFilter.value;
    filterOrdersByStatus(selectedStatus, orders);
  });

  // Действия с заказами
  const actionBtns = page.querySelectorAll('[data-action]');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = (btn as HTMLElement).dataset.action;
      const orderId = (btn as HTMLElement).dataset.order;
      handleOrderAction(action!, orderId!, orders);
    });
  });

  // Клик по карточке заказа
  const orderCards = page.querySelectorAll('.order-card');
  orderCards.forEach(card => {
    card.addEventListener('click', () => {
      const orderId = (card as HTMLElement).dataset.order;
      const order = orders.find(o => o.id === orderId);
      if (order) {
        window.location.hash = `#/offers/${order.offerId}`;
      }
    });
  });

  // Модальное окно отзыва
  setupReviewModal(page, orders);
}

function filterOrdersByStatus(status: string, orders: Order[]) {
  console.log('Filter orders by status:', status);
  // Здесь будет логика фильтрации заказов
}

function handleOrderAction(action: string, orderId: string, orders: Order[]) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  switch (action) {
    case 'repeat':
      // Повторить заказ
      console.log('Repeat order:', orderId);
      break;
    case 'review':
      // Редактировать отзыв
      openReviewModal(order);
      break;
    case 'cancel':
      // Отменить заказ
      if (confirm('Вы уверены, что хотите отменить заказ?')) {
        console.log('Cancel order:', orderId);
      }
      break;
    case 'details':
      // Подробности заказа
      console.log('Order details:', orderId);
      break;
  }
}

function openReviewModal(order: Order) {
  const modal = document.getElementById('review-modal') as HTMLElement;
  modal.style.display = 'block';
  
  // Заполняем форму текущими данными
  const reviewText = document.getElementById('review-text') as HTMLTextAreaElement;
  reviewText.value = order.review || '';
  
  // Устанавливаем рейтинг
  const starBtns = modal.querySelectorAll('.star-btn');
  starBtns.forEach((btn, index) => {
    btn.classList.toggle('star-btn--active', index < (order.rating || 0));
  });
  
  // Сохраняем ID заказа
  modal.dataset.orderId = order.id;
}

function setupReviewModal(page: HTMLElement, orders: Order[]) {
  const modal = page.querySelector('#review-modal') as HTMLElement;
  const closeBtn = page.querySelector('#review-modal-close');
  const cancelBtn = page.querySelector('#review-cancel');
  const saveBtn = page.querySelector('#review-save');

  // Закрытие модального окна
  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  cancelBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Сохранение отзыва
  saveBtn?.addEventListener('click', () => {
    const orderId = modal.dataset.orderId;
    const reviewText = (page.querySelector('#review-text') as HTMLTextAreaElement).value;
    const selectedRating = modal.querySelectorAll('.star-btn--active').length;
    
    if (orderId) {
      console.log('Save review:', { orderId, rating: selectedRating, review: reviewText });
      modal.style.display = 'none';
    }
  });

  // Выбор рейтинга
  const starBtns = modal.querySelectorAll('.star-btn');
  starBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Сбрасываем все звезды
      starBtns.forEach(b => b.classList.remove('star-btn--active'));
      // Активируем звезды до выбранной
      for (let i = 0; i <= index; i++) {
        starBtns[i].classList.add('star-btn--active');
      }
    });
  });

  // Закрытие по клику вне модального окна
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}
