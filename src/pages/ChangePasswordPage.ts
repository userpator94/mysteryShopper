// Отдельный экран смены пароля (из профиля)

import { router } from '../router/index.js';
import { apiService } from '../services/api.js';

/** Как на бэкенде (validators): только латиница, цифры и перечисленные символы. */
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
    if (k.length === 1 && !PASSWORD_CHAR.test(k)) {
      e.preventDefault();
    }
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

export async function createChangePasswordPage(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'change-password-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <button type="button" id="back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 class="text-xl font-bold">Смена пароля</h1>
        </div>
      </header>
      <main class="pb-28 px-4 py-4 max-w-md mx-auto">
        <form id="pwd-form" class="space-y-4 bg-white rounded-lg border border-slate-200 p-4">
          <div>
            <label for="pwd-current" class="block text-sm font-medium text-slate-700 mb-1">Текущий пароль</label>
            <input id="pwd-current" type="password" autocomplete="current-password" spellcheck="false" autocapitalize="off"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label for="pwd-new" class="block text-sm font-medium text-slate-700 mb-1">Новый пароль</label>
            <input id="pwd-new" type="password" autocomplete="new-password" spellcheck="false" autocapitalize="off"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label for="pwd-confirm" class="block text-sm font-medium text-slate-700 mb-1">Повторите новый пароль</label>
            <input id="pwd-confirm" type="password" autocomplete="new-password" spellcheck="false" autocapitalize="off"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-800 cursor-pointer select-none">
            <input type="checkbox" id="pwd-show" class="rounded border-slate-300" />
            Показать пароль
          </label>
          <p id="pwd-err" class="hidden text-sm text-red-600"></p>
          <button type="submit" id="pwd-submit" class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90">
            Сохранить
          </button>
        </form>
      </main>
    </div>
  `;

  page.querySelector('#back-btn')?.addEventListener('click', () => {
    router.navigate('/profile');
  });

  const cur = page.querySelector('#pwd-current') as HTMLInputElement;
  const neu = page.querySelector('#pwd-new') as HTMLInputElement;
  const conf = page.querySelector('#pwd-confirm') as HTMLInputElement;

  bindLatinPasswordField(cur, { interceptPaste: true });
  bindLatinPasswordField(neu, { interceptPaste: true });
  bindLatinPasswordField(conf, { interceptPaste: false });
  bindNoClipboard(conf);

  const showCb = page.querySelector('#pwd-show') as HTMLInputElement;
  showCb?.addEventListener('change', () => {
    const t = showCb.checked ? 'text' : 'password';
    cur.type = t;
    neu.type = t;
    conf.type = t;
  });

  const errEl = page.querySelector('#pwd-err') as HTMLElement;
  const showErr = (msg: string) => {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  };
  const hideErr = () => errEl.classList.add('hidden');

  page.querySelector('#pwd-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErr();
    const current = cur.value;
    const next = neu.value;
    const again = conf.value;
    if (next !== again) {
      showErr('Новый пароль и повтор не совпадают.');
      return;
    }
    const btn = page.querySelector('#pwd-submit') as HTMLButtonElement;
    btn.disabled = true;
    try {
      await apiService.changePassword({ current_password: current, new_password: next });
      router.navigate('/login');
    } catch (ex: unknown) {
      showErr(ex instanceof Error ? ex.message : 'Не удалось сменить пароль');
    } finally {
      btn.disabled = false;
    }
  });

  return page;
}
