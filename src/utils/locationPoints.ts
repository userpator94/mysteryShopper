import type { LocationPoint } from '../types/index.js';

function parseCoord(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Нормализует location_points из ответа API */
export function normalizeLocationPoints(raw: unknown): LocationPoint[] | null {
  if (raw == null) return null;
  let data: unknown = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      return null;
    }
  }
  if (!Array.isArray(data) || data.length === 0) return null;
  const points: LocationPoint[] = [];
  for (const item of data) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const lng = parseCoord(o.lng);
    const lat = parseCoord(o.lat);
    if (lng == null || lat == null) continue;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) continue;
    const label = typeof o.label === 'string' ? o.label.trim().slice(0, 200) : undefined;
    points.push({ lng, lat, ...(label ? { label } : {}) });
  }
  return points.length ? points : null;
}

export function hasLocationPoints(raw: unknown): boolean {
  return normalizeLocationPoints(raw) != null;
}
