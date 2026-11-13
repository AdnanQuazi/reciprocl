import type { PaginationResult, SortOrder, StatusFilter } from '../types.ts';

interface SortableRecord {
  id: string;
  name?: string;
  updatedAt?: string;
  responses?: number | null;
}

export function filterFormsByStatus<T>(
  forms: readonly T[],
  statusFilter: StatusFilter = 'all',
): T[] {
  return forms.filter(form => statusFilter === 'all' || (
    typeof form === 'object' && form !== null && 'status' in form && form.status === statusFilter
  ));
}

export function searchFormsByName<T extends { name: string }>(
  forms: readonly T[],
  query = '',
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return forms.filter(form => form.name.toLowerCase().includes(normalizedQuery));
}

export function sortForms<T extends SortableRecord>(
  forms: readonly T[],
  sortOrder: SortOrder = 'updated-desc',
): T[] {
  const direction = sortOrder.endsWith('-asc') ? 1 : -1;

  return [...forms].sort((a, b) => {
    let comparison = 0;

    switch (sortOrder) {
      case 'name-asc':
      case 'name-desc':
        if (a.name !== undefined && b.name !== undefined) {
          comparison = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) * direction;
        }
        break;
      case 'responses-asc':
      case 'responses-desc': {
        const aCount = typeof a.responses === 'number' && Number.isFinite(a.responses) ? a.responses : null;
        const bCount = typeof b.responses === 'number' && Number.isFinite(b.responses) ? b.responses : null;
        const aMissing = aCount === null;
        const bMissing = bCount === null;
        // Missing values stay last regardless of the numeric sort direction.
        if (aMissing !== bMissing) return aMissing ? 1 : -1;
        comparison = aCount !== null && bCount !== null ? (aCount - bCount) * direction : 0;
        break;
      }
      default:
        if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
          comparison = (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * direction;
        }
    }

    // Equal primary values always use ID ascending, independent of direction.
    return comparison || a.id.localeCompare(b.id, 'en');
  });
}

export function paginateForms<T>(
  forms: readonly T[],
  page = 1,
  pageSize = 8,
): PaginationResult<T> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('Page size must be a positive integer.');
  }

  const totalCount = forms.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const requestedPage = Number.isInteger(page) ? page : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), Math.max(1, pageCount));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  return {
    visibleForms: forms.slice(startIndex, endIndex),
    totalCount,
    currentPage,
    pageCount,
    range: { start: totalCount === 0 ? 0 : startIndex + 1, end: endIndex },
  };
}
