/**
 * Нормализует поле tags из API (string или string[]) в строку для отображения:
 * слова через запятую, без символов [ ].
 */
export function formatTagsForDisplay(tags: string | string[] | undefined | null): string {
  if (tags == null) return '';
  if (Array.isArray(tags)) {
    return tags
      .map((t) => String(t).replace(/^\[|\]$/g, '').trim())
      .filter(Boolean)
      .join(', ');
  }
  return String(tags).replace(/^\[|\]$/g, '').trim();
}
