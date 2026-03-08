import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProjectStatus } from '@prisma/client';

import { Card } from '@/components/ui/card';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

const allStatuses: ProjectStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'BUILDING',
  'DELIVERED',
  'REJECTED',
];

function formatStatus(status: ProjectStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'ADMIN';
  const grouped = await db.project.groupBy({
    by: ['status'],
    where: isAdmin ? undefined : { tenantId: session.user.tenantId ?? '' },
    _count: {
      status: true,
    },
  });

  const counts = new Map<ProjectStatus, number>(
    grouped.map((item) => [item.status as ProjectStatus, item._count.status]),
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, {session.user.name ?? session.user.email}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Here is an overview of your project activity.
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
        >
          View projects
        </Link>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {allStatuses.map((status) => (
          <Card
            key={status}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-blue-300 sm:p-6"
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatStatus(status)}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {counts.get(status) ?? 0}
            </p>
          </Card>
        ))}
      </section>
    </div>
  );
}
