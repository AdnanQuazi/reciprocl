import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RefObject, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ButtonProps } from '@/components/ui/button';

interface HeaderProps {
  search: { label: string; placeholder: string; value: string; onValueChange: (value: string) => void };
  actions: readonly { id: string; label: string; variant: ButtonProps['variant']; icon?: LucideIcon }[];
  navigationTrigger: ReactNode;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export default function Header({ search, actions, navigationTrigger, searchInputRef }: HeaderProps) {
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-card-foreground md:px-8">
      <div className="flex w-full min-w-0 items-center gap-3 md:w-auto">
        {navigationTrigger}
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-muted px-2.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring md:w-64 md:flex-none">
          <label htmlFor="workspace-search" className="sr-only">{search.label}</label>
          <Search aria-hidden="true" className="pointer-events-none size-4 shrink-0 text-tertiary-foreground" />
          <Input
            ref={searchInputRef}
            variant="search"
            id="workspace-search"
            type="search"
            placeholder={search.placeholder}
            value={search.value}
            onChange={event => search.onValueChange(event.target.value)}
            className="min-w-0 flex-1"
          />
        </div>
      </div>

      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
        <span id="header-actions-unavailable" className="sr-only text-xs text-muted-foreground lg:not-sr-only">Actions unavailable</span>
        {actions.map(({ id, label, variant, icon: Icon }) => (
          <Button key={id} variant={variant} size="compact" disabled aria-describedby="header-actions-unavailable" title={`${label} — unavailable`}>
            {Icon && <Icon aria-hidden="true" className="size-4" />}
            {label}
          </Button>
        ))}
      </div>
    </header>
  );
}
