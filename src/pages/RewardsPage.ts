import { router } from '../router/index.js';
import { apiService } from '../services/api.js';
import { getRole } from '../utils/auth.js';

type RewardsSummary = {
  balance: number;
  total_earned: number;
  earned_by_kind: Record<string, number>;
  count_by_status: Record<string, number>;
};

type RewardRow = {
  id: string;
  kind: string;
  amount: number;
  status: string;
  description: string | null;
  offer_id: string | null;
  report_id: string | null;
  created_at: string;
};

function escapeHtml(s: string): string {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

function formatLocalDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function kindLabel(kind: string): string {
  const k = (kind || '').toLowerCase();
  if (k === 'bonus') return 'Бонусы';
  if (k === 'yandex_plus_points') return 'Баллы Яндекс Плюс';
  return 'Вознаграждение';
}

export async function createRewardsPage(): Promise<HTMLElement> {
  const role = getRole();
  if (role !== 'user') {
    router.navigate('/');
    return document.createElement('div');
  }

  const page = document.createElement('div');
  page.className = 'rewards-page';

  page.innerHTML = `
    <div class="relative w-full">
      <header class="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 pt-4 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-3">
          <button type="button" id="back-btn" class="text-slate-500 p-1" aria-label="Назад">←</button>
          <h1 class="text-xl font-bold flex-1 min-w-0">Вознаграждения</h1>
        </div>
      </header>
      <main class="pb-28 px-4 py-4 space-y-4">
        <div id="loading" class="py-8 text-center text-slate-500">Загрузка…</div>
        <div id="err" class="hidden py-8 text-center text-red-600"></div>
        <div id="content" class="hidden space-y-4"></div>
      </main>
    </div>
  `;

  page.querySelector('#back-btn')?.addEventListener('click', () => router.navigate('/profile'));

  const loading = page.querySelector('#loading') as HTMLElement;
  const err = page.querySelector('#err') as HTMLElement;
  const content = page.querySelector('#content') as HTMLElement;

  try {
    const [summaryResp, listResp] = await Promise.all([
      apiService.getRewardsSummary() as unknown as Promise<{ success: true; data: RewardsSummary }>,
      apiService.getRewards({ limit: 50, offset: 0 }) as unknown as Promise<{ success: true; data: RewardRow[] }>,
    ]);
    const summary = summaryResp.data;
    const rows = listResp.data ?? [];

    const history = rows.length
      ? rows
          .map(
            (r) => `
              <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-900">${escapeHtml(kindLabel(r.kind))}: +${Number(r.amount).toLocaleString()}</p>
                  <p class="text-xs text-slate-500">${escapeHtml(formatLocalDateTime(r.created_at))}</p>
                </div>
                <span class="text-xs text-slate-500">${escapeHtml(String(r.status || ''))}</span>
              </div>
            `
          )
          .join('')
      : `<p class="text-sm text-slate-500">Пока нет начислений</p>`;

    loading.classList.add('hidden');
    content.classList.remove('hidden');
    content.innerHTML = `
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="text-sm font-semibold text-slate-800 mb-2">Баланс</h2>
        <p class="text-3xl font-bold text-slate-900">${Number(summary.balance).toLocaleString()} бонусов</p>
        <p class="text-xs text-slate-500 mt-2">Мы показываем начисленные вознаграждения. Как вы тратите бонусы у партнёров — вы решаете самостоятельно.</p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex items-stretch gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-semibold text-slate-800">Потратить бонусы</h2>
            <p class="text-sm text-slate-600 mt-1">Вы можете потратить бонусы у наших партнёров.</p>
          </div>
          <a
            href="https://market.yandex.ru/"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-auto self-stretch inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100 transition-colors"
          >
            Перейти к партнёрам
          </a>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="text-sm font-semibold text-slate-800 mb-3">История</h2>
        <div class="space-y-2">
          ${history}
        </div>
      </div>
    `;
  } catch (e: any) {
    loading.classList.add('hidden');
    err.textContent = e?.message || 'Не удалось загрузить вознаграждения';
    err.classList.remove('hidden');
  }

  return page;
}

