/**
 * [AGENT] Карты и отображение локации скрыты в UI — код не удалён.
 *
 * Чтобы снова запустить функционал, по сути нужен только API key:
 *   1) MAPS_LOCATION_UI_ENABLED = true  (этот файл)
 *   2) VITE_YANDEX_MAPS_API_KEY=<ключ> в .env → пересобрать
 * Других правок кода / удаления «скрывающих» веток не требуется.
 *
 * Точки входа UI: CreateOfferPage, EditOfferPage, OfferDetailPage, HomePage,
 * offerMapUi.ts, maps/*, utils/geolocation.ts, utils/locationPoints.ts.
 */
export const MAPS_LOCATION_UI_ENABLED = false;

export function getYandexMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : undefined;
}

export function isYandexMapsConfigured(): boolean {
  return Boolean(getYandexMapsApiKey());
}

/** Показывать ли UI карт / локации. Нужны и флаг, и VITE_YANDEX_MAPS_API_KEY. */
export function isMapsLocationUiEnabled(): boolean {
  return MAPS_LOCATION_UI_ENABLED && isYandexMapsConfigured();
}
