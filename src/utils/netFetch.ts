// Обёртка над fetch: сетевые сбои (обрыв, блокировка, таймаут) превращаются
// в понятную русскую ошибку вместо "Failed to fetch" / "Load failed".
// Плюс таймаут: запрос не может висеть бесконечно (мобильные сети, блокировки).

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
export const NETWORK_ERROR_MESSAGE =
  'Нет связи с сервером. Проверьте подключение к интернету и попробуйте ещё раз.';
export const TIMEOUT_ERROR_MESSAGE =
  'Сервер долго не отвечает. Проверьте подключение к интернету и попробуйте ещё раз.';

/** Таймаут по умолчанию для обычных API-запросов. */
export const DEFAULT_TIMEOUT_MS = 15_000;
/** Таймаут для загрузки файлов (FormData: отчёт с фото и т.п.). */
export const UPLOAD_TIMEOUT_MS = 120_000;

export function isNetworkError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === NETWORK_ERROR_CODE;
}

export type NetFetchInit = RequestInit & { timeoutMs?: number };

export async function netFetch(input: RequestInfo | URL, init: NetFetchInit = {}): Promise<Response> {
  const { timeoutMs, ...rest } = init;
  const isUpload = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  const limit = timeoutMs ?? (isUpload ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);

  // AbortController вручную, а не AbortSignal.timeout — для старых iOS Safari.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, limit);

  const outer = rest.signal ?? undefined;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort, { once: true });
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (error: unknown) {
    // Отмена самим вызывающим кодом — пробрасываем как есть.
    if (outer?.aborted && !timedOut) throw error;
    const name = (error as { name?: string } | null)?.name;
    const message = timedOut || name === 'TimeoutError' ? TIMEOUT_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE;
    const err = new Error(message) as Error & { code?: string; cause?: unknown };
    err.code = NETWORK_ERROR_CODE;
    err.cause = error;
    throw err;
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
  }
}
