import type * as YmapsApi from 'ymaps3';

export function getYmapsApi(): typeof YmapsApi | undefined {
  return (globalThis as { ymaps3?: typeof YmapsApi }).ymaps3;
}
