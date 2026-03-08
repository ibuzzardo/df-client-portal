import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function TenantsPage(): Promise<React.JSX.Element> {
  try {
    const session = await getAuthSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      redirect('/dashboard');
    }

    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return (
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Tenants</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage client organizations, members, and project ownership.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/tenants/new">New Tenant</Link>
          </Button>
        </div>

        <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-900">No tenants yet</h2>
              <p className="mt-2 text-sm text-slate-500">Create your first tenant to organize users and projects.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Slug</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Members</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Projects</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-slate-200 transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        <Link href={`/dashboard/tenants/${tenant.id}`} className="hover:underline">
                          {tenant.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tenant.slug}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tenant._count.memberships}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tenant._count.projects}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {tenant.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  } catch {
    redirect('/dashboard');
  }
}
