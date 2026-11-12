import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import SidebarContent from './SidebarContent';

// Keep this query aligned with Tailwind's default md breakpoint.
const desktopQuery = '(min-width: 48rem)';

export default function MobileNavigation(props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(desktopQuery);
    const closeOnDesktop = event => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open navigation">
          <Menu aria-hidden="true" className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="gap-0"
        onCloseAutoFocus={event => {
          // The trigger is hidden after resizing to desktop; focus the workspace.
          if (window.matchMedia(desktopQuery).matches) {
            event.preventDefault();
            document.getElementById('main-content')?.focus();
          }
        }}
      >
        <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
        <SheetDescription className="sr-only">Browse navigation and expand workspace groups. Unavailable destinations are disabled.</SheetDescription>
        <SidebarContent {...props} mobile />
      </SheetContent>
    </Sheet>
  );
}
