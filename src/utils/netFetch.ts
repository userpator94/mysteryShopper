// Обёртка над fetch: сетевые сбои (обрыв, блокировка, таймаут) превращаются
// в понятную русскую ошибку вместо "Failed to fetch" / "Load failed".
// Плюс таймаут: запрос не может висеть бесконечно (мобильные сети, блокировки).
// Диагностика вокруг fetch не меняет результат и не читает тела.

import { applyDiagHeaders, diagEvent, readResourceTiming } from './diagnostics.js';

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

export type NetFetchInit = RequestInit & {
  timeoutMs?: number;
  /** 1 или 2 — только для login, уходит в X-Diag-Attempt и в журнал. */
  diagAttempt?: number;
};

function logDiag(type: string, data: Record<string, unknown>): void {
  try { diagEvent(type, data); } catch { /* диагностика не ломает запрос */ }
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function readEffectiveType(): string | undefined {
  try {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    return connection?.effectiveType;
  } catch {
    return undefined;
  }
}

function bodyBytes(body: BodyInit | null | undefined): number | undefined {
  try {
    if (body == null) return 0;
    if (typeof body === 'string') return new TextEncoder().encode(body).length;
    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
      return new TextEncoder().encode(body.toString()).length;
    }
    if (typeof Blob !== 'undefined' && body instanceof Blob) return body.size;
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      let total = 0;
      body.forEach((value) => {
        if (typeof value === 'string') total += new TextEncoder().encode(value).length;
        else total += value.size;
      });
      return total;
    }
    if (body instanceof ArrayBuffer) return body.byteLength;
  } catch { /* длина неизвестна */ }
  return undefined;
}

function headerLength(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function errorFields(error: unknown): Record<string, unknown> {
  const err = error as { name?: string; message?: string; code?: unknown; stack?: string; cause?: unknown } | null;
  const cause = err?.cause as { name?: string; message?: string } | undefined;
  return {
    name: typeof err?.name === 'string' ? err.name : null,
    message: typeof err?.message === 'string' ? err.message : null,
    code: typeof err?.code === 'string' || typeof err?.code === 'number' ? err.code : null,
    causeName: typeof cause?.name === 'string' ? cause.name : null,
    causeMessage: typeof cause?.message === 'string' ? cause.message : null,
    stack: typeof err?.stack === 'string' ? err.stack.slice(0, 2000) : null,
  };
}

export async function netFetch(input: RequestInfo | URL, init: NetFetchInit = {}): Promise<Response> {
  const { timeoutMs, diagAttempt, ...rest } = init;
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

  let headers: HeadersInit | undefined = rest.headers;
  try {
    const copy = new Headers(rest.headers ?? undefined);
    applyDiagHeaders(copy, input, diagAttempt);
    headers = copy;
  } catch { /* без диагностических заголовков запрос всё равно уходит */ }

  const started = performance.now();
  const method = (rest.method || 'GET').toUpperCase();
  const url = requestUrl(input);
  const attempt = diagAttempt === 1 || diagAttempt === 2 ? diagAttempt : undefined;
  logDiag('request_start', {
    method,
    url,
    timeoutMs: limit,
    attempt,
    online: navigator.onLine,
    visibilityState: document.visibilityState,
    effectiveType: readEffectiveType() ?? null,
    bodyBytes: bodyBytes(rest.body) ?? null,
  });

  try {
    const response = await fetch(input, { ...rest, headers, signal: controller.signal });
    const durationMs = Math.round(performance.now() - started);
    const resourceTiming = readResourceTiming(url, started);
    logDiag('request_end', {
      method,
      url,
      attempt,
      status: response.status,
      ok: response.ok,
      durationMs,
      contentType: response.headers.get('content-type'),
      'x-request-id': response.headers.get('x-request-id'),
      'server-timing': response.headers.get('server-timing'),
      date: response.headers.get('date'),
      responseBytes: headerLength(response.headers.get('content-length')),
      resourceTiming,
      likelyReusedConnection: resourceTiming ? resourceTiming.likelyReusedConnection : null,
    });
    return response;
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - started);
    const resourceTiming = readResourceTiming(url, started);
    // Отмена самим вызывающим кодом — пробрасываем как есть.
    if (outer?.aborted && !timedOut) {
      logDiag('request_abort', {
        method,
        url,
        attempt,
        reason: 'external_signal',
        durationMs,
        resourceTiming,
      });
      throw error;
    }
    if (timedOut) {
      logDiag('request_abort', {
        method,
        url,
        attempt,
        reason: 'timeout',
        durationMs,
        resourceTiming,
      });
    }
    logDiag('request_error', {
      method,
      url,
      attempt,
      ...errorFields(error),
      timedOut,
      durationMs,
      resourceTiming,
      likelyReusedConnection: resourceTiming ? resourceTiming.likelyReusedConnection : null,
    });
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
