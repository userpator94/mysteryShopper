/** Скрытый префикс админ-панели (не светить в публичной навигации). */
export const ADMIN_BASE = '/svc-panel/admin';

export const ADMIN_LOGIN_PATH = `${ADMIN_BASE}/login`;
/** Обзор (без trailing slash — так проще матчить в роутере) */
export const ADMIN_OVERVIEW_PATH = ADMIN_BASE;
export const ADMIN_APPLICATIONS_PATH = `${ADMIN_BASE}/applications`;
export const ADMIN_QUEUES_PATH = `${ADMIN_BASE}/queues`;
export const ADMIN_DOCUMENTS_PATH = `${ADMIN_BASE}/documents`;

export function isAdminPanelPath(path: string): boolean {
  const clean = (path.split('?')[0] || '/').replace(/\/+$/, '') || '/';
  const base = ADMIN_BASE.replace(/\/+$/, '');
  return clean === base || clean.startsWith(`${base}/`);
}
