import { getYandexMapsApiKey } from '../config/yandexMaps.js';
import { getYmapsApi } from './ymapsApi.js';

let loadPromise: Promise<void> | null = null;

export function loadYandexMaps(): Promise<void> {
  const key = getYandexMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('YANDEX_MAPS_API_KEY_MISSING'));
  }

  const existing = getYmapsApi();
  if (existing) {
    return existing.ready;
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(key)}&lang=ru_RU`;
      script.async = true;
      script.onerror = () => {
        loadPromise = null;
        reject(new Error('YANDEX_MAPS_SCRIPT_FAILED'));
      };
      script.onload = () => {
        const api = getYmapsApi();
        if (!api) {
          loadPromise = null;
          reject(new Error('YANDEX_MAPS_NOT_AVAILABLE'));
          return;
        }
        api.ready.then(resolve).catch(reject);
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}
