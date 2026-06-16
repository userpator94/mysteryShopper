// Страница сброса пароля по ссылке из письма

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

const PASSWORD_CHAR = /^[a-zA-Z0-9!@#$%^&*()\-_=+]$/;
const PASSWORD_LINE = /^[a-zA-Z0-9!@#$%^&*()\-_=+]*$/;

function bindLatinPasswordField(input: HTMLInputElement, opts: { interceptPaste: boolean }): void {
  input.addEventListener('input', () => {
    if (!PASSWORD_LINE.test(input.value)) {
      input.value = [...input.value].filter((ch) => PASSWORD_CHAR.test(ch)).join('');
    }
  });
  input.addEventListener('keypress', (e) => {
    const k = e.key;
    if (k.length === 1 && !PASSWORD_CHAR.test(k)) e.preventDefault();
  });
  if (opts.interceptPaste) {
    input.addEventListener('paste', (e) => {
      const paste =
        (e.clipboardData || (window as unknown as { clipboardData?: DataTransfer }).clipboardData)?.getData('text') ??
        '';
      const filtered = [...paste].filter((ch) => PASSWORD_CHAR.test(ch)).join('');
      if (paste !== filtered) {
        e.preventDefault();
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const v = input.value;
        input.value = v.slice(0, start) + filtered + v.slice(end);
        input.setSelectionRange(start + filtered.length, start + filtered.length);
      }
    });
  }
}

function bindNoClipboard(el: HTMLInputElement): void {
  const block = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  el.addEventListener('paste', block);
  el.addEventListener('copy', block);
  el.addEventListener('cut', block);
}

function getTokenFromUrl(): string {
  const path = window.location.hash
    ? window.location.hash.substring(1)
    : window.location.pathname + window.location.search;
  const qs = path.includes('?') ? path.split('?')[1] : window.location.search.slice(1);
  return new URLSearchParams(qs).get('token')?.trim() || '';
}

export async function createResetPasswordPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'reset-password-page';
  const token = getTokenFromUrl();

  page.innerHTML = `
    <div class="relative w-full min-h-screen bg-background-light">
      <main class="flex w-full flex-col items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-sm flex flex-col gap-4">
          <h1 class="text-xl font-bold text-slate-900 text-center">Новый пароль</h1>
          ${
            token
              ? `
          <form id="reset-form" class="space-y-3 bg-white rounded-lg border border-slate-200 p-4">
            <div>
              <label for="reset-new" class="block text-sm font-medium text-slate-700 mb-1">Новый пароль</label>
              <input id="reset-new" type="password" autocomplete="new-password" required
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label for="reset-confirm" class="block text-sm font-medium text-slate-700 mb-1">Повторите пароль</label>
              <input id="reset-confirm" type="password" autocomplete="new-password" required
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <label class="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
              <input type="checkbox" id="reset-show" class="rounded border-slate-300" />
              Показать пароль
            </label>
            <p id="reset-err" class="hidden text-sm text-red-600"></p>
            <button type="submit" id="reset-submit"
              class="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90">
              Сохранить пароль
            </button>
          </form>`
              : `
          <p class="text-sm text-red-600 text-center">Ссылка недействительна. Запросите сброс пароля снова.</p>
          <button type="button" id="go-forgot" class="w-full border border-slate-200 py-2.5 rounded-lg text-sm">
            Запросить сброс пароля
          </button>`
          }
        </div>
      </main>
    </div>
  `;

  if (!token) {
    page.querySelector('#go-forgot')?.addEventListener('click', () => router.navigate('/forgot-password'));
    return page;
  }

  const neu = page.querySelector('#reset-new') as HTMLInputElement;
  const conf = page.querySelector('#reset-confirm') as HTMLInputElement;
  bindLatinPasswordField(neu, { interceptPaste: true });
  bindLatinPasswordField(conf, { interceptPaste: false });
  bindNoClipboard(conf);

  page.querySelector('#reset-show')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    const t = checked ? 'text' : 'password';
    neu.type = t;
    conf.type = t;
  });

  const errEl = page.querySelector('#reset-err') as HTMLElement;

  page.querySelector('#reset-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');
    if (neu.value !== conf.value) {
      errEl.textContent = 'Пароли не совпадают.';
      errEl.classList.remove('hidden');
      return;
    }
    const btn = page.querySelector('#reset-submit') as HTMLButtonElement;
    btn.disabled = true;
    try {
      await apiService.resetPassword({ token, new_password: neu.value });
      alert('Пароль изменён. Теперь вы можете войти.');
      router.navigate('/login');
    } catch (ex: unknown) {
      errEl.textContent = ex instanceof Error ? ex.message : 'Не удалось сменить пароль';
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  });

  return page;
}
