/// <reference types="vite/client" />
/// <reference types="@yandex/ymaps3-types" />

interface ImportMetaEnv {
  /**
   * [AGENT] Ключ Яндекс.Карт. UI карт/локации сейчас скрыт (см. src/config/yandexMaps.ts).
   * Чтобы включить: MAPS_LOCATION_UI_ENABLED = true + этот ключ в .env. Больше ничего не нужно.
   */
  readonly VITE_YANDEX_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Время сборки, подставляется Vite (`define` в vite.config.ts). */
declare const __BUILD_TIME__: string;
