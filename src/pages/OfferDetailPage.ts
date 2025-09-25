// Страница детального просмотра предложения

// import { Offer } from '../types/index.js';

export async function createOfferDetailPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offer-detail-page';

  page.innerHTML = `
    <div class="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <div class="flex-grow">
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <div class="flex items-center gap-3">
            <button class="text-slate-500">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 class="text-lg font-semibold">Предложение</h1>
          </div>
        </header>
        
        <main class="pb-28">
          <div class="w-full h-64 bg-slate-200"></div>
          
          <div class="px-4 py-4">
            <h2 class="text-2xl font-bold mb-2">Дегустация вин в ресторане "Сомелье"</h2>
            <p class="text-slate-600 mb-4">Уникальная возможность попробовать лучшие вина мира с профессиональным сомелье</p>
            
            <div class="flex items-center gap-4 mb-4">
              <span class="text-3xl font-bold text-primary">2,500 ₽</span>
              <div class="flex items-center gap-1">
                <span class="text-yellow-500">⭐</span>
                <span class="font-semibold">4.8</span>
                <span class="text-slate-600">(127 отзывов)</span>
              </div>
            </div>
            
            <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
              <h3 class="font-semibold mb-2">📍 Местоположение</h3>
              <p class="text-slate-600">ул. Арбат, 15, Москва</p>
            </div>
            
            <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
              <h3 class="font-semibold mb-2">📋 Условия</h3>
              <ul class="text-slate-600 space-y-1">
                <li>• Возраст 18+</li>
                <li>• Предварительная запись</li>
              </ul>
            </div>
            
            <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
              <h3 class="font-semibold mb-2">🏷️ Теги</h3>
              <div class="flex flex-wrap gap-2">
                <span class="bg-slate-200 text-slate-600 text-sm px-2 py-1 rounded">вино</span>
                <span class="bg-slate-200 text-slate-600 text-sm px-2 py-1 rounded">дегустация</span>
                <span class="bg-slate-200 text-slate-600 text-sm px-2 py-1 rounded">ресторан</span>
              </div>
            </div>
            
            <button class="w-full bg-primary text-white py-3 rounded-lg font-semibold mb-2">
              Забронировать
            </button>
            <button class="w-full bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold">
              Добавить в избранное
            </button>
          </div>
        </main>
      </div>
    </div>
  `;

  return page;
}