import SidebarContent from './SidebarContent';

export default function Sidebar(props) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card text-card-foreground md:flex">
      <SidebarContent {...props} />
    </aside>
  );
}
