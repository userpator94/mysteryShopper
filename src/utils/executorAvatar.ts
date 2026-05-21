import { escapeHtml } from './employerExecutorProfileUi.js';

export type ExecutorAvatarInput = {
  avatar_url?: string | null;
  avatar_emoji?: string | null;
  /** Tailwind classes for outer circle, e.g. w-10 h-10 */
  sizeClass?: string;
  /** Tailwind text size for emoji, e.g. text-2xl */
  emojiTextClass?: string;
};

const DEFAULT_SIZE = 'w-16 h-16';
const DEFAULT_EMOJI_TEXT = 'text-4xl';

/**
 * HTML блока аватара исполнителя: загруженное фото → эмодзи → плейсхолдер «?».
 */
export function buildExecutorAvatarHtml(input: ExecutorAvatarInput): string {
  const size = input.sizeClass ?? DEFAULT_SIZE;
  const emojiText = input.emojiTextClass ?? DEFAULT_EMOJI_TEXT;
  const base = `${size} rounded-full flex items-center justify-center shrink-0 border border-slate-200`;

  const url = input.avatar_url?.trim();
  if (url) {
    return `<img src="${escapeHtml(url)}" alt="" class="${size} rounded-full object-cover border border-slate-200 shrink-0" />`;
  }

  const emoji = input.avatar_emoji?.trim();
  if (emoji) {
    return `<div class="${base} bg-slate-50 ${emojiText} leading-none" aria-hidden="true">${escapeHtml(emoji)}</div>`;
  }

  return `<div class="${base} bg-slate-200 text-slate-500 text-2xl font-semibold" aria-hidden="true">?</div>`;
}

/** Установить эмодзи-аватар в DOM-элемент (профиль исполнителя). */
export function applyExecutorAvatarToElement(
  el: HTMLElement | null,
  avatar_emoji: string | null | undefined
): void {
  if (!el) return;
  const emoji = avatar_emoji?.trim();
  if (!emoji) return;
  el.textContent = emoji;
  el.classList.remove('bg-slate-200');
  el.classList.add('bg-slate-50');
}
