import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getAuthSession } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
