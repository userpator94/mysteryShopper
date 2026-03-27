/**
 * Конструктор чек-листа на страницах создания/редактирования оффера.
 */
import { MAX_CHECKLIST_ITEMS } from '../config/checklist.js';
import type { ChecklistItem, ChecklistItemType, ChecklistSchema } from '../types/index.js';

export function newQuestionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function checklistSectionHtml(): string {
  return `
    <div class="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
      <p class="text-sm font-medium text-slate-800">Формат отчёта исполнителя</p>
      <div class="flex flex-col gap-2">
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input type="radio" name="report-mode" value="standard" id="report-mode-standard" class="text-primary" checked />
          <span class="text-sm">Стандарт: оценка и текст</span>
        </label>
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input type="radio" name="report-mode" value="custom" id="report-mode-custom" class="text-primary" />
          <span class="text-sm">Кастомный чек-лист (до ${MAX_CHECKLIST_ITEMS} вопросов)</span>
        </label>
      </div>
      <div id="checklist-builder" class="hidden space-y-2">
        <div id="checklist-items" class="space-y-2"></div>
        <button type="button" id="checklist-add-item" class="text-sm text-primary font-medium">+ Добавить вопрос</button>
      </div>
    </div>
  `;
}

function typeSelectHtml(selected: ChecklistItemType): string {
  const types: { v: ChecklistItemType; l: string }[] = [
    { v: 'boolean', l: 'Да/нет' },
    { v: 'scale_1_5', l: 'Шкала 1–5' },
    { v: 'text', l: 'Текст' },
    { v: 'single_choice', l: 'Выбор из вариантов' }
  ];
  return types
    .map(
      (t) =>
        `<option value="${t.v}" ${t.v === selected ? 'selected' : ''}>${t.l}</option>`
    )
    .join('');
}

export function renderChecklistItemRow(item: Partial<ChecklistItem> & { id: string }): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'bg-white border border-slate-200 rounded p-2 space-y-2';
  wrap.dataset.itemId = item.id;
  const type = (item.type || 'text') as ChecklistItemType;
  wrap.innerHTML = `
    <div class="flex flex-wrap gap-2 items-end">
      <div class="flex-1 min-w-[120px]">
        <label class="text-xs text-slate-600">Текст вопроса</label>
        <input type="text" class="cl-label w-full px-2 py-1 border rounded text-sm" value="${escapeAttr(item.label || '')}" />
      </div>
      <div>
        <label class="text-xs text-slate-600">Тип</label>
        <select class="cl-type w-full px-2 py-1 border rounded text-sm" data-item-id="${item.id}">
          ${typeSelectHtml(type)}
        </select>
      </div>
      <label class="flex items-center gap-1 text-xs pt-4">
        <input type="checkbox" class="cl-req" ${item.required ? 'checked' : ''} /> обязательно
      </label>
      <button type="button" class="cl-remove text-red-600 text-sm px-2">Удалить</button>
    </div>
    <div class="cl-options-wrap ${type === 'single_choice' ? '' : 'hidden'}">
      <label class="text-xs text-slate-600">Варианты (через запятую)</label>
      <input type="text" class="cl-options w-full px-2 py-1 border rounded text-sm" value="${escapeAttr((item.options || []).join(', '))}" placeholder="вариант1, вариант2" />
    </div>
  `;
  const typeSel = wrap.querySelector('.cl-type') as HTMLSelectElement;
  const optWrap = wrap.querySelector('.cl-options-wrap') as HTMLElement;
  typeSel?.addEventListener('change', () => {
    optWrap.classList.toggle('hidden', typeSel.value !== 'single_choice');
  });
  wrap.querySelector('.cl-remove')?.addEventListener('click', () => wrap.remove());
  return wrap;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function initChecklistBuilder(
  page: HTMLElement,
  initial: ChecklistSchema | null | undefined
): void {
  const builder = page.querySelector('#checklist-builder') as HTMLElement;
  const itemsEl = page.querySelector('#checklist-items') as HTMLElement;
  const addBtn = page.querySelector('#checklist-add-item') as HTMLButtonElement;
  const modeStandard = page.querySelector('#report-mode-standard') as HTMLInputElement;
  const modeCustom = page.querySelector('#report-mode-custom') as HTMLInputElement;

  const syncMode = () => {
    const custom = modeCustom?.checked;
    builder?.classList.toggle('hidden', !custom);
  };
  modeStandard?.addEventListener('change', syncMode);
  modeCustom?.addEventListener('change', syncMode);

  const addItem = (data?: Partial<ChecklistItem> & { id: string }) => {
    if (!itemsEl) return;
    if (itemsEl.children.length >= MAX_CHECKLIST_ITEMS) {
      alert(`Не более ${MAX_CHECKLIST_ITEMS} вопросов`);
      return;
    }
    const id = data?.id || newQuestionId();
    itemsEl.appendChild(renderChecklistItemRow({ ...data, id }));
  };

  addBtn?.addEventListener('click', () => addItem({ id: newQuestionId(), type: 'text', label: '', required: false }));

  if (initial?.items?.length) {
    modeCustom.checked = true;
    modeStandard.checked = false;
    initial.items.forEach((it) => addItem(it));
  }
  syncMode();
}

export function collectOfferChecklistFromPage(page: HTMLElement): {
  mode: 'standard' | 'custom';
  schema: ChecklistSchema | null;
} {
  const modeCustom = (page.querySelector('#report-mode-custom') as HTMLInputElement)?.checked;
  if (!modeCustom) {
    return { mode: 'standard', schema: null };
  }
  const itemsEl = page.querySelector('#checklist-items');
  if (!itemsEl) return { mode: 'custom', schema: null };
  const items: ChecklistItem[] = [];
  itemsEl.querySelectorAll('[data-item-id]').forEach((node) => {
    const wrap = node as HTMLElement;
    const id = wrap.dataset.itemId || newQuestionId();
    const label = (wrap.querySelector('.cl-label') as HTMLInputElement)?.value.trim() || '';
    const type = (wrap.querySelector('.cl-type') as HTMLSelectElement)?.value as ChecklistItemType;
    const required = (wrap.querySelector('.cl-req') as HTMLInputElement)?.checked ?? false;
    const optRaw = (wrap.querySelector('.cl-options') as HTMLInputElement)?.value || '';
    const options =
      type === 'single_choice'
        ? optRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
    if (!label) return;
    items.push({ id, type, label, required, options });
  });
  if (items.length === 0) {
    alert('Добавьте хотя бы один вопрос в чек-листе.');
    return { mode: 'custom', schema: null };
  }
  return { mode: 'custom', schema: { items } };
}
