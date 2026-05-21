/// <reference types="vite/client" />
/// <reference types="@yandex/ymaps3-types" />

interface ImportMetaEnv {
  readonly VITE_YANDEX_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
