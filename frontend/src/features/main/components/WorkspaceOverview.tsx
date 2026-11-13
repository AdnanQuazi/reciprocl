import { UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Workspace, WorkspaceSummary } from '../types';

export default function WorkspaceOverview({
  workspace, summary,
}: { workspace: Workspace; summary: WorkspaceSummary }) {
  return (
    <section aria-labelledby="workspace-title" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 id="workspace-title" className="text-2xl font-bold tracking-tight break-words">{workspace.name}</h1>
        <ul aria-label="Workspace summary" className="mt-2 flex flex-col gap-2 text-xs font-medium text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          <li><strong className="font-semibold text-foreground">{summary.responses.toLocaleString('en-US')}</strong> responses</li>
          <li aria-hidden="true" className="hidden sm:block">•</li>
          <li>
            <strong className="font-semibold text-foreground">{summary.completionPercentage}%</strong> completion
          </li>
          <li aria-hidden="true" className="hidden sm:block">•</li>
          <li>
            <strong className="font-semibold text-foreground">{summary.liveForms}</strong> live forms
          </li>
        </ul>
      </div>
      <Button variant="outline" size="compact" disabled className="shrink-0 self-start" aria-label="Invite — unavailable" title="Invite — unavailable">
        <UserRoundPlus aria-hidden="true" className="size-4" />
        Invite
      </Button>
    </section>
  );
}
