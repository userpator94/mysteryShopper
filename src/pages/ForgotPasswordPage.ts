// Страница запроса сброса пароля

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

export async function createForgotPasswordPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'forgot-password-page';

  page.innerHTML = `
    <div class="relative w-full min-h-screen bg-background-light">
      <main class="flex w-full flex-col items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-sm flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <button type="button" id="back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
            <h1 class="text-xl font-bold text-slate-900">Восстановление пароля</h1>
          </div>
          <p class="text-sm text-slate-600">Введите email — мы отправим ссылку для сброса пароля.</p>
          <form id="forgot-form" class="space-y-3 bg-white rounded-lg border border-slate-200 p-4">
            <div>
              <label for="forgot-email" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input id="forgot-email" type="text" inputmode="text" autocomplete="email" autocapitalize="none" spellcheck="false" required
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="name+tag@email.com" />
            </div>
            <p id="forgot-err" class="hidden text-sm text-red-600"></p>
            <button type="submit" id="forgot-submit"
              class="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90">
              Отправить
            </button>
          </form>
          <div id="forgot-success" class="hidden rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Если аккаунт с таким email существует, мы отправили письмо с инструкциями.
          </div>
        </div>
      </main>
    </div>
  `;

  page.querySelector('#back-btn')?.addEventListener('click', () => router.navigate('/login'));

  const form = page.querySelector('#forgot-form') as HTMLFormElement;
  const successEl = page.querySelector('#forgot-success') as HTMLElement;
  const errEl = page.querySelector('#forgot-err') as HTMLElement;
  const emailInput = page.querySelector('#forgot-email') as HTMLInputElement;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');
    const btn = page.querySelector('#forgot-submit') as HTMLButtonElement;
    btn.disabled = true;
    try {
      await apiService.forgotPassword(emailInput.value.trim());
      form.classList.add('hidden');
      successEl.classList.remove('hidden');
    } catch (ex: unknown) {
      errEl.textContent = ex instanceof Error ? ex.message : 'Не удалось отправить запрос';
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  });

  return page;
}
