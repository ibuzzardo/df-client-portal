import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});
const getAuthSessionMock = vi.fn();
const findManyMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    tenant: {
      findMany: findManyMock,
    },
  },
}));

describe('TenantsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects client users to dashboard', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'CLIENT' } });
    const mod = await import('@/app/dashboard/tenants/page');

    await expect(mod.default()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('renders tenants for admin', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    findManyMock.mockResolvedValue([
      {
        id: 'tenant-1',
        name: 'Acme',
        slug: 'acme',
        createdAt: new Date('2024-01-01'),
        _count: { memberships: 2, projects: 3 },
      },
    ]);
    const mod = await import('@/app/dashboard/tenants/page');
    const element = await mod.default();

    render(element);

    expect(screen.getByText('Tenants')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Tenant' })).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    findManyMock.mockResolvedValue([]);
    const mod = await import('@/app/dashboard/tenants/page');
    const element = await mod.default();

    render(element);

    expect(screen.getByText('No tenants yet')).toBeInTheDocument();
  });
});
