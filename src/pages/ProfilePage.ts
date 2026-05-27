// Страница профиля пользователя

import { apiService } from '../services/api.js';
import { router } from '../router/index.js';
import { getRole } from '../utils/auth.js';
import type { UserStatistics, MeUser, Offer, Application } from '../types/index.js';
import { applyExecutorAvatarToElement } from '../utils/executorAvatar.js';
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

function isAppNeedsRevision(app: Application): boolean {
  return app.report_status === 'rejected' && Boolean(app.can_resubmit);
}

function isAppCompleted(app: Application): boolean {
  if (isAppNeedsRevision(app)) return false;
  if (app.has_report) return true;
  const s = (app.status || '').toLowerCase();
  return s === 'completed' || s === 'done';
}

/** Заявка ожидает решения заказчика. */
function isAppPendingApproval(app: Application): boolean {
  return (app.status || '').toLowerCase() === 'pending';
}

/** Задача в работе: одобрена, отчёт ещё не отправлен или требует доработки. */
function isAppActiveTask(app: Application): boolean {
  if (isAppNeedsRevision(app)) return true;
  if (app.has_report) return false;
  const s = (app.status || '').toLowerCase();
  if (s === 'rejected' || s === 'cancelled' || s === 'pending') return false;
  return s === 'approved' || s === 'in_progress' || s === 'accepted';
}

type MeLoadError = '429' | 'network' | 'other' | null;

function classifyMeError(error: unknown): MeLoadError {
  const e = error as { status?: number; message?: string; name?: string };
  if (e?.status === 429) return '429';
  if (
    e?.name === 'TypeError' ||
    (typeof e?.message === 'string' &&
      (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')))
  ) {
    return 'network';
  }
  return 'other';
}

type ActivityItem = { at: string; text: string };

function buildEmployerDashboard(offers: Offer[]): {
  createdTotal: number;
  pendingApplications: number;
  pendingReports: number;
  activeOffersNow: number;
  activity: ActivityItem[];
  empty: boolean;
} {
  const createdTotal = offers.length;
  const pendingApplications = offers.reduce(
    (acc, o) => acc + (o.pending_applications_count ?? o.executors_pending?.length ?? 0),
    0
  );
  const pendingReports = offers.reduce(
    (acc, o) => acc + (o.pending_reports_count ?? 0),
    0
  );
  const activeOffersNow = offers.filter((o) => o.is_active).length;

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
    pendingReports,
    activeOffersNow,
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
  let employerInboxCounts: { pending_applications: number; pending_reports: number } | null = null;
  let meLoadError: MeLoadError = null;
  try {
    meUser = (await apiService.getMe()).data;
  } catch (error) {
    meLoadError = classifyMeError(error);
    console.error('Ошибка загрузки профиля getMe:', error);
  }
  const isEmployer = getRole() === 'employer';
  if (isEmployer) {
    try {
      employerInboxCounts = await apiService.getEmployerInboxCounts();
    } catch (e) {
      console.error('Ошибка загрузки счётчиков входящих:', e);
    }
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
      const appliesRes = await apiService.getApplies();
      myApplies = appliesRes.data ?? null;
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
  const displayName = fromMe || fromStats || '—';
  const displayEmail = meUser?.email ?? userStats?.email ?? '—';
  const displayPhone = meUser?.phone ?? userStats?.phone ?? '—';
  const displayUserId = meUser?.id ?? userStats?.user_id ?? '';

  const meErrorBanner =
    meLoadError && !meUser
      ? `<div id="profile-me-error" class="mb-3 rounded-lg border px-3 py-2 text-sm ${
          meLoadError === '429'
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-red-200 bg-red-50 text-red-800'
        }">
          ${
            meLoadError === '429'
              ? 'Слишком много запросов. Подождите немного и обновите страницу.'
              : meLoadError === 'network'
                ? 'Не удалось загрузить профиль. Проверьте подключение к интернету.'
                : 'Не удалось загрузить данные профиля.'
          }
          <button type="button" id="profile-retry-me" class="mt-2 block text-sm font-semibold text-primary hover:underline">Повторить</button>
        </div>`
      : '';

  const employerDash = isEmployer
    ? (() => {
        const dash = myOffers
          ? buildEmployerDashboard(myOffers)
          : {
              createdTotal: 0,
              pendingApplications: 0,
              pendingReports: 0,
              activeOffersNow: 0,
              activity: [] as ActivityItem[],
              empty: true
            };
        if (employerInboxCounts) {
          dash.pendingApplications = employerInboxCounts.pending_applications;
          dash.pendingReports = employerInboxCounts.pending_reports;
        }
        return dash;
      })()
    : null;
  const executorPendingApplications =
    !isEmployer && myApplies ? myApplies.filter(isAppPendingApproval).length : null;
  const executorActiveTasks =
    !isEmployer && myApplies
      ? myApplies.filter(isAppActiveTask).length
      : userStats
        ? Number(userStats.approved_applications) + Number(userStats.in_progress_applications)
        : null;
  const executorCompleted =
    !isEmployer && myApplies ? myApplies.filter(isAppCompleted).length : userStats ? Number(userStats.completed_applications) : null;
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
        if (isAppNeedsRevision(a)) {
          historyItems.push({ at: a.approved_at || a.applied_at, label: `Отчёт отклонён — требуется доработка` });
        } else if (a.has_report) {
          historyItems.push({ at: a.approved_at || a.applied_at, label: `Отчёт отправлен` });
        }
      }
    }
  }
  historyItems.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const historyTop10 = historyItems.slice(0, 10);

  const ed = employerDash;

  page.innerHTML = `
    <div class="relative w-full">
      <div>
        <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-3">
          <h1 class="text-xl font-bold">Профиль</h1>
        </header>
        
        <main class="pb-28">
          <div class="px-4 py-2">
            <div id="user-info-block" class="bg-white rounded-lg p-4 border border-slate-200 mb-3">
              ${meErrorBanner}
              <div class="flex items-center gap-3 mb-3">
                <div id="user-avatar" class="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-4xl leading-none"></div>
                <div class="min-w-0 text-left">
                  <h2 id="user-name" class="text-xl font-semibold">${escapeHtml(displayName)}</h2>
                  ${
                    displayUserId
                      ? `<button type="button" id="profile-copy-user-id" class="block w-fit inline-flex items-center gap-1 text-left text-xs text-primary hover:underline px-0 py-0 bg-transparent" data-copy-text="${escapeHtml(String(displayUserId))}" aria-label="Скопировать ID">
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
                  ${!isEmployer ? `<p class="text-xs text-slate-500 mt-1">Email и телефон не показываются заказчику</p>` : ''}
                </div>
              </div>
              
              ${isEmployer ? `
              <div id="employer-info" class="mb-3 p-2.5 bg-slate-50 rounded-lg">
                <div class="flex items-start gap-3">
                  <div class="min-w-0 flex-1">
                    ${meUser?.company ? `<p class="text-sm text-slate-700"><span class="font-medium">Компания:</span> ${escapeHtml(meUser.company)}</p>` : ''}
                    ${meUser?.description ? `<p class="text-sm text-slate-600 mt-1">${escapeHtml(meUser.description)}</p>` : ''}
                    ${meUser?.website ? `<a href="${escapeHtml(meUser.website)}" target="_blank" rel="noopener" class="text-sm text-primary hover:underline break-all">${escapeHtml(meUser.website)}</a>` : ''}
                    <button type="button" id="profile-edit-employer-brand" class="mt-2 text-sm font-semibold text-primary hover:underline" data-action="edit-employer-brand">Редактировать</button>
                  </div>
                </div>
              </div>
              ` : ''}
              
              ${isEmployer && ed ? `
                <div class="grid grid-cols-2 gap-2.5">
                  <button type="button" id="profile-metric-pending-reports" data-navigate="/my-inbox/pending-reports" class="profile-metric-card relative flex flex-col items-center justify-center w-full rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition-colors text-slate-900">
                    <span data-metric-badge="reports" class="${ed.pendingReports > 0 ? '' : 'hidden '}absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white pointer-events-none" aria-hidden="true"></span>
                    <span data-metric-count="pending-reports" class="text-2xl font-bold text-primary leading-none">${ed.pendingReports}</span>
                    <span class="text-sm text-slate-600 mt-1 text-center">ожидают одобрения отчёта</span>
                  </button>
                  <button type="button" id="profile-metric-pending-applications" data-navigate="/my-inbox/pending-applications" class="profile-metric-card relative flex flex-col items-center justify-center w-full rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition-colors text-slate-900">
                    <span data-metric-badge="applications" class="${ed.pendingApplications > 0 ? '' : 'hidden '}absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white pointer-events-none" aria-hidden="true"></span>
                    <span data-metric-count="pending-applications" class="text-2xl font-bold text-primary leading-none">${ed.pendingApplications}</span>
                    <span class="text-sm text-slate-600 mt-1 text-center">ожидают согласования заявки</span>
                  </button>
                  <div class="profile-metric-card flex flex-col items-center justify-center w-full rounded-lg border border-slate-200 p-2.5 text-center">
                    <span class="text-2xl font-bold text-primary leading-none">${ed.createdTotal}</span>
                    <span class="text-sm text-slate-600 mt-1">всего создано задач</span>
                  </div>
                  <div class="profile-metric-card flex flex-col items-center justify-center w-full rounded-lg border border-slate-200 p-2.5 text-center">
                    <span class="text-2xl font-bold text-primary leading-none">${ed.activeOffersNow}</span>
                    <span class="text-sm text-slate-600 mt-1">активных сейчас задач</span>
                  </div>
                </div>

                ${ed.empty ? `
                  <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                    <p class="text-slate-700 font-medium mb-3">У вас пока нет задач</p>
                    <button type="button" id="profile-create-first-offer" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90" data-action="create-first-offer">
                      Создайте первую задачу
                    </button>
                  </div>
                ` : ''}
              ` : `
                <div class="grid grid-cols-2 gap-2.5">
                  <div class="profile-metric-card flex flex-col items-center justify-center rounded-lg border border-slate-200 p-2.5 text-center">
                    <span class="text-2xl font-bold text-primary leading-none">${executorPendingApplications ?? 0}</span>
                    <span class="text-xs text-slate-600 mt-1">активные заявки</span>
                  </div>
                  <div class="profile-metric-card flex flex-col items-center justify-center rounded-lg border border-slate-200 p-2.5 text-center">
                    <span class="text-2xl font-bold text-primary leading-none">${executorActiveTasks ?? 0}</span>
                    <span class="text-xs text-slate-600 mt-1">задачи в работе</span>
                  </div>
                  <div class="profile-metric-card flex flex-col items-center justify-center rounded-lg border border-slate-200 p-2.5 text-center">
                    <span class="text-2xl font-bold text-primary leading-none">${executorCompleted ?? 0}</span>
                    <span class="text-xs text-slate-600 mt-1">задач выполнено (с отчётом)</span>
                  </div>
                  <button type="button" id="profile-metric-rewards" class="profile-metric-card flex flex-col items-center justify-center w-full rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition-colors text-center" data-action="payouts">
                    <span class="text-2xl font-bold text-primary leading-none">${executorRewardsTotal ?? 0}</span>
                    <span class="text-xs text-slate-600 mt-1">бонусов начислено</span>
                  </button>
                </div>
              `}
            </div>
            
            <div class="space-y-3">
              ${isEmployer ? `
                <div class="bg-white rounded-lg p-3 border border-slate-200">
                  <h3 class="font-semibold mb-1.5">Активность</h3>
                  <div class="space-y-2">
                    ${ed && ed.activity.length > 0
                      ? ed.activity
                          .map((x) => `<div class="text-sm text-slate-700"><span class="text-slate-500">${escapeHtml(formatLocalDateTime(x.at))}</span> — ${escapeHtml(x.text)}</div>`)
                          .join('')
                      : `<p class="text-sm text-slate-500">Пока нет событий</p>`}
                  </div>
                </div>
              ` : `
                <div class="bg-white rounded-lg p-3 border border-slate-200">
                  <h3 class="font-semibold mb-1.5">Активность</h3>
                  <div class="space-y-2">
                    ${historyTop10.length > 0
                      ? historyTop10
                          .map((x) => `<div class="text-sm text-slate-700"><span class="text-slate-500">${escapeHtml(formatLocalDateTime(x.at))}</span> — ${escapeHtml(x.label)}</div>`)
                          .join('')
                      : `<p class="text-sm text-slate-500">Активность появится здесь</p>`}
                  </div>
                </div>
              `}

              <div class="bg-white rounded-lg p-3 border border-slate-200">
                <div class="space-y-3">
                  <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Настройки</p>
                    <button type="button" id="profile-settings-notifications" class="w-full text-left px-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="notifications">
                      Настройки уведомлений <span class="text-slate-500 text-sm">(скоро)</span>
                    </button>
                    ${isEmployer ? `
                      <button type="button" id="profile-settings-billing" class="w-full text-left px-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="billing">
                        Биллинг <span class="text-slate-500 text-sm">(скоро)</span>
                      </button>
                    ` : `
                      <button type="button" id="profile-settings-rewards" class="w-full text-left px-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="payouts">
                        Вознаграждения
                      </button>
                    `}
                    ${
                      meUser
                        ? `
                    <button type="button" id="go-change-password" class="w-full text-left px-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100">
                      Сменить пароль
                    </button>`
                        : ''
                    }
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Поддержка</p>
                    <button type="button" id="profile-support-help" class="w-full text-left px-2 py-1.5 cursor-not-allowed opacity-50 rounded transition-colors border border-transparent" data-action="help" disabled>Помощь</button>
                    <button type="button" id="profile-support-contact" class="w-full text-left px-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100" data-action="contact">Связаться с нами</button>
                    <button type="button" id="profile-support-feedback" class="w-full text-left px-2 py-1.5 cursor-not-allowed opacity-50 rounded transition-colors border border-transparent" data-action="feedback" disabled>Оставить отзыв</button>
                  </div>
                </div>
              </div>
              
              <button id="logout-button" class="w-full bg-red-500 text-white py-2.5 rounded-lg font-semibold">
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

  if (!isEmployer) {
    applyExecutorAvatarToElement(page.querySelector('#user-avatar') as HTMLElement, meUser?.avatar_emoji);
  }

  if (isEmployer) {
    void import('../utils/employerInboxBadge.js').then(({ refreshEmployerInboxBadge }) => refreshEmployerInboxBadge());
  }

  return page;
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

  page.querySelectorAll<HTMLElement>('[data-navigate]').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.getAttribute('data-navigate');
      if (path) router.navigate(path);
    });
  });

  // Обработчик кнопки выхода из аккаунта
  const logoutButton = page.querySelector('#logout-button') as HTMLButtonElement;
  logoutButton?.addEventListener('click', handleLogout);

  page.querySelector('#profile-retry-me')?.addEventListener('click', () => {
    void apiService.getMe({ force: true }).then(() => router.navigate('/profile'));
  });

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