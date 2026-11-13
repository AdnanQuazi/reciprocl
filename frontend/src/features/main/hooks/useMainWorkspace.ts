import { useState } from 'react';
import { filterFormsByStatus, paginateForms, searchFormsByName, sortForms } from '@/features/main/utils/formSelectors';
import type { FormRecord, SortOrder, StatusFilter } from '@/features/main/types';

const pageSizeOptions: readonly number[] = [8, 16, 24];

export default function useMainWorkspace(forms: readonly FormRecord[]) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('updated-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const statusForms = filterFormsByStatus(forms, statusFilter);
  const matchingForms = searchFormsByName(statusForms, searchQuery);
  const sortedForms = sortForms(matchingForms, sortOrder);
  const pagination = paginateForms(sortedForms, currentPage, pageSize);

  function onStatusChange(status: StatusFilter) {
    setStatusFilter(status);
    setCurrentPage(1);
  }

  function onSearchChange(query: string) {
    setSearchQuery(query);
    setCurrentPage(1);
  }

  function onSortChange(order: SortOrder) {
    setSortOrder(order);
    setCurrentPage(1);
  }

  function onPageChange(page: number) {
    if (!Number.isInteger(page)) return;
    setCurrentPage(Math.min(Math.max(1, page), Math.max(1, pagination.pageCount)));
  }

  function onPageSizeChange(size: number) {
    if (!pageSizeOptions.includes(size)) return;
    setPageSize(size);
    setCurrentPage(1);
  }

  function onClearFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOrder('updated-desc');
    setCurrentPage(1);
  }

  return {
    statusFilter, onStatusChange,
    searchQuery, onSearchChange,
    sortOrder, onSortChange,
    pageSize, pageSizeOptions, onPageChange, onPageSizeChange, onClearFilters,
    ...pagination,
  };
}
