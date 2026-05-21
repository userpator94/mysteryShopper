export const LIST_ROW_CARD = 'list-row-card';

export function listRowCardClasses(padding: 'p-3' | 'p-4' = 'p-4'): string {
  const padClass = padding === 'p-3' ? 'list-row-card--p3' : 'list-row-card--p4';
  return `${LIST_ROW_CARD} ${padClass}`;
}

/** Подсветка карточек списка (mouse/touch/focus) — дополняет CSS :hover. */
export function bindListRowCardHover(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(`.${LIST_ROW_CARD}`).forEach((el) => {
    if (el.dataset.listRowHoverBound === '1') return;
    el.dataset.listRowHoverBound = '1';

    const activate = () => el.classList.add('list-row-card--hovered');
    const deactivate = () => el.classList.remove('list-row-card--hovered');

    el.addEventListener('mouseenter', activate);
    el.addEventListener('mouseleave', deactivate);
    el.addEventListener('focusin', activate);
    el.addEventListener('focusout', deactivate);
    el.addEventListener('touchstart', activate, { passive: true });
    el.addEventListener('touchend', deactivate, { passive: true });
    el.addEventListener('touchcancel', deactivate, { passive: true });
  });
}
