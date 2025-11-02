// Страница входа в аккаунт

import { router } from '../router/index.js';

export async function createLoginPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'login-page';

  page.innerHTML = `
    <div class="relative flex h-screen w-full flex-col overflow-y-auto bg-background-light">
      <main class="flex w-full flex-col items-center justify-center grow p-4">
        <div class="flex w-full max-w-sm flex-col items-center gap-6">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <span class="material-symbols-outlined text-4xl">
              shopping_bag
            </span>
          </div>
          
          <h1 class="text-slate-900 tracking-tight text-[32px] font-bold leading-tight text-center">Вход в аккаунт</h1>
          
          <div class="flex w-full flex-col items-stretch gap-4">
            <div class="flex flex-col">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-slate-700 text-base font-medium leading-normal pb-2">Логин</p>
                <input 
                  id="login-email" 
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white h-14 placeholder:text-slate-400 p-[15px] text-base font-normal leading-normal" 
                  placeholder="example@email.com" 
                  type="email" 
                  required
                  value=""
                />
              </label>
            </div>
            
            <div class="flex flex-col">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-slate-700 text-base font-medium leading-normal pb-2">Пароль</p>
                <div class="relative flex w-full flex-1 items-stretch">
                  <input 
                    id="login-password" 
                    class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white h-14 placeholder:text-slate-400 p-[15px] pr-12 text-base font-normal leading-normal" 
                    placeholder="Введите ваш пароль" 
                    type="password" 
                    required
                    value=""
                  />
                  <button 
                    id="toggle-password-visibility" 
                    class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-primary focus:outline-none" 
                    type="button"
                  >
                    <span class="material-symbols-outlined text-2xl">
                      visibility
                    </span>
                  </button>
                </div>
              </label>
            </div>
            
            <p 
              id="forgot-password-link" 
              class="text-primary text-sm font-medium leading-normal text-right pt-1 underline cursor-pointer hover:text-primary/80"
            >
              Забыли пароль?
            </p>
          </div>
          
          <button 
            id="login-button" 
            class="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Войти
          </button>
          
          <div class="text-center">
            <p class="text-sm text-slate-600">
              Впервые у нас?
              <a 
                id="register-link" 
                class="font-semibold text-primary underline-offset-2 hover:underline cursor-pointer" 
                href="#"
              >
                Зарегистрироваться
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  `;

  // Настраиваем обработчики событий
  setupEventHandlers(page);

  return page;
}

function setupEventHandlers(page: HTMLElement) {
  // Создание и показ тултипа с ошибкой
  const showPasswordTooltip = (input: HTMLInputElement, message: string) => {
    // Удаляем существующий тултип, если есть
    const existingTooltip = input.parentElement?.querySelector('.password-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Создаем тултип
    const tooltip = document.createElement('div');
    tooltip.className = 'password-tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: absolute;
      bottom: -45px;
      left: 0;
      right: 0;
      background-color: #ef4444;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: tooltipFadeIn 0.2s ease-out;
    `;

    // Добавляем анимацию появления
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    if (!document.querySelector('#password-tooltip-style')) {
      style.id = 'password-tooltip-style';
      document.head.appendChild(style);
    }

    // Вставляем тултип после поля ввода
    const parent = input.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(tooltip);

      // Удаляем тултип через 3 секунды
      setTimeout(() => {
        tooltip.style.animation = 'tooltipFadeIn 0.2s ease-out reverse';
        setTimeout(() => {
          tooltip.remove();
        }, 200);
      }, 3000);
    }
  };

  // Функция валидации пароля (только латиница и безопасные специальные символы)
  const setupPasswordValidation = (input: HTMLInputElement) => {
    // Разрешенные символы: латиница (a-z, A-Z), цифры (0-9), безопасные специальные символы
    // Безопасные специальные символы: !@#$%^&*()-_=+
    const allowedCharsRegex = /^[a-zA-Z0-9!@#$%^&*()\-_=+]*$/;
    const allowedMessage = 'Разрешены только: латинские буквы (a-z, A-Z), цифры (0-9) и символы !@#$%^&*()-_=+';
    
    input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      
      // Фильтруем только разрешенные символы
      const filtered = value.split('').filter(char => allowedCharsRegex.test(char)).join('');
      
      if (value !== filtered) {
        input.value = filtered;
        // Находим первый недопустимый символ для показа ошибки
        const invalidChar = value.split('').find(char => !allowedCharsRegex.test(char));
        if (invalidChar) {
          showPasswordTooltip(input, allowedMessage);
        }
      }
    });

    input.addEventListener('keypress', (e) => {
      const char = e.key;
      // Разрешаем латиницу, цифры, специальные символы и служебные клавиши
      if (!allowedCharsRegex.test(char) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(char)) {
        e.preventDefault();
        showPasswordTooltip(input, allowedMessage);
      }
    });

    input.addEventListener('paste', (e) => {
      const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
      const filtered = paste.split('').filter((char: string) => allowedCharsRegex.test(char)).join('');
      
      if (paste !== filtered) {
        e.preventDefault();
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = input.value;
        input.value = currentValue.substring(0, start) + filtered + currentValue.substring(end);
        input.setSelectionRange(start + filtered.length, start + filtered.length);
        showPasswordTooltip(input, allowedMessage);
      }
    });
  };

  // Переключение видимости пароля
  const togglePasswordBtn = page.querySelector('#toggle-password-visibility') as HTMLElement;
  const passwordInput = page.querySelector('#login-password') as HTMLInputElement;
  const visibilityIcon = togglePasswordBtn?.querySelector('.material-symbols-outlined');

  togglePasswordBtn?.addEventListener('click', () => {
    if (passwordInput) {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      
      if (visibilityIcon) {
        visibilityIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
      }
    }
  });

  // Настраиваем валидацию для поля пароля
  if (passwordInput) setupPasswordValidation(passwordInput);

  // Функция валидации email (только допустимые символы для email)
  const setupEmailValidation = (input: HTMLInputElement) => {
    // Разрешенные символы для email: латиница, цифры, точки, дефисы, подчеркивания, @
    // Email может содержать: буквы латиницы, цифры, точки, дефисы, подчеркивания, знак @
    const allowedCharsRegex = /^[a-zA-Z0-9._@-]*$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const emailMessage = 'Email должен содержать только латинские буквы, цифры, точки, дефисы, подчеркивания и знак @. Формат: example@email.com';
    
    input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      
      // Фильтруем только разрешенные символы
      const filtered = value.split('').filter(char => allowedCharsRegex.test(char)).join('');
      
      if (value !== filtered) {
        input.value = filtered;
        showEmailTooltip(input, emailMessage);
      }

      // Визуальная валидация email формата
      if (filtered && !emailRegex.test(filtered)) {
        input.classList.add('border-red-300');
        input.classList.remove('border-slate-300');
      } else {
        input.classList.remove('border-red-300');
        input.classList.add('border-slate-300');
      }
    });

    input.addEventListener('keypress', (e) => {
      const char = e.key;
      // Разрешаем латиницу, цифры, точки, дефисы, подчеркивания, @ и служебные клавиши
      if (!allowedCharsRegex.test(char) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(char)) {
        e.preventDefault();
        showEmailTooltip(input, emailMessage);
      }
    });

    input.addEventListener('blur', () => {
      const value = input.value.trim();
      if (value && !emailRegex.test(value)) {
        showEmailTooltip(input, 'Неверный формат email. Пример: example@email.com');
      }
    });

    input.addEventListener('paste', (e) => {
      const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
      const filtered = paste.split('').filter((char: string) => allowedCharsRegex.test(char)).join('');
      
      if (paste !== filtered) {
        e.preventDefault();
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = input.value;
        input.value = currentValue.substring(0, start) + filtered + currentValue.substring(end);
        input.setSelectionRange(start + filtered.length, start + filtered.length);
        showEmailTooltip(input, emailMessage);
      }
    });
  };

  // Создание и показ тултипа для email
  const showEmailTooltip = (input: HTMLInputElement, message: string) => {
    // Удаляем существующий тултип, если есть
    const labelContainer = input.closest('label')?.parentElement;
    const existingTooltip = labelContainer?.querySelector('.email-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Создаем тултип
    const tooltip = document.createElement('div');
    tooltip.className = 'email-tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: absolute;
      bottom: -45px;
      left: 0;
      right: 0;
      background-color: #ef4444;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: tooltipFadeIn 0.2s ease-out;
    `;

    // Вставляем тултип в контейнер поля (div.flex.flex-col)
    const container = input.closest('label')?.parentElement;
    if (container) {
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      container.appendChild(tooltip);

      // Удаляем тултип через 3 секунды
      setTimeout(() => {
        tooltip.style.animation = 'tooltipFadeIn 0.2s ease-out reverse';
        setTimeout(() => {
          tooltip.remove();
        }, 200);
      }, 3000);
    }
  };

  // Обработчик формы входа
  const loginButton = page.querySelector('#login-button') as HTMLElement;
  const emailInput = page.querySelector('#login-email') as HTMLInputElement;
  const passwordInputHandler = page.querySelector('#login-password') as HTMLInputElement;

  // Настраиваем валидацию для поля email
  if (emailInput) setupEmailValidation(emailInput);

  // Функция для добавления красной обводки незаполненным полям
  const markFieldAsInvalid = (input: HTMLInputElement) => {
    input.classList.remove('border-slate-300');
    input.classList.add('border-red-500', 'border-2');
    input.style.borderColor = '#ef4444'; // Явно устанавливаем красный цвет
    
    // Убираем красную обводку при вводе
    const removeInvalidOnInput = () => {
      if (input.value.trim()) {
        input.classList.remove('border-red-500', 'border-2');
        input.classList.add('border-slate-300');
        input.style.borderColor = '';
        input.removeEventListener('input', removeInvalidOnInput);
      }
    };
    input.addEventListener('input', removeInvalidOnInput);
  };

  // Функция для сброса красной обводки
  const resetFieldValidation = (input: HTMLInputElement) => {
    input.classList.remove('border-red-500', 'border-2');
    input.classList.add('border-slate-300');
    input.style.borderColor = '';
  };

  const handleLogin = () => {
    let isValid = true;
    
    // Сбрасываем предыдущие ошибки
    if (emailInput) resetFieldValidation(emailInput);
    if (passwordInputHandler) resetFieldValidation(passwordInputHandler);

    const email = emailInput?.value.trim() || '';
    const password = passwordInputHandler?.value || '';

    // Валидация email
    if (!email) {
      if (emailInput) markFieldAsInvalid(emailInput);
      isValid = false;
    } else {
      // Валидация формата email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (emailInput) markFieldAsInvalid(emailInput);
        isValid = false;
      }
    }

    // Валидация пароля
    if (!password) {
      if (passwordInputHandler) markFieldAsInvalid(passwordInputHandler);
      isValid = false;
    }

    // Если есть ошибки, не продолжаем
    if (!isValid) {
      // Фокусируемся на первом невалидном поле
      if (!email && emailInput) {
        emailInput.focus();
      } else if (!password && passwordInputHandler) {
        passwordInputHandler.focus();
      }
      return;
    }

    // Здесь должна быть логика авторизации
    console.log('Логин:', email);
    console.log('Пароль:', password);

    // После успешного входа можно перейти на главную страницу
    // window.location.hash = '#/';
  };

  loginButton?.addEventListener('click', handleLogin);

  // Обработка Enter в полях ввода
  emailInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInputHandler?.focus();
    }
  });

  passwordInputHandler?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });

  // Обработчик "Забыли пароль?"
  const forgotPasswordLink = page.querySelector('#forgot-password-link') as HTMLElement;
  forgotPasswordLink?.addEventListener('click', () => {
    console.log('Восстановление пароля');
    // Здесь можно добавить переход на страницу восстановления пароля
    // window.location.hash = '#/forgot-password';
    alert('Функция восстановления пароля будет реализована позже');
  });

  // Обработчик "Зарегистрироваться" - переход на страницу регистрации
  const registerLink = page.querySelector('#register-link') as HTMLElement;
  registerLink?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/signup');
  });
}

