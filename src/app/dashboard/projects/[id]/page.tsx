import { notFound, redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

async function updateProjectStatus(projectId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
  'use server';

  const session = await getAuthSession();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard/projects');
  }

  await db.project.update({
    where: { id: projectId },
    data: {
      status,
      approvedById: session.user.id,
    },
  });

  await db.projectEvent.create({
    data: {
      projectId,
      type: 'STATUS_CHANGE',
      message: `Status changed to ${status}`,
      userId: session.user.id,
    },
  });

  redirect(`/dashboard/projects/${projectId}`);
}

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps): Promise<React.JSX.Element> {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      tenant: true,
      submittedBy: true,
      approvedBy: true,
      events: {
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  if (session.user.role === 'CLIENT' && project.tenantId !== session.user.tenantId) {
    notFound();
  }

  const showAdminActions = session.user.role === 'ADMIN' && project.status === 'SUBMITTED';

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {project.name}
            </h1>
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                getStatusBadgeClass(project.status),
              )}
            >
              {formatStatus(project.status)}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Submitted by {project.submittedBy?.name ?? project.submittedBy?.email ?? "Unknown"}
          </p>
        </div>

        {showAdminActions ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <form action={updateProjectStatus.bind(null, project.id, 'APPROVED')}>
              <Button type="submit">Approve</Button>
            </form>
            <form action={updateProjectStatus.bind(null, project.id, 'REJECTED')}>
              <Button type="submit" variant="destructive">
                Reject
              </Button>
            </form>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project Brief</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
              {project.brief}
            </p>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            <div className="mt-4 relative space-y-4 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200">
              {project.events.map((event) => (
                <div key={event.id} className="relative pl-10">
                  <span className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-blue-100 ring-4 ring-white" />
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{event.type}</p>
                    <p className="mt-1 text-sm text-slate-700">{event.message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {event.user?.name ?? event.user?.email ?? "Unknown"} • {formatDate(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</p>
                <p className="mt-1 text-sm text-slate-900">{project.tenant.name}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted By</p>
                <p className="mt-1 text-sm text-slate-900">{project.submittedBy?.name ?? project.submittedBy?.email ?? "Unknown"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved By</p>
                <p className="mt-1 text-sm text-slate-900">{project.approvedBy?.name ?? project.approvedBy?.email ?? '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
                <p className="mt-1 text-sm text-slate-900">{formatDate(project.createdAt)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</p>
                <p className="mt-1 text-sm text-slate-900">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
