import { ChartColumn, FileText, Globe, LockKeyhole, PanelsTopLeft, Plus, Users, Zap } from 'lucide-react';
import reciproclLogo from '@/assets/reciprocl-logo.png';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';

const navigationIcons = { forms: FileText, contacts: Users, automations: Zap, insights: ChartColumn, pages: PanelsTopLeft };
const groupIcons = { private: LockKeyhole, shared: Globe };
const brand = { name: 'Reciprocl', logo: reciproclLogo };
const headerActions = [
  { id: 'brandKit', label: 'Brand kit', variant: 'ghost', icon: Globe },
  { id: 'createForm', label: 'Create form', variant: 'default', icon: Plus },
];

export default function MainWorkspace({ data }) {
  const navigation = data.primaryNavigation.map(item => ({ ...item, icon: navigationIcons[item.id] }));
  const workspaceGroups = data.workspaceGroups.map(group => ({ ...group, icon: groupIcons[group.id] }));

  return (
    <AppShell
      sidebar={<Sidebar brand={brand} accountLabel={data.accountLabel} navigation={navigation} workspaceGroups={workspaceGroups} />}
      header={<Header search={{ label: 'Search forms', placeholder: 'Search unavailable' }} actions={headerActions} />}
    >
      <PageContainer>
        <h1 className="text-2xl font-semibold tracking-tight">{data.workspace.name}</h1>
      </PageContainer>
    </AppShell>
  );
}
