import { Button } from '@/components/ui/button';
import WorkspaceNavigation from './WorkspaceNavigation';

export default function Sidebar({ brand, accountLabel, navigation, workspaceGroups }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card text-card-foreground md:flex">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <img src={brand.logo} alt="" className="size-8 rounded-md object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{brand.name}</p>
          <p className="truncate text-xs text-muted-foreground">{accountLabel}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <nav aria-label="Primary navigation">
          <ul className="space-y-1">
            {navigation.map(({ id, label, icon: Icon, current }) => (
              <li key={id}>
                {current ? (
                  <span aria-current="page" className="flex h-8 items-center gap-2 rounded-md bg-muted px-3 text-xs font-medium">
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    {label}
                  </span>
                ) : (
                  <Button variant="navigation" size="sm" disabled className="w-full" title={`${label} — unavailable`}>
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                    <span className="sr-only"> — unavailable</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <WorkspaceNavigation groups={workspaceGroups} />
      </div>
    </aside>
  );
}
