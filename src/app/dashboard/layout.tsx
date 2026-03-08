import { redirect } from 'next/navigation';

import { Sidebar } from '@/components/dashboard/sidebar';
import { getAuthSession } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:min-h-screen md:border-b-0 md:border-r md:p-6">
        <Sidebar user={session.user} />
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
