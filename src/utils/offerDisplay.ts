import type { Offer } from '../types/index.js';

/** Карточки исполнителя: без «0 ₽», если денежная сумма не задана */
export const EXECUTOR_PRICE_NOT_SET_LABEL = 'Сумма не указана';

/**
 * Положительная сумма вознаграждения в ₽ или 0 (null, пусто, 0 и ниже — «не задано»).
 */
export function getOfferMoneyRubPositive(offer: Pick<Offer, 'price'>): number {
  const raw = offer.price != null ? String(offer.price).replace(/\s/g, '').replace(',', '.') : '';
  const num = parseFloat(raw);
  if (Number.isNaN(num) || num <= 0) return 0;
  return num;
}

/** Одна строка для списков/карточек: «N ₽» или нейтральная подпись. */
export function formatExecutorMoneyRewardShort(offer: Pick<Offer, 'price'>): string {
  const n = getOfferMoneyRubPositive(offer);
  return n > 0 ? `${n.toLocaleString('ru-RU')} ₽` : EXECUTOR_PRICE_NOT_SET_LABEL;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Абзацы описания — суть задания для исполнителя */
export function descriptionToParagraphsHtml(description: string): string {
  const t = (description || '').trim();
  if (!t) return '<p class="text-slate-500 italic">Описание не указано.</p>';
  return t
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p class="mb-2 last:mb-0">${escapeHtml(line)}</p>`)
    .join('');
}

/** Доп. условия — списком, если текст не дублирует описание целиком */
export function requirementsToBulletsHtml(requirements: string, description: string): string {
  const r = (requirements || '').trim();
  const d = (description || '').trim();
  if (!r) return '';
  if (r === d) return '';
  return r
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<div class="flex items-start gap-2 mb-2"><span class="text-primary mt-1">•</span><span>${escapeHtml(line)}</span></div>`)
    .join('');
}

/**
 * Вознаграждение: не только «сумма в ₽» — денежная часть + текст из полей задания
 * (в тестовых данных суть невыкупных форматов задаётся в описании).
 */
export function formatCompensationLines(offer: Offer): string[] {
  const lines: string[] = [];
  const n = getOfferMoneyRubPositive(offer);
  if (n > 0) {
    lines.push(`Денежная компенсация: ${n.toLocaleString('ru-RU')} ₽`);
  } else {
    lines.push('Фиксированная сумма в рублях не задана — условия вознаграждения см. в описании задания.');
  }
  return lines;
}

/** Грубая классификация типа вознаграждения для фильтра/сортировки в списке (без отдельного поля в БД). */
export type RewardKindInferred = 'money' | 'non_money' | 'mixed' | 'unknown';

export function inferRewardKind(offer: Offer): RewardKindInferred {
  const hasMoney = getOfferMoneyRubPositive(offer) > 0;
  const text = `${offer.description || ''} ${offer.requirements || ''}`.toLowerCase();
  const nonMoneyHints =
    /сертификат|бартер|бонус|кэшбэк|не денежн|продукт|набор|подарок|скидк|эквивалент|безнал|договор|балл|депозит/i.test(
      text
    );
  if (hasMoney && nonMoneyHints) return 'mixed';
  if (hasMoney && !nonMoneyHints) return 'money';
  if (!hasMoney || nonMoneyHints) return 'non_money';
  return 'unknown';
}

const REWARD_SORT_ORDER: Record<RewardKindInferred, number> = {
  money: 0,
  mixed: 1,
  non_money: 2,
  unknown: 3
};

/** Категории с главной (Home): совпадение по тексту задания и тегам. */
export function offerMatchesProductCategory(offer: Offer, category: string | null): boolean {
  if (!category) return true;
  const blob = `${offer.title || ''} ${offer.description || ''} ${String(offer.tags || '')}`.toLowerCase();
  const map: Record<string, RegExp> = {
    clothing: /одежд|бутик|масс-маркет|футболк|джинс|плать|куртк/i,
    shoes: /обув|кроссов|ботин|сапог|шуз/i,
    electronics: /электрон|техник|смартфон|ноутбук|гаджет/i,
    food: /продукт|супермаркет|кафе|ресторан|еда|гастро|вкус/i,
    sports: /спорт|фитнес|тренаж|велосипед|зал/i,
    beauty: /космет|красот|парикмах|уход|макияж/i
  };
  const re = map[category];
  return re ? re.test(blob) : true;
}

export function offerMatchesRewardFilter(offer: Offer, filter: string | null): boolean {
  if (!filter || filter === 'all') return true;
  return inferRewardKind(offer) === filter;
}

export function sortOffersForList(
  offers: Offer[],
  sortKey: string
): Offer[] {
  const arr = [...offers];
  const num = (o: Offer) => getOfferMoneyRubPositive(o);
  const part = (o: Offer) => Number(o.current_participants ?? 0);
  const created = (o: Offer) => new Date(o.created_at || 0).getTime();
  const rk = (o: Offer) => REWARD_SORT_ORDER[inferRewardKind(o)];

  switch (sortKey) {
    case 'created_asc':
      return arr.sort((a, b) => created(a) - created(b));
    case 'price_desc':
      return arr.sort((a, b) => num(b) - num(a));
    case 'price_asc':
      return arr.sort((a, b) => num(a) - num(b));
    case 'participants_desc':
      return arr.sort((a, b) => part(b) - part(a));
    case 'participants_asc':
      return arr.sort((a, b) => part(a) - part(b));
    case 'reward_kind':
      return arr.sort((a, b) => rk(a) - rk(b));
    case 'created_desc':
    default:
      return arr.sort((a, b) => created(b) - created(a));
  }
}
