import type { Offer } from '../types/index.js';

/** Карточки: без «0», если сумма не задана */
export const EXECUTOR_PRICE_NOT_SET_LABEL = 'Вознаграждение не указано';
export const EMPLOYER_PRICE_NOT_SET_LABEL = 'Вознаграждение не указано';

/**
 * В API `price` хранится в рублях (как вводит заказчик).
 * Исполнителю показываем ту же величину в Рэшках.
 * Курс можно поменять здесь, не трогая формы заказчика.
 */
export const RUB_TO_RESHKI_RATE = 1;

export function rublesToReshki(rubles: number): number {
  return Math.floor(rubles * RUB_TO_RESHKI_RATE);
}

/** Склонение единицы «Рэшка» по числу (1 Рэшка, 2 Рэшки, 5 Рэшек). */
export function reshkiWord(n: number): string {
  const abs = Math.abs(Math.floor(n)) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'Рэшек';
  if (last === 1) return 'Рэшка';
  if (last >= 2 && last <= 4) return 'Рэшки';
  return 'Рэшек';
}

/** «N Рэшек» с локальным форматированием числа. */
export function formatReshkiAmount(n: number): string {
  return `${n.toLocaleString('ru-RU')} ${reshkiWord(n)}`;
}

/** «N ₽» — отображение для заказчика. */
export function formatRublesAmount(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`;
}

/**
 * Положительная сумма вознаграждения в рублях (из API) или 0.
 */
export function getOfferRewardPositive(offer: Pick<Offer, 'price'>): number {
  const raw = offer.price != null ? String(offer.price).replace(/\s/g, '').replace(',', '.') : '';
  const num = parseFloat(raw);
  if (Number.isNaN(num) || num <= 0) return 0;
  return num;
}

/** Одна строка для исполнителя: «N Рэшек» или нейтральная подпись. */
export function formatExecutorRewardShort(offer: Pick<Offer, 'price'>): string {
  const rub = getOfferRewardPositive(offer);
  if (rub <= 0) return EXECUTOR_PRICE_NOT_SET_LABEL;
  return formatReshkiAmount(rublesToReshki(rub));
}

/** Только число (для списка заданий); без единицы «Рэшки». */
export function formatExecutorRewardNumber(offer: Pick<Offer, 'price'>): string {
  const rub = getOfferRewardPositive(offer);
  if (rub <= 0) return EXECUTOR_PRICE_NOT_SET_LABEL;
  return rublesToReshki(rub).toLocaleString('ru-RU');
}

/** Одна строка для заказчика: «N ₽» или нейтральная подпись. */
export function formatEmployerRewardShort(offer: Pick<Offer, 'price'>): string {
  const rub = getOfferRewardPositive(offer);
  return rub > 0 ? formatRublesAmount(rub) : EMPLOYER_PRICE_NOT_SET_LABEL;
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

export type RewardViewer = 'executor' | 'employer';

/**
 * Вознаграждение для карточки задания: заказчику — рубли, исполнителю — Рэшки.
 */
export function formatCompensationLines(offer: Offer, viewer: RewardViewer = 'executor'): string[] {
  const lines: string[] = [];
  const rub = getOfferRewardPositive(offer);
  if (rub > 0) {
    const amount =
      viewer === 'employer'
        ? formatRublesAmount(rub)
        : formatReshkiAmount(rublesToReshki(rub));
    lines.push(`Вознаграждение: ${amount}`);
  } else if (viewer === 'employer') {
    lines.push('Фиксированная сумма в рублях не задана — условия вознаграждения см. в описании задания.');
  } else {
    lines.push('Фиксированное число Рэшек не задано — условия вознаграждения см. в описании задания.');
  }
  return lines;
}

/** Грубая классификация типа вознаграждения для фильтра/сортировки в списке (без отдельного поля в БД). */
export type RewardKindInferred = 'bonus' | 'non_bonus' | 'mixed' | 'unknown';

export function inferRewardKind(offer: Offer): RewardKindInferred {
  const hasReshki = getOfferRewardPositive(offer) > 0;
  const text = `${offer.description || ''} ${offer.requirements || ''}`.toLowerCase();
  const nonReshkiHints =
    /сертификат|бартер|кэшбэк|не денежн|продукт|набор|подарок|скидк|эквивалент|безнал|договор|депозит/i.test(
      text
    );
  if (hasReshki && nonReshkiHints) return 'mixed';
  if (hasReshki && !nonReshkiHints) return 'bonus';
  if (!hasReshki || nonReshkiHints) return 'non_bonus';
  return 'unknown';
}

const REWARD_SORT_ORDER: Record<RewardKindInferred, number> = {
  bonus: 0,
  mixed: 1,
  non_bonus: 2,
  unknown: 3
};

/** Категории с главной (Home): совпадение по тексту задания. */
export function offerMatchesProductCategory(offer: Offer, category: string | null): boolean {
  if (!category) return true;
  const blob = `${offer.title || ''} ${offer.description || ''}`.toLowerCase();
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

/** Упоминание скидки в тексте задания. Не использует эвристику типа вознаграждения. */
const DISCOUNT_HINT = /скидк|кэшбэк|кэшбек|купон|промокод/i;

export function offerMentionsDiscount(offer: Pick<Offer, 'title' | 'description' | 'requirements'>): boolean {
  const blob = `${offer.title || ''} ${offer.description || ''} ${offer.requirements || ''}`;
  return DISCOUNT_HINT.test(blob);
}

/**
 * Задания с вознаграждением строго выше медианы положительных сумм.
 * Если выше медианы меньше двух заданий, порог не применяется: остаются все с положительной суммой.
 */
export function selectHighIncomeOffers<T extends Pick<Offer, 'price'>>(offers: T[]): T[] {
  const priced = offers.filter((o) => getOfferRewardPositive(o) > 0);
  if (priced.length < 2) return priced;

  const values = priced.map((o) => getOfferRewardPositive(o)).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  const above = priced.filter((o) => getOfferRewardPositive(o) > median);
  if (above.length < 2) return priced;
  return above;
}

export function sortOffersForList(
  offers: Offer[],
  sortKey: string
): Offer[] {
  const arr = [...offers];
  const num = (o: Offer) => getOfferRewardPositive(o);
  const part = (o: Offer) => Number(o.current_participants ?? 0);
  const created = (o: Offer) => new Date(o.created_at || 0).getTime();
  const rk = (o: Offer) => REWARD_SORT_ORDER[inferRewardKind(o)];

  let sorted: Offer[];
  switch (sortKey) {
    case 'created_asc':
      sorted = arr.sort((a, b) => created(a) - created(b));
      break;
    case 'price_desc':
      sorted = arr.sort((a, b) => num(b) - num(a));
      break;
    case 'price_asc':
      sorted = arr.sort((a, b) => num(a) - num(b));
      break;
    case 'participants_desc':
      sorted = arr.sort((a, b) => part(b) - part(a));
      break;
    case 'participants_asc':
      sorted = arr.sort((a, b) => part(a) - part(b));
      break;
    case 'reward_kind':
      sorted = arr.sort((a, b) => rk(a) - rk(b));
      break;
    case 'created_desc':
    default:
      sorted = arr.sort((a, b) => created(b) - created(a));
  }

  return sorted.sort((a, b) => Number(b.is_promo) - Number(a.is_promo));
}
