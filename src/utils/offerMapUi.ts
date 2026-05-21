import { isYandexMapsConfigured } from '../config/yandexMaps.js';
import type { OfferMapEditorHandle } from '../maps/offerMap.js';
import { mountOfferMapEditor } from '../maps/offerMap.js';
import type { LocationPoint } from '../types/index.js';

export interface OfferMapCreateSection {
  getLocationPointsForSubmit: () => LocationPoint[] | null;
  destroy: () => void;
}

/** Кнопка «Добавить карту» / «Удалить карту» и редактор меток (только создание задачи). */
export function initOfferMapCreateSection(page: HTMLElement): OfferMapCreateSection {
  const toggleBtn = page.querySelector('#offer-map-toggle') as HTMLButtonElement | null;
  const panel = page.querySelector('#offer-map-panel') as HTMLElement | null;
  const mapContainer = page.querySelector('#offer-map-container') as HTMLElement | null;
  const searchInput = page.querySelector('#offer-map-search') as HTMLInputElement | null;
  const searchBtn = page.querySelector('#offer-map-search-btn') as HTMLButtonElement | null;
  const pointsList = page.querySelector('#offer-map-points-list') as HTMLElement | null;
  const mapError = page.querySelector('#offer-map-error') as HTMLElement | null;
  const mapUnavailable = page.querySelector('#offer-map-unavailable') as HTMLElement | null;

  let mapVisible = false;
  let editor: OfferMapEditorHandle | null = null;
  let mapInitPromise: Promise<void> | null = null;

  const setToggleLabel = (visible: boolean) => {
    if (!toggleBtn) return;
    toggleBtn.textContent = visible ? 'Удалить карту' : 'Добавить карту';
    toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
  };

  const showMapError = (msg: string) => {
    if (!mapError) return;
    mapError.textContent = msg;
    mapError.classList.remove('hidden');
  };

  const hideMapError = () => mapError?.classList.add('hidden');

  const destroyEditor = () => {
    editor?.destroy();
    editor = null;
    mapInitPromise = null;
  };

  const ensureEditor = async () => {
    if (!mapContainer || editor) return;
    if (!isYandexMapsConfigured()) {
      mapUnavailable?.classList.remove('hidden');
      return;
    }
    mapUnavailable?.classList.add('hidden');
    hideMapError();
    mapInitPromise = mountOfferMapEditor(mapContainer, {
      searchInput: searchInput ?? undefined,
      searchButton: searchBtn ?? undefined,
      pointsListEl: pointsList ?? undefined,
      onSearchError: () => showMapError('Адрес не найден. Уточните запрос или поставьте метку на карте.'),
    }).then((handle) => {
      editor = handle;
    });
    await mapInitPromise;
  };

  toggleBtn?.addEventListener('click', () => {
    if (!panel) return;
    if (mapVisible) {
      mapVisible = false;
      panel.classList.add('hidden');
      destroyEditor();
      if (searchInput) searchInput.value = '';
      setToggleLabel(false);
      hideMapError();
      return;
    }
    mapVisible = true;
    panel.classList.remove('hidden');
    setToggleLabel(true);
    void ensureEditor().catch(() => {
      showMapError('Не удалось загрузить карту. Проверьте ключ API и ограничения Referer.');
    });
  });

  if (!isYandexMapsConfigured()) {
    toggleBtn?.setAttribute('disabled', 'true');
    toggleBtn?.classList.add('opacity-50', 'cursor-not-allowed');
    if (mapUnavailable) mapUnavailable.textContent = 'Карта недоступна: не задан VITE_YANDEX_MAPS_API_KEY.';
  }

  return {
    getLocationPointsForSubmit() {
      if (!mapVisible || !editor) return null;
      const pts = editor.getPoints();
      return pts.length > 0 ? pts : null;
    },
    destroy() {
      destroyEditor();
    },
  };
}

/** Только просмотр карты (детали задачи, редактирование без изменения меток). */
export async function mountReadonlyOfferMapBlock(
  container: HTMLElement,
  points: LocationPoint[],
  errorEl?: HTMLElement | null
): Promise<{ destroy: () => void }> {
  if (!isYandexMapsConfigured()) {
    errorEl?.classList.remove('hidden');
    if (errorEl) errorEl.textContent = 'Карта недоступна: не задан ключ API.';
    return { destroy: () => {} };
  }
  errorEl?.classList.add('hidden');
  try {
    const { mountOfferMapReadonly } = await import('../maps/offerMap.js');
    return await mountOfferMapReadonly(container, points);
  } catch {
    errorEl?.classList.remove('hidden');
    if (errorEl) errorEl.textContent = 'Не удалось загрузить карту.';
    return { destroy: () => {} };
  }
}
