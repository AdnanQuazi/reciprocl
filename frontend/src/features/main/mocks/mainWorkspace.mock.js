// Local display fixtures, not a Frappe data contract.
export const mainWorkspaceMock = {
  workspace: { id: 'main', name: 'My workspace' },
  // Illustrative workspace metrics from Stitch; independent of form records.
  summary: { responses: 842, completionPercentage: 76, liveForms: 6 },
  accountLabel: 'Demo account',
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
