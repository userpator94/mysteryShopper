// Подтверждение email по ссылке из письма

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

function getTokenFromUrl(): string {
  const path = window.location.hash
    ? window.location.hash.substring(1)
    : window.location.pathname + window.location.search;
  const qs = path.includes('?') ? path.split('?')[1] : window.location.search.slice(1);
  return new URLSearchParams(qs).get('token')?.trim() || '';
}

export async function createVerifyEmailPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'verify-email-page';
  const token = getTokenFromUrl();

  page.innerHTML = `
    <div class="relative w-full min-h-screen bg-background-light">
      <main class="flex w-full flex-col items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-sm flex flex-col gap-4 text-center">
          <div id="verify-loading" class="flex flex-col items-center gap-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p class="text-sm text-slate-600">Подтверждаем email…</p>
          </div>
          <div id="verify-result" class="hidden flex flex-col gap-4">
            <p id="verify-msg" class="text-sm"></p>
            <button type="button" id="verify-login-btn"
              class="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90">
              Войти
            </button>
          </div>
        </div>
      </main>
    </div>
  `;

  page.querySelector('#verify-login-btn')?.addEventListener('click', () => router.navigate('/login'));

  const loadingEl = page.querySelector('#verify-loading') as HTMLElement;
  const resultEl = page.querySelector('#verify-result') as HTMLElement;
  const msgEl = page.querySelector('#verify-msg') as HTMLElement;

  if (!token) {
    loadingEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    msgEl.className = 'text-sm text-red-600';
    msgEl.textContent = 'Ссылка недействительна. Запросите новое письмо при входе или регистрации.';
    return page;
  }

  try {
    const data = await apiService.verifyEmail(token);
    loadingEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    msgEl.className = 'text-sm text-green-800';
    msgEl.textContent = data.message;
  } catch (ex: unknown) {
    loadingEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    msgEl.className = 'text-sm text-red-600';
    msgEl.textContent = ex instanceof Error ? ex.message : 'Не удалось подтвердить email';
  }

  return page;
}
