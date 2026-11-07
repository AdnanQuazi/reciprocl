import { Database, Globe, Mail, MessageCircle, Plug, Plus, Table2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const integrationIcons = {
  message: MessageCircle,
  database: Database,
  web: Globe,
  mail: Mail,
  spreadsheet: Table2,
  automation: Zap,
};
const visibleLimit = 3;
const stackingOrder = ['z-30', 'z-20', 'z-10'];

export default function IntegrationIndicators({ integrations = [] }) {
  const items = integrations ?? [];

  if (items.length === 0) {
    return (
      <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
        <Plus aria-hidden="true" className="size-3" />
        <span className="sr-only">No integrations</span>
      </span>
    );
  }

  const overflow = items.length - visibleLimit;

  return (
    <div>
      <span className="sr-only">
        {items.length} {items.length === 1 ? 'integration' : 'integrations'}: {items.map(item => item.name).join(', ')}.
      </span>
      <div aria-hidden="true" className="isolate flex items-center -space-x-1.5">
        {items.slice(0, visibleLimit).map((item, index) => {
          const Icon = integrationIcons[item.icon] ?? Plug;

          return (
            <span key={item.id} title={item.name} className={cn('relative flex size-6 shrink-0 items-center justify-center rounded-full border border-card bg-integration text-integration-foreground', stackingOrder[index])}>
              <Icon className="size-3.5" />
            </span>
          );
        })}
        {overflow > 0 && (
          <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full border border-card bg-muted text-xs font-medium text-muted-foreground">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
