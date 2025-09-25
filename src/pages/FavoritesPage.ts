// Страница избранного

// import { Offer } from '../types/index.js';

export async function createFavoritesPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'favorites-page';
  
  page.innerHTML = `
    <div class="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <div class="flex-grow">
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <h1 class="text-2xl font-bold">Избранное</h1>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div class="grid grid-cols-1 gap-4">
              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="w-full h-48 bg-slate-200 rounded-lg mb-3"></div>
                <h3 class="font-semibold mb-2">Дегустация вин в ресторане "Сомелье"</h3>
                <p class="text-slate-600 text-sm mb-2">Уникальная возможность попробовать лучшие вина мира</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">2,500 ₽</span>
                  <span class="text-sm text-slate-500">⭐ 4.8 (127)</span>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="w-full h-48 bg-slate-200 rounded-lg mb-3"></div>
                <h3 class="font-semibold mb-2">Мастер-класс по приготовлению суши</h3>
                <p class="text-slate-600 text-sm mb-2">Научитесь готовить традиционные японские суши</p>
                <div class="flex justify-between items-center">
                  <span class="text-primary font-bold">1,800 ₽</span>
                  <span class="text-sm text-slate-500">⭐ 4.6 (89)</span>
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

// function setupEventHandlers(page: HTMLElement, offers: Offer[]) {
//   // Сортировка
//   const sortSelect = page.querySelector('#sort-select') as HTMLSelectElement;
//   sortSelect?.addEventListener('change', () => {
//     const [field, direction] = sortSelect.value.split('-');
//     applySorting(field, direction, offers);
//   });

//   // Очистить все
//   const clearAllBtn = page.querySelector('#clear-all-btn');
//   clearAllBtn?.addEventListener('click', () => {
//     if (confirm('Вы уверены, что хотите удалить все предложения из избранного?')) {
//       clearAllFavorites();
//     }
//   });

//   // Удаление из избранного
//   const removeBtns = page.querySelectorAll('.remove-favorite-btn');
//   removeBtns.forEach(btn => {
//     btn.addEventListener('click', (e) => {
//       e.stopPropagation();
//       const offerId = (btn as HTMLElement).dataset.offer;
//       showConfirmModal(offerId!);
//     });
//   });

//   // Кнопки действий на карточках
//   const actionBtns = page.querySelectorAll('.favorite-card__actions .btn');
//   actionBtns.forEach(btn => {
//     btn.addEventListener('click', (e) => {
//       e.stopPropagation();
//       const offerId = (btn as HTMLElement).dataset.offer;
//       const action = btn.textContent?.trim();
      
//       if (action === 'Подробнее') {
//         window.location.hash = `#/offers/${offerId}`;
//       } else if (action === 'Забронировать') {
//         // Здесь будет логика бронирования
//         console.log('Book offer:', offerId);
//       }
//     });
//   });

//   // Клик по карточке
//   const favoriteCards = page.querySelectorAll('.favorite-card');
//   favoriteCards.forEach(card => {
//     card.addEventListener('click', () => {
//       const offerId = (card as HTMLElement).dataset.offer;
//       window.location.hash = `#/offers/${offerId}`;
//     });
//   });

//   // Кнопка "Найти предложения"
//   const exploreBtn = page.querySelector('#explore-btn');
//   exploreBtn?.addEventListener('click', () => {
//     window.location.hash = '#/offers';
//   });

//   // Модальное окно подтверждения
//   setupConfirmModal(page);
// }

// function applySorting(field: string, direction: string, offers: Offer[]) {
//   console.log('Apply sorting:', field, direction);
//   // Здесь будет логика сортировки и перерисовки карточек
// }

// function clearAllFavorites() {
//   console.log('Clear all favorites');
//   // Здесь будет логика очистки всех избранных предложений
// }

// function showConfirmModal(offerId: string) {
//   const modal = document.getElementById('confirm-modal') as HTMLElement;
//   modal.style.display = 'block';
  
//   // Сохраняем ID предложения для удаления
//   modal.dataset.offerId = offerId;
// }

// function setupConfirmModal(page: HTMLElement) {
//   const modal = page.querySelector('#confirm-modal') as HTMLElement;
//   const cancelBtn = page.querySelector('#confirm-cancel');
//   const deleteBtn = page.querySelector('#confirm-delete');

//   cancelBtn?.addEventListener('click', () => {
//     modal.style.display = 'none';
//   });

//   deleteBtn?.addEventListener('click', () => {
//     const offerId = modal.dataset.offerId;
//     if (offerId) {
//       removeFromFavorites(offerId);
//       modal.style.display = 'none';
//     }
//   });

//   // Закрытие по клику вне модального окна
//   modal.addEventListener('click', (e) => {
//     if (e.target === modal) {
//       modal.style.display = 'none';
//     }
//   });
// }

// function removeFromFavorites(offerId: string) {
//   console.log('Remove from favorites:', offerId);
//   // Здесь будет логика удаления из избранного
// }
