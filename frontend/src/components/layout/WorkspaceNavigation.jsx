import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkspaceNavigation({ groups }) {
  return (
    <nav aria-labelledby="workspace-navigation-title" className="mt-8">
      <div className="flex items-center justify-between px-2">
        <h2 id="workspace-navigation-title" className="text-xs font-medium text-muted-foreground">Workspaces</h2>
        <Button variant="ghost" size="icon-xs" disabled aria-label="Add workspace — unavailable" title="Add workspace — unavailable">
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {groups.map(({ id, label, icon: Icon, workspaces }) => (
          <details key={id} open className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span>{label}</span>
              <ChevronRight aria-hidden="true" className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-90" />
            </summary>
            <ul className="space-y-1 pl-5">
              {workspaces.map(({ id: workspaceId, name, current }) => (
                <li key={workspaceId}>
                  {current ? (
                    <span aria-current="location" className="flex h-7 items-center rounded-md bg-muted px-3 text-xs font-medium">
                      <span className="truncate">{name}</span>
                    </span>
                  ) : (
                    <Button variant="navigation" size="sm" disabled className="h-7 w-full" title={`${name} — unavailable`}>
                      <span className="truncate">{name}</span>
                      <span className="sr-only"> — unavailable</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  );
}
