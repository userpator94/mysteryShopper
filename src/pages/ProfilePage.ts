// Страница профиля пользователя

import { User, Order } from '../types/index.js';

export async function createProfilePage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'profile-page';
  
  // Моковые данные пользователя
  const user: User = {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan.petrov@example.com',
    avatar: '/images/user-avatar.jpg',
    phone: '+7 (999) 123-45-67',
    preferences: {
      language: 'ru',
      theme: 'light',
      notifications: true
    }
  };

  // Моковые данные статистики
  const stats = {
    totalOrders: 12,
    completedOrders: 10,
    totalEarnings: 15000,
    averageRating: 4.8,
    memberSince: '2023-06-15'
  };

  page.innerHTML = `
    <div class="profile-page__header">
      <h1 class="page-title">Профиль</h1>
    </div>

    <div class="profile-page__content">
      <div class="profile-section">
        <div class="profile-card">
          <div class="profile-avatar">
            <img src="${user.avatar}" alt="${user.name}" onerror="this.src='/placeholder-avatar.jpg'">
            <button class="avatar-edit-btn" id="avatar-edit-btn">
              <span class="icon">📷</span>
            </button>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">${user.name}</h2>
            <p class="profile-email">${user.email}</p>
            <p class="profile-phone">${user.phone}</p>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">${stats.totalOrders}</span>
                <span class="stat-label">заказов</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${stats.totalEarnings} ₽</span>
                <span class="stat-label">заработано</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">⭐ ${stats.averageRating}</span>
                <span class="stat-label">рейтинг</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-menu">
        <div class="menu-section">
          <h3 class="menu-section-title">Активность</h3>
          <div class="menu-items">
            <a href="#/orders" class="menu-item">
              <div class="menu-item-icon">📋</div>
              <div class="menu-item-content">
                <span class="menu-item-title">История заказов</span>
                <span class="menu-item-subtitle">${stats.totalOrders} заказов</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </a>
            <a href="#/earnings" class="menu-item">
              <div class="menu-item-icon">💰</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Заработок</span>
                <span class="menu-item-subtitle">${stats.totalEarnings} ₽</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </a>
            <a href="#/reviews" class="menu-item">
              <div class="menu-item-icon">⭐</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Мои отзывы</span>
                <span class="menu-item-subtitle">Оставленные отзывы</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </a>
          </div>
        </div>

        <div class="menu-section">
          <h3 class="menu-section-title">Настройки</h3>
          <div class="menu-items">
            <div class="menu-item" id="language-item">
              <div class="menu-item-icon">🌐</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Язык</span>
                <span class="menu-item-subtitle">${getLanguageName(user.preferences.language)}</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </div>
            <div class="menu-item" id="theme-item">
              <div class="menu-item-icon">🎨</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Тема</span>
                <span class="menu-item-subtitle">${user.preferences.theme === 'light' ? 'Светлая' : 'Темная'}</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </div>
            <div class="menu-item" id="notifications-item">
              <div class="menu-item-icon">🔔</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Уведомления</span>
                <span class="menu-item-subtitle">${user.preferences.notifications ? 'Включены' : 'Отключены'}</span>
              </div>
              <div class="menu-item-toggle">
                <input type="checkbox" ${user.preferences.notifications ? 'checked' : ''} id="notifications-toggle">
                <label for="notifications-toggle" class="toggle-switch"></label>
              </div>
            </div>
          </div>
        </div>

        <div class="menu-section">
          <h3 class="menu-section-title">Аккаунт</h3>
          <div class="menu-items">
            <div class="menu-item" id="edit-profile-item">
              <div class="menu-item-icon">✏️</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Редактировать профиль</span>
                <span class="menu-item-subtitle">Изменить данные</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </div>
            <div class="menu-item" id="security-item">
              <div class="menu-item-icon">🔒</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Безопасность</span>
                <span class="menu-item-subtitle">Пароль и доступ</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </div>
            <div class="menu-item" id="help-item">
              <div class="menu-item-icon">❓</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Помощь</span>
                <span class="menu-item-subtitle">Поддержка и FAQ</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </div>
            <div class="menu-item menu-item--danger" id="logout-item">
              <div class="menu-item-icon">🚪</div>
              <div class="menu-item-content">
                <span class="menu-item-title">Выйти</span>
                <span class="menu-item-subtitle">Завершить сессию</span>
              </div>
              <div class="menu-item-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальные окна для настроек -->
    <div class="modal" id="language-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Выберите язык</h3>
          <button class="modal-close" id="language-modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="language-list">
            <label class="language-option">
              <input type="radio" name="language" value="ru" ${user.preferences.language === 'ru' ? 'checked' : ''}>
              <span>🇷🇺 Русский</span>
            </label>
            <label class="language-option">
              <input type="radio" name="language" value="en" ${user.preferences.language === 'en' ? 'checked' : ''}>
              <span>🇺🇸 English</span>
            </label>
            <label class="language-option">
              <input type="radio" name="language" value="uk" ${user.preferences.language === 'uk' ? 'checked' : ''}>
              <span>🇺🇦 Українська</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" id="language-cancel">Отмена</button>
          <button class="btn btn--primary" id="language-apply">Применить</button>
        </div>
      </div>
    </div>

    <div class="modal" id="theme-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Выберите тему</h3>
          <button class="modal-close" id="theme-modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="theme-list">
            <label class="theme-option">
              <input type="radio" name="theme" value="light" ${user.preferences.theme === 'light' ? 'checked' : ''}>
              <span>☀️ Светлая тема</span>
            </label>
            <label class="theme-option">
              <input type="radio" name="theme" value="dark" ${user.preferences.theme === 'dark' ? 'checked' : ''}>
              <span>🌙 Темная тема</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" id="theme-cancel">Отмена</button>
          <button class="btn btn--primary" id="theme-apply">Применить</button>
        </div>
      </div>
    </div>
  `;

  setupEventHandlers(page, user);
  return page;
}

function getLanguageName(lang: string): string {
  const languages: { [key: string]: string } = {
    'ru': 'Русский',
    'en': 'English',
    'uk': 'Українська'
  };
  return languages[lang] || lang;
}

function setupEventHandlers(page: HTMLElement, user: User) {
  // Редактирование аватара
  const avatarEditBtn = page.querySelector('#avatar-edit-btn');
  avatarEditBtn?.addEventListener('click', () => {
    // Здесь будет логика загрузки нового аватара
    console.log('Edit avatar');
  });

  // Переключатель уведомлений
  const notificationsToggle = page.querySelector('#notifications-toggle') as HTMLInputElement;
  notificationsToggle?.addEventListener('change', () => {
    user.preferences.notifications = notificationsToggle.checked;
    console.log('Notifications:', user.preferences.notifications);
  });

  // Пункты меню
  const menuItems = page.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const itemId = (item as HTMLElement).id;
      handleMenuItemClick(itemId);
    });
  });

  // Модальные окна
  setupModals(page, user);
}

function handleMenuItemClick(itemId: string) {
  switch (itemId) {
    case 'language-item':
      openModal('language-modal');
      break;
    case 'theme-item':
      openModal('theme-modal');
      break;
    case 'edit-profile-item':
      // Здесь будет логика редактирования профиля
      console.log('Edit profile');
      break;
    case 'security-item':
      // Здесь будет логика настроек безопасности
      console.log('Security settings');
      break;
    case 'help-item':
      // Здесь будет логика помощи
      console.log('Help');
      break;
    case 'logout-item':
      if (confirm('Вы уверены, что хотите выйти?')) {
        // Здесь будет логика выхода
        console.log('Logout');
      }
      break;
  }
}

function openModal(modalId: string) {
  const modal = document.getElementById(modalId) as HTMLElement;
  modal.style.display = 'block';
}

function setupModals(page: HTMLElement, user: User) {
  // Модальное окно языка
  const languageModal = page.querySelector('#language-modal') as HTMLElement;
  const languageClose = page.querySelector('#language-modal-close');
  const languageCancel = page.querySelector('#language-cancel');
  const languageApply = page.querySelector('#language-apply');

  languageClose?.addEventListener('click', () => {
    languageModal.style.display = 'none';
  });

  languageCancel?.addEventListener('click', () => {
    languageModal.style.display = 'none';
  });

  languageApply?.addEventListener('click', () => {
    const selectedLanguage = page.querySelector('input[name="language"]:checked') as HTMLInputElement;
    if (selectedLanguage) {
      user.preferences.language = selectedLanguage.value as 'ru' | 'en' | 'uk';
      console.log('Language changed to:', user.preferences.language);
      languageModal.style.display = 'none';
    }
  });

  // Модальное окно темы
  const themeModal = page.querySelector('#theme-modal') as HTMLElement;
  const themeClose = page.querySelector('#theme-modal-close');
  const themeCancel = page.querySelector('#theme-cancel');
  const themeApply = page.querySelector('#theme-apply');

  themeClose?.addEventListener('click', () => {
    themeModal.style.display = 'none';
  });

  themeCancel?.addEventListener('click', () => {
    themeModal.style.display = 'none';
  });

  themeApply?.addEventListener('click', () => {
    const selectedTheme = page.querySelector('input[name="theme"]:checked') as HTMLInputElement;
    if (selectedTheme) {
      user.preferences.theme = selectedTheme.value as 'light' | 'dark';
      document.body.classList.toggle('dark-theme', selectedTheme.value === 'dark');
      console.log('Theme changed to:', user.preferences.theme);
      themeModal.style.display = 'none';
    }
  });

  // Закрытие модальных окон по клику вне них
  [languageModal, themeModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}
