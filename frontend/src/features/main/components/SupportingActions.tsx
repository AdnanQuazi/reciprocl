import { useId } from 'react';
import { Link2, PanelsTopLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const actions = [
  { id: 'templates', title: 'Start from a template', description: 'Lead capture, job application, feedback.', icon: PanelsTopLeft },
  { id: 'frappe', title: 'Connect a Frappe app', description: 'Send responses to CRM, ERPNext, or HR.', icon: Link2 },
];

export default function SupportingActions() {
  const sectionId = useId();

  return (
    <section aria-labelledby={sectionId} className="mt-6">
      <h2 id={sectionId} className="sr-only">Supporting actions</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {actions.map(({ id, title, description, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant="supporting"
            size="tile"
            className="w-full"
            disabled
            aria-label={`${title} — unavailable`}
            aria-describedby={`${sectionId}-${id}`}
            title={`${title} — unavailable`}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <Badge variant="subtle" aria-hidden="true">Unavailable</Badge>
            </span>
            <span className="block">
              <span className="block text-sm font-semibold">{title}</span>
              <span id={`${sectionId}-${id}`} className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
