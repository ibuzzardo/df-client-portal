import type { ReactNode } from 'react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex md:w-64 lg:w-72">
          <DashboardSidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
