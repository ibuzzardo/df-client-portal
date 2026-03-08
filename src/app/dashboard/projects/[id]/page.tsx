import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

async function updateProjectStatus(projectId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
  'use server';

  try {
    const session = await getAuthSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      redirect('/dashboard');
    }

    await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/projects/${projectId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    });
  } catch {
    redirect(`/dashboard/projects/${projectId}`);
  }

  redirect(`/dashboard/projects/${projectId}`);
}

async function triggerBuild(projectId: string): Promise<void> {
  'use server';

  try {
    const session = await getAuthSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      redirect('/dashboard');
    }

    await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/projects/${projectId}/trigger`, {
      method: 'POST',
      cache: 'no-store',
    });
  } catch {
    redirect(`/dashboard/projects/${projectId}`);
  }

  redirect(`/dashboard/projects/${projectId}`);
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-50 text-green-700 ring-green-200';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 ring-red-200';
    case 'BUILDING':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'DELIVERED':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps): Promise<React.JSX.Element> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      redirect('/login');
    }

    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        tenant: true,
        createdBy: true,
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      notFound();
    }

    const canManageProject = session.user.role === 'ADMIN';

    return (
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{project.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClasses(project.status)}`}
                    >
                      {project.status}
                    </span>
                    {project.prUrl ? (
                      <a
                        href={project.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Pull Request
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canManageProject && project.status === 'SUBMITTED' ? (
                    <>
                      <form action={updateProjectStatus.bind(null, project.id, 'APPROVED')}>
                        <Button type="submit">Approve</Button>
                      </form>
                      <form action={updateProjectStatus.bind(null, project.id, 'REJECTED')}>
                        <Button type="submit" variant="destructive">
                          Reject
                        </Button>
                      </form>
                    </>
                  ) : null}

                  {canManageProject && project.status === 'APPROVED' ? (
                    <form action={triggerBuild.bind(null, project.id)}>
                      <Button type="submit" variant="outline">
                        Trigger Build
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>

              {project.status === 'BUILDING' ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Build in progress...
                </div>
              ) : null}

              <div className="mt-6 space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Brief</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{project.brief}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project Timeline</h2>
              <div className="mt-4 space-y-4">
                {project.events.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
                ) : (
                  project.events.map((event) => (
                    <div key={event.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{event.message}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{event.type}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Tenant</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{project.tenant.name}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Submitted by</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{project.createdBy.name ?? project.createdBy.email ?? 'Unknown'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{new Date(project.createdAt).toLocaleDateString()}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Pipeline Job ID</dt>
                  <dd className="break-all text-right font-medium text-slate-900 dark:text-slate-100">{project.pipelineJobId ?? '—'}</dd>
                </div>
              </dl>
            </Card>

            <Card>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/projects">Back to Projects</Link>
              </Button>
            </Card>
          </aside>
        </div>
      </div>
    );
  } catch {
    redirect('/dashboard/projects');
  }
}
