export type RecentOfferItem = {
  offerId: string;
  title: string;
  viewedAt: string; // ISO
};

const STORAGE_KEY = 'recent_offers_v1';
const MAX_ITEMS = 10;

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getRecentOffers(): RecentOfferItem[] {
  const parsed = safeParseJson<unknown>(localStorage.getItem(STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];
  const items: RecentOfferItem[] = [];
  for (const x of parsed) {
    if (!x || typeof x !== 'object') continue;
    const o = x as any;
    if (typeof o.offerId !== 'string') continue;
    if (typeof o.title !== 'string') continue;
    if (typeof o.viewedAt !== 'string') continue;
    items.push({ offerId: o.offerId, title: o.title, viewedAt: o.viewedAt });
  }
  return items;
}

export function addRecentOffer(input: { offerId: string; title: string }) {
  const nowIso = new Date().toISOString();
  const next: RecentOfferItem[] = [
    { offerId: input.offerId, title: input.title, viewedAt: nowIso },
    ...getRecentOffers().filter((x) => x.offerId !== input.offerId),
  ].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota / private mode
  }
}

