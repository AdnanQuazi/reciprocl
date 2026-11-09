import { useId } from 'react';
import { BriefcaseBusiness, CalendarDays, FileText, LifeBuoy, Mail, MessageCircle, MoreHorizontal, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FormStatusBadge from '@/features/main/components/FormStatusBadge';
import IntegrationIndicators from '@/features/main/components/IntegrationIndicators';
import ResponseTrend from '@/features/main/components/ResponseTrend';

const formIcons = { file: FileText, briefcase: BriefcaseBusiness, message: MessageCircle, calendar: CalendarDays, support: LifeBuoy, phone: Phone, mail: Mail };

export default function FormsTable({ forms, workspaceName, isSourceEmpty = false, onClearFilters }) {
  const scrollHintId = useId();

  if (forms.length === 0) {
    return (
      <div className="space-y-4 border-b border-border bg-card px-4 py-8 text-card-foreground">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">No forms found</h2>
          <p className="text-sm text-muted-foreground">
            {isSourceEmpty ? 'This workspace has no forms yet.' : 'Your current search or status filter has no matching forms.'}
          </p>
        </div>
        {!isSourceEmpty && onClearFilters && (
          <Button type="button" variant="outline" onClick={onClearFilters}>Clear filters</Button>
        )}
      </div>
    );
  }

  return (
    <>
      <p id={scrollHintId} className="sr-only">Scroll horizontally to see all columns when needed.</p>
      <Table
        className="min-w-max"
        containerProps={{ role: 'region', 'aria-label': 'Forms table', 'aria-describedby': scrollHintId, tabIndex: 0 }}
      >
        <TableCaption className="sr-only">Forms in {workspaceName}</TableCaption>
        <colgroup>
          <col className="w-5/12" />
          <col className="w-1/6" />
          <col className="w-1/6" />
          <col className="w-1/6" />
          <col className="w-1/12" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" variant="listing">Form</TableHead>
            <TableHead scope="col" variant="listing">Integrations</TableHead>
            <TableHead scope="col" variant="listing">Trend</TableHead>
            <TableHead scope="col" variant="listing" className="text-right">Responses</TableHead>
            <TableHead scope="col" variant="listing"><span className="sr-only">Row actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody variant="listing">
          {forms.map(form => {
            const Icon = formIcons[form.icon];

            return (
              <TableRow key={form.id} variant="listing">
                <TableCell variant="listing">
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{form.name}</p>
                        <FormStatusBadge status={form.status} />
                      </div>
                      <p className="mt-1 text-xs leading-normal text-muted-foreground">{form.connection ?? 'Not connected'} · {form.sharing}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell variant="listing">
                  <IntegrationIndicators integrations={form.integrations} />
                </TableCell>
                <TableCell variant="listing">
                  <ResponseTrend values={form.trend} />
                </TableCell>
                <TableCell variant="listing" className="text-right">
                  {Number.isFinite(form.responses) ? (
                    <>
                      <p className="text-sm font-semibold">{form.responses.toLocaleString('en-US')}</p>
                      <p className="text-xs text-muted-foreground">{Number.isFinite(form.completionPercentage) ? `${form.completionPercentage}% completed` : 'Completion unavailable'}</p>
                    </>
                  ) : <span className="text-xs text-muted-foreground"><span aria-hidden="true">—</span><span className="sr-only">No response data</span></span>}
                </TableCell>
                <TableCell variant="listing">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon-xs" disabled aria-label={`Actions for ${form.name} — unavailable`} title="Form actions — unavailable">
                      <MoreHorizontal aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
