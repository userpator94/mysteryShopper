import { router } from '../../router/index.js';
import { apiService } from '../../services/api.js';
import { isAuthenticated, getRole } from '../../utils/auth.js';
import { ADMIN_OVERVIEW_PATH } from '../../utils/adminPaths.js';
import { EMAIL_FORMAT_HINT, isValidEmailFormat } from '../../utils/email.js';

export async function createAdminLoginPage(): Promise<HTMLElement> {
  if (isAuthenticated() && getRole() === 'admin') {
    setTimeout(() => router.navigate(ADMIN_OVERVIEW_PATH, { replace: true }), 0);
    const loading = document.createElement('div');
    loading.className = 'admin-login-page flex h-screen items-center justify-center bg-slate-100';
    loading.innerHTML =
      '<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700"></div>';
    return loading;
  }

  const page = document.createElement('div');
  page.className = 'admin-login-page';
  page.innerHTML = `
    <div class="flex min-h-screen w-full flex-col items-center justify-center bg-slate-100 p-4">
      <div class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4">
          <input
            id="admin-login-email"
            type="text"
            inputmode="email"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            aria-label="email"
            class="h-12 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="email"
          />
          <input
            id="admin-login-password"
            type="password"
            autocomplete="current-password"
            aria-label="пароль"
            class="h-12 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="пароль"
          />
        </div>

        <div
          id="admin-login-error"
          class="mt-4 hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        ></div>

        <button
          type="button"
          id="admin-login-button"
          class="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 text-base font-semibold text-white hover:bg-slate-800"
        >
          Войти
        </button>
      </div>
    </div>
  `;

  const emailInput = page.querySelector('#admin-login-email') as HTMLInputElement;
  const passwordInput = page.querySelector('#admin-login-password') as HTMLInputElement;
  const errorBox = page.querySelector('#admin-login-error') as HTMLElement;
  const button = page.querySelector('#admin-login-button') as HTMLButtonElement;

  const showError = (msg: string) => {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  };
  const hideError = () => {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  };

  const submit = async () => {
    hideError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      showError('Введите email и пароль');
      return;
    }
    if (!isValidEmailFormat(email)) {
      showError(EMAIL_FORMAT_HINT);
      return;
    }

    button.disabled = true;
    button.textContent = 'Вход…';
    try {
      await apiService.loginAdmin(email, password);
      if (getRole() !== 'admin') {
        showError('Доступ запрещён');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        return;
      }
      router.navigate(ADMIN_OVERVIEW_PATH, { replace: true });
    } catch (e: unknown) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : 'Неверный логин или пароль';
      showError(msg);
    } finally {
      button.disabled = false;
      button.textContent = 'Войти';
    }
  };

  button.addEventListener('click', () => void submit());
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void submit();
  });
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void submit();
  });

  return page;
}
