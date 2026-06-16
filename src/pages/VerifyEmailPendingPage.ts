// Экран «проверьте почту» после регистрации

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

function getEmailFromUrl(): string {
  const path = window.location.hash
    ? window.location.hash.substring(1)
    : window.location.pathname + window.location.search;
  const qs = path.includes('?') ? path.split('?')[1] : window.location.search.slice(1);
  return new URLSearchParams(qs).get('email')?.trim() || '';
}

export async function createVerifyEmailPendingPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'verify-email-pending-page';
  const email = getEmailFromUrl();

  page.innerHTML = `
    <div class="relative w-full min-h-screen bg-background-light">
      <main class="flex w-full flex-col items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-sm flex flex-col gap-4 text-center">
          <div class="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <span class="material-symbols-outlined text-3xl">mail</span>
          </div>
          <h1 class="text-xl font-bold text-slate-900">Подтвердите email</h1>
          <p class="text-sm text-slate-600">
            Мы отправили письмо${email ? ` на <strong>${escapeHtml(email)}</strong>` : ''}.
            Перейдите по ссылке в письме, затем войдите в аккаунт.
          </p>
          <p id="pending-msg" class="hidden text-sm text-green-700"></p>
          <p id="pending-err" class="hidden text-sm text-red-600"></p>
          ${
            email
              ? `<button type="button" id="resend-btn"
              class="w-full border border-slate-200 py-2.5 rounded-lg text-sm hover:bg-slate-50">
              Отправить письмо повторно
            </button>`
              : ''
          }
          <button type="button" id="go-login-btn"
            class="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90">
            Перейти ко входу
          </button>
        </div>
      </main>
    </div>
  `;

  page.querySelector('#go-login-btn')?.addEventListener('click', () => router.navigate('/login'));

  page.querySelector('#resend-btn')?.addEventListener('click', async () => {
    const errEl = page.querySelector('#pending-err') as HTMLElement;
    const msgEl = page.querySelector('#pending-msg') as HTMLElement;
    errEl.classList.add('hidden');
    msgEl.classList.add('hidden');
    const btn = page.querySelector('#resend-btn') as HTMLButtonElement;
    btn.disabled = true;
    try {
      const data = await apiService.resendVerification(email);
      msgEl.textContent = data.message;
      msgEl.classList.remove('hidden');
    } catch (ex: unknown) {
      errEl.textContent = ex instanceof Error ? ex.message : 'Не удалось отправить письмо';
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  });

  return page;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
