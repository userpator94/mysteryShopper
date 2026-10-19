import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import { getRole } from '../utils/auth.js';
import { formatReshkiAmount } from '../utils/offerDisplay.js';
import type { WithdrawDetails, WithdrawMethod } from './WithdrawPage.js';

const METHOD_LABELS: Record<WithdrawMethod, string> = {
  bank_account: 'Банковские реквизиты',
  phone: 'Перевод по номеру телефона',
  card: 'Перевод по номеру карты',
};

/** Минимальная сумма вывода (Рэшки). Курс вывода: 1 Рэшка = 1 ₽. */
const MIN_WITHDRAW_AMOUNT = 2000;

function escapeHtml(s: string): string {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function formatFio(d: WithdrawDetails): string {
  return [d.last_name, d.first_name, d.middle_name]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(' ');
}

function destinationSummary(d: WithdrawDetails): string {
  if (d.method === 'phone') {
    return `${d.phone || '—'} · ${d.bank_name || '—'}`;
  }
  if (d.method === 'card') {
    const c = digitsOnly(d.card_number || '');
    const masked = c.length === 16 ? `${c.slice(0, 4)} ···· ···· ${c.slice(-4)}` : c || '—';
    return masked;
  }
  const acc = digitsOnly(d.account_number || '');
  const short = acc.length === 20 ? `····${acc.slice(-4)}` : acc || '—';
  return `счёт ${short}${d.bik ? `, БИК ${d.bik}` : ''}`;
}

export async function createWithdrawRequestPage(): Promise<HTMLElement> {
  const role = getRole();
  if (role !== 'user') {
    router.navigate('/');
    return document.createElement('div');
  }

  const page = document.createElement('div');
  page.className = 'withdraw-request-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <button type="button" id="back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 class="text-xl font-bold flex-1 min-w-0">Вывод средств</h1>
        </div>
      </header>
      <main class="pb-28 lg:pb-8 px-4 py-3 space-y-3 max-w-md mx-auto">
        <div id="loading" class="py-6 text-center text-slate-500">Загрузка…</div>
        <div id="err" class="hidden py-8 text-center text-red-600"></div>
        <div id="content" class="hidden space-y-3"></div>
      </main>
    </div>
  `;

  page.querySelector('#back-btn')?.addEventListener('click', () => router.back('/rewards/withdraw'));

  const loading = page.querySelector('#loading') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;

  const showPageErr = (msg: string) => {
    loading.classList.add('hidden');
    content.classList.add('hidden');
    err.textContent = msg;
    err.classList.remove('hidden');
  };

  try {
    const [detailsResp, summaryResp] = await Promise.all([
      apiService.getWithdrawDetails(),
      apiService.getRewardsSummary(),
    ]);
    const details = detailsResp.data as WithdrawDetails | null;
    let balance = Math.max(0, Math.floor(Number(summaryResp.data?.balance ?? 0)));

    if (!details) {
      loading.classList.add('hidden');
      content.classList.remove('hidden');
      content.innerHTML = `
        <div class="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
          <p class="text-sm text-slate-600">Сначала сохраните реквизиты для вывода.</p>
          <button type="button" id="go-details"
            class="app-cta bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90">
            Указать реквизиты
          </button>
        </div>
      `;
      content.querySelector('#go-details')?.addEventListener('click', () => {
        router.navigate('/rewards/withdraw');
      });
      return page;
    }

    const canWithdraw = balance >= MIN_WITHDRAW_AMOUNT;
    const renderAmountHint = () =>
      canWithdraw
        ? `Минимум ${MIN_WITHDRAW_AMOUNT.toLocaleString('ru-RU')}, максимум ${balance.toLocaleString('ru-RU')}`
        : `Для вывода нужно накопить минимум ${formatReshkiAmount(MIN_WITHDRAW_AMOUNT)}`;

    loading.classList.add('hidden');
    content.classList.remove('hidden');
    content.innerHTML = `
      <div class="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
        <p class="text-xs text-slate-500">Доступно к выводу</p>
        <p id="wr-balance" class="text-2xl font-bold text-slate-900">${formatReshkiAmount(balance)}</p>
      </div>

      <div class="rounded-lg border border-sky-100 bg-sky-50 p-3">
        <p class="text-sm text-slate-700">
          На счёт будут переведены <span class="font-semibold">рубли</span> по курсу
          <span class="font-semibold">1 Рэшка = 1&nbsp;₽</span>.
          Минимальная сумма вывода — ${formatReshkiAmount(MIN_WITHDRAW_AMOUNT)}.
        </p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
        <p class="text-xs text-slate-500">Куда выводим</p>
        <p class="text-sm font-semibold text-slate-900">${escapeHtml(formatFio(details))}</p>
        <p class="text-sm text-slate-700">${escapeHtml(METHOD_LABELS[details.method])}</p>
        <p class="text-sm text-slate-600">${escapeHtml(destinationSummary(details))}</p>
      </div>

      <form id="wr-form" class="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
        <div>
          <label for="wr-amount" class="block text-sm font-medium text-slate-700 mb-1">Сумма вывода (в Рэшках)</label>
          <input id="wr-amount" type="text" inputmode="numeric" autocomplete="off"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
            placeholder="Не меньше ${MIN_WITHDRAW_AMOUNT}" ${canWithdraw ? '' : 'disabled'} />
          <p id="wr-hint" class="text-xs text-slate-500 mt-1">${renderAmountHint()}</p>
        </div>
        <button type="button" id="wr-all"
          class="text-sm font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
          ${canWithdraw ? '' : 'disabled'}>
          Вывести весь баланс
        </button>
        <p id="wr-err" class="hidden text-sm text-red-600"></p>
        <p id="wr-ok" class="hidden text-sm text-emerald-700"></p>
        <button type="submit" id="wr-submit"
          class="app-cta bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60"
          ${canWithdraw ? '' : 'disabled'}>
          Вывести
        </button>
      </form>
    `;

    const amountInput = content.querySelector('#wr-amount') as HTMLInputElement;
    const errEl = content.querySelector('#wr-err') as HTMLElement;
    const okEl = content.querySelector('#wr-ok') as HTMLElement;
    const submitBtn = content.querySelector('#wr-submit') as HTMLButtonElement;
    const allBtn = content.querySelector('#wr-all') as HTMLButtonElement;
    const hintEl = content.querySelector('#wr-hint') as HTMLElement;
    const balanceEl = content.querySelector('#wr-balance') as HTMLElement;

    const syncDisabled = () => {
      const ok = balance >= MIN_WITHDRAW_AMOUNT;
      amountInput.disabled = !ok;
      allBtn.disabled = !ok;
      submitBtn.disabled = !ok;
      hintEl.textContent = ok
        ? `Минимум ${MIN_WITHDRAW_AMOUNT.toLocaleString('ru-RU')}, максимум ${balance.toLocaleString('ru-RU')}`
        : `Для вывода нужно накопить минимум ${formatReshkiAmount(MIN_WITHDRAW_AMOUNT)}`;
      balanceEl.textContent = formatReshkiAmount(balance);
    };

    amountInput.addEventListener('input', () => {
      amountInput.value = digitsOnly(amountInput.value).replace(/^0+(?=\d)/, '');
    });

    allBtn.addEventListener('click', () => {
      if (balance >= MIN_WITHDRAW_AMOUNT) amountInput.value = String(balance);
    });

    content.querySelector('#wr-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.classList.add('hidden');
      okEl.classList.add('hidden');

      const amount = Number(digitsOnly(amountInput.value));
      if (!Number.isFinite(amount) || amount < MIN_WITHDRAW_AMOUNT) {
        errEl.textContent = `Минимальная сумма вывода — ${formatReshkiAmount(MIN_WITHDRAW_AMOUNT)}`;
        errEl.classList.remove('hidden');
        return;
      }
      if (amount > balance) {
        errEl.textContent = 'Сумма превышает доступный баланс';
        errEl.classList.remove('hidden');
        return;
      }

      submitBtn.disabled = true;
      try {
        await apiService.createWithdrawRequest({ amount });
        okEl.textContent = `Заявка на вывод ${formatReshkiAmount(amount)} (${amount.toLocaleString('ru-RU')} ₽) создана`;
        okEl.classList.remove('hidden');
        amountInput.value = '';
        balance = Math.max(0, balance - amount);
        syncDisabled();
      } catch (ex: any) {
        errEl.textContent = ex?.message || 'Не удалось создать заявку на вывод';
        errEl.classList.remove('hidden');
        submitBtn.disabled = balance < MIN_WITHDRAW_AMOUNT;
      }
    });
  } catch (e: any) {
    showPageErr(e?.message || 'Не удалось открыть экран вывода');
  }

  return page;
}
