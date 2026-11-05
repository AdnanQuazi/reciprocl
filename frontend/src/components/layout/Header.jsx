import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Header({ search, actions, navigationTrigger }) {
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-card-foreground md:px-8">
      <div className="flex w-full min-w-0 items-center gap-3 md:w-auto">
        {navigationTrigger}
        <div className="relative min-w-0 flex-1 md:w-64 md:flex-none">
          <label htmlFor="workspace-search" className="sr-only">{search.label}</label>
          <Search aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
          <Input
            variant="search"
            id="workspace-search"
            type="search"
            placeholder={search.placeholder}
            disabled
            aria-describedby="search-unavailable"
            className="h-8 pl-9"
          />
          <span id="search-unavailable" className="sr-only">Search is unavailable.</span>
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
