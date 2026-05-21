import { getYandexMapsApiKey } from '../config/yandexMaps.js';
import type { DomEvent } from 'ymaps3';
import type { LocationPoint } from '../types/index.js';
import { loadYandexMaps } from './yandexMapsLoader.js';
import { getYmapsApi } from './ymapsApi.js';

const DEFAULT_CENTER: [number, number] = [37.617635, 55.755814];
const DEFAULT_ZOOM = 11;
export const MAX_OFFER_MAP_POINTS = 10;

function coordsToYandex(point: LocationPoint): [number, number] {
  return [point.lng, point.lat];
}

function boundsFromPoints(points: LocationPoint[]): { center: [number, number]; zoom: number } {
  if (points.length === 0) return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  if (points.length === 1) return { center: coordsToYandex(points[0]), zoom: 15 };
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  for (const p of points) {
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
  }
  const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  const span = Math.max(maxLng - minLng, maxLat - minLat);
  let zoom = 14;
  if (span > 0.5) zoom = 10;
  else if (span > 0.1) zoom = 12;
  else if (span > 0.02) zoom = 14;
  return { center, zoom };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createMarkerElement(index: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'offer-map-pin';
  el.innerHTML = `<span class="offer-map-pin__dot"></span><span class="offer-map-pin__n">${index}</span>`;
  return el;
}

export async function geocodeSearchQuery(query: string): Promise<LocationPoint | null> {
  const key = getYandexMapsApiKey();
  if (!key || !query.trim()) return null;
  const url = new URL('https://geocode-maps.yandex.ru/v1/');
  url.searchParams.set('apikey', key);
  url.searchParams.set('geocode', query.trim());
  url.searchParams.set('format', 'json');
  url.searchParams.set('lang', 'ru_RU');
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    response?: { GeoObjectCollection?: { featureMember?: Array<{ GeoObject?: { Point?: { pos?: string } } }> } };
  };
  const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
  if (typeof pos !== 'string') return null;
  const parts = pos.split(/\s+/).map(Number);
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  const [lng, lat] = parts;
  return { lng, lat, label: query.trim().slice(0, 200) };
}

export interface OfferMapHandle {
  destroy: () => void;
}

export async function mountOfferMapReadonly(
  container: HTMLElement,
  points: LocationPoint[]
): Promise<OfferMapHandle> {
  await loadYandexMaps();
  const api = getYmapsApi();
  if (!api) throw new Error('YANDEX_MAPS_NOT_AVAILABLE');
  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = api;
  container.innerHTML = '';
  const { center, zoom } = boundsFromPoints(points);
  const map = new YMap(container, { location: { center, zoom } });
  map.addChild(new YMapDefaultSchemeLayer({}));
  map.addChild(new YMapDefaultFeaturesLayer({}));
  for (let i = 0; i < points.length; i++) {
    map.addChild(new YMapMarker({ coordinates: coordsToYandex(points[i]) }, createMarkerElement(i + 1)));
  }
  return {
    destroy() {
      container.innerHTML = '';
    }
  };
}

export interface OfferMapEditorOptions {
  initial?: LocationPoint[] | null;
  onChange?: (points: LocationPoint[]) => void;
  maxPoints?: number;
  searchInput?: HTMLInputElement;
  searchButton?: HTMLButtonElement;
  pointsListEl?: HTMLElement;
  onSearchError?: () => void;
}

export type OfferMapEditorHandle = OfferMapHandle & {
  getPoints: () => LocationPoint[];
  clearPoints: () => void;
};

export async function mountOfferMapEditor(
  container: HTMLElement,
  options: OfferMapEditorOptions
): Promise<OfferMapEditorHandle> {
  await loadYandexMaps();
  const api = getYmapsApi();
  if (!api) throw new Error('YANDEX_MAPS_NOT_AVAILABLE');
  const maxPoints = options.maxPoints ?? MAX_OFFER_MAP_POINTS;
  let points: LocationPoint[] = Array.isArray(options.initial) ? [...options.initial] : [];
  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = api;
  container.innerHTML = '';
  const { center, zoom } = boundsFromPoints(points);
  const map = new YMap(container, { location: { center, zoom } });
  map.addChild(new YMapDefaultSchemeLayer({}));
  map.addChild(new YMapDefaultFeaturesLayer({}));
  const markerEntities: InstanceType<typeof YMapMarker>[] = [];

  const renderPointsList = () => {
    if (!options.pointsListEl) return;
    if (points.length === 0) {
      options.pointsListEl.innerHTML = '<li class="text-slate-500">Меток пока нет</li>';
      return;
    }
    options.pointsListEl.innerHTML = points
      .map(
        (p, i) =>
          `<li class="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
            <span class="text-slate-700 truncate">${i + 1}. ${escapeHtml(p.label || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`)}</span>
            <button type="button" data-remove-idx="${i}" class="shrink-0 text-red-600 text-sm font-medium">Удалить</button>
          </li>`
      )
      .join('');
    options.pointsListEl.querySelectorAll('[data-remove-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn as HTMLElement).dataset.removeIdx);
        if (Number.isNaN(idx)) return;
        points = points.filter((_, j) => j !== idx);
        syncMarkers();
      });
    });
  };

  const syncMarkers = () => {
    for (const m of markerEntities) {
      map.removeChild(m);
    }
    markerEntities.length = 0;
    points.forEach((p, i) => {
      const m = new YMapMarker({ coordinates: coordsToYandex(p) }, createMarkerElement(i + 1));
      map.addChild(m);
      markerEntities.push(m);
    });
    renderPointsList();
    options.onChange?.(points);
  };

  const addPoint = (p: LocationPoint) => {
    if (points.length >= maxPoints) return;
    points = [...points, p];
    syncMarkers();
    const { zoom: fitZoom } = boundsFromPoints(points);
    map.update({ location: { center: coordsToYandex(p), zoom: fitZoom } });
  };

  map.addChild(
    new YMapListener({
      layer: 'any',
      onClick: (_object, event: DomEvent) => {
        const [lng, lat] = event.coordinates;
        addPoint({ lng, lat });
      }
    })
  );

  syncMarkers();

  const doSearch = async () => {
    const q = options.searchInput?.value;
    if (!q?.trim()) return;
    const found = await geocodeSearchQuery(q);
    if (!found) {
      options.onSearchError?.();
      return;
    }
    addPoint(found);
    if (options.searchInput && found.label) options.searchInput.value = found.label;
  };

  const onSearchClick = () => void doSearch();
  const onSearchKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void doSearch();
    }
  };
  options.searchButton?.addEventListener('click', onSearchClick);
  options.searchInput?.addEventListener('keydown', onSearchKey);

  return {
    destroy() {
      options.searchButton?.removeEventListener('click', onSearchClick);
      options.searchInput?.removeEventListener('keydown', onSearchKey);
      container.innerHTML = '';
    },
    getPoints: () => [...points],
    clearPoints: () => {
      points = [];
      syncMarkers();
    }
  };
}
