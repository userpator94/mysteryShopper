import { getAuthToken } from './auth.js';
import { netFetch } from './netFetch.js';

/**
 * Подставляет blob: URL для <img src="/api/images/..."> —
 * браузер не шлёт Authorization на обычный img.src.
 */
export async function hydrateAuthenticatedImages(root: ParentNode): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  const imgs = Array.from(root.querySelectorAll('img[src^="/api/images/"]')) as HTMLImageElement[];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src) return;
      try {
        const res = await netFetch(src, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          img.removeAttribute('src');
          img.alt = img.alt || 'Фото недоступно';
          return;
        }
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        img.src = objectUrl;
      } catch {
        img.removeAttribute('src');
        img.alt = img.alt || 'Фото недоступно';
      }
    })
  );
}
