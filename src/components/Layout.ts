// Основной layout с навигацией

import { router } from '../router/index.js';

export function createLayout(): HTMLElement {
  const layout = document.createElement('div');
  layout.className = 'layout';
  
  layout.innerHTML = `
    <header class="header">
      <div class="header__container">
        <div class="header__logo">
          <h1>Mystery Shopper</h1>
        </div>
        <nav class="header__nav">
          <a href="/" class="nav-link" data-route="/">Главная</a>
          <a href="/offers" class="nav-link" data-route="/offers">Предложения</a>
          <a href="/favorites" class="nav-link" data-route="/favorites">Избранное</a>
          <a href="/profile" class="nav-link" data-route="/profile">Профиль</a>
        </nav>
        <div class="header__actions">
          <button class="btn btn--icon" id="theme-toggle">
            <span class="icon">🌙</span>
          </button>
          <button class="btn btn--icon" id="notifications">
            <span class="icon">🔔</span>
          </button>
        </div>
      </div>
    </header>
    
    <main class="main" id="main-content">
      <!-- Контент страниц будет загружаться здесь -->
    </main>
    
    <footer class="footer">
      <div class="footer__container">
        <p>&copy; 2024 Mystery Shopper. Все права защищены.</p>
      </div>
    </footer>
  `;

  // Обработчики навигации
  const navLinks = layout.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = (e.target as HTMLElement).dataset.route;
      if (route) {
        router.navigate(route);
        updateActiveNavLink(route);
      }
    });
  });

  // Обработчик переключения темы
  const themeToggle = layout.querySelector('#theme-toggle');
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = themeToggle.querySelector('.icon');
    if (icon) {
      icon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    }
  });

  return layout;
}

function updateActiveNavLink(activeRoute: string) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('nav-link--active');
    if ((link as HTMLElement).dataset.route === activeRoute) {
      link.classList.add('nav-link--active');
    }
  });
}
