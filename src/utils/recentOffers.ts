import { getUserId } from './auth.js';

export type RecentOfferItem = {
  offerId: string;
  title: string;
  viewedAt: string; // ISO
};

const STORAGE_KEY_PREFIX = 'recent_offers_v1';
/** Старый общий ключ без user_id — нельзя читать, иначе чужая история утекает на новый аккаунт. */
const LEGACY_STORAGE_KEY = 'recent_offers_v1';
const MAX_ITEMS = 10;

function currentUserId(): string | null {
  const id = getUserId();
  if (!id || !id.trim()) return null;
  return id.trim();
}

function storageKeyForUser(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function purgeLegacySharedHistory(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore storage / private mode
  }
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseItems(raw: string | null): RecentOfferItem[] {
  const parsed = safeParseJson<unknown>(raw);
  if (!Array.isArray(parsed)) return [];
  const items: RecentOfferItem[] = [];
  for (const x of parsed) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    if (typeof o.offerId !== 'string') continue;
    if (typeof o.title !== 'string') continue;
    if (typeof o.viewedAt !== 'string') continue;
    items.push({ offerId: o.offerId, title: o.title, viewedAt: o.viewedAt });
  }
  return items;
}

export function getRecentOffers(): RecentOfferItem[] {
  purgeLegacySharedHistory();
  const userId = currentUserId();
  if (!userId) return [];
  return parseItems(localStorage.getItem(storageKeyForUser(userId)));
}

export function addRecentOffer(input: { offerId: string; title: string }) {
  purgeLegacySharedHistory();
  const userId = currentUserId();
  if (!userId) return;
  const nowIso = new Date().toISOString();
  const next: RecentOfferItem[] = [
    { offerId: input.offerId, title: input.title, viewedAt: nowIso },
    ...getRecentOffers().filter((x) => x.offerId !== input.offerId),
  ].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(next));
  } catch {
    // ignore storage quota / private mode
  }
}

/** Удаляет историю текущего пользователя и общий ключ предыдущей версии. */
export function clearRecentOffers(): void {
  purgeLegacySharedHistory();
  const userId = currentUserId();
  if (!userId) return;
  try {
    localStorage.removeItem(storageKeyForUser(userId));
  } catch {
    // ignore storage / private mode
  }
}
