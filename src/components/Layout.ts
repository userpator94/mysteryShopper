// Основной layout с навигацией

import { router } from '../router/index.js';

export function createLayout(): HTMLElement {
  const layout = document.createElement('div');
  layout.className = 'relative w-full';
  
  layout.innerHTML = `
    <div id="main-content">
      <!-- Контент страниц будет загружаться здесь -->
    </div>
    
    <footer class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200">
      <div class="flex justify-around items-start pt-2 pb-3">
        <a class="flex flex-col items-center justify-center gap-1 text-primary w-1/4 nav-link" href="#" data-route="/">
          <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
          </svg>
          <p class="text-xs font-medium">Главная</p>
        </a>
        <a class="flex flex-col items-center justify-center gap-1 text-slate-500 w-1/4 nav-link" href="#" data-route="/offers">
          <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40ZM160,168H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm0-32H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm32-32H64a8,8,0,0,1,0-16H192a8,8,0,0,1,0,16Z"></path>
          </svg>
          <p class="text-xs font-medium">Предложения</p>
        </a>
        <a class="flex flex-col items-center justify-center gap-1 text-slate-500 w-1/4 nav-link" href="#" data-route="/favorites">
          <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path>
          </svg>
          <p class="text-xs font-medium">Избранное</p>
        </a>
        <a class="flex flex-col items-center justify-center gap-1 text-slate-500 w-1/4 nav-link" href="#" data-route="/profile">
          <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
          </svg>
          <p class="text-xs font-medium">Профиль</p>
        </a>
      </div>
    </footer>
  `;

  // Обработчики навигации
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

  return layout;
}

function updateActiveNavLink(activeRoute: string) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const route = link.getAttribute('data-route');
    const icon = link.querySelector('svg');
    // const text = link.querySelector('p');
    
    if (route === activeRoute) {
      link.classList.remove('text-slate-500');
      link.classList.add('text-primary');
      if (icon) icon.classList.remove('text-slate-500');
      if (icon) icon.classList.add('text-primary');
    } else {
      link.classList.remove('text-primary');
      link.classList.add('text-slate-500');
      if (icon) icon.classList.remove('text-primary');
      if (icon) icon.classList.add('text-slate-500');
    }
  });
}
