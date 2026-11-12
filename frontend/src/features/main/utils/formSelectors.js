export function filterFormsByStatus(forms, statusFilter = 'all') {
  return forms.filter(form => statusFilter === 'all' || form.status === statusFilter);
}

export function searchFormsByName(forms, query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  return forms.filter(form => form.name.toLowerCase().includes(normalizedQuery));
}

export function sortForms(forms, sortOrder = 'updated-desc') {
  const direction = sortOrder.endsWith('-asc') ? 1 : -1;

  return [...forms].sort((a, b) => {
    let comparison;

    switch (sortOrder) {
      case 'name-asc':
      case 'name-desc':
        comparison = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) * direction;
        break;
      case 'responses-asc':
      case 'responses-desc': {
        const aMissing = !Number.isFinite(a.responses);
        const bMissing = !Number.isFinite(b.responses);
        // Missing values stay last regardless of the numeric sort direction.
        if (aMissing !== bMissing) return aMissing ? 1 : -1;
        comparison = aMissing ? 0 : (a.responses - b.responses) * direction;
        break;
      }
      default:
        comparison = (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * direction;
    }

    // Equal primary values always use ID ascending, independent of direction.
    return comparison || a.id.localeCompare(b.id, 'en');
  });
}

export function paginateForms(forms, page = 1, pageSize = 8) {
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
