// Страница истории заказов

// import { Order } from '../types/index.js';

export async function createOrderHistoryPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'order-history-page';

  page.innerHTML = `
    <div class="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <div class="flex-grow">
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <h1 class="text-2xl font-bold">История заказов</h1>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div class="space-y-4">
              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-semibold">Дегустация вин в ресторане "Сомелье"</h3>
                  <span class="text-sm text-green-600 font-semibold">Выполнено</span>
                </div>
                <p class="text-slate-600 text-sm mb-2">15 января 2024</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">2,500 ₽</span>
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">⭐</span>
                    <span class="text-sm">4.8</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-semibold">Мастер-класс по приготовлению суши</h3>
                  <span class="text-sm text-blue-600 font-semibold">В процессе</span>
                </div>
                <p class="text-slate-600 text-sm mb-2">14 января 2024</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">1,800 ₽</span>
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">⭐</span>
                    <span class="text-sm">4.6</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-semibold">Экскурсия по историческому центру</h3>
                  <span class="text-sm text-green-600 font-semibold">Выполнено</span>
                </div>
                <p class="text-slate-600 text-sm mb-2">13 января 2024</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">1,200 ₽</span>
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">⭐</span>
                    <span class="text-sm">4.7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  return page;
}