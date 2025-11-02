// Страница регистрации

import { router } from '../router/index.js';

export async function createSignUpPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'signup-page';

  page.innerHTML = `
    <div class="relative flex h-screen w-full flex-col overflow-y-auto bg-background-light">
      <main class="flex w-full flex-col items-center justify-center grow p-4">
        <div class="flex w-full max-w-sm flex-col items-center gap-6">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <span class="material-symbols-outlined text-4xl">
              shopping_bag
            </span>
          </div>
          
          <h1 class="text-slate-900 tracking-tight text-[32px] font-bold leading-tight text-center">Регистрация</h1>
          
          <div class="flex w-full flex-col items-stretch gap-4">
            <div class="flex flex-col">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-slate-700 text-base font-medium leading-normal pb-2">Имя</p>
                <input 
                  id="signup-name" 
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white h-14 placeholder:text-slate-400 p-[15px] text-base font-normal leading-normal" 
                  placeholder="Введите ваше имя" 
                  type="text" 
                  required
                  value=""
                />
              </label>
            </div>
            
            <div class="flex flex-col">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-slate-700 text-base font-medium leading-normal pb-2">Фамилия</p>
                <input 
                  id="signup-lastname" 
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white h-14 placeholder:text-slate-400 p-[15px] text-base font-normal leading-normal" 
                  placeholder="Введите вашу фамилию" 
                  type="text" 
                  required
                  value=""
                />
              </label>
            </div>
            
            <div class="flex flex-col">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-slate-700 text-base font-medium leading-normal pb-2">Логин</p>
                <input 
                  id="signup-email" 
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
                <p class="text-slate-700 text-base font-medium leading-normal pb-2">Номер телефона</p>
                <input 
                  id="signup-phone" 
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white h-14 placeholder:text-slate-400 p-[15px] text-base font-normal leading-normal" 
                  placeholder="+7 (999) 999-99-99" 
                  type="tel" 
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
                    id="signup-password" 
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
            
            <div class="flex flex-col">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-slate-700 text-base font-medium leading-normal pb-2">Подтверждение пароля</p>
                <div class="relative flex w-full flex-1 items-stretch">
                  <input 
                    id="signup-confirm-password" 
                    class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white h-14 placeholder:text-slate-400 p-[15px] pr-12 text-base font-normal leading-normal" 
                    placeholder="Повторите пароль" 
                    type="password" 
                    required
                    value=""
                  />
                  <button 
                    id="toggle-confirm-password-visibility" 
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
          </div>
          
          <button 
            id="signup-button" 
            class="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Зарегистрироваться
          </button>
          
          <div class="text-center">
            <p class="text-sm text-slate-600">
              Уже есть аккаунт?
              <a 
                id="login-link" 
                class="font-semibold text-primary underline-offset-2 hover:underline cursor-pointer" 
                href="#"
              >
                Войти
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
  const passwordInput = page.querySelector('#signup-password') as HTMLInputElement;
  const passwordVisibilityIcon = togglePasswordBtn?.querySelector('.material-symbols-outlined');

  togglePasswordBtn?.addEventListener('click', () => {
    if (passwordInput) {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      
      if (passwordVisibilityIcon) {
        passwordVisibilityIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
      }
    }
  });

  // Переключение видимости подтверждения пароля
  const toggleConfirmPasswordBtn = page.querySelector('#toggle-confirm-password-visibility') as HTMLElement;
  const confirmPasswordInput = page.querySelector('#signup-confirm-password') as HTMLInputElement;
  const confirmPasswordVisibilityIcon = toggleConfirmPasswordBtn?.querySelector('.material-symbols-outlined');

  toggleConfirmPasswordBtn?.addEventListener('click', () => {
    if (confirmPasswordInput) {
      const isPassword = confirmPasswordInput.type === 'password';
      confirmPasswordInput.type = isPassword ? 'text' : 'password';
      
      if (confirmPasswordVisibilityIcon) {
        confirmPasswordVisibilityIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
      }
    }
  });

  // Настраиваем валидацию для полей пароля
  if (passwordInput) setupPasswordValidation(passwordInput);
  if (confirmPasswordInput) setupPasswordValidation(confirmPasswordInput);

  // Функция валидации имени и фамилии (только латиница и кириллица)
  const validateName = (name: string): boolean => {
    // Регулярное выражение для латиницы и кириллицы
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s-]+$/;
    return nameRegex.test(name);
  };

  // Обработчик ввода для имени и фамилии (только латиница и кириллица)
  const setupNameValidation = (input: HTMLInputElement) => {
    input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      // Фильтруем только разрешенные символы
      const filtered = value.replace(/[^a-zA-Zа-яА-ЯёЁ\s-]/g, '');
      if (value !== filtered) {
        input.value = filtered;
      }
    });

    input.addEventListener('keypress', (e) => {
      const char = e.key;
      // Разрешаем только латиницу, кириллицу, пробелы и дефисы
      if (!/^[a-zA-Zа-яА-ЯёЁ\s-]$/.test(char) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(char)) {
        e.preventDefault();
      }
    });
  };

  // Обработчик формы регистрации
  const signupButton = page.querySelector('#signup-button') as HTMLElement;
  const nameInput = page.querySelector('#signup-name') as HTMLInputElement;
  const lastnameInput = page.querySelector('#signup-lastname') as HTMLInputElement;
  const emailInput = page.querySelector('#signup-email') as HTMLInputElement;
  const phoneInput = page.querySelector('#signup-phone') as HTMLInputElement;
  const passwordInputHandler = page.querySelector('#signup-password') as HTMLInputElement;
  const confirmPasswordInputHandler = page.querySelector('#signup-confirm-password') as HTMLInputElement;

  // Настраиваем валидацию для имени и фамилии
  if (nameInput) setupNameValidation(nameInput);
  if (lastnameInput) setupNameValidation(lastnameInput);

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

  // Настраиваем валидацию для поля email
  if (emailInput) setupEmailValidation(emailInput);

  // Маска для номера телефона (формат: +7 (999) 999-99-99)
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
      
      if (value.length > 0 && !value.startsWith('7')) {
        value = '7' + value;
      }
      
      if (value.length > 11) {
        value = value.substring(0, 11);
      }
      
      let formatted = '';
      if (value.length > 0) {
        formatted = '+7';
        if (value.length > 1) {
          formatted += ' (' + value.substring(1, 4);
          if (value.length >= 4) {
            formatted += ') ' + value.substring(4, 7);
            if (value.length >= 7) {
              formatted += '-' + value.substring(7, 9);
              if (value.length >= 9) {
                formatted += '-' + value.substring(9, 11);
              }
            }
          } else {
            formatted += ')';
          }
        }
      }
      
      (e.target as HTMLInputElement).value = formatted;
    });

    phoneInput.addEventListener('keydown', (e) => {
      // Разрешаем: цифры, Backspace, Delete, Tab, стрелки
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

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

  const handleSignUp = () => {
    let isValid = true;
    
    // Сбрасываем предыдущие ошибки
    if (nameInput) resetFieldValidation(nameInput);
    if (lastnameInput) resetFieldValidation(lastnameInput);
    if (emailInput) resetFieldValidation(emailInput);
    if (phoneInput) resetFieldValidation(phoneInput);
    if (passwordInputHandler) resetFieldValidation(passwordInputHandler);
    if (confirmPasswordInputHandler) resetFieldValidation(confirmPasswordInputHandler);

    const name = nameInput?.value.trim() || '';
    const lastname = lastnameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    const password = passwordInputHandler?.value || '';
    const confirmPassword = confirmPasswordInputHandler?.value || '';

    // Валидация имени
    if (!name) {
      if (nameInput) markFieldAsInvalid(nameInput);
      isValid = false;
    } else if (!validateName(name)) {
      if (nameInput) markFieldAsInvalid(nameInput);
      isValid = false;
    }

    // Валидация фамилии
    if (!lastname) {
      if (lastnameInput) markFieldAsInvalid(lastnameInput);
      isValid = false;
    } else if (!validateName(lastname)) {
      if (lastnameInput) markFieldAsInvalid(lastnameInput);
      isValid = false;
    }

    // Валидация email
    if (!email) {
      if (emailInput) markFieldAsInvalid(emailInput);
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (emailInput) markFieldAsInvalid(emailInput);
        isValid = false;
      }
    }

    // Валидация номера телефона
    if (!phone) {
      if (phoneInput) markFieldAsInvalid(phoneInput);
      isValid = false;
    } else {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) {
        if (phoneInput) markFieldAsInvalid(phoneInput);
        isValid = false;
      }
    }

    // Валидация пароля
    if (!password) {
      if (passwordInputHandler) markFieldAsInvalid(passwordInputHandler);
      isValid = false;
    } else if (password.length < 6) {
      if (passwordInputHandler) markFieldAsInvalid(passwordInputHandler);
      isValid = false;
    }

    // Валидация подтверждения пароля
    if (!confirmPassword) {
      if (confirmPasswordInputHandler) markFieldAsInvalid(confirmPasswordInputHandler);
      isValid = false;
    } else if (password !== confirmPassword) {
      if (confirmPasswordInputHandler) markFieldAsInvalid(confirmPasswordInputHandler);
      if (passwordInputHandler) markFieldAsInvalid(passwordInputHandler);
      isValid = false;
    }

    // Если есть ошибки, не продолжаем
    if (!isValid) {
      // Фокусируемся на первом невалидном поле
      if (!name && nameInput) {
        nameInput.focus();
      } else if (!lastname && lastnameInput) {
        lastnameInput.focus();
      } else if (!email && emailInput) {
        emailInput.focus();
      } else if (!phone && phoneInput) {
        phoneInput.focus();
      } else if (!password && passwordInputHandler) {
        passwordInputHandler.focus();
      } else if (!confirmPassword && confirmPasswordInputHandler) {
        confirmPasswordInputHandler.focus();
      }
      return;
    }

    // Здесь должна быть логика регистрации
    console.log('Регистрация:', { name, lastname, email, phone, password });

    // После успешной регистрации можно перейти на главную страницу или страницу входа
    // window.location.hash = '#/';
  };

  signupButton?.addEventListener('click', handleSignUp);

  // Обработка Enter в полях ввода
  nameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      lastnameInput?.focus();
    }
  });

  lastnameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      emailInput?.focus();
    }
  });

  emailInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      phoneInput?.focus();
    }
  });

  phoneInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInputHandler?.focus();
    }
  });

  passwordInputHandler?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      confirmPasswordInputHandler?.focus();
    }
  });

  confirmPasswordInputHandler?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSignUp();
    }
  });

  // Обработчик "Войти" - переход на страницу входа
  const loginLink = page.querySelector('#login-link') as HTMLElement;
  loginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login');
  });
}

