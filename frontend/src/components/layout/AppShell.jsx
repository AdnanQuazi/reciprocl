export default function AppShell({ sidebar, header, children }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-popover focus:p-3 focus:text-popover-foreground focus:ring-2 focus:ring-ring"
      >
        Skip to workspace
      </a>
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 min-w-0 flex-1 overflow-y-auto outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
