// Компонент модального окна для веб-устройств

export function createWebDeviceModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.id = 'web-device-modal';

  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
      <div class="text-center">
        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        
        <h2 class="text-xl font-bold text-gray-900 mb-2">Веб-версия недоступна</h2>
        
        <p class="text-gray-600 mb-6 leading-relaxed">
          Извините, но веб-версия приложения сейчас недоступна. 
          Для корректного отображения и работы воспользуйтесь телефоном или планшетом.
        </p>
        
        <button 
          class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          id="web-modal-ok-btn"
        >
          Понятно
        </button>
      </div>
    </div>
  `;

  // Обработчик закрытия модального окна
  const okBtn = modal.querySelector('#web-modal-ok-btn');
  okBtn?.addEventListener('click', () => {
    modal.remove();
  });

  // Закрытие по клику вне модального окна
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  return modal;
}

export function showWebDeviceModal(): void {
  // Проверяем, не показано ли уже модальное окно
  if (document.getElementById('web-device-modal')) {
    return;
  }

  const modal = createWebDeviceModal();
  document.body.appendChild(modal);
}