/**
 * Компонент сообщения для веб-устройств
 */

export function createWebDeviceMessage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'web-device-message';
  
  container.innerHTML = `
    <div class="web-message">
      <div class="web-message__icon">
        📱
      </div>
      <div class="web-message__content">
        <h2 class="web-message__title">Мобильное приложение</h2>
        <p class="web-message__description">
          На данный момент приложение доступно только для мобильных устройств.
          Мы работаем над веб-версией и скоро она будет доступна!
        </p>
        <div class="web-message__features">
          <h3>Что вас ждет:</h3>
          <ul>
            <li>🎯 Удобный поиск предложений</li>
            <li>❤️ Избранные товары и услуги</li>
            <li>📱 Уведомления о новых предложениях</li>
            <li>⭐ Отзывы и рейтинги</li>
            <li>📊 История заказов</li>
          </ul>
        </div>
        <div class="web-message__actions">
          <button class="btn btn--primary web-message__notify-btn" id="notify-btn">
            Уведомить о запуске
          </button>
          <button class="btn btn--secondary web-message__demo-btn" id="demo-btn">
            Посмотреть демо
          </button>
        </div>
        <div class="web-message__footer">
          <p>Следите за обновлениями в наших социальных сетях</p>
          <div class="social-links">
            <a href="#" class="social-link">📘 Facebook</a>
            <a href="#" class="social-link">📷 Instagram</a>
            <a href="#" class="social-link">🐦 Twitter</a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Добавляем обработчики событий
  const notifyBtn = container.querySelector('#notify-btn') as HTMLButtonElement;
  const demoBtn = container.querySelector('#demo-btn') as HTMLButtonElement;
  
  notifyBtn.addEventListener('click', () => {
    showNotificationForm();
  });
  
  demoBtn.addEventListener('click', () => {
    showDemo();
  });
  
  return container;
}

function showNotificationForm(): void {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Уведомить о запуске</h3>
        <button class="modal-close" id="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="notification-form">
          <div class="form-group">
            <label for="email">Email адрес</label>
            <input type="email" id="email" name="email" required 
                   placeholder="your@email.com" class="form-input">
          </div>
          <div class="form-group">
            <label for="phone">Телефон (необязательно)</label>
            <input type="tel" id="phone" name="phone" 
                   placeholder="+7 (999) 123-45-67" class="form-input">
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="newsletter" name="newsletter">
              Подписаться на новости и специальные предложения
            </label>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn--secondary" id="cancel-btn">Отмена</button>
        <button class="btn btn--primary" id="submit-btn">Подписаться</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Обработчики событий
  const closeBtn = modal.querySelector('#close-modal') as HTMLButtonElement;
  const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
  const submitBtn = modal.querySelector('#submit-btn') as HTMLButtonElement;
  const form = modal.querySelector('#notification-form') as HTMLFormElement;
  
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  submitBtn.addEventListener('click', () => {
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const newsletter = formData.get('newsletter') === 'on';
    
    // Здесь можно добавить отправку данных на сервер
    console.log('Подписка:', { email, phone, newsletter });
    
    // Показываем сообщение об успехе
    alert('Спасибо! Мы уведомим вас о запуске веб-версии.');
    closeModal();
  });
}

function showDemo(): void {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Демо-версия</h3>
        <button class="modal-close" id="close-demo">&times;</button>
      </div>
      <div class="modal-body">
        <div class="demo-content">
          <div class="demo-mockup">
            <div class="phone-mockup">
              <div class="phone-screen">
                <div class="demo-app">
                  <div class="demo-header">
                    <h4>Mystery Shopper</h4>
                  </div>
                  <div class="demo-search">
                    <input type="text" placeholder="Поиск предложений..." disabled>
                  </div>
                  <div class="demo-cards">
                    <div class="demo-card"></div>
                    <div class="demo-card"></div>
                    <div class="demo-card"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="demo-info">
            <h4>Основные функции:</h4>
            <ul>
              <li>Поиск и фильтрация предложений</li>
              <li>Детальная информация о товарах</li>
              <li>Система избранного</li>
              <li>Профиль пользователя</li>
              <li>История заказов</li>
            </ul>
            <p class="demo-note">
              Это упрощенная демо-версия. Полная функциональность будет доступна в мобильном приложении.
            </p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn--primary" id="close-demo-btn">Понятно</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Обработчики событий
  const closeBtn = modal.querySelector('#close-demo') as HTMLButtonElement;
  const closeDemoBtn = modal.querySelector('#close-demo-btn') as HTMLButtonElement;
  
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  closeBtn.addEventListener('click', closeModal);
  closeDemoBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}
