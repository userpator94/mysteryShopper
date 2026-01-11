// Страница отчёта о выполнении задания

import { apiService } from '../services/api.js';
import { getUserId } from '../utils/auth.js';
import type { Offer } from '../types/index.js';

const REPORT_FORM_URL = 'https://forms.yandex.ru/cloud/692847d4d046889383c04c34';

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
            <h1 class="text-2xl font-bold">Отчёт</h1>
          </div>
        </header>
        
        <main class="pb-28">
          <div id="loading-state" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span class="ml-2 text-slate-600">Загрузка информации...</span>
          </div>
          
          <div id="error-state" class="hidden text-center py-8 px-4">
            <div class="text-red-500 mb-2">⚠️</div>
            <p class="text-slate-600 mb-4">Не удалось загрузить информацию о предложении</p>
            <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              Попробовать снова
            </button>
          </div>
          
          <div id="report-content" class="hidden">
            <div class="px-4 py-4">
              <!-- Информация о предложении -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <h2 id="offer-title" class="text-xl font-bold mb-2"></h2>
                <p id="offer-description" class="text-slate-600 text-sm mb-3"></p>
                <div class="flex items-center justify-between">
                  <span id="offer-price" class="text-2xl font-bold text-primary"></span>
                  <span id="offer-company" class="text-slate-600 text-sm"></span>
                </div>
              </div>
              
              <!-- Инструкции по отчёту -->
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <h3 class="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                  <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10A1,1 0 0,1 13,11V13A1,1 0 0,1 12,14A1,1 0 0,1 11,13V11A1,1 0 0,1 12,10Z"/>
                  </svg>
                  Инструкция
                </h3>
                <p class="text-blue-800 text-sm leading-relaxed">
                  Пожалуйста, заполните форму отчёта о выполнении задания. Убедитесь, что вы предоставили всю необходимую информацию и приложили все требуемые материалы.
                </p>
              </div>
              
              <!-- Форма отчёта -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <h3 class="font-semibold mb-4">Форма отчёта</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Оценка (от 1 до 5)
                    </label>
                    <select 
                      id="report-rating" 
                      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="5">5 - Отлично</option>
                      <option value="4">4 - Хорошо</option>
                      <option value="3">3 - Удовлетворительно</option>
                      <option value="2">2 - Плохо</option>
                      <option value="1">1 - Очень плохо</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Описание выполненной работы
                    </label>
                    <textarea 
                      id="report-description" 
                      class="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="Опишите, что вы сделали, какие задачи выполнили..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Фотографии (если требуются)
                    </label>
                    <div id="upload-section" class="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center">
                      <div id="upload-placeholder">
                        <svg class="mx-auto h-8 w-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p class="text-xs text-slate-600 mb-2">Нажмите для загрузки фотографий</p>
                        <input 
                          type="file" 
                          id="report-photos" 
                          class="hidden" 
                          accept="image/*" 
                          multiple
                        />
                        <button 
                          id="upload-photos-btn" 
                          class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs"
                        >
                          Выбрать файлы
                        </button>
                      </div>
                      <p id="files-limit-message" class="mt-1.5 text-xs text-slate-500 hidden"></p>
                      <div id="photos-preview" class="mt-2 space-y-2 text-left"></div>
                      <div id="add-more-files" class="hidden mt-2">
                        <button 
                          id="add-more-files-btn" 
                          class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs"
                        >
                          Добавить ещё файлы
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Кнопки действий -->
              <div class="space-y-3">
                <button 
                  id="submit-report-btn" 
                  class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Отправить отчёт
                </button>
                <button 
                  id="open-form-btn" 
                  class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Открыть форму Yandex
                </button>
                <button 
                  id="cancel-btn" 
                  class="w-full bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Загружаем данные предложения
  await loadOfferInfo(page, offerId);

  // Настраиваем обработчики событий
  setupEventHandlers(page, offerId);

  return page;
}

// Функция загрузки информации о предложении
async function loadOfferInfo(page: HTMLElement, offerId: string) {
  const loadingState = page.querySelector('#loading-state') as HTMLElement;
  const errorState = page.querySelector('#error-state') as HTMLElement;
  const reportContent = page.querySelector('#report-content') as HTMLElement;

  try {
    // Показываем состояние загрузки
    showState(loadingState, [errorState, reportContent]);

    // Загружаем предложение из API
    const offer = await apiService.getOfferById(offerId);

    if (!offer) {
      throw new Error('Предложение не найдено');
    }

    // Скрываем состояние загрузки
    hideState(loadingState);

    // Отображаем данные предложения
    renderOfferInfo(offer, page);
    
    // Показываем контент
    showState(reportContent, [errorState]);

  } catch (error) {
    console.error('Ошибка загрузки предложения:', error);
    
    // Скрываем состояние загрузки
    hideState(loadingState);
    
    // Показываем состояние ошибки
    showState(errorState, [reportContent]);
  }
}

// Функция отображения информации о предложении
function renderOfferInfo(offer: Offer, page: HTMLElement) {
  const titleEl = page.querySelector('#offer-title') as HTMLElement;
  const descriptionEl = page.querySelector('#offer-description') as HTMLElement;
  const priceEl = page.querySelector('#offer-price') as HTMLElement;
  const companyEl = page.querySelector('#offer-company') as HTMLElement;

  if (titleEl) titleEl.textContent = offer.title || 'Название не указано';
  if (descriptionEl) descriptionEl.textContent = offer.description || 'Описание не указано';
  if (priceEl) priceEl.textContent = offer.price ? `${parseFloat(offer.price).toLocaleString()} ₽` : 'Цена не указана';
  if (companyEl) companyEl.textContent = offer.employer_company || 'Компания не указана';
}

// Функции управления состояниями
function showState(element: HTMLElement, hideElements: HTMLElement[]) {
  element.classList.remove('hidden');
  hideElements.forEach(el => el.classList.add('hidden'));
}

function hideState(element: HTMLElement) {
  element.classList.add('hidden');
}

// Максимальное количество файлов
const MAX_FILES = 10;

// Хранилище загруженных файлов
interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
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
    await loadOfferInfo(page, offerId);
  });

  // Массив для хранения загруженных файлов
  const uploadedFiles: FileWithPreview[] = [];

  // Обработчик загрузки фотографий
  const uploadPhotosBtn = page.querySelector('#upload-photos-btn');
  const photosInput = page.querySelector('#report-photos') as HTMLInputElement;
  const photosPreview = page.querySelector('#photos-preview') as HTMLElement;
  const filesLimitMessage = page.querySelector('#files-limit-message') as HTMLElement;
  const uploadPlaceholder = page.querySelector('#upload-placeholder') as HTMLElement;
  const addMoreFiles = page.querySelector('#add-more-files') as HTMLElement;
  const addMoreFilesBtn = page.querySelector('#add-more-files-btn') as HTMLButtonElement;

  // Функция обновления отображения файлов
  const updateFilesDisplay = () => {
    if (!photosPreview) return;

    photosPreview.innerHTML = '';
    
    // Показываем или скрываем плейсхолдер в зависимости от наличия файлов
    if (uploadPlaceholder) {
      if (uploadedFiles.length > 0) {
        uploadPlaceholder.classList.add('hidden');
      } else {
        uploadPlaceholder.classList.remove('hidden');
      }
    }
    
    // Показываем или скрываем кнопку "Добавить ещё файлы"
    if (addMoreFiles) {
      if (uploadedFiles.length > 0 && uploadedFiles.length < MAX_FILES) {
        addMoreFiles.classList.remove('hidden');
      } else {
        addMoreFiles.classList.add('hidden');
      }
    }
    
    uploadedFiles.forEach((fileData) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200';
      fileItem.dataset.fileId = fileData.id;
      
      // Миниатюра изображения
      const thumbnail = document.createElement('img');
      thumbnail.src = fileData.preview;
      thumbnail.className = 'w-12 h-12 object-cover rounded-lg flex-shrink-0';
      thumbnail.alt = fileData.file.name;
      
      // Название файла
      const fileName = document.createElement('div');
      fileName.className = 'flex-1 min-w-0';
      const fileNameText = document.createElement('p');
      fileNameText.className = 'text-xs font-medium text-slate-700 truncate';
      fileNameText.textContent = fileData.file.name;
      fileName.appendChild(fileNameText);
      
      // Размер файла
      const fileSize = document.createElement('p');
      fileSize.className = 'text-xs text-slate-500';
      const sizeInMB = (fileData.file.size / (1024 * 1024)).toFixed(2);
      fileSize.textContent = `${sizeInMB} МБ`;
      fileName.appendChild(fileSize);
      
      // Кнопка удаления
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors';
      deleteBtn.innerHTML = `
        <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => {
        removeFile(fileData.id);
      });
      
      fileItem.appendChild(thumbnail);
      fileItem.appendChild(fileName);
      fileItem.appendChild(deleteBtn);
      photosPreview.appendChild(fileItem);
    });

    // Обновляем сообщение о лимите
    if (filesLimitMessage) {
      if (uploadedFiles.length >= MAX_FILES) {
        filesLimitMessage.textContent = `Достигнут лимит файлов (${MAX_FILES})`;
        filesLimitMessage.classList.remove('hidden');
        filesLimitMessage.classList.add('text-orange-600');
      } else if (uploadedFiles.length > 0) {
        filesLimitMessage.textContent = `Загружено файлов: ${uploadedFiles.length}/${MAX_FILES}`;
        filesLimitMessage.classList.remove('hidden', 'text-orange-600');
        filesLimitMessage.classList.add('text-slate-500');
      } else {
        filesLimitMessage.classList.add('hidden');
      }
    }
  };

  // Функция удаления файла
  const removeFile = (fileId: string) => {
    const index = uploadedFiles.findIndex(f => f.id === fileId);
    if (index !== -1) {
      uploadedFiles.splice(index, 1);
      updateFilesDisplay();
      
      // Обновляем input, чтобы можно было загрузить файлы снова
      if (photosInput) {
        photosInput.value = '';
      }
    }
  };

  const handleFileUpload = () => {
    if (uploadedFiles.length >= MAX_FILES) {
      alert(`Можно загрузить не более ${MAX_FILES} файлов`);
      return;
    }
    photosInput?.click();
  };

  uploadPhotosBtn?.addEventListener('click', handleFileUpload);
  
  addMoreFilesBtn?.addEventListener('click', handleFileUpload);

  photosInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0 || !photosPreview) return;

    const remainingSlots = MAX_FILES - uploadedFiles.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`Можно загрузить только ${remainingSlots} файл(ов). Остальные файлы не были добавлены.`);
    }

    filesToAdd.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileData: FileWithPreview = {
            file: file,
            preview: event.target?.result as string,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          uploadedFiles.push(fileData);
          updateFilesDisplay();
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Файл "${file.name}" не является изображением и не будет добавлен.`);
      }
    });
  });

  // Обработчик кнопки "Отправить отчёт"
  const submitBtn = page.querySelector('#submit-report-btn');
  submitBtn?.addEventListener('click', async () => {
    const description = (page.querySelector('#report-description') as HTMLTextAreaElement)?.value;
    const ratingSelect = page.querySelector('#report-rating') as HTMLSelectElement;
    const rating = ratingSelect ? parseInt(ratingSelect.value) : 5;
    
    if (!description || description.trim() === '') {
      alert('Пожалуйста, заполните описание выполненной работы');
      return;
    }
    
    // Получаем user_id
    const userId = getUserId();
    if (!userId) {
      alert('Ошибка: не удалось определить пользователя. Пожалуйста, войдите в систему заново.');
      window.location.href = '/login';
      return;
    }
    
    // Получаем application_id из заявки
    let applicationId: string | null = null;
    try {
      const application = await apiService.getApplyByOfferId(offerId);
      if (application && application.application_id) {
        applicationId = application.application_id;
      } else {
        alert('Ошибка: не найдена заявка для этого предложения. Пожалуйста, сначала подайте заявку.');
        return;
      }
    } catch (error) {
      console.error('Ошибка при получении заявки:', error);
      alert('Ошибка: не удалось получить информацию о заявке. Пожалуйста, попробуйте позже.');
      return;
    }
    
    // Подготавливаем данные для отправки
    const feedback = {
      comment: description.trim(),
    };
    
    // Получаем файлы
    const files = uploadedFiles.map(f => f.file);
    
    // Блокируем кнопку во время отправки
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
    }
    
    try {
      // Отправляем отчёт
      const response = await apiService.submitReport(
        applicationId,
        offerId,
        userId,
        rating,
        feedback,
        files
      );
      
      if (response.success) {
        alert('Отчёт успешно отправлен! Спасибо за выполнение задания.');
        // Возвращаемся назад
        window.history.back();
      } else {
        throw new Error('Неожиданный формат ответа от сервера');
      }
    } catch (error: any) {
      console.error('Ошибка при отправке отчёта:', error);
      const errorMessage = error?.message || 'Произошла ошибка при отправке отчёта. Пожалуйста, попробуйте позже.';
      alert(errorMessage);
    } finally {
      // Разблокируем кнопку
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить отчёт';
      }
    }
  });

  // Обработчик кнопки "Открыть форму Yandex"
  const openFormBtn = page.querySelector('#open-form-btn');
  openFormBtn?.addEventListener('click', () => {
    window.open(REPORT_FORM_URL, '_blank', 'noopener');
  });

  // Обработчик кнопки "Отмена"
  const cancelBtn = page.querySelector('#cancel-btn');
  cancelBtn?.addEventListener('click', () => {
    window.history.back();
  });
}

