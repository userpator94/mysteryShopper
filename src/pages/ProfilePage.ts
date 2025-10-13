// Страница профиля пользователя

import { apiService } from '../services/api.js';
import type { UserStatistics } from '../types/index.js';

export async function createProfilePage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'profile-page';

  // Загружаем данные пользователя
  let userStats: UserStatistics | null = null;
  try {
    const response = await apiService.getUserStatistics();
    userStats = response.data;
  } catch (error) {
    console.error('Ошибка загрузки статистики пользователя:', error);
  }

  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <h1 class="text-2xl font-bold">Профиль</h1>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div class="bg-white rounded-lg p-6 border border-slate-200 mb-4">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 bg-slate-200 rounded-full"></div>
                <div>
                  <h2 class="text-xl font-semibold">${userStats ? `${userStats.name} ${userStats.surname}` : 'Загрузка...'}</h2>
                  <p class="text-slate-600">ivan.petrov@example.com</p>
                  <p class="text-slate-600">+7 (999) 123-45-67</p>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">${userStats ? userStats.total_applications : '...'}</div>
                  <div class="text-sm text-slate-600">заказов</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">${userStats ? userStats.completed_applications : '...'}</div>
                  <div class="text-sm text-slate-600">выполнено</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">${userStats ? `${userStats.total_earnings.toLocaleString()} ₽` : '...'}</div>
                  <div class="text-sm text-slate-600">заработано</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">⭐ ${userStats ? userStats.average_rating : '...'}</div>
                  <div class="text-sm text-slate-600">рейтинг</div>
                </div>
              </div>
            </div>
            
            <div class="space-y-4">
              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <h3 class="font-semibold mb-2">Настройки</h3>
                <div class="space-y-2">
                  <div class="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors" data-action="language">
                    <span>Язык</span>
                    <span class="text-slate-600">Русский</span>
                  </div>
                  <div class="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors" data-action="theme">
                    <span>Тема</span>
                    <span class="text-slate-600">Светлая</span>
                  </div>
                  <div class="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors" data-action="notifications">
                    <span>Уведомления</span>
                    <span class="text-slate-600">Включены</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <h3 class="font-semibold mb-2">Поддержка</h3>
                <div class="space-y-2">
                  <button class="w-full text-left py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors" data-action="help">Помощь</button>
                  <button class="w-full text-left py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors" data-action="contact">Связаться с нами</button>
                  <button class="w-full text-left py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors" data-action="feedback">Оставить отзыв</button>
                </div>
              </div>
              
              <button class="w-full bg-red-500 text-white py-3 rounded-lg font-semibold">
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Настраиваем обработчики событий
  setupEventHandlers(page);

  return page;
}

function setupEventHandlers(page: HTMLElement) {
  // Обработчики для элементов настроек и поддержки
  const actionElements = page.querySelectorAll('[data-action]');
  actionElements.forEach(element => {
    element.addEventListener('click', () => {
      const action = (element as HTMLElement).dataset.action;
      handleAction(action);
    });
  });
}

function handleAction(action: string | undefined) {
  switch (action) {
    case 'language':
      console.log('Открыть настройки языка');
      break;
    case 'theme':
      console.log('Открыть настройки темы');
      break;
    case 'notifications':
      console.log('Открыть настройки уведомлений');
      break;
    case 'help':
      console.log('Открыть помощь');
      break;
    case 'contact':
      console.log('Связаться с нами');
      break;
    case 'feedback':
      console.log('Оставить отзыв');
      break;
    default:
      console.log('Неизвестное действие:', action);
  }
}