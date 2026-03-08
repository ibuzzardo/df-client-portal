import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
    case 'SUBMITTED':
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
    case 'BUILDING':
      return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
    case 'DELIVERED':
      return 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200';
  }
}

function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default async function ProjectsPage(): Promise<React.JSX.Element> {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'ADMIN';
  const projects = await db.project.findMany({
    where: isAdmin ? undefined : { tenantId: session.user.tenantId ?? '' },
    include: {
      tenant: true,
      submittedBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Track submitted work and current delivery status.
          </p>
        </div>
        {!isAdmin ? (
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
          >
            New Project
          </Link>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Name
                </th>
                <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status
                </th>
                <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Tenant
                </th>
                <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Submitted By
                </th>
                <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="border-t border-slate-200 px-4 py-4 align-middle text-sm text-slate-700">
                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-blue-600 hover:underline">
                      {project.name}
                    </Link>
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-middle text-sm text-slate-700">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
                        getStatusBadgeClass(project.status),
                      )}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-middle text-sm text-slate-700">
                    {project.tenant.name}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-middle text-sm text-slate-700">
                    {project.submittedBy.name ?? project.submittedBy.email}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-middle text-sm text-slate-700">
                    {formatDate(project.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
          {projects.map((project) => (
            <div key={project.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-blue-600 hover:underline">
                  {project.name}
                </Link>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
                    getStatusBadgeClass(project.status),
                  )}
                >
                  {formatStatus(project.status)}
                </span>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-900">Tenant</dt>
                  <dd>{project.tenant.name}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Submitted By</dt>
                  <dd>{project.submittedBy.name ?? project.submittedBy.email}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Created</dt>
                  <dd>{formatDate(project.createdAt)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
