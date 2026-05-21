export function getYandexMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : undefined;
}

export function isYandexMapsConfigured(): boolean {
  return Boolean(getYandexMapsApiKey());
}
