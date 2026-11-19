import type { ReactNode } from 'react';

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 md:px-8 lg:px-10">{children}</div>;
}
