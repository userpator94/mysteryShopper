// Страница детального просмотра предложения

import type { Offer } from '../types/index.js';
import { apiService } from '../services/api.js';

const REPORT_FORM_URL = 'https://forms.yandex.ru/cloud/692847d4d046889383c04c34';

// Map для хранения обработчиков событий по кнопкам
const buttonHandlers = new WeakMap<HTMLButtonElement, (e: MouseEvent) => void>();

export async function createOfferDetailPage(offerId: string): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offer-detail-page';

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
          </div>
        </header>
        
        <main class="pb-28">
          <div id="loading-state" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span class="ml-2 text-slate-600">Загрузка предложения...</span>
          </div>
          
          <div id="error-state" class="hidden text-center py-8">
            <div class="text-red-500 mb-2">⚠️</div>
            <p class="text-slate-600 mb-4">Не удалось загрузить предложение</p>
            <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              Попробовать снова
            </button>
          </div>
          
          <div id="offer-content" class="hidden">
            <!-- Изображение предложения -->
            <!-- <div id="offer-image-container" class="hidden w-full h-64 bg-slate-200 relative overflow-hidden">
              <div id="offer-image-placeholder" class="w-full h-full flex items-center justify-center text-slate-400">
                <svg fill="currentColor" height="64" viewBox="0 0 24 24" width="64" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5Z"/>
                </svg>
              </div>
              <img id="offer-image" class="hidden w-full h-full object-cover" alt="">
            </div> -->
            
            <div class="px-4 py-4">
              <!-- Заголовок и основная информация -->
              <div class="mb-4">
                <h2 id="offer-title" class="text-2xl font-bold mb-2"></h2>
                <div class="flex items-center gap-2 mb-2">
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">⭐</span>
                    <span id="offer-rating" class="font-semibold text-sm"></span>
                  </div>
                  <span class="text-slate-400">•</span>
                  <span id="offer-company" class="text-slate-600 text-sm"></span>
                </div>
                <p id="offer-description" class="text-slate-600 mb-4"></p>
              </div>
              
              <!-- Цена и даты -->
              <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4">
                <div class="mb-2">
                  <span id="offer-price" class="text-3xl font-bold text-primary"></span>
                </div>
                <div class="flex items-center gap-4 text-sm text-slate-600">
                  <div class="flex items-center gap-1">
                    <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
                    </svg>
                    <span id="offer-start-date"></span>
                  </div>
                  <span>—</span>
                  <div class="flex items-center gap-1">
                    <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
                    </svg>
                    <span id="offer-end-date"></span>
                  </div>
                </div>
              </div>
              
              <!-- Местоположение -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <h3 class="font-semibold mb-2 flex items-center gap-2">
                  <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,4A5,5 0 0,1 17,9C17,10.5 16.5,12 12,18.71C7.5,12 7,10.5 7,9A5,5 0 0,1 12,4Z"/>
                  </svg>
                  Местоположение
                </h3>
                <p id="offer-location" class="text-slate-600"></p>
              </div>
              
              <!-- Условия -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <h3 class="font-semibold mb-2 flex items-center gap-2">
                  <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Условия участия
                </h3>
                <div id="offer-requirements" class="text-slate-600"></div>
              </div>
              
              <!-- Теги -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <h3 class="font-semibold mb-2 flex items-center gap-2">
                  <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.77,14.05 22,13.55 22,13C22,12.45 21.77,11.95 21.41,11.58Z"/>
                  </svg>
                  Теги
                </h3>
                <div id="offer-tags" class="flex flex-wrap gap-2"></div>
              </div>
              
              
              <!-- Кнопки действий -->
              <div class="space-y-3">
                <button id="make-report" class="hidden w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                  Отчитаться
                </button>
                <div>
                  <button id="apply-btn" class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Участвовать
                  </button>
                  <p class="text-xs text-slate-500 text-center mt-2">
                    Заказчик может рассматривать вашу заявку в течение некоторого времени
                  </p>
                </div>
                <button id="add-to-favorites-btn" class="w-full bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors">
                  Добавить в избранное
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Загружаем данные предложения
  await loadOffer(page, offerId);

  // Настраиваем обработчики событий
  setupEventHandlers(page, offerId);

  return page;
}

// Функция загрузки предложения
async function loadOffer(page: HTMLElement, offerId: string) {
  const loadingState = page.querySelector('#loading-state') as HTMLElement;
  const errorState = page.querySelector('#error-state') as HTMLElement;
  const offerContent = page.querySelector('#offer-content') as HTMLElement;

  try {
    // Показываем состояние загрузки
    showState(loadingState, [errorState, offerContent]);

    // Загружаем предложение из API
    const offer = await apiService.getOfferById(offerId);

    if (!offer) {
      throw new Error('Предложение не найдено');
    }

    // Скрываем состояние загрузки
    hideState(loadingState);

    // Отображаем данные предложения
    renderOffer(offer, page);
    
    // Показываем контент перед проверкой статусов
    showState(offerContent, [errorState]);
    
    // Проверяем статус избранного
    await checkAndSetFavoriteStatus(offerId, page);
    
    // Проверяем наличие заявки на это предложение
    await checkAndSetApplyStatus(offerId, page);

  } catch (error) {
    console.error('Ошибка загрузки предложения:', error);
    
    // Скрываем состояние загрузки
    hideState(loadingState);
    
    // Показываем состояние ошибки
    showState(errorState, [offerContent]);
  }
}

// Функция отображения данных предложения
function renderOffer(offer: Offer, page: HTMLElement) {
  // Основная информация
  const titleEl = page.querySelector('#offer-title') as HTMLElement;
  const descriptionEl = page.querySelector('#offer-description') as HTMLElement;
  const priceEl = page.querySelector('#offer-price') as HTMLElement;
  const ratingEl = page.querySelector('#offer-rating') as HTMLElement;
  const companyEl = page.querySelector('#offer-company') as HTMLElement;
  const locationEl = page.querySelector('#offer-location') as HTMLElement;
  const requirementsEl = page.querySelector('#offer-requirements') as HTMLElement;
  const tagsEl = page.querySelector('#offer-tags') as HTMLElement;
  
  // Изображение
  // const imageContainer = page.querySelector('#offer-image-container') as HTMLElement;
  // const imagePlaceholder = page.querySelector('#offer-image-placeholder') as HTMLElement;
  // const imageEl = page.querySelector('#offer-image') as HTMLImageElement;
  
  // Даты
  const startDateEl = page.querySelector('#offer-start-date') as HTMLElement;
  const endDateEl = page.querySelector('#offer-end-date') as HTMLElement;

  // Заполняем основную информацию
  if (titleEl) titleEl.textContent = offer.title || 'Название не указано';
  if (descriptionEl) descriptionEl.textContent = offer.description || 'Описание не указано';
  if (priceEl) priceEl.textContent = offer.price ? `${parseFloat(offer.price).toLocaleString()} ₽` : 'Цена не указана';
  if (ratingEl) ratingEl.textContent = offer.numeric_info ? offer.numeric_info.toString() : '0';
  if (companyEl) companyEl.textContent = offer.employer_company || 'Компания не указана';
  if (locationEl) locationEl.textContent = offer.location || 'Местоположение не указано';
  
  // Изображение
  // if (offer.image_id === null) {
  //   // Скрываем весь контейнер изображения если image_id = null
  //   if (imageContainer) {
  //     imageContainer.classList.add('hidden');
  //   }
  // } else {
  //   // Показываем контейнер изображения
  //   if (imageContainer) {
  //     imageContainer.classList.remove('hidden');
  //   }
  //   
  //   if (offer.image_url) {
  //     // Показываем изображение
  //     if (imageEl) {
  //       imageEl.src = offer.image_url;
  //       imageEl.alt = offer.image_alt_text || offer.title;
  //       imageEl.classList.remove('hidden');
  //     }
  //     if (imagePlaceholder) {
  //       imagePlaceholder.classList.add('hidden');
  //     }
  //   } else {
  //     // Показываем плейсхолдер
  //     if (imageEl) {
  //       imageEl.classList.add('hidden');
  //     }
  //     if (imagePlaceholder) {
  //       imagePlaceholder.classList.remove('hidden');
  //     }
  //   }
  // }
  
  
  // Даты
  if (startDateEl) {
    startDateEl.textContent = offer.start_date ? new Date(offer.start_date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'Не указано';
  }
  
  if (endDateEl) {
    endDateEl.textContent = offer.end_date ? new Date(offer.end_date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'Не указано';
  }
  
  
  // Условия
  if (requirementsEl) {
    if (offer.requirements && offer.requirements.trim()) {
      requirementsEl.innerHTML = offer.requirements
        .split('\n')
        .filter(req => req.trim())
        .map(req => `<div class="flex items-start gap-2 mb-2">
          <span class="text-primary mt-1">•</span>
          <span>${req.trim()}</span>
        </div>`)
        .join('');
    } else {
      requirementsEl.innerHTML = '<p class="text-slate-500 italic">Условия не указаны</p>';
    }
  }
  
  // Теги
  if (tagsEl) {
    if (offer.tags && offer.tags.trim()) {
      tagsEl.innerHTML = offer.tags
        .split(',')
        .filter(tag => tag.trim())
        .map(tag => `<span class="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">${tag.trim()}</span>`)
        .join('');
    } else {
      tagsEl.innerHTML = '<p class="text-slate-500 italic">Теги не указаны</p>';
    }
  }
  
}

// Функции управления состояниями
function showState(element: HTMLElement, hideElements: HTMLElement[]) {
  element.classList.remove('hidden');
  hideElements.forEach(el => el.classList.add('hidden'));
}

function hideState(element: HTMLElement) {
  element.classList.add('hidden');
}

function setupEventHandlers(page: HTMLElement, offerId: string) {
  // Кнопка "Назад"
  const backBtn = page.querySelector('#back-btn');
  backBtn?.addEventListener('click', () => {
    window.history.back();
  });

  // Обработчик кнопки повтора
  const retryBtn = page.querySelector('#retry-btn');
  retryBtn?.addEventListener('click', async () => {
    await loadOffer(page, offerId);
  });

  // Обработчик кнопки "Участвовать" / "Отказаться"
  const applyBtn = page.querySelector('#apply-btn') as HTMLButtonElement;
  applyBtn?.addEventListener('click', () => {
    const buttonText = applyBtn.textContent?.trim();
    if (buttonText === 'Отказаться') {
      cancelApply(offerId, applyBtn);
    } else {
      applyForOffer(offerId, applyBtn);
    }
  });

  const makeReportBtn = page.querySelector('#make-report') as HTMLButtonElement | null;
  makeReportBtn?.addEventListener('click', () => {
    openReportModal();
  });

  // Обработчик кнопки "Добавить в избранное" будет установлен в checkAndSetFavoriteStatus
}

// Функция проверки и установки статуса избранного
async function checkAndSetFavoriteStatus(offerId: string, page: HTMLElement) {
  try {
    const favoriteStatus = await apiService.checkFavoriteStatus(offerId);
    const addToFavoritesBtn = page.querySelector('#add-to-favorites-btn') as HTMLButtonElement;
    
    if (addToFavoritesBtn && favoriteStatus.data.is_favorite) {
      // Предложение уже в избранном - устанавливаем красное состояние
      setButtonToRemoveState(addToFavoritesBtn, offerId);
    } else if (addToFavoritesBtn) {
      // Предложение не в избранном - устанавливаем серое состояние
      setButtonToAddState(addToFavoritesBtn, offerId);
    }
  } catch (error) {
    console.error('Ошибка проверки статуса избранного:', error);
    // В случае ошибки устанавливаем состояние по умолчанию (добавить)
    const addToFavoritesBtn = page.querySelector('#add-to-favorites-btn') as HTMLButtonElement;
    if (addToFavoritesBtn) {
      setButtonToAddState(addToFavoritesBtn, offerId);
    }
  }
}

// Функция проверки и установки статуса заявки
async function checkAndSetApplyStatus(offerId: string, page: HTMLElement) {
  try {
    console.log('Проверка статуса заявки для offerId:', offerId);
    const application = await apiService.getApplyByOfferId(offerId);
    console.log('Результат проверки заявки:', application);
    
    // Ждем немного, чтобы убедиться, что DOM готов
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const applyBtn = page.querySelector('#apply-btn') as HTMLButtonElement;
    console.log('Кнопка найдена:', applyBtn);
    console.log('Текущий текст кнопки:', applyBtn?.textContent);
    
    const makeReportBtn = page.querySelector('#make-report') as HTMLButtonElement | null;
    
    if (!applyBtn) {
      console.error('Кнопка #apply-btn не найдена в DOM!');
      return;
    }
    
    if (application) {
      // Заявка существует - меняем текст кнопки на "Отказаться"
      console.log('Заявка найдена, меняем текст кнопки на "Отказаться"');
      applyBtn.textContent = 'Отказаться';
      console.log('Новый текст кнопки:', applyBtn.textContent);
      
      // Показать кнопку "Отчитаться" при статусе pending
      if (makeReportBtn) {
        if (application.status === 'pending') {
          makeReportBtn.classList.remove('hidden');
        } else {
          makeReportBtn.classList.add('hidden');
        }
      }
    } else {
      console.log('Заявка не найдена, оставляем текст "Участвовать"');
      // Скрываем кнопку "Отчитаться", если заявки нет
      makeReportBtn?.classList.add('hidden');
    }
  } catch (error) {
    console.error('Ошибка проверки статуса заявки:', error);
    // В случае ошибки оставляем кнопку в исходном состоянии
  }
}

// Функция установки кнопки в состояние "Добавить в избранное"
function setButtonToAddState(button: HTMLButtonElement, offerId: string) {
  button.textContent = 'Добавить в избранное';
  button.classList.remove('bg-red-500', 'text-white', 'hover:bg-red-600');
  button.classList.add('bg-slate-200', 'text-slate-700', 'hover:bg-slate-300');
  
  // Удаляем существующий обработчик, если есть
  const oldHandler = buttonHandlers.get(button);
  if (oldHandler) {
    button.removeEventListener('click', oldHandler);
  }
  
  // Создаем новый обработчик и сохраняем его
  const newHandler = () => addToFavorites(offerId, button);
  buttonHandlers.set(button, newHandler);
  button.addEventListener('click', newHandler);
}

// Функция установки кнопки в состояние "Удалить из избранного"
function setButtonToRemoveState(button: HTMLButtonElement, offerId: string) {
  console.log('setButtonToRemoveState вызвана для offerId:', offerId);
  button.textContent = 'Удалить из избранного';
  button.classList.remove('bg-slate-200', 'text-slate-700', 'hover:bg-slate-300');
  button.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
  
  // Удаляем существующий обработчик, если есть
  const oldHandler = buttonHandlers.get(button);
  if (oldHandler) {
    button.removeEventListener('click', oldHandler);
  }
  
  // Создаем новый обработчик и сохраняем его
  const newHandler = () => removeFromFavorites(offerId, button);
  buttonHandlers.set(button, newHandler);
  button.addEventListener('click', newHandler);
  console.log('Обработчик removeFromFavorites установлен');
}

// Функция добавления в избранное
async function addToFavorites(offerId: string, button: HTMLElement) {
  const buttonEl = button as HTMLButtonElement;
  
  try {
    // Показываем состояние загрузки на кнопке
    buttonEl.textContent = 'Добавление...';
    buttonEl.disabled = true;

    const result = await apiService.addToFavorites(offerId);
    
    // Проверяем статус код
    if (result.statusCode === 200 || result.statusCode === 201) {
      // Успешно добавлено - меняем кнопку на красную с текстом "Удалить из избранного"
      buttonEl.disabled = false;
      setButtonToRemoveState(buttonEl, offerId);
    }
    
  } catch (error) {
    console.error('Ошибка добавления в избранное:', error);
    
    // Показываем ошибку
    buttonEl.textContent = 'Ошибка добавления';
    buttonEl.classList.remove('bg-slate-200', 'text-slate-700');
    buttonEl.classList.add('bg-red-500', 'text-white');
    
    // Через 2 секунды возвращаем исходное состояние
    setTimeout(() => {
      buttonEl.disabled = false;
      setButtonToAddState(buttonEl, offerId);
    }, 2000);
  }
}

// Функция удаления из избранного
async function removeFromFavorites(offerId: string, button: HTMLElement) {
  console.log('removeFromFavorites вызвана для offerId:', offerId);
  const buttonEl = button as HTMLButtonElement;
  
  try {
    // Показываем состояние загрузки на кнопке
    buttonEl.textContent = 'Удаление...';
    buttonEl.disabled = true;

    const result = await apiService.removeFromFavorites(offerId);
    
    // Проверяем статус код
    if (result.statusCode === 200 || result.statusCode === 201) {
      // Успешно удалено - возвращаем кнопку в исходное состояние
      buttonEl.disabled = false;
      setButtonToAddState(buttonEl, offerId);
    }
    
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error);
    
    // Показываем ошибку
    buttonEl.textContent = 'Ошибка удаления';
    buttonEl.classList.remove('bg-red-500', 'text-white');
    buttonEl.classList.add('bg-red-600', 'text-white');
    
    // Через 2 секунды возвращаем состояние "Удалить из избранного"
    setTimeout(() => {
      buttonEl.disabled = false;
      setButtonToRemoveState(buttonEl, offerId);
    }, 2000);
  }
}

// Функция подачи заявки на участие
async function applyForOffer(offerId: string, button: HTMLButtonElement) {
  try {
    button.disabled = true;

    await apiService.apply(offerId);
    
    // Успешно подана заявка - меняем на "Отказаться"
    button.textContent = 'Отказаться';
    button.disabled = false;
    
  } catch (error: any) {
    console.error('Ошибка подачи заявки:', error);
    // В случае ошибки оставляем кнопку в состоянии "Участвовать"
    button.textContent = 'Участвовать';
    button.disabled = false;
  }
}

// Функция отказа от заявки
async function cancelApply(offerId: string, button: HTMLButtonElement) {
  try {
    button.disabled = true;

    const success = await apiService.cancelApply(offerId);
    
    if (success) {
      // Успешно отменена заявка - меняем текст кнопки на "Участвовать"
      button.textContent = 'Участвовать';
      button.disabled = false;
    } else {
      // Ошибка - оставляем в состоянии "Отказаться"
      button.textContent = 'Отказаться';
      button.disabled = false;
    }
    
  } catch (error: any) {
    console.error('Ошибка отказа от заявки:', error);
    
    // В случае ошибки оставляем в состоянии "Отказаться"
    button.textContent = 'Отказаться';
    button.disabled = false;
  }
}

function openReportModal() {
  if (document.getElementById('report-modal')) {
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'report-modal';
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
      <p class="text-slate-700 mb-6 leading-relaxed">
        Переходя дальше я соглашаюсь отчитаться о задаче и передать отчёт на проверку.
      </p>
      <div class="flex flex-col gap-3">
        <button id="report-continue-btn" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Перейти
        </button>
        <button id="report-back-btn" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          Назад
        </button>
      </div>
    </div>
  `;

  const removeModal = () => modal.remove();

  const backBtn = modal.querySelector('#report-back-btn') as HTMLButtonElement | null;
  backBtn?.addEventListener('click', removeModal);

  const continueBtn = modal.querySelector('#report-continue-btn') as HTMLButtonElement | null;
  continueBtn?.addEventListener('click', () => {
    window.open(REPORT_FORM_URL, '_blank', 'noopener');
    removeModal();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      removeModal();
    }
  });

  document.body.appendChild(modal);
}
