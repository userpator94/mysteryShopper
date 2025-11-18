// Утилиты для работы с аутентификацией

/**
 * Получить JWT токен из localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Проверить, авторизован ли пользователь
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  // Проверяем, что токен не истек
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (exp && exp * 1000 < Date.now()) {
      // Токен истек
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      return false;
    }
    return true;
  } catch (error) {
    // Невалидный токен
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    return false;
  }
}

/**
 * Выйти из системы
 */
export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
}

/**
 * Получить ID пользователя из токена
 */
export function getUserId(): string | null {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || null;
  } catch (error) {
    return null;
  }
}


