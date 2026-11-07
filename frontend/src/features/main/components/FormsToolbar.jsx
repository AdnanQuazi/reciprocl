import { useId } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

const sortOptions = [
  { value: 'updated-desc', label: 'Last updated, newest first' },
  { value: 'updated-asc', label: 'Last updated, oldest first' },
  { value: 'name-asc', label: 'Form name, A–Z' },
  { value: 'name-desc', label: 'Form name, Z–A' },
  { value: 'responses-desc', label: 'Response count, highest first' },
  { value: 'responses-asc', label: 'Response count, lowest first' },
];

export default function FormsToolbar({ statusFilter, onStatusChange, sortOrder, onSortChange }) {
  const noticeId = useId();

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-3">
      <p id={noticeId} className="sr-only">Changing the view is unavailable.</p>
      <div role="group" aria-label="Filter forms by status" className="flex items-center gap-6">
        {statusFilters.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            variant="filter"
            size="filter"
            className="-mb-3"
            aria-pressed={statusFilter === value}
            onClick={() => onStatusChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3">
        <Select value={sortOrder} onValueChange={onSortChange}>
          <SelectTrigger variant="toolbar" size="compact" className="max-w-full" aria-label="Sort forms">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {sortOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div role="group" aria-label="Forms display" className="flex items-center gap-1">
          <Button variant="view" size="icon-xs" disabled aria-pressed="true" aria-label="List view" aria-describedby={noticeId} title="List view selected">
            <List aria-hidden="true" className="size-4" />
          </Button>
          <Button variant="view" size="icon-xs" disabled aria-pressed="false" aria-label="Grid view — unavailable" aria-describedby={noticeId} title="Grid view — unavailable">
            <LayoutGrid aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
