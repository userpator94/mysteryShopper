// Утилиты для работы с аутентификацией

/**
 * Получить JWT токен из localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Проверяет, аутентифицирован ли пользователь
 * @returns true если токен существует в localStorage
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token; // Возвращает true если токен существует
}

/**
 * Получить ID пользователя из localStorage
 */
export function getUserId(): string | null {
  return localStorage.getItem('user_id');
}
