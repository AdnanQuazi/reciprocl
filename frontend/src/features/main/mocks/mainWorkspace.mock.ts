// Local display fixtures, not a Frappe data contract.
// Generic integration categories illustrate the reference icons, not real connections.
import type { Integration, MainWorkspaceData } from '../types.ts';

const integrationMocks = {
  messaging: { id: 'messaging', name: 'Messaging', icon: 'message' },
  database: { id: 'database', name: 'Database', icon: 'database' },
  web: { id: 'web', name: 'Web', icon: 'web' },
  email: { id: 'email', name: 'Email', icon: 'mail' },
  spreadsheet: { id: 'spreadsheet', name: 'Spreadsheet', icon: 'spreadsheet' },
  automation: { id: 'automation', name: 'Automation', icon: 'automation' },
} satisfies Record<string, Integration>;

export const mainWorkspaceMock: MainWorkspaceData = {
  workspace: { id: 'main', name: 'My workspace' },
  // Illustrative workspace metrics from Stitch; independent of form records.
  summary: { responses: 842, completionPercentage: 76, liveForms: 6 },
  accountLabel: 'Demo account',
  // Eight Stitch reference records followed by 16 synthetic browsing fixtures.
  // Trend samples are illustrative; no time bucket or aggregation rule is defined.
  // Fixed mock update times preserve the reference order under newest-first sorting.
  forms: [
    {
      id: 'lead-capture', name: 'Lead capture', icon: 'file', status: 'published', connection: 'CRM Lead', sharing: 'Shared',
      updatedAt: '2026-01-08T12:00:00.000Z',
      integrations: [integrationMocks.messaging, integrationMocks.database, integrationMocks.web, integrationMocks.email, integrationMocks.automation],
      trend: [12, 14, 16, 19, 22, 26, 29, 32, 31, 34, 40, 44],
      responses: 128, completionPercentage: 72,
    },
    {
      id: 'job-application', name: 'Job application', icon: 'briefcase', status: 'published', connection: 'Job Applicant', sharing: 'Shared',
      updatedAt: '2026-01-07T12:00:00.000Z',
      integrations: [integrationMocks.email, integrationMocks.web],
      trend: [42, 41, 40, 39, 40, 39, 38, 36, 16, 14, 15, 17],
      responses: 96, completionPercentage: 54,
    },
    {
      id: 'customer-feedback', name: 'Customer feedback', icon: 'message', status: 'published', connection: 'Customer', sharing: 'Private',
      updatedAt: '2026-01-06T12:00:00.000Z',
      integrations: [integrationMocks.spreadsheet],
      trend: [18, 19, 21, 23, 26, 29, 33, 36, 35, 39, 43, 47],
      responses: 312, completionPercentage: 81,
    },
    {
      id: 'event-rsvp', name: 'Event RSVP', icon: 'calendar', status: 'published', connection: 'CRM Contact', sharing: 'Shared',
      updatedAt: '2026-01-05T12:00:00.000Z',
      integrations: [integrationMocks.email, integrationMocks.automation],
      trend: [20, 19, 19, 21, 24, 28, 33, 38, 40, 30, 34, 41],
      responses: 210, completionPercentage: 63,
    },
    {
      id: 'support-request', name: 'Support request', icon: 'support', status: 'published', connection: 'Ticket', sharing: 'Shared',
      updatedAt: '2026-01-04T12:00:00.000Z',
      integrations: [integrationMocks.web, integrationMocks.email, integrationMocks.spreadsheet],
      trend: [31, 32, 32, 31, 30, 29, 27, 24, 25, 39, 37, 29],
      responses: 187, completionPercentage: 77,
    },
    {
      id: 'contact-us', name: 'Contact us', icon: 'phone', status: 'published', connection: 'CRM Lead', sharing: 'Shared',
      updatedAt: '2026-01-03T12:00:00.000Z',
      integrations: [integrationMocks.email],
      trend: [24, 23, 23, 24, 25, 27, 29, 28, 27, 18, 22, 29],
      responses: 74, completionPercentage: 59,
    },
    {
      id: 'newsletter-signup', name: 'Newsletter signup', icon: 'mail', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2026-01-02T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'new-form', name: 'New form', icon: 'file', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2026-01-01T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    // Synthetic forms exercise pagination; these are not real workspace records.
    {
      id: 'demo-form-01', name: 'Demo form 01 — Volunteer signup', icon: 'file', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-31T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 24, completionPercentage: 61,
    },
    {
      id: 'demo-form-02', name: 'Demo form 02 — Equipment request', icon: 'briefcase', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-30T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'demo-form-03', name: 'Demo form 03 — Workshop registration', icon: 'calendar', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-29T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 0, completionPercentage: 63,
    },
    {
      id: 'demo-form-04', name: 'Demo form 04 — Project feedback', icon: 'message', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-28T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'demo-form-05', name: 'Demo form 05 — Mentor application', icon: 'file', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-27T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 42, completionPercentage: 65,
    },
    {
      id: 'demo-form-06', name: 'Demo form 06 — Travel request', icon: 'file', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-26T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'demo-form-07', name: 'Demo form 07 — Community survey', icon: 'message', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-25T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 18, completionPercentage: 67,
    },
    {
      id: 'demo-form-08', name: 'Demo form 08 — Content submission', icon: 'file', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-24T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'demo-form-09', name: 'Demo form 09 — Training evaluation', icon: 'calendar', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-23T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 24, completionPercentage: 69,
    },
    {
      id: 'demo-form-10', name: 'Demo form 10 — Office booking', icon: 'file', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-22T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'demo-form-11', name: 'Demo form 11 — Partner interest', icon: 'briefcase', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-21T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 81, completionPercentage: 71,
    },
    {
      id: 'demo-form-12', name: 'Demo form 12 — Expense request', icon: 'file', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-20T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'demo-form-13', name: 'Demo form 13 — Product survey', icon: 'message', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-19T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 7, completionPercentage: 73,
    },
    {
      id: 'demo-form-14', name: 'Demo form 14 — Resource request', icon: 'support', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-18T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
    {
      id: 'demo-form-15', name: 'Demo form 15 — Team feedback', icon: 'message', status: 'published', connection: null, sharing: 'Shared',
      updatedAt: '2025-12-17T12:00:00.000Z',
      integrations: [integrationMocks.email], trend: [2, 4, 3, 6, 5, 8, 7, 9], responses: 52, completionPercentage: 75,
    },
    {
      id: 'demo-form-16', name: 'Demo form 16 — Leave request', icon: 'file', status: 'draft', connection: null, sharing: 'Private',
      updatedAt: '2025-12-16T12:00:00.000Z',
      integrations: [], trend: null, responses: null, completionPercentage: null,
    },
  ],
  primaryNavigation: [
    { id: 'forms', label: 'Forms', current: true },
    { id: 'contacts', label: 'Contacts' },
    { id: 'automations', label: 'Automations' },
    { id: 'insights', label: 'Insights' },
    { id: 'pages', label: 'Pages' },
  ],
  workspaceGroups: [
    {
      id: 'private', label: 'Private', workspaces: [
        { id: 'main', name: 'My workspace', current: true },
        { id: 'personal-notes', name: 'Personal notes' },
      ],
    },
    {
      id: 'shared', label: 'Shared', workspaces: [
        { id: 'hr-hiring', name: 'HR hiring' },
        { id: 'sales-marketing', name: 'Sales / Marketing' },
      ],
    },
  ],
};
