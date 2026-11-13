import type { LucideIcon } from 'lucide-react';

export interface SidebarProps {
  brand: { name: string; logo: string };
  accountLabel: string;
  navigation: readonly {
    id: string;
    label: string;
    icon: LucideIcon;
    current?: boolean;
  }[];
  workspaceGroups: readonly {
    id: string;
    label: string;
    icon: LucideIcon;
    workspaces: readonly {
      id: string;
      name: string;
      current?: boolean;
    }[];
  }[];
}
