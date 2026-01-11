// Утилита для логирования с поддержкой dev/prod режимов

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Логирование только в development режиме
 */
export const devLog = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Ошибки логируем всегда
    console.error(...args);
  },
  warn: (...args: any[]) => {
    // Предупреждения логируем всегда
    console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

/**
 * Важные логи, которые должны работать и в production
 */
export const importantLog = {
  log: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
};
