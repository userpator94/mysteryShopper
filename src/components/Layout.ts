// Основной layout с навигацией (mobile bottom bar + desktop sidebar)

import { router } from '../router/index.js';
import { getRole } from '../utils/auth.js';

const ICON_HOME = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path></svg>`;
const ICON_LIST = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40ZM160,168H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm0-32H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm32-32H64a8,8,0,0,1,0-16H192a8,8,0,0,1,0,16Z"></path></svg>`;
const ICON_HEART = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path></svg>`;
const ICON_USER = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path></svg>`;
const ICON_PLUS = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>`;

const INBOX_BADGE = `
  <span
    class="employer-nav-inbox-badge hidden absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white"
    aria-label="Требуют внимания"
  ></span>
`;

function mobileNavLink(route: string, label: string, icon: string, active = false): string {
  const color = active ? 'text-primary' : 'text-slate-500';
  return `
    <a class="flex flex-col items-center justify-center gap-1 ${color} w-1/4 nav-link" href="#" data-route="${route}">
      ${icon}
      <p class="text-xs font-medium">${label}</p>
    </a>
  `;
}

function sidebarNavLink(route: string, label: string, icon: string, active = false, withBadge = false): string {
  const color = active ? 'text-primary bg-primary/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  const badgeWrap = withBadge
    ? `<span class="relative inline-flex">${icon}${INBOX_BADGE}</span>`
    : icon;
  return `
    <a class="nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${color}" href="#" data-route="${route}">
      ${badgeWrap}
      <span>${label}</span>
    </a>
  `;
}

export function createLayout(): HTMLElement {
  const layout = document.createElement('div');
  layout.id = 'app-shell';
  layout.className = 'relative w-full min-h-screen';

  layout.innerHTML = `
    <aside id="desktop-sidebar" class="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
      <div class="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
        <span class="text-lg font-bold text-primary">Mystery Shopper</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <div id="sidebar-nav-user" class="flex flex-col gap-1" data-nav-role="user">
          ${sidebarNavLink('/', 'Главная', ICON_HOME, true)}
          ${sidebarNavLink('/offers', 'Задания', ICON_LIST)}
          ${sidebarNavLink('/favorites', 'Избранное', ICON_HEART)}
          ${sidebarNavLink('/profile', 'Профиль', ICON_USER)}
        </div>
        <div id="sidebar-nav-employer" class="hidden flex flex-col gap-1" data-nav-role="employer">
          ${sidebarNavLink('/', 'Мои задачи', ICON_LIST)}
          ${sidebarNavLink('/my-offers/new', 'Создать', ICON_PLUS)}
          ${sidebarNavLink('/profile', 'Профиль', ICON_USER, false, true)}
        </div>
      </nav>
    </aside>

    <div id="main-content" class="min-h-screen lg:pl-60">
      <!-- Контент страниц будет загружаться здесь -->
    </div>

    <footer id="main-footer" class="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/80 backdrop-blur-sm lg:hidden">
      <div class="flex justify-around items-start pt-2 pb-3">
        <div id="nav-user" class="flex justify-around items-start w-full" data-nav-role="user">
          ${mobileNavLink('/', 'Главная', ICON_HOME, true)}
          ${mobileNavLink('/offers', 'Задания', ICON_LIST)}
          ${mobileNavLink('/favorites', 'Избранное', ICON_HEART)}
          ${mobileNavLink('/profile', 'Профиль', ICON_USER)}
        </div>
        <div id="nav-employer" class="hidden flex justify-around items-start w-full" data-nav-role="employer">
          ${mobileNavLink('/', 'Мои задачи', ICON_LIST)}
          ${mobileNavLink('/my-offers/new', 'Создать', ICON_PLUS)}
          <a class="flex flex-col items-center justify-center gap-1 text-slate-500 w-1/4 nav-link" href="#" data-route="/profile">
            <span class="relative inline-flex">
              ${ICON_USER}
              ${INBOX_BADGE}
            </span>
            <p class="text-xs font-medium">Профиль</p>
          </a>
        </div>
      </div>
    </footer>
  `;

  const navLinks = layout.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = (e.target as HTMLElement).closest('[data-route]')?.getAttribute('data-route');
      if (route) {
        router.navigate(route);
        updateActiveNavLink(route);
      }
    });
  });

  updateNavByRole();
  void import('../utils/employerInboxBadge.js').then(({ refreshEmployerInboxBadge }) => refreshEmployerInboxBadge());

  return layout;
}

function updateActiveNavLink(activeRoute: string) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const route = link.getAttribute('data-route') || '';
    const isMyOffersPath =
      activeRoute === '/' ||
      activeRoute === '/my-offers' ||
      /^\/my-offers\/[^/]+\/edit$/.test(activeRoute) ||
      /^\/my-offers\/[^/]+\/reports(\/|$)/.test(activeRoute);
    const isActive = route === activeRoute
      || (route === '/my-offers' && activeRoute.startsWith('/my-offers'))
      || (route === '/' && isMyOffersPath);

    const isSidebar = Boolean(link.closest('#desktop-sidebar'));
    const icon = link.querySelector('svg');

    if (isSidebar) {
      link.classList.remove('text-primary', 'bg-primary/10', 'text-slate-600', 'hover:bg-slate-100', 'hover:text-slate-900');
      if (isActive) {
        link.classList.add('text-primary', 'bg-primary/10');
      } else {
        link.classList.add('text-slate-600', 'hover:bg-slate-100', 'hover:text-slate-900');
      }
    } else {
      if (isActive) {
        link.classList.remove('text-slate-500');
        link.classList.add('text-primary');
        if (icon) { icon.classList.remove('text-slate-500'); icon.classList.add('text-primary'); }
      } else {
        link.classList.remove('text-primary');
        link.classList.add('text-slate-500');
        if (icon) { icon.classList.remove('text-primary'); icon.classList.add('text-slate-500'); }
      }
    }
  });
}

/** Показать навигацию по роли (user / employer). Admin — без публичного меню. */
export function updateNavByRole(): void {
  const role = getRole();
  const pairs: Array<[string, string]> = [
    ['nav-user', 'sidebar-nav-user'],
    ['nav-employer', 'sidebar-nav-employer'],
  ];

  for (const [mobileId, sidebarId] of pairs) {
    const mobile = document.getElementById(mobileId);
    const sidebar = document.getElementById(sidebarId);
    if (role === 'admin') {
      mobile?.classList.add('hidden');
      sidebar?.classList.add('hidden');
      continue;
    }
    const isEmployerBlock = mobileId === 'nav-employer';
    const hide = isEmployerBlock ? role !== 'employer' : role === 'employer';
    mobile?.classList.toggle('hidden', hide);
    sidebar?.classList.toggle('hidden', hide);
  }

  const path = window.location.pathname || (window.location.hash ? window.location.hash.slice(1).split('?')[0] : '/');
  updateActiveNavLink(path);
}

/** Скрыть/показать chrome навигации (footer + sidebar) в зависимости от маршрута. */
export function toggleFooter(show: boolean) {
  const shell = document.getElementById('app-shell');
  if (shell) {
    shell.classList.toggle('chrome-hidden', !show);
  }
  const footer = document.getElementById('main-footer');
  if (footer) {
    footer.style.display = show ? '' : 'none';
  }
}

export function shouldHideFooter(path: string): boolean {
  const hiddenRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/verify-email-pending'];
  if (hiddenRoutes.includes(path)) return true;
  if (path === '/svc-panel/admin' || path.startsWith('/svc-panel/admin/')) return true;
  return false;
}
