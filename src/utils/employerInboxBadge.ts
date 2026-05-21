import { apiService } from '../services/api.js';
import { getRole, isAuthenticated } from './auth.js';

export type EmployerInboxCounts = {
  pending_applications: number;
  pending_reports: number;
};

let lastCounts: EmployerInboxCounts | null = null;
let refreshInFlight: Promise<void> | null = null;
let lastRefreshAt = 0;
const REFRESH_MIN_INTERVAL_MS = 4000;

export function getLastEmployerInboxCounts(): EmployerInboxCounts | null {
  return lastCounts;
}

function applyBadges(counts: EmployerInboxCounts): void {
  const total = counts.pending_applications + counts.pending_reports;
  const navBadge = document.getElementById('employer-nav-inbox-badge');
  if (navBadge) {
    if (total > 0) {
      navBadge.textContent = total > 99 ? '99+' : String(total);
      navBadge.classList.remove('hidden');
    } else {
      navBadge.textContent = '';
      navBadge.classList.add('hidden');
    }
  }

  document.querySelectorAll<HTMLElement>('[data-metric-badge="reports"]').forEach((dot) => {
    dot.classList.toggle('hidden', counts.pending_reports <= 0);
  });
  document.querySelectorAll<HTMLElement>('[data-metric-badge="applications"]').forEach((dot) => {
    dot.classList.toggle('hidden', counts.pending_applications <= 0);
  });

  document.querySelectorAll<HTMLElement>('[data-metric-count="pending-reports"]').forEach((el) => {
    el.textContent = String(counts.pending_reports);
  });
  document.querySelectorAll<HTMLElement>('[data-metric-count="pending-applications"]').forEach((el) => {
    el.textContent = String(counts.pending_applications);
  });
}

/** Обновить бейджи входящих заказчика (навигация + точки на метриках профиля). */
export async function refreshEmployerInboxBadge(force = false): Promise<void> {
  if (!isAuthenticated() || getRole() !== 'employer') {
    lastCounts = null;
    applyBadges({ pending_applications: 0, pending_reports: 0 });
    return;
  }

  const now = Date.now();
  if (!force && lastCounts && now - lastRefreshAt < REFRESH_MIN_INTERVAL_MS) {
    applyBadges(lastCounts);
    return;
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const counts = await apiService.getEmployerInboxCounts();
      lastCounts = counts;
      lastRefreshAt = Date.now();
      applyBadges(counts);
    } catch {
      /* сеть / 401 / 429 — не ломаем UI */
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
