'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MemberRole = 'ADMIN' | 'CLIENT';

interface MembershipItem {
  id: string;
  role: MemberRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface ProjectItem {
  id: string;
  name: string;
  status: string;
}

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberships: MembershipItem[];
  projects: ProjectItem[];
}

export default function TenantDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<MemberRole>('CLIENT');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    async function loadTenant(): Promise<void> {
      try {
        const response = await fetch(`/api/tenants/${params.id}/members`, {
          method: 'GET',
        });

        const membershipsBody = (await response.json()) as { memberships?: MembershipItem[] };
        const tenantResponse = await fetch('/api/tenants');
        const tenantBody = (await tenantResponse.json()) as {
          tenants?: Array<{ id: string; name: string; slug: string; createdAt: string }>;
        };

        const currentTenant = tenantBody.tenants?.find((item) => item.id === params.id);

        if (!currentTenant) {
          setError('Tenant not found');
          return;
        }

        setTenant({
          id: currentTenant.id,
          name: currentTenant.name,
          slug: currentTenant.slug,
          createdAt: currentTenant.createdAt,
          memberships: membershipsBody.memberships ?? [],
          projects: [],
        });
      } catch {
        setError('Failed to load tenant');
      }
    }

    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      void loadTenant();
    }
  }, [params.id, router, session?.user.role, status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/tenants/${params.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      const body = (await response.json()) as {
        error?: { message?: string; details?: string[] };
        invited?: boolean;
        membership?: MembershipItem;
      };

      if (!response.ok) {
        setError(body.error?.details?.[0] ?? body.error?.message ?? 'Failed to add member');
        return;
      }

      if (body.membership && tenant) {
        setTenant({
          ...tenant,
          memberships: [...tenant.memberships, body.membership],
        });
      }

      setSuccess(body.invited ? 'Invitation created successfully.' : 'Member added successfully.');
      setEmail('');
      setRole('CLIENT');
    } catch {
      setError('Failed to add member');
    }
  }

  if (!tenant) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">{error || 'Loading tenant...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{tenant.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tenant.slug}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Members</h2>
              <div className="space-y-3">
                {tenant.memberships.length === 0 ? (
                  <p className="text-sm text-slate-500">No members yet.</p>
                ) : (
                  tenant.memberships.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
                      <div>
                        <p className="font-medium text-slate-900">{membership.user.name ?? membership.user.email ?? 'Unknown user'}</p>
                        <p className="text-sm text-slate-500">{membership.user.email ?? 'No email'}</p>
                      </div>
                      <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset">
                        {membership.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Projects</h2>
              <div className="space-y-3">
                {tenant.projects.length === 0 ? (
                  <p className="text-sm text-slate-500">No projects for this tenant yet.</p>
                ) : (
                  tenant.projects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-medium text-slate-900">{project.name}</p>
                      <p className="text-sm text-slate-500">{project.status}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tenant Details</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Slug</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{tenant.slug}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Member</h2>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={role}
                  onChange={(event) => setRole(event.target.value as MemberRole)}
                >
                  <option value="CLIENT">CLIENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              {success ? <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}
              <Button className="w-full" type="submit">
                Add Member
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
