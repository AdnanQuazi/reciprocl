// Frontend display models for the mock workspace, not Frappe response contracts.
export type PublishingStatus = 'published' | 'draft';
export type StatusFilter = 'all' | PublishingStatus;
export type SortOrder =
  | 'updated-desc'
  | 'updated-asc'
  | 'name-asc'
  | 'name-desc'
  | 'responses-desc'
  | 'responses-asc';

export type FormIcon = 'file' | 'briefcase' | 'message' | 'calendar' | 'support' | 'phone' | 'mail';
export type IntegrationIcon = 'message' | 'database' | 'web' | 'mail' | 'spreadsheet' | 'automation';

export interface Integration {
  id: string;
  name: string;
  icon: IntegrationIcon;
}

export interface FormRecord {
  id: string;
  name: string;
  icon: FormIcon;
  status: PublishingStatus;
  connection: string | null;
  sharing: 'Shared' | 'Private';
  updatedAt: string;
  integrations: readonly Integration[];
  trend: readonly number[] | null;
  responses: number | null;
  completionPercentage: number | null;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface WorkspaceSummary {
  responses: number;
  completionPercentage: number;
  liveForms: number;
}

export type PrimaryNavigationId = 'forms' | 'contacts' | 'automations' | 'insights' | 'pages';
export type WorkspaceGroupId = 'private' | 'shared';

export interface PrimaryNavigationItem {
  id: PrimaryNavigationId;
  label: string;
  current?: boolean;
}

export interface WorkspaceNavigationItem {
  id: string;
  name: string;
  current?: boolean;
}

export interface WorkspaceGroup {
  id: WorkspaceGroupId;
  label: string;
  workspaces: readonly WorkspaceNavigationItem[];
}

export interface MainWorkspaceData {
  workspace: Workspace;
  summary: WorkspaceSummary;
  accountLabel: string;
  forms: readonly FormRecord[];
  primaryNavigation: readonly PrimaryNavigationItem[];
  workspaceGroups: readonly WorkspaceGroup[];
}

export interface PaginationResult<T> {
  visibleForms: T[];
  totalCount: number;
  currentPage: number;
  pageCount: number;
  range: { start: number; end: number };
}
