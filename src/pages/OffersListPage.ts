// Страница списка предложений (исполнитель): секции, фильтры, сортировка

import type { Offer, Application, SearchParams } from '../types/index.js';
import { MAX_PARTICIPANTS_UNLIMITED } from '../config/offerLimits.js';
import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import {
  inferRewardKind,
  offerMatchesProductCategory,
  offerMatchesRewardFilter,
  offerMentionsDiscount,
  selectHighIncomeOffers,
  sortOffersForList,
  escapeHtml,
  formatExecutorRewardNumber
} from '../utils/offerDisplay.js';
import { listRowCardClasses, bindListRowCardHover } from '../utils/listRowUi.js';

const REWARD_LABELS: Record<string, string> = {
  bonus: '',
  non_bonus: 'Иное',
  mixed: 'Смешанное',
  unknown: ''
};

const CATEGORY_NAMES: Record<string, string> = {
  clothing: 'Одежда',
  shoes: 'Одежда',
  electronics: 'Электроника',
  food: 'Продукты',
  sports: 'Спорт',
  beauty: 'Красота'
};

type OfferSectionId = 'accepted' | 'available' | 'completed';

const SECTION_ORDER: OfferSectionId[] = ['accepted', 'available', 'completed'];

const PERK_META: Record<string, { title: string; note: string; empty: string }> = {
  high_income: {
    title: 'Высокий доход',
    note: 'Показаны задания с наибольшим вознаграждением',
    empty: 'Сейчас нет заданий с высоким вознаграждением'
  },
  discount: {
    title: 'Большая скидка',
    note: 'Показаны задания, где упомянута скидка',
    empty: 'Сейчас нет заданий со скидкой'
  }
};

function listHeading(queryParams: URLSearchParams): { title: string; note: string } {
  const perk = queryParams.get('perk');
  if (perk && PERK_META[perk]) {
    return { title: PERK_META[perk].title, note: PERK_META[perk].note };
  }
  const category = queryParams.get('category');
  if (category && CATEGORY_NAMES[category]) {
    return { title: `${CATEGORY_NAMES[category]} — задания`, note: '' };
  }
  return { title: 'Задания', note: '' };
}

/** Медиана «высокого дохода» считается по всем секциям сразу, не внутри каждой. */
function applyPerkToGroups(
  groups: [Offer[], Offer[], Offer[]],
  perk: string | null
): [Offer[], Offer[], Offer[]] {
  if (perk === 'discount') {
    return [
      groups[0].filter(offerMentionsDiscount),
      groups[1].filter(offerMentionsDiscount),
      groups[2].filter(offerMentionsDiscount)
    ];
  }
  if (perk === 'high_income') {
    const allowed = new Set(selectHighIncomeOffers(groups.flat()).map((o) => o.id));
    return [
      groups[0].filter((o) => allowed.has(o.id)),
      groups[1].filter((o) => allowed.has(o.id)),
      groups[2].filter((o) => allowed.has(o.id))
    ];
  }
  return groups;
}

function normalizeApplications(data: unknown): Application[] {
  if (Array.isArray(data)) return data as Application[];
  if (data && typeof data === 'object' && 'application_id' in (data as object)) {
    return [data as Application];
  }
  return [];
}

function latestAppByOffer(apps: Application[]): Map<string, Application> {
  const sorted = [...apps].sort(
    (a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
  );
  const m = new Map<string, Application>();
  for (const a of sorted) {
    if (!m.has(a.offer_id)) m.set(a.offer_id, a);
  }
  return m;
}

function isApplicationNeedsRevision(app: Application): boolean {
  return app.report_status === 'rejected' && Boolean(app.can_resubmit);
}

function isApplicationCompleted(app: Application): boolean {
  if (isApplicationNeedsRevision(app)) return false;
  if (app.has_report) return true;
  const s = (app.status || '').toLowerCase();
  return s === 'completed' || s === 'done';
}

function isApplicationInProgress(app: Application): boolean {
  if (isApplicationNeedsRevision(app)) return true;
  if (isApplicationCompleted(app)) return false;
  const s = (app.status || '').toLowerCase();
  return s === 'pending' || s === 'approved' || s === 'in_progress' || s === 'accepted';
}

function partitionOffers(offers: Offer[], applications: Application[]) {
  const byOffer = latestAppByOffer(applications);
  const accepted: Offer[] = [];
  const available: Offer[] = [];
  const completed: Offer[] = [];

  for (const offer of offers) {
    const app = byOffer.get(offer.id);
    if (!app) {
      available.push(offer);
      continue;
    }
    if (isApplicationCompleted(app)) {
      completed.push(offer);
    } else if (isApplicationInProgress(app)) {
      accepted.push(offer);
    } else {
      available.push(offer);
    }
  }
  return { accepted, available, completed };
}

function matchesSearch(offer: Offer, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = `${offer.title || ''} ${offer.description || ''}`.toLowerCase();
  return hay.includes(s);
}

function applyListFilters(offers: Offer[], opts: { search: string; category: string | null; reward: string | null }): Offer[] {
  return offers.filter(
    (o) =>
      matchesSearch(o, opts.search) &&
      offerMatchesProductCategory(o, opts.category) &&
      offerMatchesRewardFilter(o, opts.reward)
  );
}

function setHashQuery(updates: Record<string, string | undefined | null>) {
  const params = new URLSearchParams(router.getQueryParams());
  for (const [k, v] of Object.entries(updates)) {
    if (v == null || v === '') params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  window.location.hash = qs ? `#/offers?${qs}` : '#/offers';
}

export async function createOffersListPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'offers-list-page';

  const heading = listHeading(router.getQueryParams());

  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 pb-2">
          <h1 id="offers-page-title" class="text-2xl font-bold${heading.note ? '' : ' mb-3'}">${escapeHtml(heading.title)}</h1>
          <p id="offers-perk-note" class="text-sm text-slate-500 mt-1 mb-3${heading.note ? '' : ' hidden'}">${escapeHtml(heading.note)}</p>
          <div class="flex items-center gap-2 mb-1">
            <div class="relative flex-1">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg class="text-slate-500" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input id="search-input" class="w-full h-12 pl-10 pr-3 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="Поиск по названию и описанию..." type="text"/>
            </div>
            <button type="button" id="filters-panel-toggle" class="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" aria-label="Фильтры и сортировка" aria-haspopup="dialog" aria-expanded="false" aria-controls="filters-panel">
              <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
            </button>
          </div>
        </header>
        <div id="filters-panel" class="hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="filters-panel-title" hidden>
          <div id="filters-panel-backdrop" class="absolute inset-0 bg-black/50"></div>
          <div class="relative mx-auto mt-16 w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-4 shadow-xl flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <h2 id="filters-panel-title" class="text-lg font-semibold text-slate-900">Фильтры и сортировка</h2>
              <button type="button" id="filters-panel-close" class="h-9 w-9 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Закрыть">
                <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <label class="flex flex-col gap-1 text-xs text-slate-600">
              <span>Тема</span>
              <select id="filter-category" class="h-10 rounded-lg border border-slate-200 px-2 text-sm bg-white">
                <option value="">Все темы</option>
                <option value="clothing">Одежда</option>
                <option value="shoes">Одежда</option>
                <option value="electronics">Электроника</option>
                <option value="food">Продукты</option>
                <option value="sports">Спорт</option>
                <option value="beauty">Красота</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs text-slate-600">
              <span>Вознаграждение</span>
              <select id="filter-reward" class="h-10 rounded-lg border border-slate-200 px-2 text-sm bg-white">
                <option value="all">Все типы</option>
                <option value="bonus">Рэшки</option>
                <option value="non_bonus">Не Рэшки</option>
                <option value="mixed">Смешанное</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs text-slate-600">
              <span>Сортировка</span>
              <select id="sort-select" class="h-10 rounded-lg border border-slate-200 px-2 text-sm bg-white">
                <option value="created_desc">Сначала новые</option>
                <option value="created_asc">Сначала старые</option>
                <option value="price_desc">Вознаграждение по убыванию</option>
                <option value="price_asc">Вознаграждение по возрастанию</option>
                <option value="participants_desc">Больше исполнителей</option>
                <option value="participants_asc">Меньше исполнителей</option>
                <option value="reward_kind">Тип вознаграждения</option>
              </select>
            </label>
            <div class="flex gap-2 pt-1">
              <button type="button" id="filters-reset" class="flex-1 h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Сбросить</button>
              <button type="button" id="filters-apply" class="flex-1 h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">Применить</button>
            </div>
          </div>
        </div>
        
        <main class="pb-28">
          <div class="px-4 pt-2 pb-4">
            <div id="loading-state" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span class="ml-2 text-slate-600">Загрузка заданий...</span>
            </div>
            
            <div id="error-state" class="hidden text-center py-8">
              <div class="text-red-500 mb-2">⚠️</div>
              <p class="text-slate-600 mb-4">Не удалось загрузить задания</p>
              <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Попробовать снова
              </button>
            </div>
            
            <div id="empty-state" class="hidden text-center py-8">
              <div class="text-slate-400 mb-2">📭</div>
              <p id="empty-state-text" class="text-slate-600">Нет заданий по выбранным условиям</p>
              <a id="empty-state-all" href="#/offers" class="hidden inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg font-semibold">Все задания</a>
            </div>
            
            <div id="offers-container" class="hidden">
              <div id="offers-section-tabs" class="hidden mb-3" hidden>
                <div class="flex p-1 rounded-lg bg-slate-100 gap-1" role="tablist" aria-label="Списки заданий">
                  <button type="button" role="tab" id="offers-tab-accepted" data-section="accepted" aria-controls="accepted-offers" aria-selected="false" class="offers-section-tab flex-1 py-2 px-2 rounded-md text-sm font-semibold text-slate-500">Принятые</button>
                  <button type="button" role="tab" id="offers-tab-available" data-section="available" aria-controls="available-offers" aria-selected="false" class="offers-section-tab flex-1 py-2 px-2 rounded-md text-sm font-semibold text-slate-500">Доступные</button>
                  <button type="button" role="tab" id="offers-tab-completed" data-section="completed" aria-controls="completed-offers" aria-selected="false" class="offers-section-tab flex-1 py-2 px-2 rounded-md text-sm font-semibold text-slate-500">Выполненные</button>
                </div>
              </div>
              <div id="offers-section-viewport" class="touch-pan-y">
                <div id="accepted-offers" role="tabpanel" aria-labelledby="offers-tab-accepted" class="grid grid-cols-1 gap-4"></div>
                <div id="available-offers" role="tabpanel" aria-labelledby="offers-tab-available" class="grid grid-cols-1 gap-4 hidden" hidden></div>
                <div id="completed-offers" role="tabpanel" aria-labelledby="offers-tab-completed" class="grid grid-cols-1 gap-4 hidden" hidden></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  await loadOffers(page);
  setupEventHandlers(page);
  return page;
}

function renderOfferCard(offer: Offer, variant: 'default' | 'completed', app?: Application): string {
  const priceStr = formatExecutorRewardNumber(offer);
  const rk = inferRewardKind(offer);
  const badge = REWARD_LABELS[rk] || '';
  const needsRevision = app ? isApplicationNeedsRevision(app) : false;
  const doneBadge =
    needsRevision
      ? '<span class="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">Требует доработки</span>'
      : variant === 'completed'
        ? '<span class="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">Отчёт отправлен</span>'
        : '';
  return `
    <div class="${listRowCardClasses('p-4')}${offer.is_promo ? ' list-row-card--promo' : ''}" data-offer-id="${offer.id}">
      <div class="flex justify-between items-start gap-2 mb-2">
        <h3 class="font-semibold">${escapeHtml(offer.title || 'Без названия')}</h3>
        ${doneBadge}
      </div>
      <p class="text-slate-600 text-sm mb-2 line-clamp-3">${escapeHtml(offer.description || '')}</p>
      <div class="flex flex-wrap justify-between items-center gap-2 text-sm">
        <span class="text-primary font-bold">${priceStr}</span>
        ${badge ? `<span class="text-slate-500 text-xs">${escapeHtml(badge)}</span>` : ''}
      </div>
      <div class="mt-1 text-xs text-slate-400">Исполнителей: ${Number(offer.current_participants ?? 0)} / ${offer.max_participants === MAX_PARTICIPANTS_UNLIMITED ? 'без лимита' : Number(offer.max_participants)}</div>
    </div>
  `;
}

function syncListHeading(page: HTMLElement) {
  const q = router.getQueryParams();
  const { title, note } = listHeading(q);
  const titleEl = page.querySelector('#offers-page-title');
  const noteEl = page.querySelector('#offers-perk-note');
  if (titleEl) {
    titleEl.textContent = title;
    titleEl.classList.toggle('mb-3', !note);
  }
  if (noteEl) {
    noteEl.textContent = note;
    noteEl.classList.toggle('hidden', !note);
  }
}

function showPerkEmpty(page: HTMLElement, perk: string | null) {
  const emptyState = page.querySelector('#empty-state') as HTMLElement;
  const emptyText = page.querySelector('#empty-state-text');
  const emptyLink = page.querySelector('#empty-state-all');
  const offersContainer = page.querySelector('#offers-container') as HTMLElement;
  const errorState = page.querySelector('#error-state') as HTMLElement;
  const meta = perk ? PERK_META[perk] : undefined;
  if (emptyText) {
    emptyText.textContent = meta?.empty ?? 'Нет заданий по выбранным условиям';
  }
  emptyLink?.classList.toggle('hidden', !meta);
  showState(emptyState, [errorState, offersContainer]);
}

function syncFiltersFromUrl(page: HTMLElement) {
  const q = router.getQueryParams();
  const search = page.querySelector('#search-input') as HTMLInputElement;
  const cat = page.querySelector('#filter-category') as HTMLSelectElement;
  const reward = page.querySelector('#filter-reward') as HTMLSelectElement;
  const sort = page.querySelector('#sort-select') as HTMLSelectElement;
  if (search) search.value = q.get('query') || '';
  if (cat) cat.value = q.get('category') || '';
  if (reward) reward.value = q.has('reward') ? q.get('reward') || 'all' : 'all';
  if (sort) sort.value = q.get('sort') || 'created_desc';
  const filtersToggle = page.querySelector('#filters-panel-toggle');
  const filtersActive = Boolean(
    q.get('category') ||
      (q.get('reward') && q.get('reward') !== 'all') ||
      (q.get('sort') && q.get('sort') !== 'created_desc')
  );
  filtersToggle?.classList.toggle('border-primary', filtersActive);
  filtersToggle?.classList.toggle('text-primary', filtersActive);
  filtersToggle?.classList.toggle('border-slate-200', !filtersActive);
  filtersToggle?.classList.toggle('text-slate-700', !filtersActive);
}

async function loadOffers(page: HTMLElement) {
  const loadingState = page.querySelector('#loading-state') as HTMLElement;
  const errorState = page.querySelector('#error-state') as HTMLElement;
  const emptyState = page.querySelector('#empty-state') as HTMLElement;
  const offersContainer = page.querySelector('#offers-container') as HTMLElement;

  try {
    apiService.clearCache('/offers');
    apiService.clearCache('/applies');
    showState(loadingState, [errorState, emptyState, offersContainer]);

    const queryParams = router.getQueryParams();
    const searchQuery = queryParams.get('query') || '';
    const categoryFilter = queryParams.get('category');
    const rewardFilter = queryParams.get('reward') || 'all';
    const sortKey = queryParams.get('sort') || 'created_desc';
    const perk = queryParams.get('perk');
    syncListHeading(page);
    syncFiltersFromUrl(page);

    const searchParams: SearchParams = {};
    if (searchQuery) searchParams.query = searchQuery;
    const offers = await apiService.getOffers(searchParams);

    let applications: Application[] = [];
    try {
      const appliesResponse = await apiService.getApplies();
      applications = normalizeApplications(appliesResponse.data);
    } catch (e) {
      console.error('Ошибка загрузки заявок:', e);
    }

    hideState(loadingState);

    const filterOpts = {
      search: searchQuery,
      category: categoryFilter,
      reward: rewardFilter === 'all' ? null : rewardFilter
    };

    const { accepted, available, completed } = partitionOffers(offers, applications);

    let acc = applyListFilters(accepted, filterOpts);
    let av = applyListFilters(available, filterOpts);
    let comp = applyListFilters(completed, filterOpts);

    [acc, av, comp] = applyPerkToGroups([acc, av, comp], perk);

    acc = sortOffersForList(acc, sortKey);
    av = sortOffersForList(av, sortKey);
    comp = sortOffersForList(comp, sortKey);

    const visibleCount = acc.length + av.length + comp.length;

    if (offers.length === 0 || (perk && PERK_META[perk] && visibleCount === 0)) {
      showPerkEmpty(page, perk && PERK_META[perk] ? perk : null);
      syncFiltersFromUrl(page);
      return;
    }

    const sectionOffers: Record<OfferSectionId, Offer[]> = {
      accepted: acc,
      available: av,
      completed: comp
    };
    const present = SECTION_ORDER.filter((id) => sectionOffers[id].length > 0);
    if (present.length === 0) {
      showPerkEmpty(page, perk && PERK_META[perk] ? perk : null);
      syncFiltersFromUrl(page);
      return;
    }

    const byOffer = latestAppByOffer(applications);
    for (const id of SECTION_ORDER) {
      const panel = page.querySelector(`#${id}-offers`) as HTMLElement | null;
      const tab = page.querySelector(`#offers-tab-${id}`);
      const list = sectionOffers[id];
      const shown = list.length > 0;
      tab?.classList.toggle('hidden', !shown);
      tab?.toggleAttribute('hidden', !shown);
      if (!panel) continue;
      if (id === 'accepted') {
        panel.innerHTML = list.map((o) => renderOfferCard(o, 'default', byOffer.get(o.id))).join('');
      } else if (id === 'completed') {
        panel.innerHTML = list.map((o) => renderOfferCard(o, 'completed')).join('');
      } else {
        panel.innerHTML = list.map((o) => renderOfferCard(o, 'default')).join('');
      }
    }

    const remembered = page.dataset.activeSection as OfferSectionId | undefined;
    showOfferSection(page, remembered && present.includes(remembered) ? remembered : present[0]);

    emptyState.classList.add('hidden');
    showState(offersContainer, [errorState, emptyState]);
    bindListRowCardHover(offersContainer);

    syncFiltersFromUrl(page);
  } catch (error) {
    console.error('Ошибка загрузки предложений:', error);
    hideState(loadingState);
    syncListHeading(page);
    syncFiltersFromUrl(page);
    showState(errorState, [emptyState, offersContainer]);
  }
}

function showState(element: HTMLElement, hideElements: HTMLElement[]) {
  element.classList.remove('hidden');
  hideElements.forEach((el) => el.classList.add('hidden'));
}

function hideState(element: HTMLElement) {
  element.classList.add('hidden');
}

function visibleOfferSections(page: HTMLElement): OfferSectionId[] {
  return SECTION_ORDER.filter((id) => {
    const tab = page.querySelector(`#offers-tab-${id}`);
    return Boolean(tab && !tab.hasAttribute('hidden'));
  });
}

function showOfferSection(page: HTMLElement, id: OfferSectionId) {
  const visible = visibleOfferSections(page);
  const next = visible.includes(id) ? id : visible[0];
  if (!next) return;
  page.dataset.activeSection = next;
  const tabs = page.querySelector('#offers-section-tabs');
  const showTabs = visible.length > 1;
  tabs?.classList.toggle('hidden', !showTabs);
  tabs?.toggleAttribute('hidden', !showTabs);
  for (const sectionId of SECTION_ORDER) {
    const tab = page.querySelector(`#offers-tab-${sectionId}`);
    const panel = page.querySelector(`#${sectionId}-offers`);
    const on = sectionId === next;
    tab?.setAttribute('aria-selected', on ? 'true' : 'false');
    tab?.classList.toggle('bg-white', on);
    tab?.classList.toggle('text-slate-900', on);
    tab?.classList.toggle('shadow-sm', on);
    tab?.classList.toggle('text-slate-500', !on);
    panel?.classList.toggle('hidden', !on);
    panel?.toggleAttribute('hidden', !on);
  }
}

function setupEventHandlers(page: HTMLElement) {
  const searchInput = page.querySelector('#search-input') as HTMLInputElement;
  let searchTimeout: number;

  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      const query = searchInput.value.trim();
      setHashQuery({ query: query || null });
    }, 400);
  });

  const filtersToggle = page.querySelector('#filters-panel-toggle') as HTMLButtonElement;
  const filtersPanel = page.querySelector('#filters-panel') as HTMLElement;
  const setFiltersOpen = (open: boolean) => {
    if (!filtersPanel || !filtersToggle) return;
    filtersPanel.classList.toggle('hidden', !open);
    filtersPanel.toggleAttribute('hidden', !open);
    filtersToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  const closeFilters = () => {
    syncFiltersFromUrl(page);
    setFiltersOpen(false);
  };
  const readFilterDraft = () => {
    const category = (page.querySelector('#filter-category') as HTMLSelectElement | null)?.value || null;
    const rewardRaw = (page.querySelector('#filter-reward') as HTMLSelectElement | null)?.value || 'all';
    const sortRaw = (page.querySelector('#sort-select') as HTMLSelectElement | null)?.value || 'created_desc';
    return {
      category: category || null,
      reward: rewardRaw === 'all' ? null : rewardRaw,
      sort: sortRaw === 'created_desc' ? null : sortRaw
    };
  };
  filtersToggle?.addEventListener('click', () => {
    const opening = filtersPanel.classList.contains('hidden');
    if (opening) syncFiltersFromUrl(page);
    setFiltersOpen(opening);
  });
  page.querySelector('#filters-panel-close')?.addEventListener('click', closeFilters);
  page.querySelector('#filters-panel-backdrop')?.addEventListener('click', closeFilters);
  page.querySelector('#filters-apply')?.addEventListener('click', () => {
    setHashQuery(readFilterDraft());
    setFiltersOpen(false);
  });
  page.querySelector('#filters-reset')?.addEventListener('click', () => {
    const category = page.querySelector('#filter-category') as HTMLSelectElement | null;
    const reward = page.querySelector('#filter-reward') as HTMLSelectElement | null;
    const sort = page.querySelector('#sort-select') as HTMLSelectElement | null;
    if (category) category.value = '';
    if (reward) reward.value = 'all';
    if (sort) sort.value = 'created_desc';
    setHashQuery({ category: null, reward: null, sort: null });
  });
  const onFiltersKey = (event: KeyboardEvent) => {
    if (!page.isConnected) {
      document.removeEventListener('keydown', onFiltersKey);
      document.body.style.overflow = '';
      return;
    }
    if (event.key === 'Escape' && filtersPanel && !filtersPanel.classList.contains('hidden')) {
      closeFilters();
    }
  };
  document.addEventListener('keydown', onFiltersKey);
  setFiltersOpen(false);

  page.querySelector('#retry-btn')?.addEventListener('click', () => loadOffers(page));

  page.querySelectorAll<HTMLButtonElement>('.offers-section-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.section as OfferSectionId | undefined;
      if (id) showOfferSection(page, id);
    });
  });

  const viewport = page.querySelector('#offers-section-viewport');
  let swipe: { id: number; x: number; y: number } | null = null;
  let suppressCardClick = false;
  viewport?.addEventListener('pointerdown', (e) => {
    const event = e as PointerEvent;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  viewport?.addEventListener('pointerup', (e) => {
    const event = e as PointerEvent;
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const visible = visibleOfferSections(page);
    const current = (page.dataset.activeSection || visible[0]) as OfferSectionId;
    const index = visible.indexOf(current);
    const next = dx < 0 ? visible[index + 1] : visible[index - 1];
    if (!next) return;
    suppressCardClick = true;
    showOfferSection(page, next);
  });
  viewport?.addEventListener('pointercancel', () => {
    swipe = null;
  });

  page.addEventListener('click', (e) => {
    if (suppressCardClick) {
      suppressCardClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const target = e.target as HTMLElement;
    const offerCard = target.closest('[data-offer-id]') as HTMLElement;
    if (offerCard?.dataset.offerId) {
      router.navigate(`/offers/${offerCard.dataset.offerId}`);
    }
  });

  const onHashChange = () => {
    if (!page.isConnected) {
      window.removeEventListener('hashchange', onHashChange);
      return;
    }
    if (/^#\/offers(\?|$)/.test(window.location.hash)) {
      loadOffers(page);
    }
  };
  window.addEventListener('hashchange', onHashChange);
}
