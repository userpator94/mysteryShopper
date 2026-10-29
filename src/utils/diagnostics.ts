// Клиентская диагностика входа и сети. Ошибки этого модуля не должны ломать приложение.
// Пароль, токен, Authorization, cookie и тела запросов сюда не попадают.
// Email — только маска и короткий SHA-256.

import { getAuthToken, getRole, getUserId } from './auth.js';
import { copyToClipboard } from './clipboard.js';

const SCHEMA_VERSION = 2;
const MAX_EVENTS = 1000;
const MAX_EVENT_BYTES = 256 * 1024;
const MAX_REPORT_BYTES = 512 * 1024;
const MAX_RESOURCES = 200;
const PERSIST_MS = 400;
const SESSION_KEY = 'ms_diag_session_id';
const STARTED_KEY = 'ms_diag_started_at';
const FAIL_COUNT_KEY = 'ms_diag_login_net_fails';
const EVENTS_PREFIX = 'ms_diag_events_';

const SECRET_QUERY = new Set(['token', 'code', 'key', 'secret', 'password', 'email']);
const EMAIL_RE = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const QUERY_SECRET_RE = /([?&#](?:token|code|key|secret|password|email)=)[^&#\s]*/gi;

export interface DiagEvent {
  t: number;
  wall: number;
  iso: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface ResourceTimingSnap {
  name: string;
  startTime: number;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  nextHopProtocol: string;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  initiatorType: string;
  likelyReusedConnection: boolean;
  responseStatus?: number;
}

export interface DiagnosticsReport {
  schemaVersion: number;
  sessionId: string;
  generatedAt: string;
  app: {
    href: string;
    pathname: string;
    route: string;
    referrer: string;
    title: string;
    moduleScript: string;
    mode: string;
    baseUrl: string;
    buildTime: string;
    startedAt: string;
  };
  device: Record<string, unknown>;
  network: {
    onLine: boolean;
    connection: {
      effectiveType?: string;
      rtt?: number;
      downlink?: number;
      saveData?: boolean;
      type?: string;
    } | null;
    visibilityState: string;
    navigationType: string | null;
    redirectCount: number | null;
  };
  auth: Record<string, unknown>;
  storage: {
    estimate: { quota?: number; usage?: number } | null;
    localStorageBytes: number | null;
    sessionStorageBytes: number | null;
  };
  navigation: Record<string, unknown>;
  events: DiagEvent[];
  resources: ResourceTimingSnap[];
  summary: string;
  truncated: boolean;
}

let inited = false;
let memorySessionId: string | null = null;
let memoryStartedAt: number | null = null;
let events: DiagEvent[] = [];
let eventBytesTotal = 0;
let resources: ResourceTimingSnap[] = [];
let navigationObserved: Record<string, unknown> | null = null;
let persistTimer = 0;
let storageEstimate: { quota?: number; usage?: number } | null = null;
let queryOpenDone = false;
let queryDownloadDone = false;
let assistLock = false;
let memoryFails = 0;
let healthPingBusy = false;
let clientHints: UaClientHints | null = null;

interface UaClientHints {
  mobile?: boolean;
  platform?: string;
  model?: string;
  platformVersion?: string;
  architecture?: string;
  bitness?: string;
  brands?: { brand: string; version: string }[];
}

function createSessionId(): string {
  try {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* fallback below */ }
  const bytes = new Uint8Array(16);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getDiagSessionId(): string {
  if (memorySessionId) return memorySessionId;
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      memorySessionId = existing;
      const started = Number(sessionStorage.getItem(STARTED_KEY) || '');
      memoryStartedAt = Number.isFinite(started) && started > 0 ? started : Date.now();
      if (!Number.isFinite(started) || started <= 0) {
        sessionStorage.setItem(STARTED_KEY, String(memoryStartedAt));
      }
      return existing;
    }
    const id = createSessionId();
    memorySessionId = id;
    memoryStartedAt = Date.now();
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.setItem(STARTED_KEY, String(memoryStartedAt));
    return id;
  } catch {
    if (!memorySessionId) {
      memorySessionId = createSessionId();
      memoryStartedAt = Date.now();
    }
    return memorySessionId;
  }
}

function sessionStartedIso(): string {
  getDiagSessionId();
  return new Date(memoryStartedAt ?? Date.now()).toISOString();
}

function storageKey(sessionId: string): string {
  return `${EVENTS_PREFIX}${sessionId}`;
}

export function maskEmail(email: string): string {
  const value = String(email ?? '').trim();
  if (!value) return '';
  const at = value.indexOf('@');
  if (at <= 0) return `${value.slice(0, 1)}***`;
  return `${value.slice(0, 1)}***@${value.slice(at + 1)}`;
}

export async function hashEmailShort(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return '';
  try {
    if (!crypto.subtle?.digest) return '';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  } catch {
    return '';
  }
}

function isSecretKey(key: string): boolean {
  const lk = key.toLowerCase();
  if (
    lk === 'password' ||
    lk === 'token' ||
    lk === 'authorization' ||
    lk === 'proxy-authorization' ||
    lk === 'cookie' ||
    lk === 'set-cookie'
  ) {
    return true;
  }
  if (lk === 'new_password' || lk === 'current_password' || lk === 'old_password') return true;
  if (lk === 'auth_token' || lk === 'access_token' || lk === 'refresh_token' || lk === 'id_token') return true;
  if (/(^|[_-])password$/.test(lk)) return true;
  if (/(^|[_-])token$/.test(lk)) return true;
  if (lk.endsWith('authorization')) return true;
  return false;
}

function isEmailKey(key: string): boolean {
  const lk = key.toLowerCase();
  return lk === 'email' || lk.endsWith('_email') || lk.endsWith('-email');
}

function stripSecretParams(params: URLSearchParams): void {
  for (const key of [...params.keys()]) {
    if (SECRET_QUERY.has(key.toLowerCase())) params.set(key, '[redacted]');
  }
}

function redactUrl(raw: string): string {
  try {
    const url = new URL(raw, location.href);
    url.username = '';
    url.password = '';
    stripSecretParams(url.searchParams);
    const hash = url.hash.replace(/^#/, '');
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const path = hash.slice(0, qIndex);
      const params = new URLSearchParams(hash.slice(qIndex + 1));
      stripSecretParams(params);
      const next = params.toString();
      url.hash = next ? `${path}?${next}` : path;
    }
    return url.toString();
  } catch {
    return String(raw).replace(QUERY_SECRET_RE, '$1[redacted]').slice(0, 500);
  }
}

function redactString(value: string, limit: number): string {
  let out = /^https?:\/\//i.test(value) ? redactUrl(value) : value.replace(QUERY_SECRET_RE, '$1[redacted]');
  out = out.replace(/bearer\s+\S+/gi, 'Bearer [redacted]');
  out = out.replace(EMAIL_RE, (match) => maskEmail(match));
  if (out.length > limit) return `${out.slice(0, limit)}…`;
  return out;
}

function redact(value: unknown, depth: number): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value, 500);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (depth > 4) return '[max-depth]';
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => redact(item, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (count >= 40) {
        out._truncatedKeys = true;
        break;
      }
      count += 1;
      if (inner === undefined) continue;
      if (isSecretKey(key)) {
        out[key] = '[redacted]';
        continue;
      }
      if (isEmailKey(key)) {
        out[key] = typeof inner === 'string' ? maskEmail(inner) : '[redacted]';
        continue;
      }
      if (typeof inner === 'string') {
        out[key] = redactString(inner, key.toLowerCase() === 'stack' ? 2000 : 500);
        continue;
      }
      out[key] = redact(inner, depth + 1);
    }
    return out;
  }
  return redactString(String(value), 500);
}

function eventSize(ev: DiagEvent): number {
  try {
    return JSON.stringify(ev).length;
  } catch {
    return MAX_EVENT_BYTES;
  }
}

function recomputeBytes(): void {
  eventBytesTotal = 0;
  for (const ev of events) eventBytesTotal += eventSize(ev);
}

function trimEvents(): void {
  let guard = 0;
  while ((events.length > MAX_EVENTS || eventBytesTotal > MAX_EVENT_BYTES) && events.length > 1 && guard < 2000) {
    const removed = events.shift();
    guard += 1;
    if (!removed) break;
    eventBytesTotal -= eventSize(removed);
  }
  if (eventBytesTotal < 0) recomputeBytes();
  if (events.length === 1 && eventBytesTotal > MAX_EVENT_BYTES) {
    const only = events[0];
    if (only) {
      events[0] = {
        t: only.t,
        wall: only.wall,
        iso: only.iso,
        type: only.type,
        data: { note: 'event dropped: too large' },
      };
      recomputeBytes();
    }
  }
  while (events.length > MAX_EVENTS) events.shift();
}

function isQuotaError(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name;
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

function dropOtherDiagKeys(keep: string): void {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(EVENTS_PREFIX) && key !== keep) doomed.push(key);
  }
  for (const key of doomed) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}

function persistNow(): void {
  try {
    const id = getDiagSessionId();
    const key = storageKey(id);
    const write = (): void => {
      localStorage.setItem(key, JSON.stringify({ v: 1, sessionId: id, events }));
    };
    try {
      write();
    } catch (error) {
      if (!isQuotaError(error)) return;
      dropOtherDiagKeys(key);
      for (let i = 0; i < 6 && events.length > 1; i++) {
        events.splice(0, Math.ceil(events.length / 2));
        try {
          write();
          recomputeBytes();
          return;
        } catch (again) {
          if (!isQuotaError(again)) return;
        }
      }
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      recomputeBytes();
    }
  } catch { /* fail-open */ }
}

function schedulePersist(): void {
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    persistTimer = 0;
    persistNow();
  }, PERSIST_MS);
}

function flushPersist(): void {
  if (persistTimer) {
    window.clearTimeout(persistTimer);
    persistTimer = 0;
  }
  persistNow();
}

function restore(): void {
  const id = getDiagSessionId();
  const key = storageKey(id);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { sessionId?: string; events?: DiagEvent[] };
    if (parsed.sessionId !== id || !Array.isArray(parsed.events)) return;
    events = parsed.events
      .filter((ev) => !!ev && typeof ev.type === 'string' && typeof ev.t === 'number')
      .slice(-MAX_EVENTS);
    recomputeBytes();
    trimEvents();
  } catch {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}

function listen(target: EventTarget, type: string, handler: (ev: Event) => void): void {
  try {
    target.addEventListener(type, handler);
  } catch { /* fail-open */ }
}

function installListeners(): void {
  listen(window, 'error', (ev) => {
    const errorEvent = ev as ErrorEvent;
    if (errorEvent.error) {
      diagError('window_error', errorEvent.error, {
        filename: errorEvent.filename,
        lineno: errorEvent.lineno,
        colno: errorEvent.colno,
      });
      return;
    }
    diagEvent('window_error', {
      message: errorEvent.message,
      filename: errorEvent.filename,
      lineno: errorEvent.lineno,
      colno: errorEvent.colno,
    });
  });
  listen(window, 'unhandledrejection', (ev) => {
    diagError('unhandledrejection', (ev as PromiseRejectionEvent).reason);
  });
  listen(document, 'visibilitychange', () => {
    diagEvent('visibilitychange', { visibilityState: document.visibilityState });
    if (document.visibilityState === 'hidden') flushPersist();
  });
  listen(window, 'pageshow', (ev) => {
    diagEvent('pageshow', { persisted: (ev as PageTransitionEvent).persisted === true });
  });
  listen(window, 'pagehide', (ev) => {
    diagEvent('pagehide', { persisted: (ev as PageTransitionEvent).persisted === true });
    flushPersist();
  });
  listen(window, 'online', () => diagEvent('online', { onLine: navigator.onLine }));
  listen(window, 'offline', () => diagEvent('offline', { onLine: navigator.onLine }));
  listen(document, 'freeze', () => {
    diagEvent('freeze', {});
    flushPersist();
  });
  listen(document, 'resume', () => diagEvent('resume', {}));
  listen(window, 'orientationchange', () => {
    diagEvent('orientationchange', {
      orientation: screen.orientation?.type ?? null,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    });
  });
  const viewport = window.visualViewport;
  if (viewport) {
    let timer = 0;
    listen(viewport, 'resize', () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = 0;
        diagEvent('visualviewport_resize', {
          height: viewport.height,
          width: viewport.width,
          scale: viewport.scale,
        });
      }, 300);
    });
  }
  observePerformance();
}

function isInterestingResource(name: string): boolean {
  try {
    const url = new URL(name, location.href);
    if (url.origin !== location.origin) return false;
    const path = url.pathname;
    if (path === '/health' || path === '/api' || path.startsWith('/api/')) return true;
    if (path === '/src/main.ts') return true;
    return /\.(?:js|mjs|css)$/i.test(path);
  } catch {
    return false;
  }
}

function snapshotResource(entry: PerformanceResourceTiming): ResourceTimingSnap | null {
  try {
    const snap: ResourceTimingSnap = {
      name: redactUrl(entry.name),
      startTime: entry.startTime,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      nextHopProtocol: entry.nextHopProtocol,
      domainLookupStart: entry.domainLookupStart,
      domainLookupEnd: entry.domainLookupEnd,
      connectStart: entry.connectStart,
      connectEnd: entry.connectEnd,
      secureConnectionStart: entry.secureConnectionStart,
      requestStart: entry.requestStart,
      responseStart: entry.responseStart,
      responseEnd: entry.responseEnd,
      initiatorType: entry.initiatorType,
      likelyReusedConnection: entry.connectStart === 0 && entry.domainLookupStart === 0,
    };
    const responseStatus = (entry as PerformanceResourceTiming & { responseStatus?: number }).responseStatus;
    if (typeof responseStatus === 'number') snap.responseStatus = responseStatus;
    return snap;
  } catch {
    return null;
  }
}

function rememberResource(entry: PerformanceResourceTiming): void {
  if (!isInterestingResource(entry.name)) return;
  const snap = snapshotResource(entry);
  if (!snap) return;
  resources.push(snap);
  if (resources.length > MAX_RESOURCES) resources.splice(0, resources.length - MAX_RESOURCES);
}

function snapshotNavigation(entry: PerformanceNavigationTiming): Record<string, unknown> {
  return {
    name: redactUrl(entry.name),
    type: entry.type,
    redirectCount: entry.redirectCount,
    startTime: entry.startTime,
    duration: entry.duration,
    fetchStart: entry.fetchStart,
    domainLookupStart: entry.domainLookupStart,
    domainLookupEnd: entry.domainLookupEnd,
    connectStart: entry.connectStart,
    connectEnd: entry.connectEnd,
    secureConnectionStart: entry.secureConnectionStart,
    requestStart: entry.requestStart,
    responseStart: entry.responseStart,
    responseEnd: entry.responseEnd,
    domInteractive: entry.domInteractive,
    domContentLoadedEventStart: entry.domContentLoadedEventStart,
    domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
    domComplete: entry.domComplete,
    loadEventStart: entry.loadEventStart,
    loadEventEnd: entry.loadEventEnd,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    nextHopProtocol: entry.nextHopProtocol,
  };
}

function observePerformance(): void {
  const attach = (type: string, onEntry: (entry: PerformanceEntry) => void): void => {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) onEntry(entry);
      });
      try {
        observer.observe({ type, buffered: true });
      } catch {
        observer.observe({ entryTypes: [type] });
      }
    } catch { /* старые браузеры */ }
  };
  attach('resource', (entry) => {
    if (entry.entryType === 'resource') rememberResource(entry as PerformanceResourceTiming);
  });
  attach('navigation', (entry) => {
    if (entry.entryType === 'navigation') {
      try { navigationObserved = snapshotNavigation(entry as PerformanceNavigationTiming); } catch { /* ignore */ }
    }
  });
}

function refreshStorageEstimate(): void {
  try {
    const estimate = navigator.storage?.estimate;
    if (!estimate) return;
    void estimate.call(navigator.storage).then((est) => {
      storageEstimate = {
        quota: typeof est.quota === 'number' ? est.quota : undefined,
        usage: typeof est.usage === 'number' ? est.usage : undefined,
      };
    }).catch(() => {});
  } catch { /* ignore */ }
}

function readDiagQuery(): string | null {
  try {
    const direct = new URLSearchParams(location.search).get('diag');
    if (direct) return direct;
    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return null;
    return new URLSearchParams(hash.slice(qIndex + 1)).get('diag');
  } catch {
    return null;
  }
}

function ensureInit(): void {
  if (inited) return;
  inited = true;
  try { restore(); } catch { /* ignore */ }
  try { installListeners(); } catch { /* ignore */ }
  try { refreshStorageEstimate(); } catch { /* ignore */ }
  try { refreshClientHints(); } catch { /* ignore */ }
  diagEvent('diag_init', {});
  try { syncDiagnosticsQuery(); } catch { /* ignore */ }
}

export function initDiagnostics(): void {
  try { ensureInit(); } catch { /* fail-open */ }
}

export function syncDiagnosticsQuery(): void {
  try {
    const diag = readDiagQuery();
    if (diag === '1') {
      if (queryOpenDone) return;
      queryOpenDone = true;
      openDiagnosticsPanel();
      return;
    }
    if (diag === 'download') {
      if (queryDownloadDone) return;
      queryDownloadDone = true;
      downloadDiagnostics();
    }
  } catch { /* fail-open */ }
}

export function diagEvent(type: string, data?: Record<string, unknown>): void {
  try {
    ensureInit();
    const safeType = String(type || 'event').slice(0, 100);
    let safeData: Record<string, unknown> | undefined;
    if (data) {
      const redacted = redact(data, 0);
      if (redacted && typeof redacted === 'object' && !Array.isArray(redacted)) {
        safeData = redacted as Record<string, unknown>;
      }
    }
    const ev: DiagEvent = {
      t: typeof performance.now === 'function' ? performance.now() : 0,
      wall: Date.now(),
      iso: new Date().toISOString(),
      type: safeType,
    };
    if (safeData && Object.keys(safeData).length > 0) ev.data = safeData;
    events.push(ev);
    eventBytesTotal += eventSize(ev);
    trimEvents();
    schedulePersist();
  } catch { /* fail-open */ }
}

export function diagError(type: string, error: unknown, extra?: Record<string, unknown>): void {
  const err = error as { name?: string; message?: string; code?: unknown; stack?: string; cause?: unknown } | null;
  const cause = err?.cause as { name?: string; message?: string } | undefined;
  diagEvent(type, {
    name: typeof err?.name === 'string' ? err.name : undefined,
    message: typeof err?.message === 'string' ? err.message : undefined,
    code: typeof err?.code === 'string' || typeof err?.code === 'number' ? err.code : undefined,
    stack: typeof err?.stack === 'string' ? err.stack.slice(0, 2000) : undefined,
    cause: cause && typeof cause === 'object' ? { name: cause.name, message: cause.message } : undefined,
    ...extra,
  });
}

function isSameOriginRequest(input: RequestInfo | URL): boolean {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return new URL(raw, location.href).origin === location.origin;
  } catch {
    return false;
  }
}

export function applyDiagHeaders(headers: Headers, input: RequestInfo | URL, attempt?: number): void {
  try {
    if (!isSameOriginRequest(input)) return;
    const id = getDiagSessionId();
    if (id) headers.set('X-Diag-Session', id);
    if (attempt === 1 || attempt === 2) headers.set('X-Diag-Attempt', String(attempt));
  } catch { /* заголовок не должен ломать запрос */ }
}

export function readResourceTiming(rawUrl: string, since?: number): ResourceTimingSnap | null {
  try {
    const href = new URL(rawUrl, location.href).href;
    const entries = performance.getEntriesByName(href).filter((entry): entry is PerformanceResourceTiming => entry.entryType === 'resource');
    if (!entries.length) return null;
    let chosen = entries[entries.length - 1];
    if (typeof since === 'number') {
      const recent = entries.filter((entry) => entry.startTime >= since - 30);
      if (recent.length) chosen = recent[recent.length - 1];
    }
    return chosen ? snapshotResource(chosen) : null;
  } catch {
    return null;
  }
}

function readNavigationEntry(): PerformanceNavigationTiming | null {
  try {
    const entry = performance.getEntriesByType('navigation')[0];
    if (entry && entry.entryType === 'navigation') return entry as PerformanceNavigationTiming;
  } catch { /* ignore */ }
  return null;
}

function readBuildTime(): string {
  try {
    return typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : '';
  } catch {
    return '';
  }
}

function moduleScriptUrl(): string {
  try {
    const srcs: string[] = [];
    document.querySelectorAll('script[type="module"]').forEach((node) => {
      const src = (node as HTMLScriptElement).src;
      if (src) srcs.push(src);
    });
    const app = srcs.find((src) => !src.includes('/@vite/') && !src.includes('@vite/client')) || srcs[0];
    return app ? redactUrl(app) : '';
  } catch { /* ignore */ }
  return '';
}

function currentRoute(): string {
  const hash = location.hash.replace(/^#/, '');
  const hashPath = hash.split('?')[0] || '';
  if (hashPath) return hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  return location.pathname || '/';
}

function safeSection<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function appSection(): DiagnosticsReport['app'] {
  return {
    href: redactUrl(location.href),
    pathname: location.pathname,
    route: currentRoute(),
    referrer: document.referrer ? redactUrl(document.referrer) : '',
    title: document.title,
    moduleScript: moduleScriptUrl(),
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL,
    buildTime: readBuildTime(),
    startedAt: sessionStartedIso(),
  };
}

function emptyApp(): DiagnosticsReport['app'] {
  return {
    href: '',
    pathname: '',
    route: '',
    referrer: '',
    title: '',
    moduleScript: '',
    mode: '',
    baseUrl: '',
    buildTime: '',
    startedAt: '',
  };
}

function usableModel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const model = value.trim();
  if (model.length < 2 || model.length > 80) return null;
  if (/^(k|mobile|android|linux|wv)$/i.test(model)) return null;
  return model;
}

function brandList(value: unknown): { brand: string; version: string }[] | null {
  if (!Array.isArray(value)) return null;
  const brands: { brand: string; version: string }[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const brand = (item as { brand?: unknown }).brand;
    const version = (item as { version?: unknown }).version;
    if (typeof brand !== 'string' || typeof version !== 'string') continue;
    brands.push({ brand: brand.slice(0, 40), version: version.slice(0, 40) });
    if (brands.length >= 8) break;
  }
  return brands.length ? brands : null;
}

function refreshClientHints(): void {
  const data = (navigator as Navigator & {
    userAgentData?: {
      brands?: { brand: string; version: string }[];
      mobile?: boolean;
      platform?: string;
      getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
    };
  }).userAgentData;
  if (!data) return;
  clientHints = {
    mobile: typeof data.mobile === 'boolean' ? data.mobile : undefined,
    platform: typeof data.platform === 'string' ? data.platform : undefined,
    brands: brandList(data.brands) ?? undefined,
  };
  if (typeof data.getHighEntropyValues !== 'function') return;
  void data.getHighEntropyValues(['model', 'platformVersion', 'fullVersionList', 'architecture', 'bitness'])
    .then((values) => {
      const full = brandList(values.fullVersionList);
      clientHints = {
        ...(clientHints ?? {}),
        model: usableModel(values.model) ?? undefined,
        platformVersion: typeof values.platformVersion === 'string' ? values.platformVersion.slice(0, 40) : undefined,
        architecture: typeof values.architecture === 'string' ? values.architecture.slice(0, 40) : undefined,
        bitness: typeof values.bitness === 'string' ? values.bitness.slice(0, 8) : undefined,
        brands: full ?? clientHints?.brands,
      };
    })
    .catch(() => {});
}

function parseClient(ua: string): {
  deviceClass: string;
  model: string | null;
  browser: string;
  browserVersion: string;
  engine: string;
  engineVersion: string;
  os: string;
  osVersion: string;
} {
  const ipadAsMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  let deviceClass = 'other';
  if (/iPhone|iPod/i.test(ua)) deviceClass = 'iPhone';
  else if (/iPad/i.test(ua) || ipadAsMac) deviceClass = 'iPad';
  else if (/Android/i.test(ua)) deviceClass = 'Android';
  else if (/CrOS/i.test(ua)) deviceClass = 'ChromeOS';
  else if (/Windows/i.test(ua)) deviceClass = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) deviceClass = 'Mac';
  else if (/Linux/i.test(ua)) deviceClass = 'Linux';

  let os = 'unknown';
  let osVersion = '';
  const ios = ua.match(/(?:iPhone OS|CPU OS) ([0-9_]+)/i);
  if (ios) {
    os = ipadAsMac || /iPad/i.test(ua) ? 'iPadOS' : 'iOS';
    osVersion = ios[1].replace(/_/g, '.');
  } else if (ipadAsMac) {
    os = 'iPadOS';
    const mac = ua.match(/Mac OS X ([0-9_]+)/);
    if (mac) osVersion = mac[1].replace(/_/g, '.');
  } else {
    const android = ua.match(/Android ([0-9.]+)/);
    const mac = ua.match(/Mac OS X ([0-9_]+)/);
    const win = ua.match(/Windows NT ([0-9.]+)/);
    if (android) {
      os = 'Android';
      osVersion = android[1];
    } else if (mac) {
      os = 'macOS';
      osVersion = mac[1].replace(/_/g, '.');
    } else if (win) {
      os = 'Windows';
      osVersion = win[1];
    }
  }

  const named = [
    ['Chrome', /CriOS\/([0-9.]+)/],
    ['Firefox', /FxiOS\/([0-9.]+)/],
    ['Edge', /EdgiOS\/([0-9.]+)/],
    ['Samsung Internet', /SamsungBrowser\/([0-9.]+)/],
    ['Edge', /Edg\/([0-9.]+)/],
    ['Opera', /OPR\/([0-9.]+)/],
    ['Firefox', /Firefox\/([0-9.]+)/],
    ['Chrome', /Chrome\/([0-9.]+)/],
    ['Safari', /Version\/([0-9.]+).*Safari\//],
  ] as const;
  let browser = 'unknown';
  let browserVersion = '';
  for (const [name, re] of named) {
    const match = ua.match(re);
    if (!match) continue;
    browser = name;
    browserVersion = match[1];
    break;
  }

  const webkit = ua.match(/AppleWebKit\/([0-9.]+)/);
  const gecko = ua.match(/Gecko\/([0-9.]+)/);
  const engine = webkit ? 'WebKit' : browser === 'Firefox' && gecko ? 'Gecko' : 'unknown';
  const engineVersion = webkit?.[1] ?? (browser === 'Firefox' ? gecko?.[1] ?? '' : '');

  const androidModel = ua.match(/Android\s+[0-9.]+;\s*([^;)]+?)(?:\s+Build\/|[;)])/);
  const model = usableModel(clientHints?.model) ?? usableModel(androidModel?.[1]) ?? null;
  return { deviceClass, model, browser, browserVersion, engine, engineVersion, os, osVersion };
}

function clientLabel(client: {
  model: string | null;
  deviceClass: string;
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
}): string {
  const device = client.model || client.deviceClass;
  const os = [client.os, client.osVersion].filter(Boolean).join(' ');
  const browser = [client.browser, client.browserVersion].filter(Boolean).join(' ');
  return [device, os, browser].filter((part) => part && part !== 'unknown').join(', ');
}

function serviceWorkerSnap(): { controlled: boolean; script: string } | null {
  try {
    const worker = navigator.serviceWorker;
    if (!worker) return { controlled: false, script: '' };
    const script = worker.controller?.scriptURL ? redactUrl(worker.controller.scriptURL) : '';
    return { controlled: Boolean(worker.controller), script };
  } catch {
    return null;
  }
}

function deviceSection(): Record<string, unknown> {
  const nav = navigator as Navigator & { deviceMemory?: number; standalone?: boolean };
  const viewport = window.visualViewport;
  let displayModeStandalone = false;
  try {
    displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  } catch { /* ignore */ }
  const parsed = parseClient(navigator.userAgent);
  const client = {
    ...parsed,
    label: clientLabel(parsed),
    mobile: typeof clientHints?.mobile === 'boolean'
      ? clientHints.mobile
      : /Mobile|iPhone|iPad|Android/i.test(navigator.userAgent),
    platform: clientHints?.platform ?? null,
    platformVersion: clientHints?.platformVersion ?? null,
    architecture: clientHints?.architecture ?? null,
    bitness: clientHints?.bitness ?? null,
    brands: clientHints?.brands ?? null,
  };
  return {
    userAgent: navigator.userAgent,
    client,
    cookieEnabled: navigator.cookieEnabled,
    serviceWorker: serviceWorkerSnap(),
    platform: navigator.platform,
    vendor: navigator.vendor,
    maxTouchPoints: navigator.maxTouchPoints,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    languages: Array.from(navigator.languages ?? []),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      orientation: screen.orientation?.type ?? null,
    },
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    visualViewport: viewport ? { height: viewport.height, scale: viewport.scale } : null,
    devicePixelRatio: window.devicePixelRatio,
    displayModeStandalone,
    standalone: nav.standalone === true,
  };
}

function readConnection(): DiagnosticsReport['network']['connection'] {
  try {
    const connection = (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        rtt?: number;
        downlink?: number;
        saveData?: boolean;
        type?: string;
      };
    }).connection;
    if (!connection) return null;
    const out: NonNullable<DiagnosticsReport['network']['connection']> = {};
    if (typeof connection.effectiveType === 'string') out.effectiveType = connection.effectiveType;
    if (typeof connection.rtt === 'number') out.rtt = connection.rtt;
    if (typeof connection.downlink === 'number') out.downlink = connection.downlink;
    if (typeof connection.saveData === 'boolean') out.saveData = connection.saveData;
    if (typeof connection.type === 'string') out.type = connection.type;
    return out;
  } catch {
    return null;
  }
}

function networkSection(entry: PerformanceNavigationTiming | null): DiagnosticsReport['network'] {
  return {
    onLine: navigator.onLine,
    connection: readConnection(),
    visibilityState: document.visibilityState,
    navigationType: entry?.type ?? null,
    redirectCount: typeof entry?.redirectCount === 'number' ? entry.redirectCount : null,
  };
}

function emptyNetwork(): DiagnosticsReport['network'] {
  return {
    onLine: false,
    connection: null,
    visibilityState: 'unknown',
    navigationType: null,
    redirectCount: null,
  };
}

function decodeJwtTimes(token: string): { exp: number | null; iat: number | null } {
  try {
    const part = token.split('.')[1];
    if (!part) return { exp: null, iat: null };
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const json = JSON.parse(atob(padded + pad)) as { exp?: unknown; iat?: unknown };
    return {
      exp: typeof json.exp === 'number' ? json.exp : null,
      iat: typeof json.iat === 'number' ? json.iat : null,
    };
  } catch {
    return { exp: null, iat: null };
  }
}

function storageKeySizes(store: Storage): { key: string; bytes: number }[] {
  try {
    const out: { key: string; bytes: number }[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key) continue;
      out.push({ key, bytes: key.length + (store.getItem(key)?.length ?? 0) });
    }
    return out;
  } catch {
    return [];
  }
}

function authSection(): Record<string, unknown> {
  let token: string | null = null;
  try { token = getAuthToken(); } catch { token = null; }
  const times = token ? decodeJwtTimes(token) : { exp: null, iat: null };
  let userId: string | null = null;
  try { userId = getUserId(); } catch { userId = null; }
  let role: string | null = null;
  try { role = getRole(); } catch { role = null; }
  return {
    authTokenPresent: Boolean(token),
    authTokenLength: token ? token.length : 0,
    userId,
    role,
    exp: times.exp,
    iat: times.iat,
    localStorageKeys: storageKeySizes(localStorage),
    sessionStorageKeys: storageKeySizes(sessionStorage),
  };
}

function measureStore(store: Storage): number | null {
  try {
    let total = 0;
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key) continue;
      total += key.length + (store.getItem(key)?.length ?? 0);
    }
    return total;
  } catch {
    return null;
  }
}

function storageSection(): DiagnosticsReport['storage'] {
  return {
    estimate: storageEstimate,
    localStorageBytes: measureStore(localStorage),
    sessionStorageBytes: measureStore(sessionStorage),
  };
}

function emptyStorage(): DiagnosticsReport['storage'] {
  return { estimate: null, localStorageBytes: null, sessionStorageBytes: null };
}

function navigationSection(entry: PerformanceNavigationTiming | null): Record<string, unknown> {
  let snap: Record<string, unknown> | null = null;
  if (entry) {
    try { snap = snapshotNavigation(entry); } catch { snap = null; }
  }
  if (!snap && navigationObserved) snap = navigationObserved;
  let fcp: number | null = null;
  try {
    const paint = performance.getEntriesByName('first-contentful-paint')[0];
    if (paint) fcp = paint.startTime;
  } catch { /* ignore */ }
  return {
    ...(snap ?? {}),
    fcp,
    domContentLoaded: snap?.domContentLoadedEventEnd ?? null,
    load: snap?.loadEventEnd ?? null,
    timeOrigin: typeof performance.timeOrigin === 'number' ? performance.timeOrigin : null,
  };
}

function bundleLabel(moduleScript: string): string {
  if (!moduleScript) return 'unknown';
  try {
    const path = new URL(moduleScript, location.origin).pathname;
    return path.split('/').pop() || 'unknown';
  } catch {
    const parts = moduleScript.split('/');
    return parts[parts.length - 1] || 'unknown';
  }
}

function lastErrorOf(list: DiagEvent[]): string {
  for (let i = list.length - 1; i >= 0; i--) {
    const type = list[i]?.type ?? '';
    if (/error|timeout|abort/i.test(type)) return type;
  }
  return 'none';
}

function makeSummary(report: DiagnosticsReport): string {
  return `session=${report.sessionId}, events=${report.events.length}, online=${report.network.onLine}, bundle=${bundleLabel(report.app.moduleScript)}, lastError=${lastErrorOf(report.events)}`;
}

function buildReportInner(): DiagnosticsReport {
  const navEntry = readNavigationEntry();
  const report: DiagnosticsReport = {
    schemaVersion: SCHEMA_VERSION,
    sessionId: getDiagSessionId(),
    generatedAt: new Date().toISOString(),
    app: safeSection(appSection, emptyApp()),
    device: safeSection(deviceSection, {}),
    network: safeSection(() => networkSection(navEntry), emptyNetwork()),
    auth: safeSection(authSection, {}),
    storage: safeSection(storageSection, emptyStorage()),
    navigation: safeSection(() => navigationSection(navEntry), {
      fcp: null,
      domContentLoaded: null,
      load: null,
      timeOrigin: null,
    }),
    events: events.slice(),
    resources: resources.slice(),
    summary: '',
    truncated: false,
  };
  report.summary = makeSummary(report);
  let json = JSON.stringify(report);
  let guard = 0;
  while (json.length > MAX_REPORT_BYTES && guard < 40) {
    guard += 1;
    report.truncated = true;
    if (report.events.length > 0) {
      report.events.splice(0, Math.max(1, Math.ceil(report.events.length / 2)));
    } else if (report.resources.length > 0) {
      report.resources.splice(0, Math.max(1, Math.ceil(report.resources.length / 2)));
    } else {
      break;
    }
    report.summary = makeSummary(report);
    json = JSON.stringify(report);
  }
  if (json.length > MAX_REPORT_BYTES) report.truncated = true;
  return report;
}

export function buildDiagnosticsReport(): DiagnosticsReport {
  try {
    return buildReportInner();
  } catch {
    const sessionId = (() => {
      try { return getDiagSessionId(); } catch { return 'unknown'; }
    })();
    const report: DiagnosticsReport = {
      schemaVersion: SCHEMA_VERSION,
      sessionId,
      generatedAt: new Date().toISOString(),
      app: emptyApp(),
      device: {},
      network: emptyNetwork(),
      auth: {},
      storage: emptyStorage(),
      navigation: {},
      events: [],
      resources: [],
      summary: '',
      truncated: true,
    };
    report.summary = `session=${sessionId}, events=0, online=unknown, bundle=unknown, lastError=report_build_error`;
    return report;
  }
}

function diagnosticsFileName(sessionId: string): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  const safeId = sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'session';
  return `ms-diag-${safeId}-${stamp}.json`;
}

function reportJson(): { json: string; sessionId: string } | null {
  try {
    const report = buildDiagnosticsReport();
    return { json: JSON.stringify(report), sessionId: report.sessionId };
  } catch {
    return null;
  }
}

export function downloadDiagnostics(): void {
  try {
    diagEvent('diag_download', {});
    const built = reportJson();
    if (!built) return;
    const blob = new Blob([built.json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = diagnosticsFileName(built.sessionId);
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch { /* fail-open */ }
}

export async function copyDiagnostics(): Promise<void> {
  const report = buildDiagnosticsReport();
  const json = JSON.stringify(report, null, 2);
  const ok = await copyToClipboard(json);
  if (!ok) throw new Error('copy failed');
}

function makeShareFile(): File | null {
  const built = reportJson();
  if (!built) return null;
  try {
    const blob = new Blob([built.json], { type: 'application/json;charset=utf-8' });
    return new File([blob], diagnosticsFileName(built.sessionId), { type: 'application/json' });
  } catch {
    return null;
  }
}

export async function shareDiagnostics(): Promise<boolean> {
  const file = makeShareFile();
  if (!file) return false;
  let allowed = false;
  try {
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    allowed = typeof nav.canShare === 'function' && nav.canShare({ files: [file] });
  } catch {
    allowed = false;
  }
  if (!allowed || typeof navigator.share !== 'function') return false;
  await navigator.share({ files: [file], title: 'Диагностика Mystery Shopper' });
  return true;
}

export async function uploadDiagnostics(): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const built = reportJson();
    if (!built) return false;
    const headers = new Headers({ 'Content-Type': 'application/json' });
    applyDiagHeaders(headers, '/api/diagnostics');
    const response = await fetch('/api/diagnostics', {
      method: 'POST',
      headers,
      body: built.json,
      cache: 'no-store',
      signal: controller.signal,
    });
    diagEvent('diag_upload', { status: response.status, ok: response.ok, bytes: built.json.length });
    return response.ok;
  } catch (error) {
    diagError('diag_upload_error', error);
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function deliverDiagnostics(): Promise<'shared' | 'uploaded' | 'downloaded' | 'cancelled'> {
  try {
    if (await shareDiagnostics()) return 'shared';
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    if (name === 'AbortError') return 'cancelled';
  }
  try {
    if (await uploadDiagnostics()) return 'uploaded';
  } catch { /* fall through to download */ }
  try { downloadDiagnostics(); } catch { /* ignore */ }
  return 'downloaded';
}

export function clearDiagnostics(): void {
  try {
    if (persistTimer) {
      window.clearTimeout(persistTimer);
      persistTimer = 0;
    }
    events = [];
    eventBytesTotal = 0;
    resources = [];
    memoryFails = 0;
    try { sessionStorage.removeItem(FAIL_COUNT_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(storageKey(getDiagSessionId())); } catch { /* ignore */ }
  } catch { /* fail-open */ }
}

export function openDiagnosticsPanel(): void {
  void (async () => {
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        storageEstimate = {
          quota: typeof est.quota === 'number' ? est.quota : undefined,
          usage: typeof est.usage === 'number' ? est.usage : undefined,
        };
      }
    } catch { /* ignore */ }
    try {
      const mod = await import('../components/DiagnosticsPanel.js');
      mod.mountDiagnosticsPanel();
    } catch { /* fail-open */ }
  })();
}

function abortAfter(ms: number): { signal: AbortSignal; cancel: () => void } {
  try {
    const timeout = (AbortSignal as { timeout?: (n: number) => AbortSignal }).timeout;
    if (typeof timeout === 'function') return { signal: timeout(ms), cancel: () => {} };
  } catch { /* fallback */ }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => window.clearTimeout(timer) };
}

/** Сырой GET /health, не через netFetch — иначе диагностика зациклится на собственных запросах. */
export async function pingHealth(): Promise<void> {
  if (healthPingBusy) return;
  healthPingBusy = true;
  const started = typeof performance.now === 'function' ? performance.now() : Date.now();
  const abort = abortAfter(5000);
  try {
    let status: number | null = null;
    let serverDate: string | null = null;
    let errorMessage: string | null = null;
    try {
      const response = await fetch('/health', { cache: 'no-store', signal: abort.signal });
      status = response.status;
      serverDate = response.headers.get('date');
      try { await response.body?.cancel(); } catch { /* ignore */ }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'health ping failed';
    }
    const durationMs = Math.round((typeof performance.now === 'function' ? performance.now() : Date.now()) - started);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const clientNow = Date.now();
    const serverMs = serverDate ? Date.parse(serverDate) : NaN;
    const resourceTiming = readResourceTiming('/health', started);
    diagEvent('health_ping', {
      status,
      durationMs,
      serverDate,
      clientDate: new Date(clientNow).toISOString(),
      clockSkewMs: Number.isFinite(serverMs) ? serverMs - clientNow : null,
      error: errorMessage,
      resourceTiming,
      likelyReusedConnection: resourceTiming ? resourceTiming.likelyReusedConnection : null,
    });
  } catch { /* fail-open */ } finally {
    abort.cancel();
    healthPingBusy = false;
  }
}

/** Первая сетевая ошибка входа — скачать отчёт, со второй — ещё и открыть панель. */
export function assistLoginNetworkFailure(): void {
  if (assistLock) return;
  assistLock = true;
  try {
    memoryFails += 1;
    let n = memoryFails;
    try {
      const stored = Number(sessionStorage.getItem(FAIL_COUNT_KEY) || '0');
      n = (Number.isFinite(stored) ? stored : 0) + 1;
      sessionStorage.setItem(FAIL_COUNT_KEY, String(Math.min(n, 99)));
      memoryFails = n;
    } catch { /* остаётся счётчик в памяти */ }
    diagEvent('diag_assist', { failureCount: n, openPanel: n >= 2 });
    if (n >= 2) {
      try { openDiagnosticsPanel(); } catch { /* ignore */ }
    }
    try { downloadDiagnostics(); } catch { /* Safari может заблокировать автоскачивание */ }
  } catch { /* fail-open */ } finally {
    assistLock = false;
  }
}
