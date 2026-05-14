// Страница профиля пользователя

import { apiService } from '../services/api.js';
import { router } from '../router/index.js';
import { getRole } from '../utils/auth.js';
import type { UserStatistics, MeUser, Offer, Application } from '../types/index.js';
import { devLog } from '../utils/logger.js';
import { getRecentOffers } from '../utils/recentOffers.js';

function escapeHtml(s: string): string {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

async function copyToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? '');
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.left = '-1000px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function formatLocalDateTime(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === '') return '—';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isAppCompleted(app: Application): boolean {
  if (app.has_report) return true;
  const s = (app.status || '').toLowerCase();
  return s === 'completed' || s === 'done';
}

function isAppActive(app: Application): boolean {
  if (isAppCompleted(app)) return false;
  const s = (app.status || '').toLowerCase();
  return s === 'pending' || s === 'approved' || s === 'in_progress' || s === 'accepted';
}

type ActivityItem = { at: string; text: string };

function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function buildEmployerDashboard(offers: Offer[]): {
  createdTotal: number;
  pendingApplications: number;
  inWorkOffers: number;
  completedOffers: number; // offers with >=1 report
  activity: ActivityItem[];
  empty: boolean;
} {
  const createdTotal = offers.length;
  const pendingApplications = offers.reduce((acc, o) => acc + (o.executors_pending?.length ?? 0), 0);
  const inWorkOffers = offers.filter((o) => (o.executors_in_work?.length ?? 0) > 0).length;
  const completedOffers = offers.filter((o) => (o.executors_reported?.length ?? 0) > 0).length;

  const activity: ActivityItem[] = [];
  for (const o of offers) {
    if (o.created_at) {
      activity.push({ at: o.created_at, text: `Опубликована задача «${o.title || 'Без названия'}»` });
    }
    if ((o.executors_reported?.length ?? 0) > 0 && o.updated_at) {
      activity.push({ at: o.updated_at, text: `Пришёл отчёт по задаче «${o.title || 'Без названия'}»` });
    }
    if (o.is_active === false && o.updated_at) {
      activity.push({ at: o.updated_at, text: `Задача снята с публикации «${o.title || 'Без названия'}»` });
    }
  }
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    createdTotal,
    pendingApplications,
    inWorkOffers,
    completedOffers,
    activity: activity.slice(0, 5),
    empty: createdTotal === 0,
  };
}

export async function createProfilePage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'profile-page';

  let userStats: UserStatistics | null = null;
  let meUser: MeUser | null = null;
  let myOffers: Offer[] | null = null;
  let myApplies: Application[] | null = null;
  let rewardsSummary: { total_earned?: number; balance?: number; total_count?: number } | null = null;
  try {
    meUser = (await apiService.getMe()).data;
  } catch (_) {
    /* 401 или сеть */
  }
  const isEmployer = getRole() === 'employer';
  if (isEmployer) {
    try {
      myOffers = await apiService.getMyOffers({ limit: 500 });
    } catch (e) {
      console.error('Ошибка загрузки офферов заказчика:', e);
    }
  } else {
    try {
      userStats = (await apiService.getUserStatistics()).data;
    } catch (error) {
      console.error('Ошибка загрузки статистики пользователя:', error);
    }
    try {
      myApplies = (await apiService.getApplies()).data ?? null;
    } catch (e) {
      console.error('Ошибка загрузки заявок исполнителя:', e);
    }
    try {
      rewardsSummary = (await apiService.getRewardsSummary()).data ?? null;
    } catch (e) {
      console.error('Ошибка загрузки вознаграждений:', e);
    }
  }

  const fromMe = meUser ? `${meUser.name || ''} ${meUser.surname || ''}`.trim() : '';
  const fromStats = userStats ? `${userStats.name || ''} ${userStats.surname || ''}`.trim() : '';
  const displayName = fromMe || fromStats || 'Загрузка...';
  const displayEmail = meUser?.email ?? userStats?.email ?? 'Загрузка...';
  const displayPhone = meUser?.phone ?? userStats?.phone ?? 'Загрузка...';
  const displayUserId = meUser?.id ?? userStats?.user_id ?? '';

  const employerDash = isEmployer && myOffers ? buildEmployerDashboard(myOffers) : null;
  const executorActive =
    !isEmployer && myApplies ? myApplies.filter(isAppActive).length : userStats ? Number(userStats.approved_applications) + Number(userStats.in_progress_applications) : null;
  const executorCompleted =
    !isEmployer && myApplies ? myApplies.filter(isAppCompleted).length : userStats ? Number(userStats.completed_applications) : null;
  const executorCancelled =
    !isEmployer && myApplies ? myApplies.filter((a) => String(a.status || '').toLowerCase() === 'cancelled').length : null;
  const executorRewardsTotal = !isEmployer ? Number(rewardsSummary?.total_earned ?? 0) : null;

  const recentViewed = getRecentOffers();
  const historyItems: Array<{ at: string; label: string }> = [];
  if (!isEmployer) {
    for (const r of recentViewed) {
      historyItems.push({ at: r.viewedAt, label: `Просмотрели задачу «${r.title}»` });
    }
    if (myApplies) {
      for (const a of myApplies) {
        if (a.applied_at) historyItems.push({ at: a.applied_at, label: `Откликнулись на задачу` });
        if (a.has_report) historyItems.push({ at: a.approved_at || a.applied_at, label: `Отчёт отправлен` });
      }
    }
  }
  historyItems.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const historyTop10 = historyItems.slice(0, 10);

  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4">
          <h1 class="text-2xl font-bold">Профиль</h1>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-4">
            <div id="user-info-block" class="bg-white rounded-lg p-6 border border-slate-200 mb-4">
              <div class="flex items-center gap-4 mb-4">
                <div id="user-avatar" class="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-6xl leading-none"></div>
                <div class="min-w-0 text-left">
                  <h2 id="user-name" class="text-xl font-semibold">${escapeHtml(displayName)}</h2>
                  ${
                    displayUserId
                      ? `<button type="button" class="block w-fit inline-flex items-center gap-1 text-left text-xs text-primary hover:underline px-0 py-0 bg-transparent" data-copy-text="${escapeHtml(String(displayUserId))}" aria-label="Скопировать ID">
                          <span class="font-mono">${escapeHtml(String(displayUserId))}</span>
                          <svg class="w-3.5 h-3.5 text-primary/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9h10v10H9V9z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>`
                      : ''
                  }
                  <p id="user-email" class="text-slate-600">${escapeHtml(displayEmail)}</p>
                  <p id="user-phone" class="text-slate-600">${escapeHtml(displayPhone)}</p>
                  ${isEmployer && meUser?.company ? `<p id="user-company" class="text-slate-600 font-medium">${escapeHtml(meUser.company)}</p>` : ''}
                  ${!isEmployer ? `<p class="text-xs text-slate-500 mt-1">Email и телефон не показываются заказчику</p>` : ''}
                </div>
              </div>
              
              ${isEmployer ? `
              <div id="employer-info" class="mb-4 p-3 bg-slate-50 rounded-lg">
                <div class="flex items-start gap-3">
                  <div class="min-w-0 flex-1">
                    ${meUser?.company ? `<p class="text-sm text-slate-700"><span class="font-medium">Компания:</span> ${escapeHtml(meUser.company)}</p>` : ''}
                    ${meUser?.description ? `<p class="text-sm text-slate-600 mt-1">${escapeHtml(meUser.description)}</p>` : ''}
                    ${meUser?.website ? `<a href="${escapeHtml(meUser.website)}" target="_blank" rel="noopener" class="text-sm text-primary hover:underline break-all">${escapeHtml(meUser.website)}</a>` : ''}
                    <button type="button" class="mt-2 text-sm font-semibold text-primary hover:underline" data-action="edit-employer-brand">Редактировать</button>
                  </div>
                </div>
              </div>
              ` : ''}
              
              ${isEmployer ? `
                <div class="grid grid-cols-2 gap-4">
                  <div class="text-center rounded-lg border border-slate-200 p-3">
                    <div class="text-2xl font-bold text-primary">${employerDash ? employerDash.createdTotal : '...'}</div>
                    <div class="text-sm text-slate-600">создано задач</div>
                  </div>
                  <div class="text-center rounded-lg border border-slate-200 p-3">
                    <div class="text-2xl font-bold text-primary">${employerDash ? employerDash.pendingApplications : '...'}</div>
                    <div class="text-sm text-slate-600">${employerDash ? pluralRu(employerDash.pendingApplications, 'заявка', 'заявки', 'заявок') : 'заявок'}</div>
                  </div>
                  <div class="text-center rounded-lg border border-slate-200 p-3">
                    <div class="text-2xl font-bold text-primary">${employerDash ? employerDash.inWorkOffers : '...'}</div>
                    <div class="text-sm text-slate-600">в работе</div>
                  </div>
                  <div class="text-center rounded-lg border border-slate-200 p-3">
                    <div class="text-2xl font-bold text-primary">${employerDash ? employerDash.completedOffers : '...'}</div>
                    <div class="text-sm text-slate-600">выполнено</div>
                  </div>
                </div>

                ${employerDash?.empty ? `
                  <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                    <p class="text-slate-700 font-medium mb-3">У вас пока нет задач</p>
                    <button type="button" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90" data-action="create-first-offer">
                      Создайте первую задачу
                    </button>
                  </div>
                ` : ''}
              ` : `
                <div class="grid grid-cols-2 gap-3">
                  <div class="text-center rounded-lg border border-slate-200 p-3">
                    <div class="text-2xl font-bold text-primary">${executorActive ?? '...'}</div>
                    <div class="text-xs text-slate-600">активные заявки</div>
                  </div>
                  <div class="text-center rounded-lg border border-slate-200 p-3">
                    <div class="text-2xl font-bold text-primary">${executorCompleted ?? '...'}</div>
                    <div class="text-xs text-slate-600">выполнено с отчётом</div>
                  </div>
                  <div class="text-center rounded-lg border border-slate-200 p-3">
                    <div class="text-2xl font-bold text-primary">${executorCancelled ?? '—'}</div>
                    <div class="text-xs text-slate-600">отказы</div>
                  </div>
                  <button type="button" class="text-center rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors" data-action="payouts">
                    <div class="text-2xl font-bold text-primary">${executorRewardsTotal ?? '...'}</div>
                    <div class="text-xs text-slate-600">бонусов начислено</div>
                  </button>
                </div>
              `}
            </div>
            
            <div class="space-y-4">
              ${isEmployer ? `
                <div class="bg-white rounded-lg p-4 border border-slate-200">
                  <h3 class="font-semibold mb-2">Активность</h3>
                  <div class="space-y-2">
                    ${employerDash && employerDash.activity.length > 0
                      ? employerDash.activity
                          .map((x) => `<div class="text-sm text-slate-700"><span class="text-slate-500">${escapeHtml(formatLocalDateTime(x.at))}</span> — ${escapeHtml(x.text)}</div>`)
                          .join('')
                      : `<p class="text-sm text-slate-500">Пока нет событий</p>`}
                  </div>
                </div>
              ` : `
                <div class="bg-white rounded-lg p-4 border border-slate-200">
                  <h3 class="font-semibold mb-2">Активность</h3>
                  <div class="space-y-2">
                    ${historyTop10.length > 0
                      ? historyTop10
                          .map((x) => `<div class="text-sm text-slate-700"><span class="text-slate-500">${escapeHtml(formatLocalDateTime(x.at))}</span> — ${escapeHtml(x.label)}</div>`)
                          .join('')
                      : `<p class="text-sm text-slate-500">Активность появится здесь</p>`}
                  </div>
                </div>
              `}

              <div class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="space-y-4">
                  <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Настройки</p>
                    <button class="w-full text-left px-2 py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="notifications">
                      Настройки уведомлений <span class="text-slate-500 text-sm">(скоро)</span>
                    </button>
                    ${isEmployer ? `
                      <button class="w-full text-left px-2 py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="billing">
                        Биллинг <span class="text-slate-500 text-sm">(скоро)</span>
                      </button>
                    ` : `
                      <button class="w-full text-left px-2 py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="payouts">
                        Вознаграждения
                      </button>
                    `}
                    ${
                      meUser
                        ? `
                    <button type="button" id="go-change-password" class="w-full text-left px-2 py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100">
                      Сменить пароль
                    </button>`
                        : ''
                    }
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Поддержка</p>
                    <button class="w-full text-left px-2 py-2 cursor-not-allowed opacity-50 rounded transition-colors border border-transparent" data-action="help" disabled>Помощь</button>
                    <button class="w-full text-left px-2 py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="contact">Связаться с нами</button>
                    <button class="w-full text-left px-2 py-2 cursor-not-allowed opacity-50 rounded transition-colors border border-transparent" data-action="feedback" disabled>Оставить отзыв</button>
                  </div>
                </div>
              </div>
              
              <button id="logout-button" class="w-full bg-red-500 text-white py-3 rounded-lg font-semibold">
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Настраиваем обработчики событий
  setupEventHandlers(page);
  
  // Устанавливаем случайный эмодзи животного в аватар
  setRandomAnimalEmoji(page);

  return page;
}

// Функция установки случайного эмодзи животного
function setRandomAnimalEmoji(page: HTMLElement) {
  const animalEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
    '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦀', '🐡',
    '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓',
    '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦡',
    '🦔', '🐾', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇',
    '🐿️', '🦨', '🦦', '🦥', '🦫', '🐀', '🐁', '🐂', '🐃', '🐄',
    '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐈‍⬛', '🪶'
  ];
  
  // Выбираем случайный эмодзи
  const randomEmoji = animalEmojis[Math.floor(Math.random() * animalEmojis.length)];
  
  // Находим элемент аватара и устанавливаем эмодзи
  const avatarElement = page.querySelector('#user-avatar') as HTMLElement;
  if (avatarElement) {
    avatarElement.textContent = randomEmoji;
    // Убираем серый фон, так как теперь есть эмодзи
    avatarElement.classList.remove('bg-slate-200');
  }
}

function setupEventHandlers(page: HTMLElement) {
  // Обработчики для элементов настроек и поддержки
  const actionElements = page.querySelectorAll('[data-action]');
  actionElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    // Пропускаем неактивные кнопки (help и feedback)
    if (htmlElement.hasAttribute('disabled')) {
      return;
    }
    element.addEventListener('click', () => {
      const action = htmlElement.dataset.action;
      handleAction(action);
    });
  });

  page.querySelector('#go-change-password')?.addEventListener('click', () => {
    router.navigate('/profile/password');
  });

  // Обработчик кнопки выхода из аккаунта
  const logoutButton = page.querySelector('#logout-button') as HTMLButtonElement;
  logoutButton?.addEventListener('click', handleLogout);

  // Copy-to-clipboard (ID и т.п.)
  page.querySelectorAll<HTMLElement>('[data-copy-text]').forEach((el) => {
    el.addEventListener('click', async () => {
      const text = el.getAttribute('data-copy-text') ?? '';
      const ok = await copyToClipboard(text);
      if (!ok) {
        alert('Не удалось скопировать');
        return;
      }
      // Ненавязчивый фидбек: временно меняем прозрачность и underline
      el.classList.add('opacity-70');
      setTimeout(() => el.classList.remove('opacity-70'), 600);
    });
  });
}

async function handleLogout() {
  const logoutButton = document.querySelector('#logout-button') as HTMLButtonElement;
  
  // Показываем состояние загрузки
  if (logoutButton) {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Выход...';
  }

  try {
    // Вызываем API для выхода из аккаунта
    await apiService.logout();
    
    // Перенаправляем на страницу входа
    router.navigate('/login');
  } catch (error: any) {
    // Обработка ошибок
    console.error('Ошибка при выходе:', error);
    
    // Даже если была ошибка, все равно перенаправляем на логин
    // (токен уже удален из localStorage в методе logout)
    router.navigate('/login');
  } finally {
    // Восстанавливаем кнопку (на случай, если переход не произошел)
    if (logoutButton) {
      logoutButton.disabled = false;
      logoutButton.textContent = 'Выйти из аккаунта';
    }
  }
}

function handleAction(action: string | undefined) {
  switch (action) {
    case 'notifications':
      alert('Настройки уведомлений появятся позже');
      break;
    case 'billing':
      alert('Биллинг появится позже');
      break;
    case 'payouts':
      router.navigate('/rewards');
      break;
    case 'edit-employer-brand':
      alert('Редактирование бренда появится позже');
      break;
    case 'create-first-offer':
      router.navigate('/my-offers/new');
      break;
    case 'help':
      devLog.log('Открыть помощь');
      break;
    case 'contact':
      devLog.log('Связаться с нами');
      break;
    case 'feedback':
      devLog.log('Оставить отзыв');
      break;
    default:
      devLog.log('Неизвестное действие:', action);
  }
}