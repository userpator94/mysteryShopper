import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import { getRole } from '../utils/auth.js';

export type WithdrawMethod = 'bank_account' | 'phone' | 'card';

export type WithdrawDetails = {
  method: WithdrawMethod;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  account_number: string | null;
  bik: string | null;
  bank_name: string | null;
  phone: string | null;
  card_number: string | null;
  updated_at?: string;
};

type WithdrawDefaults = {
  last_name: string;
  first_name: string;
  middle_name: string | null;
  phone: string;
};

const METHOD_LABELS: Record<WithdrawMethod, string> = {
  bank_account: 'Банковские реквизиты',
  phone: 'Перевод по номеру телефона',
  card: 'Перевод по номеру карты',
};

function escapeHtml(s: string): string {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function formatAccountDisplay(account: string): string {
  const d = digitsOnly(account);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatCardDisplay(card: string): string {
  const d = digitsOnly(card);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatPhoneDisplay(phone: string): string {
  const d = digitsOnly(phone);
  if (d.length === 11 && d.startsWith('7')) {
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
  }
  return phone;
}

function isValidPhone(phone: string): boolean {
  const d = digitsOnly(phone);
  return d.length === 11 && d.startsWith('7');
}

function formatFioLine(details: WithdrawDetails): string {
  return [details.last_name, details.first_name, details.middle_name]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(' ');
}

function renderFioView(details: WithdrawDetails): string {
  return `
    <div>
      <p class="text-xs text-slate-500">ФИО получателя</p>
      <p class="text-sm font-medium text-slate-900">${escapeHtml(formatFioLine(details))}</p>
    </div>
  `;
}

function renderMethodFieldsView(details: WithdrawDetails): string {
  if (details.method === 'phone') {
    return `
      <div>
        <p class="text-xs text-slate-500">Телефон</p>
        <p class="text-sm font-medium text-slate-900">${escapeHtml(formatPhoneDisplay(details.phone || ''))}</p>
      </div>
      <div>
        <p class="text-xs text-slate-500">Банк</p>
        <p class="text-sm font-medium text-slate-900">${escapeHtml(details.bank_name || '—')}</p>
      </div>
    `;
  }
  if (details.method === 'card') {
    return `
      <div>
        <p class="text-xs text-slate-500">Номер карты</p>
        <p class="text-sm font-medium text-slate-900 font-mono tracking-wide">${escapeHtml(formatCardDisplay(details.card_number || ''))}</p>
      </div>
    `;
  }
  const bank = details.bank_name?.trim()
    ? `<div>
         <p class="text-xs text-slate-500">Банк</p>
         <p class="text-sm font-medium text-slate-900">${escapeHtml(details.bank_name)}</p>
       </div>`
    : '';
  return `
    <div>
      <p class="text-xs text-slate-500">Номер счёта</p>
      <p class="text-sm font-medium text-slate-900 font-mono tracking-wide">${escapeHtml(formatAccountDisplay(details.account_number || ''))}</p>
    </div>
    <div>
      <p class="text-xs text-slate-500">БИК</p>
      <p class="text-sm font-medium text-slate-900 font-mono">${escapeHtml(details.bik || '')}</p>
    </div>
    ${bank}
  `;
}

function renderView(details: WithdrawDetails): string {
  return `
    <div id="withdraw-view" class="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
      <button type="button" id="withdraw-open-request"
        class="w-full text-left space-y-3 rounded-lg -m-1 p-1 hover:bg-slate-50 transition-colors"
        aria-label="Перейти к выводу средств">
        ${renderFioView(details)}
        <div>
          <p class="text-xs text-slate-500">Способ вывода</p>
          <p class="text-sm font-semibold text-slate-900">${escapeHtml(METHOD_LABELS[details.method] || details.method)}</p>
        </div>
        ${renderMethodFieldsView(details)}
        <p class="text-xs text-primary font-semibold pt-1">Нажмите, чтобы вывести Рэшки →</p>
      </button>
      <button type="button" id="withdraw-edit-btn"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors">
        Редактировать
      </button>
    </div>
  `;
}

function renderForm(
  details: Partial<WithdrawDetails> | null,
  opts?: { submitLabel?: string; selectedMethod?: WithdrawMethod }
): string {
  const d = details;
  const method: WithdrawMethod = opts?.selectedMethod || d?.method || 'bank_account';
  const submitLabel = opts?.submitLabel ?? 'Сохранить';

  const methodRadio = (value: WithdrawMethod, label: string) => `
    <label class="flex items-start gap-2 cursor-pointer rounded-lg border ${
      method === value ? 'border-primary bg-primary/5' : 'border-slate-200'
    } px-3 py-2.5">
      <input type="radio" name="wd-method" value="${value}" class="mt-0.5" ${method === value ? 'checked' : ''} />
      <span class="text-sm font-medium text-slate-800">${escapeHtml(label)}</span>
    </label>
  `;

  return `
    <form id="withdraw-form" class="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
      <div class="space-y-3">
        <p class="text-sm font-medium text-slate-800">ФИО получателя</p>
        <div>
          <label for="wd-last-name" class="block text-sm font-medium text-slate-700 mb-1">Фамилия</label>
          <input id="wd-last-name" name="last_name" type="text" autocomplete="family-name"
            value="${escapeHtml(d?.last_name ?? '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required maxlength="100" />
        </div>
        <div>
          <label for="wd-first-name" class="block text-sm font-medium text-slate-700 mb-1">Имя</label>
          <input id="wd-first-name" name="first_name" type="text" autocomplete="given-name"
            value="${escapeHtml(d?.first_name ?? '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required maxlength="100" />
        </div>
        <div>
          <label for="wd-middle-name" class="block text-sm font-medium text-slate-700 mb-1">
            Отчество <span class="font-normal text-slate-400">(необязательно)</span>
          </label>
          <input id="wd-middle-name" name="middle_name" type="text" autocomplete="additional-name"
            value="${escapeHtml(d?.middle_name ?? '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" maxlength="100" />
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-800">Способ вывода</p>
        ${methodRadio('bank_account', METHOD_LABELS.bank_account)}
        ${methodRadio('phone', METHOD_LABELS.phone)}
        ${methodRadio('card', METHOD_LABELS.card)}
      </div>

      <div id="wd-fields-bank" class="space-y-3 ${method === 'bank_account' ? '' : 'hidden'}">
        <div>
          <label for="wd-account" class="block text-sm font-medium text-slate-700 mb-1">Номер счёта</label>
          <input id="wd-account" name="account_number" type="text" inputmode="numeric" autocomplete="off"
            value="${escapeHtml(d?.account_number ?? '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" maxlength="20"
            placeholder="20 цифр" />
        </div>
        <div>
          <label for="wd-bik" class="block text-sm font-medium text-slate-700 mb-1">БИК</label>
          <input id="wd-bik" name="bik" type="text" inputmode="numeric" autocomplete="off"
            value="${escapeHtml(d?.bik ?? '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" maxlength="9"
            placeholder="9 цифр" />
        </div>
        <div>
          <label for="wd-bank-optional" class="block text-sm font-medium text-slate-700 mb-1">
            Банк <span class="font-normal text-slate-400">(необязательно)</span>
          </label>
          <input id="wd-bank-optional" name="bank_name_optional" type="text" autocomplete="organization"
            value="${escapeHtml(method === 'bank_account' ? d?.bank_name ?? '' : '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" maxlength="200" />
        </div>
      </div>

      <div id="wd-fields-phone" class="space-y-3 ${method === 'phone' ? '' : 'hidden'}">
        <div>
          <label for="wd-phone" class="block text-sm font-medium text-slate-700 mb-1">Номер телефона</label>
          <input id="wd-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel"
            value="${escapeHtml(d?.phone ?? '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="+7 (999) 999-99-99" />
        </div>
        <div>
          <label for="wd-bank-required" class="block text-sm font-medium text-slate-700 mb-1">Банк</label>
          <input id="wd-bank-required" name="bank_name_required" type="text" autocomplete="organization"
            value="${escapeHtml(method === 'phone' ? d?.bank_name ?? '' : '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" maxlength="200"
            placeholder="Банк получателя" />
        </div>
      </div>

      <div id="wd-fields-card" class="space-y-3 ${method === 'card' ? '' : 'hidden'}">
        <div>
          <label for="wd-card" class="block text-sm font-medium text-slate-700 mb-1">Номер карты</label>
          <input id="wd-card" name="card_number" type="text" inputmode="numeric" autocomplete="cc-number"
            value="${escapeHtml(d?.card_number ?? '')}"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" maxlength="16"
            placeholder="16 цифр" />
        </div>
      </div>

      <p id="wd-err" class="hidden text-sm text-red-600"></p>
      <p id="wd-ok" class="hidden text-sm text-emerald-700"></p>
      <div class="flex gap-2">
        <button type="submit" id="wd-submit"
          class="flex-1 bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60">
          ${escapeHtml(submitLabel)}
        </button>
        <button type="button" id="wd-cancel"
          class="hidden flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Отмена
        </button>
      </div>
    </form>
  `;
}

function applyPhoneMask(input: HTMLInputElement): void {
  input.addEventListener('input', () => {
    let digits = digitsOnly(input.value);
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    const rest = digits.slice(1);
    let formatted = '+7';
    if (rest.length > 0) formatted += ` (${rest.slice(0, 3)}`;
    if (rest.length >= 3) formatted += ')';
    if (rest.length > 3) formatted += ` ${rest.slice(3, 6)}`;
    if (rest.length > 6) formatted += `-${rest.slice(6, 8)}`;
    if (rest.length > 8) formatted += `-${rest.slice(8, 10)}`;
    input.value = formatted;
  });
}

export async function createWithdrawPage(): Promise<HTMLElement> {
  const role = getRole();
  if (role !== 'user') {
    router.navigate('/');
    return document.createElement('div');
  }

  const page = document.createElement('div');
  page.className = 'withdraw-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <button type="button" id="back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 class="text-xl font-bold flex-1 min-w-0">Обналичить Рэшки</h1>
        </div>
      </header>
      <main class="pb-28 px-4 py-3 space-y-3 max-w-md mx-auto">
        <p class="text-sm text-slate-600">
          Выберите способ вывода и сохраните реквизиты. Их можно изменить в любой момент.
        </p>
        <div id="loading" class="py-6 text-center text-slate-500">Загрузка…</div>
        <div id="err" class="hidden py-8 text-center text-red-600"></div>
        <div id="content" class="hidden space-y-3"></div>
      </main>
    </div>
  `;

  page.querySelector('#back-btn')?.addEventListener('click', () => router.back('/rewards'));

  const loading = page.querySelector('#loading') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;

  let saved: WithdrawDetails | null = null;
  let defaults: WithdrawDefaults = {
    last_name: '',
    first_name: '',
    middle_name: null,
    phone: '',
  };

  const showPageErr = (msg: string) => {
    loading.classList.add('hidden');
    content.classList.add('hidden');
    err.textContent = msg;
    err.classList.remove('hidden');
  };

  const bindDigitsInput = (input: HTMLInputElement | null, maxLen: number) => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.value = digitsOnly(input.value).slice(0, maxLen);
    });
  };

  const readCurrentPartial = (): Partial<WithdrawDetails> => {
    const method =
      (content.querySelector('input[name="wd-method"]:checked') as HTMLInputElement | null)?.value ||
      'bank_account';
    return {
      method: method as WithdrawMethod,
      last_name: (content.querySelector('#wd-last-name') as HTMLInputElement | null)?.value ?? '',
      first_name: (content.querySelector('#wd-first-name') as HTMLInputElement | null)?.value ?? '',
      middle_name: (content.querySelector('#wd-middle-name') as HTMLInputElement | null)?.value || null,
      account_number: (content.querySelector('#wd-account') as HTMLInputElement | null)?.value || null,
      bik: (content.querySelector('#wd-bik') as HTMLInputElement | null)?.value || null,
      bank_name:
        method === 'phone'
          ? (content.querySelector('#wd-bank-required') as HTMLInputElement | null)?.value || null
          : (content.querySelector('#wd-bank-optional') as HTMLInputElement | null)?.value || null,
      phone: (content.querySelector('#wd-phone') as HTMLInputElement | null)?.value || null,
      card_number: (content.querySelector('#wd-card') as HTMLInputElement | null)?.value || null,
    };
  };

  const mountForm = (
    details: Partial<WithdrawDetails> | null,
    mode: 'create' | 'edit',
    selectedMethod?: WithdrawMethod
  ) => {
    const emptyHint =
      mode === 'create'
        ? `<p class="text-sm text-slate-500">Реквизиты ещё не сохранены. Заполните форму ниже.</p>`
        : '';
    const method = selectedMethod || details?.method || 'bank_account';
    content.innerHTML =
      emptyHint +
      renderForm(details, {
        submitLabel: mode === 'create' ? 'Сохранить' : 'Сохранить изменения',
        selectedMethod: method,
      });
    content.classList.remove('hidden');

    const form = content.querySelector('#withdraw-form') as HTMLFormElement;
    const errEl = content.querySelector('#wd-err') as HTMLElement;
    const okEl = content.querySelector('#wd-ok') as HTMLElement;
    const submitBtn = content.querySelector('#wd-submit') as HTMLButtonElement;
    const cancelBtn = content.querySelector('#wd-cancel') as HTMLButtonElement;

    bindDigitsInput(content.querySelector('#wd-account'), 20);
    bindDigitsInput(content.querySelector('#wd-bik'), 9);
    bindDigitsInput(content.querySelector('#wd-card'), 16);
    const phoneInput = content.querySelector('#wd-phone') as HTMLInputElement | null;
    if (phoneInput) applyPhoneMask(phoneInput);

    content.querySelectorAll<HTMLInputElement>('input[name="wd-method"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const nextMethod = radio.value as WithdrawMethod;
        const partial = readCurrentPartial();
        if (nextMethod === 'phone' && !partial.phone && defaults.phone) {
          partial.phone = defaults.phone;
        }
        mountForm({ ...partial, method: nextMethod }, mode, nextMethod);
      });
    });

    if (mode === 'edit' && saved) {
      cancelBtn.classList.remove('hidden');
      cancelBtn.addEventListener('click', () => mountView(saved!));
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.classList.add('hidden');
      okEl.classList.add('hidden');

      const method =
        ((content.querySelector('input[name="wd-method"]:checked') as HTMLInputElement | null)
          ?.value as WithdrawMethod) || 'bank_account';
      const last_name = (content.querySelector('#wd-last-name') as HTMLInputElement).value.trim();
      const first_name = (content.querySelector('#wd-first-name') as HTMLInputElement).value.trim();
      const middle_name =
        (content.querySelector('#wd-middle-name') as HTMLInputElement).value.trim() || null;

      if (!last_name) {
        errEl.textContent = 'Укажите фамилию';
        errEl.classList.remove('hidden');
        return;
      }
      if (!first_name) {
        errEl.textContent = 'Укажите имя';
        errEl.classList.remove('hidden');
        return;
      }

      const payload: Record<string, unknown> = {
        method,
        last_name,
        first_name,
        middle_name,
      };

      if (method === 'bank_account') {
        const account_number = digitsOnly(
          (content.querySelector('#wd-account') as HTMLInputElement).value
        );
        const bik = digitsOnly((content.querySelector('#wd-bik') as HTMLInputElement).value);
        const bank_name =
          (content.querySelector('#wd-bank-optional') as HTMLInputElement).value.trim() || null;
        if (account_number.length !== 20) {
          errEl.textContent = 'Номер счёта должен содержать ровно 20 цифр';
          errEl.classList.remove('hidden');
          return;
        }
        if (bik.length !== 9) {
          errEl.textContent = 'БИК должен содержать ровно 9 цифр';
          errEl.classList.remove('hidden');
          return;
        }
        payload.account_number = account_number;
        payload.bik = bik;
        payload.bank_name = bank_name;
      } else if (method === 'phone') {
        const phone = (content.querySelector('#wd-phone') as HTMLInputElement).value.trim();
        const bank_name =
          (content.querySelector('#wd-bank-required') as HTMLInputElement).value.trim();
        if (!isValidPhone(phone)) {
          errEl.textContent = 'Укажите телефон в формате +7 (XXX) XXX-XX-XX';
          errEl.classList.remove('hidden');
          return;
        }
        if (!bank_name) {
          errEl.textContent = 'Укажите банк для перевода по телефону';
          errEl.classList.remove('hidden');
          return;
        }
        payload.phone = formatPhoneDisplay(phone);
        payload.bank_name = bank_name;
      } else {
        const card_number = digitsOnly(
          (content.querySelector('#wd-card') as HTMLInputElement).value
        );
        if (card_number.length !== 16) {
          errEl.textContent = 'Номер карты должен содержать ровно 16 цифр';
          errEl.classList.remove('hidden');
          return;
        }
        payload.card_number = card_number;
      }

      submitBtn.disabled = true;
      try {
        const resp = await apiService.saveWithdrawDetails(payload as any);
        const next = resp.data as WithdrawDetails;
        saved = next;
        okEl.textContent = 'Реквизиты сохранены';
        okEl.classList.remove('hidden');
        mountView(next);
      } catch (ex: any) {
        errEl.textContent = ex?.message || 'Не удалось сохранить реквизиты';
        errEl.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
      }
    });
  };

  const mountView = (details: WithdrawDetails) => {
    content.innerHTML = renderView(details);
    content.classList.remove('hidden');
    content.querySelector('#withdraw-open-request')?.addEventListener('click', () => {
      router.navigate('/rewards/withdraw/request');
    });
    content.querySelector('#withdraw-edit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      mountForm(details, 'edit');
    });
  };

  try {
    const resp = await apiService.getWithdrawDetails();
    saved = resp.data;
    if (resp.defaults) {
      defaults = {
        last_name: resp.defaults.last_name || '',
        first_name: resp.defaults.first_name || '',
        middle_name: resp.defaults.middle_name ?? null,
        phone: resp.defaults.phone || '',
      };
    }
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    if (saved) {
      mountView(saved);
    } else {
      mountForm(
        {
          method: 'bank_account',
          last_name: defaults.last_name,
          first_name: defaults.first_name,
          middle_name: defaults.middle_name,
          phone: defaults.phone,
        },
        'create'
      );
    }
  } catch (e: any) {
    showPageErr(e?.message || 'Не удалось загрузить реквизиты');
  }

  return page;
}
