import { apiService } from '../../services/api.js';
import type { LegalOfferMeta } from '../../types/index.js';
import { escapeHtml, formatDateTime, wrapWithAdminShell } from './adminShell.js';

function formatSize(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderDocs(docs: LegalOfferMeta[]): string {
  if (docs.length === 0) {
    return '<p class="text-sm text-slate-500">Документы не найдены</p>';
  }

  return `
    <div class="space-y-3">
      ${docs
        .map((doc) => {
          const status = doc.exists
            ? '<span class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">на сервере</span>'
            : '<span class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">файл отсутствует</span>';
          return `
            <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="text-base font-semibold text-slate-800">${escapeHtml(doc.label)}</h2>
                  <p class="mt-1 text-xs text-slate-500">
                    ${escapeHtml(doc.filename)} · версия ${escapeHtml(doc.version)} · ${formatSize(doc.size)}
                    ${doc.mtime ? ` · ${escapeHtml(formatDateTime(doc.mtime))}` : ''}
                  </p>
                  <div class="mt-2">${status}</div>
                </div>
                <button
                  type="button"
                  class="admin-open-doc rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  data-role="${escapeHtml(doc.role)}"
                  ${doc.exists ? '' : 'disabled'}
                >
                  Открыть
                </button>
              </div>
            </section>
          `;
        })
        .join('')}
    </div>
    <p class="mt-4 text-xs text-slate-500">
      Файлы лежат на сервере в каталоге LEGAL_PDFS_DIR (по умолчанию /srv/mysteryshopper/pdfs/).
      Замена — вручную: Оферта_для_Исполнителя.pdf и Оферта_для_Заказчика.pdf.
    </p>
  `;
}

export async function createAdminDocumentsPage(): Promise<HTMLElement> {
  const content = document.createElement('div');
  content.innerHTML =
    '<div class="flex justify-center py-16"><div class="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700"></div></div>';

  const page = wrapWithAdminShell(content, 'documents');

  try {
    const docs = await apiService.getAdminLegalDocs();
    content.innerHTML = renderDocs(docs);

    content.querySelectorAll<HTMLButtonElement>('.admin-open-doc').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const role = btn.getAttribute('data-role');
        if (role !== 'user' && role !== 'employer') return;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Открытие…';
        try {
          await apiService.openAdminLegalDoc(role);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Ошибка открытия';
          alert(msg);
        } finally {
          btn.disabled = false;
          btn.textContent = prev || 'Открыть';
        }
      });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
    content.innerHTML = `<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">${escapeHtml(msg)}</div>`;
  }

  return page;
}
