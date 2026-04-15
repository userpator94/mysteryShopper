// Страница списка предложений (исполнитель): секции, фильтры, сортировка

import type { Offer, Application, SearchParams } from '../types/index.js';
import { MAX_PARTICIPANTS_UNLIMITED } from '../config/offerLimits.js';
import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import {
  inferRewardKind,
  offerMatchesProductCategory,
  offerMatchesRewardFilter,
  sortOffersForList,
  escapeHtml,
  formatExecutorMoneyRewardShort
} from '../utils/offerDisplay.js';

const REWARD_LABELS: Record<string, string> = {
  bonus: 'Бонусы',
  non_bonus: 'Не бонусы',
  mixed: 'Смешанное',
  unknown: '—'
};

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

function isApplicationCompleted(app: Application): boolean {
  if (app.has_report) return true;
  const s = (app.status || '').toLowerCase();
  return s === 'completed' || s === 'done';
}

function isApplicationInProgress(app: Application): boolean {
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

  const queryParams = router.getQueryParams();
  const category = queryParams.get('category');

  const categoryNames: Record<string, string> = {
    clothing: 'Одежда',
    shoes: 'Обувь',
    electronics: 'Электроника',
    food: 'Продукты',
    sports: 'Спорт',
    beauty: 'Красота'
  };

  const pageTitle =
    category && categoryNames[category] ? `${categoryNames[category]} — предложения` : 'Предложения';

  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 pb-2">
          <h1 class="text-2xl font-bold mb-3">${pageTitle}</h1>
          <div class="relative mb-3">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="text-slate-500" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input id="search-input" class="w-full h-12 pl-10 pr-3 rounded-lg bg-slate-100 text-slate-900 placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-primary" placeholder="Поиск по названию и описанию..." type="text"/>
          </div>
          <div class="mb-1">
            <button type="button" id="filters-panel-toggle" class="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-left text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors" aria-expanded="false" aria-controls="filters-panel">
              <span>Фильтры и сортировка</span>
              <svg id="filters-panel-icon" class="w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div id="filters-panel" class="hidden flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end mt-2 pt-2 border-t border-slate-100">
            <label class="flex flex-col gap-1 text-xs text-slate-600 flex-1 min-w-[140px]">
              <span>Секция</span>
              <select id="filter-section" class="h-10 rounded-lg border border-slate-200 px-2 text-sm bg-white">
                <option value="all">Все секции</option>
                <option value="accepted">Принятые</option>
                <option value="available">Доступные</option>
                <option value="completed">Выполненные</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs text-slate-600 flex-1 min-w-[140px]">
              <span>Тема</span>
              <select id="filter-category" class="h-10 rounded-lg border border-slate-200 px-2 text-sm bg-white">
                <option value="">Все темы</option>
                <option value="clothing">Одежда</option>
                <option value="shoes">Обувь</option>
                <option value="electronics">Электроника</option>
                <option value="food">Продукты</option>
                <option value="sports">Спорт</option>
                <option value="beauty">Красота</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs text-slate-600 flex-1 min-w-[140px]">
              <span>Вознаграждение</span>
              <select id="filter-reward" class="h-10 rounded-lg border border-slate-200 px-2 text-sm bg-white">
                <option value="all">Все типы</option>
                <option value="bonus">Бонусы</option>
                <option value="non_bonus">Не бонусы</option>
                <option value="mixed">Смешанное</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs text-slate-600 flex-1 min-w-[160px]">
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
            </div>
          </div>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div id="loading-state" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span class="ml-2 text-slate-600">Загрузка предложений...</span>
            </div>
            
            <div id="error-state" class="hidden text-center py-8">
              <div class="text-red-500 mb-2">⚠️</div>
              <p class="text-slate-600 mb-4">Не удалось загрузить предложения</p>
              <button id="retry-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Попробовать снова
              </button>
            </div>
            
            <div id="empty-state" class="hidden text-center py-8">
              <div class="text-slate-400 mb-2">📭</div>
              <p class="text-slate-600">Нет предложений по выбранным условиям</p>
            </div>
            
            <div id="offers-container" class="space-y-4 hidden">
              <div id="accepted-section" class="bg-white rounded-lg border border-slate-200 overflow-hidden transition-colors">
                <button type="button" id="accepted-section-header" class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <span class="font-semibold text-lg">Принятые</span>
                  <svg id="accepted-section-icon" class="w-5 h-5 text-slate-500 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div id="accepted-section-content" class="px-4 pb-4">
                  <div id="accepted-offers" class="grid grid-cols-1 gap-4"></div>
                </div>
              </div>
              
              <div id="available-section" class="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <button type="button" id="available-section-header" class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <span class="font-semibold text-lg">Доступные</span>
                  <svg id="available-section-icon" class="w-5 h-5 text-slate-500 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div id="available-section-content" class="px-4 pb-4">
                  <div id="available-offers" class="grid grid-cols-1 gap-4"></div>
                </div>
              </div>

              <div id="completed-section" class="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <button type="button" id="completed-section-header" class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <span class="font-semibold text-lg">Выполненные</span>
                  <svg id="completed-section-icon" class="w-5 h-5 text-slate-500 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div id="completed-section-content" class="px-4 pb-4">
                  <div id="completed-offers" class="grid grid-cols-1 gap-4"></div>
                </div>
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

function renderOfferCard(offer: Offer, variant: 'default' | 'completed'): string {
  const priceStr = formatExecutorMoneyRewardShort(offer);
  const rk = inferRewardKind(offer);
  const badge = REWARD_LABELS[rk] || rk;
  const doneBadge =
    variant === 'completed'
      ? '<span class="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">Отчёт отправлен</span>'
      : '';
  return `
    <div class="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" data-offer-id="${offer.id}">
      <div class="flex justify-between items-start gap-2 mb-2">
        <h3 class="font-semibold">${escapeHtml(offer.title || 'Без названия')}</h3>
        ${doneBadge}
      </div>
      <p class="text-slate-600 text-sm mb-2 line-clamp-3">${escapeHtml(offer.description || '')}</p>
      <div class="flex flex-wrap justify-between items-center gap-2 text-sm">
        <span class="text-primary font-bold">${priceStr}</span>
        <span class="text-slate-500 text-xs">${escapeHtml(badge)}</span>
      </div>
      <div class="mt-1 text-xs text-slate-400">Исполнителей: ${Number(offer.current_participants ?? 0)} / ${offer.max_participants === MAX_PARTICIPANTS_UNLIMITED ? 'без лимита' : Number(offer.max_participants)}</div>
    </div>
  `;
}

function syncFiltersFromUrl(page: HTMLElement) {
  const q = router.getQueryParams();
  const search = page.querySelector('#search-input') as HTMLInputElement;
  const section = page.querySelector('#filter-section') as HTMLSelectElement;
  const cat = page.querySelector('#filter-category') as HTMLSelectElement;
  const reward = page.querySelector('#filter-reward') as HTMLSelectElement;
  const sort = page.querySelector('#sort-select') as HTMLSelectElement;
  if (search) search.value = q.get('query') || '';
  if (section) section.value = q.has('section') ? q.get('section') || 'all' : 'all';
  if (cat) cat.value = q.get('category') || '';
  if (reward) reward.value = q.has('reward') ? q.get('reward') || 'all' : 'all';
  if (sort) sort.value = q.get('sort') || 'created_desc';
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
    const sectionView = queryParams.get('section') || 'all';

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

    acc = sortOffersForList(acc, sortKey);
    av = sortOffersForList(av, sortKey);
    comp = sortOffersForList(comp, sortKey);

    if (offers.length === 0) {
      emptyState.classList.remove('hidden');
      offersContainer.classList.add('hidden');
      return;
    }

    const acceptedSection = page.querySelector('#accepted-section') as HTMLElement;
    const availableSection = page.querySelector('#available-section') as HTMLElement;
    const completedSection = page.querySelector('#completed-section') as HTMLElement;

    if (acceptedSection) {
      acceptedSection.classList.toggle('hidden', sectionView !== 'all' && sectionView !== 'accepted');
    }
    if (availableSection) {
      availableSection.classList.toggle('hidden', sectionView !== 'all' && sectionView !== 'available');
    }
    if (completedSection) {
      completedSection.classList.toggle('hidden', sectionView !== 'all' && sectionView !== 'completed');
    }

    const acceptedContainer = page.querySelector('#accepted-offers') as HTMLElement;
    const availableContainer = page.querySelector('#available-offers') as HTMLElement;
    const completedContainer = page.querySelector('#completed-offers') as HTMLElement;
    const acceptedContent = page.querySelector('#accepted-section-content') as HTMLElement;
    const availableContent = page.querySelector('#available-section-content') as HTMLElement;
    const completedContent = page.querySelector('#completed-section-content') as HTMLElement;
    const acceptedIcon = page.querySelector('#accepted-section-icon') as HTMLElement;
    const availableIcon = page.querySelector('#available-section-icon') as HTMLElement;
    const completedIcon = page.querySelector('#completed-section-icon') as HTMLElement;

    if (acceptedSection) {
      acceptedSection.classList.toggle('bg-primary/5', acc.length > 0);
      acceptedSection.classList.toggle('bg-white', acc.length === 0);
    }

    if (acceptedContainer) {
      acceptedContainer.innerHTML =
        acc.length > 0
          ? acc.map((o) => renderOfferCard(o, 'default')).join('')
          : '<p class="text-slate-500 text-center py-4">Нет принятых заданий</p>';
    }
    if (availableContainer) {
      availableContainer.innerHTML =
        av.length > 0
          ? av.map((o) => renderOfferCard(o, 'default')).join('')
          : '<p class="text-slate-500 text-center py-4">Нет доступных предложений</p>';
    }
    if (completedContainer) {
      completedContainer.innerHTML =
        comp.length > 0
          ? comp.map((o) => renderOfferCard(o, 'completed')).join('')
          : '<p class="text-slate-500 text-center py-4">Пока нет выполненных заданий</p>';
    }

    [acceptedContent, availableContent, completedContent].forEach((el) => el?.classList.remove('hidden'));
    [acceptedIcon, availableIcon, completedIcon].forEach((ic) => {
      if (ic) ic.style.transform = 'rotate(180deg)';
    });

    emptyState.classList.add('hidden');
    showState(offersContainer, [errorState, emptyState]);

    syncFiltersFromUrl(page);
  } catch (error) {
    console.error('Ошибка загрузки предложений:', error);
    hideState(loadingState);
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
  const filtersIcon = page.querySelector('#filters-panel-icon') as HTMLElement;
  const syncFiltersPanelUi = () => {
    if (!filtersPanel || !filtersIcon || !filtersToggle) return;
    const expanded = !filtersPanel.classList.contains('hidden');
    filtersToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    filtersIcon.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
  };
  filtersToggle?.addEventListener('click', () => {
    filtersPanel?.classList.toggle('hidden');
    syncFiltersPanelUi();
  });
  syncFiltersPanelUi();

  page.querySelector('#retry-btn')?.addEventListener('click', () => loadOffers(page));

  const bindSelect = (id: string, key: string, map?: (v: string) => string | null) => {
    page.querySelector(id)?.addEventListener('change', (e) => {
      const raw = (e.target as HTMLSelectElement).value;
      const final = map ? map(raw) : raw;
      const v = final === null || final === '' ? null : final;
      setHashQuery({ [key]: v });
    });
  };
  bindSelect('#filter-section', 'section', (v) => (v === 'all' ? null : v));
  bindSelect('#filter-category', 'category', (v) => v || null);
  bindSelect('#filter-reward', 'reward', (v) => (v === 'all' ? null : v));
  bindSelect('#sort-select', 'sort', (v) => (v === 'created_desc' ? null : v));

  const toggle = (header: string, content: string, icon: string) => {
    page.querySelector(header)?.addEventListener('click', () => {
      const c = page.querySelector(content) as HTMLElement;
      const i = page.querySelector(icon) as HTMLElement;
      if (c && i) {
        c.classList.toggle('hidden');
        const expanded = !c.classList.contains('hidden');
        i.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  };
  toggle('#accepted-section-header', '#accepted-section-content', '#accepted-section-icon');
  toggle('#available-section-header', '#available-section-content', '#available-section-icon');
  toggle('#completed-section-header', '#completed-section-content', '#completed-section-icon');

  page.addEventListener('click', (e) => {
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
