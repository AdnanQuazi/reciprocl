import { useEffect, useRef } from 'react';
import { ChartColumn, FileText, Globe, LockKeyhole, PanelsTopLeft, Plus, Users, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavigation from '@/components/layout/MobileNavigation';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import WorkspaceOverview from './components/WorkspaceOverview';
import FormsToolbar from './components/FormsToolbar';
import FormsTable from './components/FormsTable';
import FormsPagination from './components/FormsPagination';
import SupportingActions from './components/SupportingActions';
import useMainWorkspace from './hooks/useMainWorkspace';
import type { MainWorkspaceData, PrimaryNavigationId, WorkspaceGroupId } from './types';

const navigationIcons: Record<PrimaryNavigationId, LucideIcon> = { forms: FileText, contacts: Users, automations: Zap, insights: ChartColumn, pages: PanelsTopLeft };
const groupIcons: Record<WorkspaceGroupId, LucideIcon> = { private: LockKeyhole, shared: Globe };
const brand = { name: 'Tuple', monogram: 'T' };
const headerActions = [
  { id: 'brandKit', label: 'Brand kit', variant: 'ghost', icon: Globe },
  { id: 'createForm', label: 'Create form', variant: 'default', icon: Plus },
] as const;

export default function MainWorkspace({ data }: { data: MainWorkspaceData }) {
  const {
    statusFilter, onStatusChange, searchQuery, onSearchChange, sortOrder, onSortChange,
    visibleForms, range, totalCount, currentPage, pageCount,
    pageSize, pageSizeOptions, onPageChange, onPageSizeChange, onClearFilters,
  } = useMainWorkspace(data.forms);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${data.workspace.name} — ${brand.name}`;
    return () => { document.title = previousTitle; };
  }, [data.workspace.name]);

  const navigation = data.primaryNavigation.map(item => ({ ...item, icon: navigationIcons[item.id] }));
  const workspaceGroups = data.workspaceGroups.map(group => ({ ...group, icon: groupIcons[group.id] }));
  const sidebarProps = { brand, accountLabel: data.accountLabel, navigation, workspaceGroups };

  function handleClearFilters() {
    onClearFilters();
    searchInputRef.current?.focus();
  }

  return (
    <AppShell
      sidebar={<Sidebar {...sidebarProps} />}
      header={
        <Header
          navigationTrigger={<MobileNavigation {...sidebarProps} />}
          search={{ label: 'Search forms', placeholder: 'Search forms', value: searchQuery, onValueChange: onSearchChange }}
          searchInputRef={searchInputRef}
          actions={headerActions}
        />
      }
    >
      <PageContainer>
        <WorkspaceOverview workspace={data.workspace} summary={data.summary} />
        <section aria-label="Forms" className="mt-6">
          <FormsToolbar statusFilter={statusFilter} onStatusChange={onStatusChange} sortOrder={sortOrder} onSortChange={onSortChange} />
          <div className="mt-2">
            <FormsTable
              forms={visibleForms}
              workspaceName={data.workspace.name}
              isSourceEmpty={data.forms.length === 0}
              onClearFilters={handleClearFilters}
            />
          </div>
          <FormsPagination
            range={range}
            totalCount={totalCount}
            currentPage={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            disabled={false}
          />
        </section>
        <SupportingActions />
      </PageContainer>
    </AppShell>
  );
}
