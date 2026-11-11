import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import WorkspaceNavigation from './WorkspaceNavigation';

export default function SidebarContent({ brand, accountLabel, navigation, workspaceGroups, mobile = false }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card text-card-foreground">
      <div className={cn('flex h-14 shrink-0 items-center gap-3 border-b border-border px-4', mobile && 'pr-12')}>
        <img src={brand.logo} alt="" className="size-8 rounded-md object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{brand.name}</p>
          <p className="type-micro truncate text-muted-foreground">{accountLabel}</p>
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
    </div>
  );
}
