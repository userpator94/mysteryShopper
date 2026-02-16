// Утилиты для работы с аутентификацией

import type { UserRole } from '../types/index.js';

const STORAGE_ROLE = 'user_role';

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
  return !!token;
}

/**
 * Получить ID пользователя из localStorage
 */
export function getUserId(): string | null {
  return localStorage.getItem('user_id');
}

/**
 * Получить роль пользователя из localStorage (user | employer).
 * Устанавливается при login/signup и при GET /api/me.
 */
export function getRole(): UserRole | null {
  const role = localStorage.getItem(STORAGE_ROLE);
  if (role === 'user' || role === 'employer') return role;
  return null;
}

/**
 * Сохранить роль в localStorage (вызывается из api при login/signup/getMe).
 */
export function setRole(role: UserRole | null): void {
  if (role) {
    localStorage.setItem(STORAGE_ROLE, role);
  } else {
    localStorage.removeItem(STORAGE_ROLE);
  }
}

/**
 * Очистить данные авторизации (роль удаляется в api.logout).
 */
export function clearRole(): void {
  localStorage.removeItem(STORAGE_ROLE);
}

/**
 * Путь для редиректа после логина/регистрации по роли (employer → /my-offers, user → /).
 */
export function getRedirectByRole(): string {
  return getRole() === 'employer' ? '/my-offers' : '/';
}
