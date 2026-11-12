import { useId, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FormsPagination({
  range,
  totalCount,
  currentPage,
  pageCount,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  disabled = true,
}) {
  const pageSizeId = useId();
  const noticeId = useId();
  const pageSummaryId = useId();
  const pageButtons = useRef({});
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  function navigateToPage(page) {
    // Keep focus within pagination when the activated boundary control disables.
    if (page === 1 || page === pageCount) pageButtons.current[page]?.focus();
    onPageChange?.(page);
  }

  return (
    <div className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-border py-4">
      {disabled && <p id={noticeId} className="sr-only">Pagination controls are unavailable.</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p role="status" aria-atomic="true" className="text-xs text-muted-foreground">
          {totalCount === 0 && <span className="sr-only">No forms found. </span>}
          Showing <strong className="font-semibold text-foreground">{range.start}–{range.end}</strong> of {totalCount} forms
        </p>
        <div className="flex items-center gap-1.5">
          <label htmlFor={pageSizeId} className="text-xs text-muted-foreground">Rows<span className="sr-only"> per page</span></label>
          <Select
            value={String(pageSize)}
            onValueChange={value => onPageSizeChange?.(Number(value))}
            disabled={disabled || !onPageSizeChange}
          >
            <SelectTrigger id={pageSizeId} size="compact" aria-describedby={disabled ? noticeId : undefined} title={disabled ? 'Rows per page — unavailable' : 'Rows per page'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(size => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <nav aria-label="Forms pagination" aria-describedby={disabled ? `${pageSummaryId} ${noticeId}` : pageSummaryId}>
        <p id={pageSummaryId} className="sr-only">{pageCount > 0 ? `Page ${currentPage} of ${pageCount}` : 'No result pages.'}</p>
        <ul className="flex flex-wrap items-center gap-1.5">
          <li>
            <Button type="button" variant="outline" size="pagination" disabled={disabled || !onPageChange || currentPage <= 1} onClick={() => navigateToPage(currentPage - 1)} aria-label="Previous page">
              <ChevronLeft aria-hidden="true" className="size-3" />
              Previous
            </Button>
          </li>
          {pageNumbers.map(page => (
            <li key={page}>
              <Button ref={node => { pageButtons.current[page] = node; }} type="button" variant="page" size="page" disabled={disabled || !onPageChange} onClick={() => onPageChange?.(page)} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined}>
                {page}
              </Button>
            </li>
          ))}
          <li>
            <Button type="button" variant="outline" size="pagination" disabled={disabled || !onPageChange || currentPage >= pageCount} onClick={() => navigateToPage(currentPage + 1)} aria-label="Next page">
              Next
              <ChevronRight aria-hidden="true" className="size-3" />
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
