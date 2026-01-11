// Страница создания отчета по предложению

import { router } from '../router/index.js';

export async function createReportPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'report-page';

  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <div class="flex items-center gap-3">
            <button id="back-btn" class="text-slate-500">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 class="text-2xl font-bold">Создать отчёт</h1>
          </div>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div class="bg-white rounded-lg p-6 border border-slate-200">
              <p class="text-slate-600 text-center">Функция создания отчёта будет реализована позже</p>
              <p class="text-slate-500 text-sm text-center mt-2">Offer ID: ${offerId}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Обработчик кнопки "Назад"
  const backBtn = page.querySelector('#back-btn') as HTMLButtonElement;
  backBtn?.addEventListener('click', () => {
    router.navigate(`/offers/${offerId}`);
  });

  return page;
}
