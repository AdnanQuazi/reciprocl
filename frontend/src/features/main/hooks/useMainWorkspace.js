import { useState } from 'react';
import { filterFormsByStatus, paginateForms, searchFormsByName, sortForms } from '@/features/main/utils/formSelectors';

const pageSizeOptions = [8, 16, 24];

export default function useMainWorkspace(forms) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('updated-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const statusForms = filterFormsByStatus(forms, statusFilter);
  const matchingForms = searchFormsByName(statusForms, searchQuery);
  const sortedForms = sortForms(matchingForms, sortOrder);
  const pagination = paginateForms(sortedForms, currentPage, pageSize);

  function onStatusChange(status) {
    setStatusFilter(status);
    setCurrentPage(1);
  }

  function onSearchChange(query) {
    setSearchQuery(query);
    setCurrentPage(1);
  }

  function onSortChange(order) {
    setSortOrder(order);
    setCurrentPage(1);
  }

  function onPageChange(page) {
    if (!Number.isInteger(page)) return;
    setCurrentPage(Math.min(Math.max(1, page), Math.max(1, pagination.pageCount)));
  }

  function onPageSizeChange(size) {
    if (!pageSizeOptions.includes(size)) return;
    setPageSize(size);
    setCurrentPage(1);
  }

  return {
    statusFilter, onStatusChange,
    searchQuery, onSearchChange,
    sortOrder, onSortChange,
    pageSize, pageSizeOptions, onPageChange, onPageSizeChange,
    ...pagination,
  };
}
