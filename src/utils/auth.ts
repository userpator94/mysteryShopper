// Утилиты для работы с аутентификацией

/**
 * Проверяет, аутентифицирован ли пользователь
 * @returns true если токен существует в localStorage
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  return !!token; // Возвращает true если токен существует
}
